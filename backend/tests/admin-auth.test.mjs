import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { verify, sign } from 'hono/jwt';
import { getTableName } from 'drizzle-orm';
import { PgDialect } from 'drizzle-orm/pg-core';

const { outputFiles } = await build({
  entryPoints: ['src/index.ts'], bundle: true, write: false,
  platform: 'node', format: 'cjs', packages: 'external',
});
const compiled = { exports: {} };
new Function('require', 'module', 'exports', outputFiles[0].text)(
  createRequire(import.meta.url), compiled, compiled.exports,
);
const { createApp } = compiled.exports;
const env = { DATABASE_URL: 'test-database', JWT_SECRET: 'test-only-secret-with-sufficient-length' };
const credentials = { name: 'Test Admin', email: 'admin@example.test', password: 'test-password-123' };

function fixture() {
  let account;
  let managedUser;
  const db = {
    select: () => ({ from: (table) => ({
      where: () => ({ limit: async () => {
        const row = getTableName(table) === 'users' ? managedUser : account;
        return row ? [row] : [];
      } }),
      then: (resolve) => resolve(getTableName(table) === 'users' && managedUser
        ? [{ id: managedUser.id, name: managedUser.name, email: managedUser.email }] : []),
    }) }),
    insert: () => ({ values: (values) => ({ returning: async () => {
      account = { id: crypto.randomUUID(), ...values };
      return [account];
    } }) }),
    execute: async (query) => {
      const { sql, params } = new PgDialect().sqlToQuery(query);
      if (sql.includes('to_regclass')) return { rows: [{ legacy: true }] };
      if (sql.includes('AS "userId"')) return { rows: [{ userId: 42 }] };
      if (sql.includes('WITH new_user')) {
        if (managedUser) throw Object.assign(new Error('duplicate'), { code: '23505' });
        managedUser = { id: 42, name: params[0], email: params[1], passwordHash: params[2] };
        return { rows: [{ id: 42, defaultOrgId: 7 }] };
      }
      return { rows: [{ id: 7, name: "Managed User's Workspace", role: 'owner' }] };
    },
  };
  const app = createApp(() => db);
  const request = (path, body, token) => app.request(`/api/v1/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  }, env);
  return { app, request, account: () => account, managedUser: () => managedUser };
}

test('signup without a JWT creates an admin with a hashed password and a usable token', async () => {
  const f = fixture();
  const response = await f.request('admin/signup', credentials);
  assert.equal(response.status, 201);
  const { token } = await response.json();
  const payload = await verify(token, env.JWT_SECRET, 'HS256');
  assert.equal(payload.role, 'Admin');
  assert.equal(payload.id, f.account().id);
  assert.ok(payload.exp > Date.now() / 1000);
  assert.notEqual(f.account().passwordHash, credentials.password);
  assert.match(f.account().passwordHash, /^pbkdf2-sha256\$/);
  assert.equal('password' in f.account(), false);
  assert.equal((await f.request('admin/bulk', null, token)).status, 200);
});

test('signin accepts the registered password, rejects another password, and reports duplicate emails', async () => {
  const f = fixture();
  await f.request('admin/signup', credentials);
  assert.equal((await f.request('admin/signin', credentials)).status, 200);
  assert.equal((await f.request('admin/signin', { ...credentials, password: 'incorrect-password' })).status, 401);
  assert.equal((await f.request('admin/signup', credentials)).status, 409);
});

test('validation and backend setup errors are public, but dashboard and task APIs require authentication', async () => {
  const f = fixture();
  assert.equal((await f.request('admin/signup', { ...credentials, password: '123' })).status, 400);
  assert.equal((await f.request('admin/bulk')).status, 401);
  assert.equal((await f.request('tasks/')).status, 401);
  const userToken = await sign({ id: crypto.randomUUID(), role: 'User' }, env.JWT_SECRET, 'HS256');
  assert.equal((await f.request('admin/bulk', null, userToken)).status, 403);
  const missingConfig = await f.app.request('/api/v1/admin/signup', { method: 'POST' }, {});
  assert.equal(missingConfig.status, 503);
});

test('database failures return an actionable error rather than a JWT rejection', async () => {
  const app = createApp(() => { throw Object.assign(new Error('missing table'), { code: '42P01' }); });
  const response = await app.request('/api/v1/admin/signup', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials),
  }, env);
  assert.equal(response.status, 503);
  assert.match((await response.json()).message, /npm run db:auth/);
});

test('an admin can create a user, open their detail page, and sign in with the new credentials', async () => {
  const f = fixture();
  const admin = await f.request('admin/signup', credentials);
  const { token } = await admin.json();
  const user = { name: 'Managed User', email: 'new-user@example.test', password: 'managed-password' };
  const created = await f.request('admin/usersignup', user, token);
  assert.equal(created.status, 201);
  assert.deepEqual(await created.json(), { id: 42, defaultOrgId: 7 });
  assert.match(f.managedUser().passwordHash, /^pbkdf2-sha256\$/);
  const detail = await f.request('admin/user/42', null, token);
  assert.equal(detail.status, 200);
  assert.deepEqual(await detail.json(), { id: 42, name: user.name, email: user.email, tasks: [], tasksAssigned: [] });
  assert.equal((await f.request('admin/usersignup', user, token)).status, 409);
  const signin = await f.request('user/signin', user);
  assert.equal(signin.status, 200);
  const { token: userToken } = await signin.json();
  assert.equal((await verify(userToken, env.JWT_SECRET, 'HS256')).role, 'User');
  assert.equal((await f.request('user/signin', { ...user, password: 'wrong-password' })).status, 401);
  const organizations = await f.request('user/organizations', null, userToken);
  assert.equal(organizations.status, 200);
  assert.equal((await organizations.json())[0].id, 7);
  assert.equal((await f.request('admin/usersignup', user, userToken)).status, 403);
  const personal = await f.request('user/bulk', null, userToken);
  assert.equal(personal.status, 200);
  assert.equal((await personal.json())[0].id, 42);
  const team = await f.request('user/bulktask', null, userToken);
  assert.equal(team.status, 200);
  assert.equal((await team.json())[0].email, user.email);
  const forbidden = await f.app.request('/api/v1/user/bulktask', {
    headers: { Authorization: `Bearer ${userToken}`, 'x-organization-id': 'different-workspace' },
  }, env);
  assert.equal(forbidden.status, 403);
});

test('user creation requires an admin token and validates the form before writing', async () => {
  const f = fixture();
  assert.equal((await f.request('admin/usersignup', credentials)).status, 401);
  const admin = await f.request('admin/signup', credentials);
  const { token } = await admin.json();
  assert.equal((await f.request('admin/usersignup', { ...credentials, password: '123' }, token)).status, 400);
  assert.equal(f.managedUser(), undefined);
});
