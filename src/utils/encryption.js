/**
 * Encryption Utilities
 * AES-256-GCM encryption for sensitive data (access tokens)
 */

const crypto = require('crypto');
const config = require('../config');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64; // 512 bits
const TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

/**
 * Derives encryption key from master key using PBKDF2
 * @param {string} salt - Hex-encoded salt
 * @returns {Buffer} Derived key
 */
function deriveKey(salt) {
  return crypto.pbkdf2Sync(
    Buffer.from(config.security.encryptionKey, 'hex'),
    Buffer.from(salt, 'hex'),
    100000, // iterations
    KEY_LENGTH,
    'sha512'
  );
}

/**
 * Encrypts sensitive data (like access tokens)
 * @param {string} plaintext - Data to encrypt
 * @returns {string} Encrypted data in format: salt:iv:authTag:ciphertext (hex-encoded)
 */
function encrypt(plaintext) {
  if (!plaintext) {
    throw new Error('Cannot encrypt empty data');
  }

  // Generate random salt and IV
  const salt = crypto.randomBytes(SALT_LENGTH);
  const iv = crypto.randomBytes(IV_LENGTH);

  // Derive key from master key + salt
  const key = deriveKey(salt.toString('hex'));

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  // Get authentication tag
  const authTag = cipher.getAuthTag();

  // Return format: salt:iv:authTag:ciphertext (all hex-encoded)
  return [
    salt.toString('hex'),
    iv.toString('hex'),
    authTag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':');
}

/**
 * Decrypts encrypted data
 * @param {string} encryptedData - Encrypted data in format: salt:iv:authTag:ciphertext
 * @returns {string} Decrypted plaintext
 */
function decrypt(encryptedData) {
  if (!encryptedData) {
    throw new Error('Cannot decrypt empty data');
  }

  try {
    // Parse encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }

    const [saltHex, ivHex, authTagHex, ciphertextHex] = parts;

    // Convert from hex
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const ciphertext = Buffer.from(ciphertextHex, 'hex');

    // Derive key
    const key = deriveKey(salt.toString('hex'));

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Hashes data using SHA-256 (for HMAC verification)
 * @param {string} data - Data to hash
 * @param {string} secret - Secret key
 * @returns {string} Hex-encoded hash
 */
function hmacSHA256(data, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
}

/**
 * Compares two values in constant time (prevents timing attacks)
 * @param {string} a - First value
 * @param {string} b - Second value
 * @returns {boolean} True if values match
 */
function constantTimeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Generates a secure random token
 * @param {number} length - Byte length (default 32)
 * @returns {string} Hex-encoded random token
 */
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

module.exports = {
  encrypt,
  decrypt,
  hmacSHA256,
  constantTimeCompare,
  generateToken,
};
