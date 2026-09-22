/**
 * AES-256-GCM helpers using WebCrypto — the same algorithm family as the
 * server would use, but here encryption/decryption happens ONLY in this
 * extension. The API only ever sees ciphertext + a symmetric key it hands
 * back to authorized buyers over TLS.
 *
 * Wire format: base64url( iv[12] ) "." base64( ciphertext+tag )
 */

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("Malformed key");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function bytesToB64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function b64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function importKey(hexKey: string): Promise<CryptoKey> {
  const raw = hexToBytes(hexKey);
  if (raw.byteLength !== 32) throw new Error("Session key must be 32 bytes");
  return crypto.subtle.importKey("raw", raw as BufferSource, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

/** Encrypts any JSON-serializable value under a hex AES key. */
export async function encryptJson(hexKey: string, value: unknown): Promise<string> {
  const key = await importKey(hexKey);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    plaintext as BufferSource,
  );
  return `${bytesToB64(iv)}.${bytesToB64(new Uint8Array(ct))}`;
}

/** Decrypts payloads produced by encryptJson. Throws on tamper/bad key. */
export async function decryptJson<T>(hexKey: string, payload: string): Promise<T> {
  const [ivB64, ctB64] = payload.split(".");
  if (!ivB64 || !ctB64) throw new Error("Malformed encrypted payload");

  const key = await importKey(hexKey);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64ToBytes(ivB64) as BufferSource },
    key,
    b64ToBytes(ctB64) as BufferSource,
  );
  return JSON.parse(new TextDecoder().decode(pt)) as T;
}
