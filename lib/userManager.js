const fs = require('fs').promises;
const path = require('path');
const { encrypt, decrypt } = require('./crypto');

const USERS_FILE = path.join(__dirname, '../data/users.json');

/**
 * User credentials schema:
 * {
 *   "username": "onnoka",
 *   "pin": "2026",
 *   "discogs": {
 *     "username": "onnoka_discogs",
 *     "token": "encrypted_token"
 *   },
 *   "spotify": {
 *     "clientId": "encrypted_id",
 *     "clientSecret": "encrypted_secret"
 *   },
 *   "lastSync": "2025-12-19T10:30:00Z",
 *   "hasImported": false
 * }
 */

class UserManager {
  constructor(encryptionKey) {
    if (!encryptionKey) {
      throw new Error('Encryption key required for UserManager');
    }
    this.encryptionKey = encryptionKey;
  }

  async ensureUsersFile() {
    try {
      await fs.access(USERS_FILE);
    } catch (error) {
      // File doesn't exist, create it
      await fs.writeFile(USERS_FILE, JSON.stringify({}, null, 2));
    }
  }

  async getUser(username) {
    await this.ensureUsersFile();
    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    return users[username] || null;
  }

  async saveUser(username, userData) {
    await this.ensureUsersFile();
    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    users[username] = userData;
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
  }

  async setCredentials(username, credentials) {
    const user = await this.getUser(username) || {
      username,
      pin: credentials.pin || '2026',
      hasImported: false
    };

    // Encrypt and save Discogs credentials if provided
    if (credentials.discogs) {
      user.discogs = {
        username: credentials.discogs.username,
        token: encrypt(credentials.discogs.token, this.encryptionKey)
      };
    }

    // Encrypt and save Spotify credentials if provided
    if (credentials.spotify) {
      user.spotify = {
        clientId: encrypt(credentials.spotify.clientId, this.encryptionKey),
        clientSecret: encrypt(credentials.spotify.clientSecret, this.encryptionKey)
      };
    }

    // Update PIN if provided
    if (credentials.pin) {
      user.pin = credentials.pin;
    }

    await this.saveUser(username, user);
    return user;
  }

  async getCredentials(username) {
    const user = await this.getUser(username);
    if (!user) return null;

    // Decrypt credentials
    const decrypted = {
      username: user.username,
      pin: user.pin,
      hasImported: user.hasImported || false,
      lastSync: user.lastSync || null
    };

    if (user.discogs) {
      decrypted.discogs = {
        username: user.discogs.username,
        token: decrypt(user.discogs.token, this.encryptionKey)
      };
    }

    if (user.spotify) {
      decrypted.spotify = {
        clientId: decrypt(user.spotify.clientId, this.encryptionKey),
        clientSecret: decrypt(user.spotify.clientSecret, this.encryptionKey)
      };
    }

    return decrypted;
  }

  async updateLastSync(username) {
    const user = await this.getUser(username);
    if (!user) return;

    user.lastSync = new Date().toISOString();
    user.hasImported = true;
    await this.saveUser(username, user);
  }

  async hasImported(username) {
    const user = await this.getUser(username);
    return user ? (user.hasImported || false) : false;
  }
}

module.exports = UserManager;
