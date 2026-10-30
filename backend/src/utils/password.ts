const iterations = 100000;
const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const decode = (value: string) => Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

async function derive(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"],
  );
  return new Uint8Array(await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" }, key, 256,
  ));
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2-sha256$${iterations}$${encode(salt)}$${encode(await derive(password, salt))}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, rounds, salt, hash] = stored.split("$");
  if (algorithm !== "pbkdf2-sha256" || Number(rounds) !== iterations || !salt || !hash) return false;
  const expected = decode(hash);
  const actual = await derive(password, decode(salt));
  if (expected.length !== actual.length) return false;
  let difference = 0;
  for (let i = 0; i < actual.length; i++) difference |= actual[i] ^ expected[i];
  return difference === 0;
}
