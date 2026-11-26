import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp } from '../server';
import {
  Asset,
  AssetCategory,
  AssetTransaction,
  Employee,
  sequelize,
} from '../models';
import { seedDatabase } from '../seed/seed';

let server: http.Server;
let baseUrl: string;

async function request(
  path: string,
  options: { method?: string; form?: Record<string, string> } = {}
): Promise<{ status: number; location?: string; body: string }> {
  const method = options.method || 'GET';
  const headers: Record<string, string> = {};
  let bodyStr: string | undefined;

  if (options.form) {
    bodyStr = new URLSearchParams(options.form).toString();
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
    headers['Content-Length'] = String(Buffer.byteLength(bodyStr));
  }

  return new Promise((resolve, reject) => {
    const req = http.request(`${baseUrl}${path}`, { method, headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      res.on('end', () => {
        resolve({
          status: res.statusCode || 0,
          location: res.headers.location,
          body: Buffer.concat(chunks).toString('utf8'),
        });
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

before(async () => {
  await seedDatabase();
  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      resolve();
    });
  });
});

after(async () => {
  if (server) {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
  await sequelize.close();
});

test('All main pages render with HTTP 200', async () => {
  const rootRes = await request('/');
  assert.equal(rootRes.status, 302);

  const routes = [
    '/employees',
    '/employees?status=active',
    '/employees?status=inactive',
    '/categories',
    '/assets',
    '/stock',
    '/issue',
    '/return',
    '/scrap',
    '/history',
    '/reports',
  ];

  for (const r of routes) {
    const res = await request(r);
    assert.equal(res.status, 200, `Expected 200 on ${r}, got ${res.status}`);
  }
});

test('Scrapped assets are excluded from all pages except Reports', async () => {
  const scrappedTag = 'AST-1009';
  const hiddenRoutes = ['/assets', '/stock', '/issue', '/return', '/scrap', '/history'];

  for (const r of hiddenRoutes) {
    const res = await request(r);
    assert.equal(res.status, 200);
    assert.equal(
      res.body.includes(scrappedTag),
      false,
      `Scrapped asset ${scrappedTag} should NOT appear on ${r}`
    );
  }

  const reportsRes = await request('/reports');
  assert.equal(reportsRes.status, 200);
  assert.equal(
    reportsRes.body.includes(scrappedTag),
    true,
    `Scrapped asset ${scrappedTag} MUST appear on /reports`
  );

  const scrappedAsset = await Asset.findOne({ where: { assetTag: scrappedTag } });
  assert.ok(scrappedAsset);

  const directHistory = await request(`/history/${scrappedAsset.id}`);
  assert.equal(directHistory.status, 302);

  const reportHistory = await request(`/reports/history/${scrappedAsset.id}`);
  assert.equal(reportHistory.status, 200);
  assert.equal(reportHistory.body.includes('PURCHASED'), true);
  assert.equal(reportHistory.body.includes('SCRAPPED'), true);
});

test('End-to-end asset lifecycle: create -> issue -> return -> scrap -> reports', async () => {
  const category = await AssetCategory.findOne();
  const employee = await Employee.findOne({ where: { status: 'active' } });
  assert.ok(category && employee);

  const uniqueTag = `AST-TEST-${Date.now()}`;
  const uniqueSerial = `SN-TEST-${Date.now()}`;

  const createRes = await request('/assets', {
    method: 'POST',
    form: {
      assetTag: uniqueTag,
      serialNumber: uniqueSerial,
      categoryId: String(category.id),
      branch: 'Head Office',
      make: 'TestMake',
      model: 'TestModel X1',
      purchaseDate: '2026-10-01',
      purchaseCost: '50000',
    },
  });
  assert.equal(createRes.status, 302);

  const createdAsset = await Asset.findOne({ where: { assetTag: uniqueTag } });
  assert.ok(createdAsset);
  assert.equal(createdAsset.status, 'in_stock');

  const stockRes = await request('/stock');
  assert.equal(stockRes.body.includes(uniqueTag), true);

  const issueRes = await request('/issue', {
    method: 'POST',
    form: {
      assetId: String(createdAsset.id),
      employeeId: String(employee.id),
      issueDate: '2026-10-05',
      condition: 'New',
      remarks: 'Test issue',
    },
  });
  assert.equal(issueRes.status, 302);
  await createdAsset.reload();
  assert.equal(createdAsset.status, 'issued');
  assert.equal(createdAsset.currentEmployeeId, employee.id);

  const returnRes = await request('/return', {
    method: 'POST',
    form: {
      assetId: String(createdAsset.id),
      returnDate: '2026-10-20',
      reason: 'Upgrade',
      condition: 'Good',
      branch: 'Head Office',
      remarks: 'Upgraded model',
    },
  });
  assert.equal(returnRes.status, 302);
  await createdAsset.reload();
  assert.equal(createdAsset.status, 'in_stock');
  assert.equal(createdAsset.currentEmployeeId, null);

  const scrapRes = await request('/scrap', {
    method: 'POST',
    form: {
      assetId: String(createdAsset.id),
      scrapDate: '2026-11-01',
      salvageValue: '2500',
      reason: 'Test obsolescence',
      remarks: 'Integration test cleanup',
    },
  });
  assert.equal(scrapRes.status, 302);
  await createdAsset.reload();
  assert.equal(createdAsset.status, 'scrapped');

  const assetsAfterScrap = await request('/assets');
  assert.equal(assetsAfterScrap.body.includes(uniqueTag), false);

  const reportsAfterScrap = await request('/reports');
  assert.equal(reportsAfterScrap.body.includes(uniqueTag), true);

  await AssetTransaction.destroy({ where: { assetId: createdAsset.id } });
  await createdAsset.destroy();
});
