const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits

/**
 * Encrypts text using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @param {string} key - Encryption key (hex string)
 * @returns {string} - Encrypted text in format: iv:authTag:encrypted
 */
function encrypt(text, key) {
  if (!text) return '';
  if (!key) throw new Error('Encryption key required');

  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(`Encryption key must be ${KEY_LENGTH * 2} hex characters`);
  }

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuffer, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

/**
 * Decrypts text encrypted with encrypt()
 * @param {string} encryptedData - Encrypted text in format: iv:authTag:encrypted
 * @param {string} key - Encryption key (hex string)
 * @returns {string} - Decrypted plain text
 */
function decrypt(encryptedData, key) {
  if (!encryptedData) return '';
  if (!key) throw new Error('Encryption key required');

  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(`Encryption key must be ${KEY_LENGTH * 2} hex characters`);
  }

  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, keyBuffer, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed: ' + error.message);
  }
}

/**
 * Generates a random encryption key
 * @returns {string} - Random hex key
 */
function generateKey() {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

module.exports = {
  encrypt,
  decrypt,
  generateKey
};
