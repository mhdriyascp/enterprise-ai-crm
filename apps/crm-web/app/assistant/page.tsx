'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/ui';
import { useAssistant } from '@/lib/hooks';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: { source: string; snippet?: string }[];
}

export default function AssistantPage() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const assistant = useAssistant();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const question = input.trim();
    if (!question || assistant.isPending) return;

    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');

    assistant.mutate(question, {
      onSuccess: (reply) => {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: reply.data.answer,
            citations: reply.data.citations,
          },
        ]);
      },
      onError: () => {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Sorry, I could not reach the AI platform.' },
        ]);
      },
    });
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-3rem)] max-w-3xl flex-col">
      <PageHeader
        title="AI Assistant"
        description="Ask about your customers, pipeline, and next best actions."
      />

      <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-400">
            Start a conversation — e.g. “Summarise my open opportunities.”
          </p>
        ) : null}
        {messages.map((message, index) => (
          <div
            key={index}
            className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
          >
            <div
              className={
                'max-w-[80%] rounded-lg px-3 py-2 text-sm ' +
                (message.role === 'user'
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-800')
              }
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.citations && message.citations.length > 0 ? (
                <ul className="mt-2 space-y-1 border-t border-slate-200 pt-2 text-xs text-slate-500">
                  {message.citations.map((citation, cIndex) => (
                    <li key={cIndex}>· {citation.source}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        ))}
        {assistant.isPending ? (
          <p className="text-sm text-slate-400">Thinking…</p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the assistant…"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={assistant.isPending}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
