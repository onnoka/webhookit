const fs = require('fs');
const path = require('path');

class JsonDB {
  constructor(filePath) {
    this.filePath = filePath;
    this.backupDir = path.join(path.dirname(filePath), 'backups');
    this.maxBackups = 10;
    this.ensureFile();
    this.ensureBackupDir();
  }

  ensureFile() {
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify({ vinyls: [] }, null, 2));
    }
  }

  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  createBackup() {
    try {
      if (fs.existsSync(this.filePath)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFileName = `vinyls-${timestamp}.json`;
        const backupPath = path.join(this.backupDir, backupFileName);

        // Copy current file to backup
        fs.copyFileSync(this.filePath, backupPath);

        // Clean old backups
        this.cleanOldBackups();
      }
    } catch (error) {
      console.error('Backup failed:', error);
      // Continue even if backup fails
    }
  }

  cleanOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(f => f.startsWith('vinyls-') && f.endsWith('.json'))
        .map(f => ({
          name: f,
          path: path.join(this.backupDir, f),
          time: fs.statSync(path.join(this.backupDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time); // Newest first

      // Keep only the last maxBackups files
      if (files.length > this.maxBackups) {
        files.slice(this.maxBackups).forEach(file => {
          fs.unlinkSync(file.path);
          console.log(`Deleted old backup: ${file.name}`);
        });
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  read() {
    const data = fs.readFileSync(this.filePath, 'utf8');
    return JSON.parse(data);
  }

  write(data) {
    // Create backup before writing
    this.createBackup();
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  getAllVinyls() {
    const data = this.read();
    return data.vinyls || [];
  }

  getVinylById(id) {
    const data = this.read();
    return data.vinyls.find(v => v.id === id);
  }

  updateVinyl(id, updates) {
    const data = this.read();
    const index = data.vinyls.findIndex(v => v.id === id);
    if (index !== -1) {
      data.vinyls[index] = { ...data.vinyls[index], ...updates };
      this.write(data);
      return data.vinyls[index];
    }
    return null;
  }

  addVinyl(vinyl) {
    const data = this.read();
    const newVinyl = {
      id: Date.now().toString(),
      ...vinyl,
      createdAt: new Date().toISOString()
    };
    data.vinyls.push(newVinyl);
    this.write(data);
    return newVinyl;
  }

  deleteVinyl(id) {
    const data = this.read();
    data.vinyls = data.vinyls.filter(v => v.id !== id);
    this.write(data);
    return true;
  }
}

module.exports = JsonDB;
