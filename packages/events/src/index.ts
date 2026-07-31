import { Kafka, Producer, Consumer, Partitioners } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';

import type { Logger } from '@crm/logging';
import type { BaseEvent, EventTopic } from '@crm/types';

export * from '@crm/types';

// =============================================================================
// @crm/events — Kafka Event Infrastructure
// =============================================================================

export interface KafkaClientOptions {
  brokers: string[];
  clientId: string;
  logger?: Logger;
}

export interface ProducerOptions {
  kafka: Kafka;
  logger?: Logger;
}

export interface ConsumerOptions {
  kafka: Kafka;
  groupId: string;
  logger?: Logger;
}

type EventHandler<T = unknown> = (event: BaseEvent<T>) => Promise<void>;

export interface PublishOptions {
  tenantId: string;
  userId?: string;
  correlationId?: string;
}

/**
 * Minimal publishing contract consumed by domain services. Both the real
 * {@link EventProducer} and the {@link NoopEventPublisher} satisfy it, so
 * services can depend on the interface and remain agnostic of transport.
 */
export interface EventPublisher {
  publish<T = unknown>(topic: EventTopic, data: T, options: PublishOptions): Promise<void>;
}

// ---------------------------------------------------------------------------
// Event Producer
// ---------------------------------------------------------------------------
export class EventProducer implements EventPublisher {
  private readonly producer: Producer;
  private readonly logger?: Logger;
  private readonly serviceName: string;

  constructor(options: ProducerOptions & { serviceName?: string }) {
    this.producer = options.kafka.producer({
      createPartitioner: Partitioners.DefaultPartitioner,
    });
    this.logger = options.logger;
    this.serviceName = options.serviceName ?? 'unknown-service';
  }

  async connect(): Promise<void> {
    await this.producer.connect();
    this.logger?.info('Kafka producer connected');
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
    this.logger?.info('Kafka producer disconnected');
  }

  async publish<T = unknown>(
    topic: EventTopic,
    data: T,
    options: PublishOptions,
  ): Promise<void> {
    const event: BaseEvent<T> = {
      id: uuidv4(),
      version: '1.0',
      type: topic,
      source: this.serviceName,
      tenantId: options.tenantId,
      userId: options.userId,
      occurredAt: new Date().toISOString(),
      correlationId: options.correlationId,
      data,
    };

    await this.producer.send({
      topic,
      messages: [
        {
          key: options.tenantId,
          value: JSON.stringify(event),
          headers: {
            'event-type': topic,
            'event-version': '1.0',
            'correlation-id': options.correlationId ?? '',
          },
        },
      ],
    });

    this.logger?.debug({ topic, eventId: event.id }, 'Event published');
  }
}

// ---------------------------------------------------------------------------
// Event Consumer
// ---------------------------------------------------------------------------
export class EventConsumer {
  private consumer: Consumer;
  private readonly handlers = new Map<string, EventHandler>();
  private readonly logger?: Logger;

  constructor(options: ConsumerOptions) {
    this.consumer = options.kafka.consumer({ groupId: options.groupId });
    this.logger = options.logger;
  }

  on<T = unknown>(topic: EventTopic, handler: EventHandler<T>): void {
    this.handlers.set(topic, handler as EventHandler);
  }

  async connect(): Promise<void> {
    await this.consumer.connect();
    this.logger?.info('Kafka consumer connected');
  }

  async subscribe(topics: EventTopic[]): Promise<void> {
    for (const topic of topics) {
      await this.consumer.subscribe({ topic, fromBeginning: false });
    }
  }

  async start(): Promise<void> {
    await this.consumer.run({
      eachMessage: async ({ topic, message }) => {
        const handler = this.handlers.get(topic);
        if (!handler) return;

        const value = message.value?.toString();
        if (!value) return;

        try {
          const event = JSON.parse(value) as BaseEvent;
          await handler(event);
          this.logger?.debug({ topic, eventId: event.id }, 'Event processed');
        } catch (error) {
          this.logger?.error({ topic, error }, 'Failed to process event');
          throw error;
        }
      },
    });
  }

  async disconnect(): Promise<void> {
    await this.consumer.disconnect();
  }
}

// ---------------------------------------------------------------------------
// Kafka Factory
// ---------------------------------------------------------------------------
export function createKafkaClient(options: KafkaClientOptions): Kafka {
  return new Kafka({
    brokers: options.brokers,
    clientId: options.clientId,
    retry: {
      initialRetryTime: 300,
      retries: 8,
    },
  });
}

// ---------------------------------------------------------------------------
// Publisher decorators & factory
// ---------------------------------------------------------------------------

/**
 * A publisher that silently discards events. Used when the event bus is
 * disabled (for example in tests or minimal local runs) so that domain
 * services can depend on {@link EventPublisher} unconditionally.
 */
export class NoopEventPublisher implements EventPublisher {
  async publish(): Promise<void> {
    /* intentionally does nothing */
  }
}

/**
 * Wraps another publisher and guarantees that publishing never throws.
 * Event delivery is best-effort: a broker outage must not fail the originating
 * business transaction, so failures are logged and swallowed.
 */
export class SafeEventPublisher implements EventPublisher {
  constructor(
    private readonly inner: EventPublisher,
    private readonly logger?: Logger,
  ) {}

  async publish<T = unknown>(topic: EventTopic, data: T, options: PublishOptions): Promise<void> {
    try {
      await this.inner.publish(topic, data, options);
    } catch (error) {
      this.logger?.error({ topic, error }, 'Failed to publish event (suppressed)');
    }
  }
}

export interface EventBusOptions {
  /** When false, a no-op publisher is returned and Kafka is never contacted. */
  enabled: boolean;
  brokers: string[];
  clientId: string;
  serviceName: string;
  logger?: Logger;
}

/**
 * A connected event bus handle: the {@link EventPublisher} plus lifecycle
 * hooks for wiring into a service's start/stop sequence.
 */
export interface EventBus {
  publisher: EventPublisher;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

/**
 * Creates an {@link EventBus}. When `enabled` is false a no-op implementation is
 * returned so callers need no conditional logic. Publishing through the
 * returned bus is always safe (never throws).
 */
export function createEventBus(options: EventBusOptions): EventBus {
  if (!options.enabled) {
    options.logger?.info('Event bus disabled; using no-op publisher');
    return {
      publisher: new NoopEventPublisher(),
      connect: async () => {},
      disconnect: async () => {},
    };
  }

  const kafka = createKafkaClient({
    brokers: options.brokers,
    clientId: options.clientId,
    logger: options.logger,
  });
  const producer = new EventProducer({
    kafka,
    logger: options.logger,
    serviceName: options.serviceName,
  });

  return {
    publisher: new SafeEventPublisher(producer, options.logger),
    connect: () => producer.connect(),
    disconnect: () => producer.disconnect(),
  };
}
