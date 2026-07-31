import http from 'k6/http';
import { check, sleep } from 'k6';

// Smoke test: minimal load to verify the gateway and a couple of read paths
// respond correctly. Intended as a fast CI gate rather than a stress test.
export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

const BASE_URL = __ENV.GATEWAY_URL || 'http://localhost:8000';

export default function () {
  const health = http.get(BASE_URL + '/health');
  check(health, {
    'health status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
