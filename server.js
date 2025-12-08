const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const https = require('https');
const fs = require('fs');
const JsonDB = require('./lib/jsondb');

const app = express();
const PORT = process.env.PORT || 8124;
const DISCOGS_TOKEN = process.env.DISCOGS_TOKEN || 'pEbvHbIafRFLJcNkfZQmTBhrhacSEuKZrhFrHcIn';
const AUTH_PIN = process.env.AUTH_PIN || '2026';

// Spotify API credentials (using client credentials flow)
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'a030c7e726654eac9f62b72856e8380a';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '5f3e2822312a47b299ee225a2d9ececa';
let spotifyAccessToken = null;
let spotifyTokenExpiry = null;

// Initialize JSON database
const db = new JsonDB(path.join(__dirname, 'data', 'vinyls.json'));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// PIN Authentication Middleware
function requirePIN(req, res, next) {
  const pin = req.headers['x-auth-pin'] || req.body.pin || req.query.pin;

  if (pin === AUTH_PIN) {
    next();
  } else {
    res.status(401).json({ success: false, message: 'Invalid PIN', requiresAuth: true });
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

            // Get full release details including tracks and original year
            if (release.id) {
              getReleaseDetails(release.id).then(details => {
                resolve({
                  title: release.title || 'Unknown',
                  artist: release.title ? release.title.split(' - ')[0] : 'Unknown',
                  year: details.originalYear || release.year || 'Unknown',
                  label: release.label ? release.label[0] : 'Unknown',
                  coverUrl: release.cover_image || release.thumb || '/placeholder.jpg',
                  barcode: barcode,
                  tracks: details.tracklist || []
                });
              }).catch(() => {
                // Fallback without tracks and original year
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

          // If release has a master_id, fetch the master to get original year
          if (release.master_id) {
            getMasterRelease(release.master_id).then(master => {
              release.originalYear = master.year || release.year;
              resolve(release);
            }).catch(() => {
              // Fallback to release year if master fetch fails
              release.originalYear = release.year;
              resolve(release);
            });
          } else {
            release.originalYear = release.year;
            resolve(release);
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

// Get master release from Discogs (for original release year)
function getMasterRelease(masterId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.discogs.com',
      path: `/masters/${masterId}`,
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
          const master = JSON.parse(data);
          resolve(master);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', reject);
  });
}

// Spotify API - Get access token
function getSpotifyAccessToken() {
  return new Promise((resolve, reject) => {
    // Check if we have a valid token
    if (spotifyAccessToken && spotifyTokenExpiry && Date.now() < spotifyTokenExpiry) {
      return resolve(spotifyAccessToken);
    }

    const auth = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
    const postData = 'grant_type=client_credentials';

    const options = {
      hostname: 'accounts.spotify.com',
      path: '/api/token',
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.access_token) {
            spotifyAccessToken = result.access_token;
            spotifyTokenExpiry = Date.now() + (result.expires_in * 1000) - 60000; // Refresh 1 min early
            resolve(spotifyAccessToken);
          } else {
            reject(new Error('No access token received'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Spotify API - Search for track
function searchSpotifyTrack(artist, trackName) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = await getSpotifyAccessToken();
      const query = encodeURIComponent(`track:${trackName} artist:${artist}`);

      const options = {
        hostname: 'api.spotify.com',
        path: `/v1/search?q=${query}&type=track&limit=1`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      https.get(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.tracks && result.tracks.items && result.tracks.items.length > 0) {
              const track = result.tracks.items[0];
              resolve({
                previewUrl: track.preview_url,
                spotifyUrl: track.external_urls.spotify,
                name: track.name,
                artist: track.artists[0].name
              });
            } else {
              resolve(null);
            }
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

// Spotify API - Search for album
function searchSpotifyAlbum(artist, albumTitle) {
  return new Promise(async (resolve, reject) => {
    try {
      const token = await getSpotifyAccessToken();
      const query = encodeURIComponent(`album:${albumTitle} artist:${artist}`);

      const options = {
        hostname: 'api.spotify.com',
        path: `/v1/search?q=${query}&type=album&limit=1`,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      https.get(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.albums && result.albums.items && result.albums.items.length > 0) {
              const album = result.albums.items[0];
              resolve({
                spotifyUrl: album.external_urls.spotify,
                spotifyUri: album.uri,
                spotifyId: album.id,
                name: album.name,
                artist: album.artists[0].name,
                releaseDate: album.release_date,
                totalTracks: album.total_tracks,
                images: album.images || [] // Array of images in different sizes
              });
            } else {
              resolve(null);
            }
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

// Download and save image locally
function downloadAndSaveImage(imageUrl, vinylId) {
  return new Promise((resolve, reject) => {
    try {
      // Create covers directory if it doesn't exist
      const coversDir = path.join(__dirname, 'public', 'covers');
      if (!fs.existsSync(coversDir)) {
        fs.mkdirSync(coversDir, { recursive: true });
      }

      const fileName = `${vinylId}.jpg`;
      const filePath = path.join(coversDir, fileName);

      // Download image
      https.get(imageUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download image: ${response.statusCode}`));
          return;
        }

        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve(`/covers/${fileName}`); // Return web path
        });

        fileStream.on('error', (err) => {
          fs.unlink(filePath, () => {}); // Delete partial file
          reject(err);
        });
      }).on('error', reject);
    } catch (error) {
      reject(error);
    }
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
      // Try to get high-quality cover from Spotify
      try {
        // Clean album title by removing artist name for better Spotify matching
        let cleanTitle = albumData.title;
        if (albumData.artist && albumData.title) {
          const cleanPatterns = [
            new RegExp(`^${albumData.artist.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[-:]\\s*`, 'i'),
            new RegExp(`^${albumData.artist.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`, 'i')
          ];

          for (const pattern of cleanPatterns) {
            const cleaned = albumData.title.replace(pattern, '').trim();
            if (cleaned !== albumData.title && cleaned.length > 0) {
              cleanTitle = cleaned;
              break;
            }
          }
        }

        const spotifyData = await searchSpotifyAlbum(albumData.artist, cleanTitle);
        if (spotifyData && spotifyData.images && spotifyData.images.length > 0) {
          // Get the highest quality image (first in array is usually largest)
          const bestImage = spotifyData.images[0];

          // Generate temporary ID for download (will be replaced with real ID on save)
          const tempId = Date.now().toString();
          const localCoverPath = await downloadAndSaveImage(bestImage.url, tempId);

          // Update album data with local cover path
          albumData.coverUrl = localCoverPath;
          albumData.tempCoverId = tempId; // Store temp ID for later renaming
        }
      } catch (spotifyError) {
        console.log('Spotify cover fetch failed, using Discogs cover:', spotifyError.message);
        // Continue with Discogs cover if Spotify fails
      }

      res.json({ success: true, album: albumData });
    } else {
      res.json({ success: false, message: 'Album not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add vinyl to collection
app.post('/api/vinyls', requirePIN, (req, res) => {
  try {
    const vinylData = req.body;

    // If there's a temp cover ID, rename the file to use the final vinyl ID
    if (vinylData.tempCoverId && vinylData.coverUrl) {
      const coversDir = path.join(__dirname, 'public', 'covers');
      const tempFileName = `${vinylData.tempCoverId}.jpg`;
      const tempFilePath = path.join(coversDir, tempFileName);

      // Add vinyl first to get the real ID
      const vinyl = db.addVinyl(vinylData);

      // Now rename the cover file to use the real vinyl ID
      try {
        const newFileName = `${vinyl.id}.jpg`;
        const newFilePath = path.join(coversDir, newFileName);

        if (fs.existsSync(tempFilePath)) {
          fs.renameSync(tempFilePath, newFilePath);
          // Update the vinyl record with the new cover path
          db.updateVinyl(vinyl.id, { coverUrl: `/covers/${newFileName}` });
        }
      } catch (renameError) {
        console.error('Failed to rename cover file:', renameError);
        // Continue anyway, the temp filename will work
      }

      res.json({ success: true, id: vinyl.id });
    } else {
      // No temp cover, just add normally
      const vinyl = db.addVinyl(vinylData);
      res.json({ success: true, id: vinyl.id });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete vinyl
app.delete('/api/vinyls/:id', requirePIN, (req, res) => {
  try {
    const vinyl = db.getVinylById(req.params.id);

    // Delete the vinyl from database
    db.deleteVinyl(req.params.id);

    // Also delete the cover file if it's a local file
    if (vinyl && vinyl.coverUrl && vinyl.coverUrl.startsWith('/covers/')) {
      const coverPath = path.join(__dirname, 'public', vinyl.coverUrl);
      try {
        if (fs.existsSync(coverPath)) {
          fs.unlinkSync(coverPath);
        }
      } catch (fileError) {
        console.error('Failed to delete cover file:', fileError);
        // Continue anyway, database delete is more important
      }
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update vinyl cover
app.post('/api/vinyls/:id/cover', requirePIN, async (req, res) => {
  try {
    const vinyl = db.getVinylById(req.params.id);
    if (!vinyl) {
      return res.status(404).json({ success: false, message: 'Vinyl not found' });
    }

    const { coverUrl } = req.body;
    if (!coverUrl) {
      return res.status(400).json({ success: false, message: 'Cover URL required' });
    }

    // Download and save the new cover
    const localCoverPath = await downloadAndSaveImage(coverUrl, vinyl.id);

    // Delete old cover if different
    if (vinyl.coverUrl && vinyl.coverUrl.startsWith('/covers/') && vinyl.coverUrl !== localCoverPath) {
      const oldCoverPath = path.join(__dirname, 'public', vinyl.coverUrl);
      try {
        if (fs.existsSync(oldCoverPath)) {
          fs.unlinkSync(oldCoverPath);
        }
      } catch (e) {
        console.log('Could not delete old cover:', e.message);
      }
    }

    // Update vinyl with new cover
    db.updateVinyl(vinyl.id, { coverUrl: localCoverPath });

    res.json({ success: true, coverUrl: localCoverPath });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update vinyl fields (type, etc.)
app.patch('/api/vinyls/:id', requirePIN, (req, res) => {
  try {
    const vinyl = db.getVinylById(req.params.id);
    if (!vinyl) {
      return res.status(404).json({ success: false, message: 'Vinyl not found' });
    }

    // Update allowed fields
    const allowedFields = ['type'];
    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    db.updateVinyl(req.params.id, updates);
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

// Refresh all vinyl covers from Spotify
app.post('/api/vinyls/refresh-all-covers', async (req, res) => {
  try {
    const data = db.read(); // Read once at start
    const vinyls = data.vinyls || [];
    let updated = 0;
    let failed = 0;
    const results = [];
    const updates = {}; // Track which vinyls need updating

    for (const vinyl of vinyls) {
      try {
        // Clean album title by removing artist name (same logic as Spotify search in detail page)
        let cleanTitle = vinyl.title;
        if (vinyl.artist && vinyl.title) {
          const cleanPatterns = [
            new RegExp(`^${vinyl.artist.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[-:]\\s*`, 'i'),
            new RegExp(`^${vinyl.artist.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`, 'i')
          ];

          for (const pattern of cleanPatterns) {
            const cleaned = vinyl.title.replace(pattern, '').trim();
            if (cleaned !== vinyl.title && cleaned.length > 0) {
              cleanTitle = cleaned;
              break;
            }
          }
        }

        // Search Spotify for this album with cleaned title
        const spotifyData = await searchSpotifyAlbum(vinyl.artist, cleanTitle);

        if (spotifyData && spotifyData.images && spotifyData.images.length > 0) {
          // Get the highest quality image
          const bestImage = spotifyData.images[0];

          // Download and save with vinyl ID
          const localCoverPath = await downloadAndSaveImage(bestImage.url, vinyl.id);

          // Delete old cover if it was a local file
          if (vinyl.coverUrl && vinyl.coverUrl.startsWith('/covers/')) {
            const oldCoverPath = path.join(__dirname, 'public', vinyl.coverUrl);
            try {
              if (fs.existsSync(oldCoverPath) && oldCoverPath !== path.join(__dirname, 'public', localCoverPath)) {
                fs.unlinkSync(oldCoverPath);
              }
            } catch (e) {
              console.log('Could not delete old cover:', e.message);
            }
          }

          // Store update for batch write
          updates[vinyl.id] = localCoverPath;
          updated++;
          results.push({ id: vinyl.id, title: vinyl.title, status: 'updated' });
        } else {
          failed++;
          results.push({ id: vinyl.id, title: vinyl.title, status: 'no_spotify_match' });
        }
      } catch (error) {
        failed++;
        results.push({ id: vinyl.id, title: vinyl.title, status: 'error', error: error.message });
      }
    }

    // Apply all updates in one batch write (creates only ONE backup)
    if (Object.keys(updates).length > 0) {
      data.vinyls = data.vinyls.map(vinyl => {
        if (updates[vinyl.id]) {
          return { ...vinyl, coverUrl: updates[vinyl.id] };
        }
        return vinyl;
      });
      db.write(data); // Single write = single backup
    }

    res.json({
      success: true,
      total: vinyls.length,
      updated,
      failed,
      results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Spotify preview URL for a track
app.get('/api/spotify/preview', async (req, res) => {
  try {
    const { artist, track } = req.query;
    if (!artist || !track) {
      return res.status(400).json({ success: false, message: 'Artist and track required' });
    }

    const result = await searchSpotifyTrack(artist, track);
    if (result && result.previewUrl) {
      res.json({ success: true, previewUrl: result.previewUrl, spotifyUrl: result.spotifyUrl });
    } else {
      res.json({ success: false, message: 'No preview available' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get Spotify album URL
app.get('/api/spotify/album', async (req, res) => {
  try {
    let { artist, album } = req.query;
    if (!artist || !album) {
      return res.status(400).json({ success: false, message: 'Artist and album required' });
    }

    // Clean album title: remove artist name if it's at the start
    // Pattern: "Artist - Album" or "Artist: Album" -> "Album"
    const cleanPatterns = [
      new RegExp(`^${artist.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[-:]\\s*`, 'i'),
      new RegExp(`^${artist.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`, 'i')
    ];

    for (const pattern of cleanPatterns) {
      if (pattern.test(album)) {
        album = album.replace(pattern, '').trim();
        break;
      }
    }

    const result = await searchSpotifyAlbum(artist, album);
    if (result && result.spotifyUrl) {
      res.json({
        success: true,
        spotifyUrl: result.spotifyUrl,
        spotifyUri: result.spotifyUri,
        spotifyId: result.spotifyId
      });
    } else {
      res.json({ success: false, message: 'Album not found on Spotify' });
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
