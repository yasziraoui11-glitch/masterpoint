const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { buildApp } = require('../src/app');

test('GET /health returns ok', async () => {
  const app = buildApp();
  const server = app.listen(0);
  const port = server.address().port;

  const body = await new Promise((resolve, reject) => {
    http.get({ hostname: '127.0.0.1', port, path: '/health' }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });

  server.close();
  assert.equal(body.status, 200);
  const parsed = JSON.parse(body.data);
  assert.equal(parsed.ok, true);
});
