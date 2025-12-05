const fs = require('fs');
const path = require('path');

class JsonDB {
  constructor(filePath) {
    this.filePath = filePath;
    this.ensureFile();
  }

  ensureFile() {
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify({ vinyls: [] }, null, 2));
    }
  }

  read() {
    const data = fs.readFileSync(this.filePath, 'utf8');
    return JSON.parse(data);
  }

  write(data) {
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
