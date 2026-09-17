import crypto from "node:crypto";

/**
 * @file MVP credential store for integration provider tokens.
 *
 * This is a functional-but-basic MVP implementation, not production-grade
 * secret storage. For production, this should be replaced with a
 * dedicated secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
 * that handles key rotation, access auditing, and durable storage
 * properly.
 *
 * Two limitations worth calling out explicitly:
 *   1. Credentials are held in an in-memory Map, not persisted anywhere
 *      (IntegrationAccount.tokenReference already exists as the pointer
 *      field, so no new Mongoose model was added for this). All stored
 *      credentials are lost on process restart. Fine for MVP/testing,
 *      not for production.
 *   2. Encryption is AES-256-GCM via Node's built-in crypto module, with
 *      the key read from process.env.CREDENTIAL_ENCRYPTION_KEY (expected
 *      as a 64-character hex string, i.e. 32 raw bytes). There is no key
 *      rotation support.
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12;

/**
 * In-memory store of encrypted credentials, keyed by tokenReference.
 * @type {Map<string, { iv: Buffer, authTag: Buffer, ciphertext: Buffer }>}
 */
const credentialStore = new Map();

/**
 * Reads and validates the encryption key from the environment.
 * @returns {Buffer} The 32-byte encryption key.
 * @throws {Error} If the key is missing or not 32 bytes once decoded.
 */
function getEncryptionKey() {
  const keyHex = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error(
      "CREDENTIAL_ENCRYPTION_KEY environment variable is not set"
    );
  }

  const key = Buffer.from(keyHex, "hex");
  if (key.length !== 32) {
    throw new Error(
      "CREDENTIAL_ENCRYPTION_KEY must decode to 32 bytes (64 hex characters) for AES-256"
    );
  }

  return key;
}

/**
 * Encrypts arbitrary credential data and stores it, returning a
 * tokenReference that can later be used to retrieve it.
 * @param {*} credentialData - e.g. { accessToken, refreshToken, expiresAt }.
 * @returns {string} The generated tokenReference (a UUID).
 */
export function storeCredential(credentialData) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const plaintext = Buffer.from(JSON.stringify(credentialData), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const tokenReference = crypto.randomUUID();
  credentialStore.set(tokenReference, { iv, authTag, ciphertext });

  return tokenReference;
}

/**
 * Looks up and decrypts a stored credential.
 * @param {string} tokenReference - The reference returned by storeCredential.
 * @returns {*} The original credential data.
 * @throws {Error} If no credential is stored for that tokenReference.
 */
export function getCredential(tokenReference) {
  const entry = credentialStore.get(tokenReference);
  if (!entry) {
    throw new Error("Credential not found");
  }

  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, entry.iv);
  decipher.setAuthTag(entry.authTag);

  const plaintext = Buffer.concat([
    decipher.update(entry.ciphertext),
    decipher.final()
  ]);

  return JSON.parse(plaintext.toString("utf8"));
}

/**
 * Removes a stored credential.
 * @param {string} tokenReference - The reference returned by storeCredential.
 * @returns {void}
 */
export function deleteCredential(tokenReference) {
  credentialStore.delete(tokenReference);
}
