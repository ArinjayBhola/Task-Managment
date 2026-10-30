import { test } from "node:test";
import assert from "node:assert/strict";
import { fixture, hash } from "./helpers.mjs";
test("login issues an HttpOnly session without exposing a token and logout revokes it", async () => {
  const f = await fixture();
  const response = await f.request("admin/signin", "POST", {
    email: "admin@example.test",
    password: "a long unique test passphrase",
  });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.user.role, "Admin");
  assert.equal("token" in body, false);
  const header = response.headers.get("set-cookie");
  assert.match(header, /HttpOnly/i);
  assert.match(header, /SameSite=Lax/i);
  const cookie = header.split(";")[0];
  assert.equal(
    (await f.request("auth/session", "GET", null, cookie)).status,
    200,
  );
  assert.equal(
    (await f.request("auth/logout", "POST", null, cookie)).status,
    200,
  );
  assert.equal(
    (await f.request("auth/session", "GET", null, cookie)).status,
    401,
  );
});
test("expired and forged sessions are rejected and cross-origin writes are blocked", async () => {
  const f = await fixture();
  const cookie = await f.login();
  assert.equal(
    (
      await f.request(
        "auth/logout",
        "POST",
        null,
        cookie,
        "https://evil.example",
      )
    ).status,
    403,
  );
  const entry = f.sessions.get(hash(cookie.split("=")[1]));
  entry.expired = true;
  assert.equal(
    (await f.request("auth/session", "GET", null, cookie)).status,
    401,
  );
  assert.equal(
    (
      await f.request(
        "auth/session",
        "GET",
        null,
        "tm_session=" + "a".repeat(64),
      )
    ).status,
    401,
  );
});
test("public admin registration is closed after setup and weak passwords are rejected", async () => {
  const f = await fixture();
  assert.equal(
    (
      await f.request("admin/signup", "POST", {
        name: "Anyone",
        email: "new@example.test",
        password: "a long unique test passphrase",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await f.request("admin/signup", "POST", {
        name: "Anyone",
        email: "new@example.test",
        password: "short",
      })
    ).status,
    400,
  );
});
test("repeated bad logins are throttled with generic errors", async () => {
  const f = await fixture();
  let response;
  for (let n = 0; n < 9; n++)
    response = await f.request("admin/signin", "POST", {
      email: "admin@example.test",
      password: "incorrect",
    });
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "900");
});
test("password change reauthenticates, rejects weak passwords, and revokes other sessions", async () => {
  const f = await fixture();
  const first = await f.login(),
    second = await f.login();
  assert.equal(
    (
      await f.request(
        "auth/password",
        "POST",
        {
          currentPassword: "wrong",
          newPassword: "a replacement secure passphrase",
        },
        first,
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await f.request(
        "auth/password",
        "POST",
        {
          currentPassword: "a long unique test passphrase",
          newPassword: "weak",
        },
        first,
      )
    ).status,
    400,
  );
  const response = await f.request(
    "auth/password",
    "POST",
    {
      currentPassword: "a long unique test passphrase",
      newPassword: "a replacement secure passphrase",
    },
    first,
  );
  assert.equal(response.status, 200);
  assert.equal(
    (await f.request("auth/session", "GET", null, second)).status,
    401,
  );
  assert.equal(
    (
      await f.request(
        "auth/session",
        "GET",
        null,
        response.headers.get("set-cookie").split(";")[0],
      )
    ).status,
    200,
  );
});
