import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { build } from 'esbuild';
import { neon } from '@neondatabase/serverless';

for (const file of ['.dev.vars', '.env']) {
  if (existsSync(file)) process.loadEnvFile(file);
}
const { outputFiles } = await build({
  entryPoints: ['src/index.ts'], bundle: true, write: false,
  platform: 'node', format: 'cjs', packages: 'external',
});
const compiled = { exports: {} };
new Function('require', 'module', 'exports', outputFiles[0].text)(
  createRequire(import.meta.url), compiled, compiled.exports,
);
const app = compiled.exports.default;
const sql = neon(process.env.DATABASE_URL);
const email = `signup-check-${crypto.randomUUID()}@example.test`;
const body = { name: 'Temporary signup check', email, password: crypto.randomUUID() };
const userEmail = `user-check-${crypto.randomUUID()}@example.test`;
let createdUser;
const request = (path, data, token) => app.request(`/api/v1/admin/${path}`, {
  method: data ? 'POST' : 'GET',
  headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  ...(data ? { body: JSON.stringify(data) } : {}),
}, process.env);

try {
  const signup = await request('signup', body);
  assert.equal(signup.status, 201, `Signup failed: ${await signup.clone().text()}`);
  const { token } = await signup.json();
  assert.equal((await request('signin', body)).status, 200);
  assert.equal((await request('signin', { ...body, password: 'wrong-password' })).status, 401);
  assert.equal((await request('signup', body)).status, 409);
  const bulk = await request('bulk', null, token);
  assert.equal(bulk.status, 200, 'Dashboard user list failed');
  assert.ok(Array.isArray(await bulk.json()));
  const userBody = { name: 'Temporary managed user', email: userEmail, password: crypto.randomUUID() };
  const created = await request('usersignup', userBody, token);
  assert.equal(created.status, 201, `User creation failed: ${await created.clone().text()}`);
  createdUser = await created.json();
  assert.ok(createdUser.id);
  assert.ok(createdUser.defaultOrgId);
  assert.equal((await request('usersignup', userBody, token)).status, 409);
  const detail = await request(`user/${createdUser.id}`, null, token);
  assert.equal(detail.status, 200);
  const publicUser = await detail.json();
  assert.equal(publicUser.email, userEmail);
  assert.equal('passwordHash' in publicUser, false);
  const userSignin = await app.request('/api/v1/user/signin', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userBody),
  }, process.env);
  assert.equal(userSignin.status, 200);
  const { token: userToken } = await userSignin.json();
  const orgResponse = await app.request('/api/v1/user/organizations', {
    headers: { Authorization: `Bearer ${userToken}` },
  }, process.env);
  assert.equal(orgResponse.status, 200);
  assert.ok((await orgResponse.json()).some(org => org.id === createdUser.defaultOrgId));
  console.log('Live checks passed: admin auth, user creation, duplicate emails, user detail, user login, and workspace membership.');
} finally {
  if (createdUser) {
    const [layout] = await sql`SELECT to_regclass('public.organization_members') IS NOT NULL AS legacy`;
    if (layout.legacy) await sql`DELETE FROM organization_members WHERE user_id = ${createdUser.id}`;
    else await sql`DELETE FROM memberships WHERE user_id = ${createdUser.id}`;
    await sql`DELETE FROM users WHERE id = ${createdUser.id} AND email = ${userEmail}`;
    await sql`DELETE FROM organizations WHERE id = ${createdUser.defaultOrgId}`;
  }
  await sql`DELETE FROM admin_accounts WHERE email = ${email}`;
  console.log('Temporary test accounts and workspace removed.');
}
