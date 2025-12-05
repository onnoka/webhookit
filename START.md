# 🎵 Vinyl Barcode Scanner - Quick Start

## ✨ NO DATABASE NEEDED!
This app uses a simple JSON file - no MongoDB, no Docker, no hassle!

## ✅ Prerequisites
- ✅ Node.js 18 installed on your NAS

## 🚀 Start the App (3 Commands!)

```bash
cd /volume1/docker/vinyl-app

git pull origin claude/vinyl-barcode-scanner-014cKgW3P9dHjVDCpGyaysVJ

npm install

node server.js
```

You should see:
```
🎵 Starting Vinyl Barcode Scanner...
📦 Using JSON file database (no MongoDB needed!)

✅ Server is running!
🎵 Vinyl Barcode Scanner: http://0.0.0.0:8124
📱 Open on your phone: http://192.168.2.102:8124

💾 Data saved to: data/vinyls.json
```

## 📱 Open the App

On your phone or computer, go to:
```
http://192.168.2.102:8124
```

## 🎯 How to Use

1. **Click "+ Add Vinyl"**
2. **Click "Start Camera"** (allow camera access)
3. **Scan the barcode** on your vinyl
4. **Album info appears** automatically from Discogs
5. **Click "Add to Collection"**
6. **Done!** 🎉

Or use **manual barcode input** if you prefer typing.

## 🛑 Stop the App

Press `Ctrl+C` in the terminal

## 💡 Tips

- Works best on mobile (iPhone/Android) for scanning
- Your collection is saved in `data/vinyls.json`
- App runs on port 8124 by default
- No database needed - everything just works!

## 🐛 Troubleshooting

**"npm install fails"**
```bash
rm -rf node_modules
npm install
```

**"Camera doesn't work"**
- Use HTTPS or allow camera on HTTP (browser settings)
- Or use manual barcode input

**"Where is my data?"**
- All vinyls are stored in `data/vinyls.json`
- You can backup this file to keep your collection safe!

---

Enjoy your vinyl collection! 🎶
