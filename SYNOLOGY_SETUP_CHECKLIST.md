# ✅ Synology Vinyl App Setup Checklist

Vink af terwijl je de stappen doorloopt!

---

## 📦 Voorbereiding

- [ ] Je hebt toegang tot je Synology DSM (via browser op je computer)
- [ ] Je weet het IP-adres van je Synology (bijv. 192.168.1.50)
- [ ] Je hebt de GitHub repo code (download als ZIP of via git)

---

## 🔧 Installatie Stappen

### 1. Docker Installeren
- [ ] Open DSM in je browser
- [ ] Open **Package Center**
- [ ] Zoek naar **"Docker"** of **"Container Manager"**
- [ ] Klik op **Install**
- [ ] Wacht tot installatie compleet is (groene vinkje)

### 2. Folder Aanmaken
- [ ] Open **File Station** in DSM
- [ ] Navigeer naar een shared folder (bijv. "home" of maak "docker" aan)
- [ ] Maak nieuwe folder: **docker** (als die er nog niet is)
- [ ] Binnen docker, maak folder: **vinyl-app**
- [ ] Je hebt nu pad: `/docker/vinyl-app` of `/volume1/docker/vinyl-app`

### 3. Code Uploaden
- [ ] Download de GitHub repo als ZIP
- [ ] Pak de ZIP uit op je computer
- [ ] Open File Station → /docker/vinyl-app
- [ ] Klik **Upload** en selecteer ALLE bestanden uit de uitgepakte folder
- [ ] Wacht tot upload compleet is
- [ ] Verifieer dat deze bestanden aanwezig zijn:
  - [ ] `docker-compose.yml` ✨ (belangrijk!)
  - [ ] `Dockerfile`
  - [ ] `server.js`
  - [ ] `package.json`
  - [ ] folder `lib/`
  - [ ] folder `config/`

### 4. Container Manager Setup
- [ ] Open **Container Manager** (of Docker) app in DSM
- [ ] Ga naar tabblad **Project** (bovenaan)
- [ ] Klik op **Create** knop
- [ ] Vul in:
  - **Project name:** `vinyl-collection`
  - **Path:** Klik op folder icoon, selecteer `/docker/vinyl-app`
  - **Source:** Selecteer "Create docker-compose.yml"
- [ ] Klik **Next**
- [ ] Container Manager toont preview van docker-compose.yml
- [ ] Klik **Done**

### 5. Build & Start
- [ ] Selecteer het `vinyl-collection` project in de lijst
- [ ] Klik op **Build** (duurt 2-5 minuten - eerste keer duurt langer)
- [ ] Wacht tot build compleet is (status wordt "Ready")
- [ ] Klik op **Start** (of de play button)
- [ ] Wacht 10-20 seconden
- [ ] Check of containers draaien:
  - [ ] `vinyl-mongodb` - Status: Running (groen)
  - [ ] `vinyl-app` - Status: Running (groen)

### 6. Testen
- [ ] Zoek het IP-adres van je NAS:
  - DSM → Control Panel → Network → Network Interface
  - Of kijk op je router
- [ ] IP-adres: _________________ (schrijf op!)
- [ ] Open Safari op je iPhone (of browser op computer)
- [ ] Ga naar: `http://[IP-ADRES]:8124`
  - Voorbeeld: `http://192.168.1.50:8124`
- [ ] Zie je de WebHookIt login pagina? ✅ Gelukt!

### 7. Account Aanmaken
- [ ] Klik op **Sign Up** of **Register**
- [ ] Maak een gebruikersnaam en wachtwoord aan
- [ ] Login met je nieuwe account
- [ ] Klik op **VINYL** in het menu bovenaan
- [ ] Je ziet: "Your collection is empty"

### 8. Eerste Vinyl Toevoegen
- [ ] Klik op **+ Add Vinyl**
- [ ] Voer een barcode in (bijvoorbeeld: `5099750442227` - een bekend album)
- [ ] Klik **Search**
- [ ] Wordt het album herkend? ✅ Perfect!
- [ ] Klik **Add to Collection**
- [ ] Ga terug naar VINYL menu
- [ ] Zie je je eerste album in de collectie? 🎉

---

## 🎯 Klaar!

Je vinyl collectie app draait nu op je Synology NAS!

**Bookmark dit adres op je iPhone:**
- Ga naar de URL in Safari
- Klik op het "Delen" icoon
- Kies "Add to Home Screen"
- Nu heb je een app icoon op je iPhone! 📱

---

## 🔧 Als iets niet werkt

### Containers starten niet
1. Container Manager → Project → vinyl-collection
2. Klik op de project naam → Log
3. Bekijk de error messages
4. Vaak: wacht 30 seconden en probeer opnieuw (MongoDB heeft tijd nodig)

### Pagina laadt niet
1. Check of beide containers running zijn
2. Check firewall op NAS: Control Panel → Security → Firewall
3. Test vanaf computer op zelfde netwerk eerst
4. Check of poort 8124 niet in gebruik is door andere app

### Album wordt niet gevonden
1. Probeer een andere barcode
2. Discogs API kan soms langzaam zijn
3. Check of je NAS internet toegang heeft (test: ping google.com via SSH)

### Camera werkt niet op iPhone
- Normaal! Camera vereist HTTPS
- **Gebruik handmatige barcode invoer** - werkt prima!
- Typ de barcode van je vinyl en klik Search

---

## 💡 Extra Tips

**Snelkoppeling maken:**
- Bookmark `http://[NAS-IP]:8124` in Safari
- Of: Add to Home Screen voor app-achtige ervaring

**Externe toegang:** (optioneel)
- Setup Synology QuickConnect
- Of gebruik Synology VPN Server

**Backup:**
- Data staat in Docker volume `mongodb-data`
- Backup via Hyper Backup pakket
- Of backup de hele `/docker/vinyl-app` folder

---

## 📞 Hulp Nodig?

Zie `SYNOLOGY_QUICKSTART.md` voor meer details en FAQ!

**Happy collecting! 🎵📀**
