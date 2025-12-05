const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const https = require('https');
const JsonDB = require('./lib/jsondb');

const app = express();
const PORT = process.env.PORT || 8124;
const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN || 'pEbvHbIafRFLJcNkfZQmTBhrhacSEuKZrhFrHcIn';

// Initialize JSON database
const db = new JsonDB(path.join(__dirname, 'data', 'vinyls.json'));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Discogs API Helper
function searchDiscogs(barcode) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.discogs.com',
      path: `/database/search?barcode=${encodeURIComponent(barcode)}&type=release`,
      method: 'GET',
      headers: {
        'User-Agent': 'VinylBarcodeScanner/2.0',
        'Authorization': `Discogs token=${DISCOGS_TOKEN}`
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

            // Get full release details including tracks
            if (release.id) {
              getReleaseDetails(release.id).then(details => {
                resolve({
                  title: release.title || 'Unknown',
                  artist: release.title ? release.title.split(' - ')[0] : 'Unknown',
                  year: release.year || 'Unknown',
                  label: release.label ? release.label[0] : 'Unknown',
                  coverUrl: release.cover_image || release.thumb || '/placeholder.jpg',
                  barcode: barcode,
                  tracks: details.tracklist || []
                });
              }).catch(() => {
                // Fallback without tracks
                resolve({
                  title: release.title || 'Unknown',
                  artist: release.title ? release.title.split(' - ')[0] : 'Unknown',
                  year: release.year || 'Unknown',
                  label: release.label ? release.label[0] : 'Unknown',
                  coverUrl: release.cover_image || release.thumb || '/placeholder.jpg',
                  barcode: barcode,
                  tracks: []
                });
              });
            } else {
              resolve({
                title: release.title || 'Unknown',
                artist: release.title ? release.title.split(' - ')[0] : 'Unknown',
                year: release.year || 'Unknown',
                label: release.label ? release.label[0] : 'Unknown',
                coverUrl: release.cover_image || release.thumb || '/placeholder.jpg',
                barcode: barcode,
                tracks: []
              });
            }
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

// Get full release details from Discogs
function getReleaseDetails(releaseId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.discogs.com',
      path: `/releases/${releaseId}`,
      method: 'GET',
      headers: {
        'User-Agent': 'VinylBarcodeScanner/2.0',
        'Authorization': `Discogs token=${DISCOGS_TOKEN}`
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const release = JSON.parse(data);
          resolve(release);
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
app.get('/vinyls', (req, res) => {
  try {
    const vinyls = db.getAllVinyls().reverse(); // newest first
    res.render('vinyls/index', { vinyls });
  } catch (error) {
    res.status(500).send('Error loading vinyls: ' + error.message);
  }
});

// Add vinyl page
app.get('/vinyls/add', (req, res) => {
  res.render('vinyls/add');
});

// View single vinyl detail
app.get('/vinyls/:id', (req, res) => {
  try {
    const vinyl = db.getVinylById(req.params.id);
    if (vinyl) {
      res.render('vinyls/detail', { vinyl });
    } else {
      res.status(404).send('Vinyl not found');
    }
  } catch (error) {
    res.status(500).send('Error loading vinyl: ' + error.message);
  }
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
app.post('/api/vinyls', (req, res) => {
  try {
    const vinyl = db.addVinyl(req.body);
    res.json({ success: true, id: vinyl.id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete vinyl
app.delete('/api/vinyls/:id', (req, res) => {
  try {
    db.deleteVinyl(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Refresh vinyl (re-fetch from Discogs with tracks)
app.post('/api/vinyls/:id/refresh', async (req, res) => {
  try {
    const vinyl = db.getVinylById(req.params.id);
    if (!vinyl) {
      return res.status(404).json({ success: false, message: 'Vinyl not found' });
    }

    // Re-fetch from Discogs with tracks
    const updatedData = await searchDiscogs(vinyl.barcode);
    if (updatedData) {
      const updated = db.updateVinyl(req.params.id, {
        tracks: updatedData.tracks
      });
      res.json({ success: true, vinyl: updated });
    } else {
      res.json({ success: false, message: 'Could not refresh from Discogs' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start server
console.log('🎵 Starting Vinyl Barcode Scanner...');
console.log('📦 Using JSON file database (no MongoDB needed!)');

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('✅ Server is running!');
  console.log(`🎵 Vinyl Barcode Scanner: http://0.0.0.0:${PORT}`);
  console.log(`📱 Open on your phone: http://192.168.2.102:${PORT}`);
  console.log('');
  console.log('💾 Data saved to: data/vinyls.json');
  console.log('');
});
