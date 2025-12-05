# 🎵 Vinyl Barcode Scanner - Quick Start

## ✅ Prerequisites (Already Done!)
- ✅ MongoDB container running on port 27017
- ✅ Node.js 18 installed on your NAS

## 🚀 Start the App (3 Simple Steps!)

### Step 1: Pull Latest Code
```bash
cd /volume1/docker/vinyl-app
git pull origin claude/vinyl-barcode-scanner-014cKgW3P9dHjVDCpGyaysVJ
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start the App
```bash
node server.js
```

You should see:
```
Connecting to MongoDB...
✅ Connected to MongoDB successfully!
🎵 Vinyl Barcode Scanner running on http://0.0.0.0:8124
📱 Open on your phone: http://YOUR-NAS-IP:8124
```

## 📱 Open the App

On your phone or computer, go to:
```
http://192.168.2.102:8124
```
(Replace with your NAS IP if different)

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
- Make sure MongoDB container is running: `sudo docker ps | grep mongo`
- App runs on port 8124 by default

## 🐛 Troubleshooting

**"Can't connect to MongoDB"**
```bash
sudo docker start vinyl-mongodb
```

**"npm install fails"**
```bash
rm -rf node_modules
npm install
```

**"Camera doesn't work"**
- Use HTTPS or allow camera on HTTP (browser settings)
- Or use manual barcode input

---

Enjoy your vinyl collection! 🎶
