import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Staged load test that ramps virtual users up and down to characterise the
// gateway and services under sustained traffic.
const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 20 },
    { duration: '30s', target: 50 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    errors: ['rate<0.05'],
    http_req_duration: ['p(95)<1000'],
  },
};

const BASE_URL = __ENV.GATEWAY_URL || 'http://localhost:8000';
const TOKEN = __ENV.AUTH_TOKEN || '';

function authHeaders() {
  if (!TOKEN) {
    return {};
  }
  return { headers: { Authorization: 'Bearer ' + TOKEN } };
}

export default function () {
  const responses = http.batch([
    ['GET', BASE_URL + '/health'],
    ['GET', BASE_URL + '/api/v1/customers', null, authHeaders()],
    ['GET', BASE_URL + '/api/v1/leads', null, authHeaders()],
  ]);

  for (const res of responses) {
    const ok = check(res, {
      'status is 2xx/4xx (not 5xx)': (r) => r.status < 500,
    });
    errorRate.add(!ok);
  }

  sleep(1);
}
