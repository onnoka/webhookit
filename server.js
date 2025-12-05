const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const bodyParser = require('body-parser');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 8124;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'vinyl-collection';

let db;
let vinylsCollection;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MongoDB Connection
async function connectDB() {
  try {
    console.log('Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    vinylsCollection = db.collection('vinyls');
    console.log('✅ Connected to MongoDB successfully!');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Discogs API Helper
function searchDiscogs(barcode) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.discogs.com',
      path: `/database/search?barcode=${encodeURIComponent(barcode)}&type=release`,
      method: 'GET',
      headers: {
        'User-Agent': 'VinylBarcodeScanner/2.0'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.results && result.results.length > 0) {
            const release = result.results[0];
            resolve({
              title: release.title || 'Unknown',
              artist: release.title ? release.title.split(' - ')[0] : 'Unknown',
              year: release.year || 'Unknown',
              label: release.label ? release.label[0] : 'Unknown',
              coverUrl: release.cover_image || release.thumb || '/placeholder.jpg',
              barcode: barcode
            });
          } else {
            resolve(null);
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

// Routes
app.get('/', (req, res) => {
  res.redirect('/vinyls');
});

// List all vinyls
app.get('/vinyls', async (req, res) => {
  try {
    const vinyls = await vinylsCollection.find({}).sort({ createdAt: -1 }).toArray();
    res.render('vinyls/index', { vinyls });
  } catch (error) {
    res.status(500).send('Error loading vinyls: ' + error.message);
  }
});

// Add vinyl page
app.get('/vinyls/add', (req, res) => {
  res.render('vinyls/add');
});

// Search by barcode API
app.get('/api/vinyls/search/:barcode', async (req, res) => {
  try {
    const albumData = await searchDiscogs(req.params.barcode);
    if (albumData) {
      res.json({ success: true, album: albumData });
    } else {
      res.json({ success: false, message: 'Album not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add vinyl to collection
app.post('/api/vinyls', async (req, res) => {
  try {
    const vinyl = {
      ...req.body,
      createdAt: new Date()
    };
    const result = await vinylsCollection.insertOne(vinyl);
    res.json({ success: true, id: result.insertedId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete vinyl
app.delete('/api/vinyls/:id', async (req, res) => {
  try {
    await vinylsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start server
connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎵 Vinyl Barcode Scanner running on http://0.0.0.0:${PORT}`);
    console.log(`📱 Open on your phone: http://YOUR-NAS-IP:${PORT}`);
  });
});
