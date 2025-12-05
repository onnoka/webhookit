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
