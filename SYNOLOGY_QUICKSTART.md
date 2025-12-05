# 🎵 Vinyl Collection op Synology NAS - Snelstart Gids

## 📦 Wat heb je nodig?
- Een Synology NAS (die witte box!)
- Docker/Container Manager geïnstalleerd
- 5-10 minuten tijd

---

## 🚀 In 5 Stappen aan de slag

### Stap 1: Installeer Docker
1. Open je Synology DSM (via browser)
2. Open **Package Center**
3. Zoek **"Docker"** of **"Container Manager"** (DSM 7.2+)
4. Klik **Installeren**
5. Wacht tot de installatie klaar is

### Stap 2: Maak een folder aan voor de app
1. Open **File Station**
2. Ga naar de root (`/` of een shared folder)
3. Maak een nieuwe folder: **docker**
4. Binnen docker, maak folder: **vinyl-app**
5. Upload alle bestanden van deze GitHub repo naar `/docker/vinyl-app`

**Tip:** Download de hele repo als ZIP van GitHub, pak uit, en upload via File Station

### Stap 3: Start de app met Docker Compose
1. Open **Container Manager** (of Docker)
2. Ga naar het tabblad **Project**
3. Klik op **Create**
4. Configureer:
   - **Project name**: `vinyl-collection`
   - **Path**: selecteer `/docker/vinyl-app` (of waar je de bestanden hebt geüpload)
   - **Source**: `Create docker-compose.yml`
5. Klik **Next**
6. Container Manager detecteert het `docker-compose.yml` bestand
7. Klik **Done**

### Stap 4: Build en Start
1. Selecteer het `vinyl-collection` project
2. Klik op **Build** (duurt 2-3 minuten)
3. Als de build klaar is, klik op **Start**
4. Check of beide containers draaien:
   - `vinyl-mongodb` (groen/actief)
   - `vinyl-app` (groen/actief)

### Stap 5: Open de app!
1. Zoek het IP-adres van je NAS:
   - Control Panel → Network → Network Interface
   - Bijvoorbeeld: `192.168.1.50`
2. Open Safari op je iPhone (of browser op computer)
3. Ga naar: `http://[NAS-IP]:8124`
   - Bijvoorbeeld: `http://192.168.1.50:8124`
4. **Done!** 🎉

---

## 📱 Eerste gebruik

1. **Maak een account aan**
   - Klik "Sign Up" (of "Register")
   - Vul een gebruikersnaam en wachtwoord in

2. **Navigeer naar Vinyl**
   - Klik op **VINYL** in het menu

3. **Voeg je eerste plaat toe**
   - Klik **+ Add Vinyl**
   - Voer de barcode handmatig in (camera werkt alleen met HTTPS)
   - Of gebruik de camera op je computer als je daar bent ingelogd
   - Album wordt automatisch herkend!
   - Klik **Add to Collection**

4. **Bekijk je collectie**
   - Terug naar VINYL menu item
   - Zie al je vinyl in een mooi grid!

---

## 🔧 Veelgestelde vragen

### Kan ik dit ook buiten mijn netwerk gebruiken?
Ja! Twee opties:

**Optie 1: Synology QuickConnect** (Makkelijkst)
1. Activeer QuickConnect (Control Panel → QuickConnect)
2. Je krijgt een URL: `jouw-naam.synology.me`
3. Setup reverse proxy:
   - Control Panel → Login Portal → Advanced → Reverse Proxy
   - Source: `vinyl.jouw-naam.synology.me` port 443
   - Destination: `localhost` port 8124

**Optie 2: VPN** (Veiligst)
1. Activeer VPN Server op je Synology
2. Maak VPN verbinding vanaf je iPhone
3. Gebruik gewoon het lokale IP: `http://192.168.1.50:8124`

### De app werkt niet, wat nu?
1. Check de logs:
   - Container Manager → Container → vinyl-app
   - Rechtermuisknop → Details → Log
2. Check of MongoDB draait:
   - Container Manager → Container → vinyl-mongodb
   - Moet status "running" hebben
3. Herstart beide containers:
   - Selecteer het project
   - Klik Stop, wacht 5 seconden, klik Start

### Camera scanning werkt niet op iPhone
- Moderne browsers vereisen HTTPS voor camera
- **Oplossing**: Voer barcodes handmatig in
- Of: Setup HTTPS via Let's Encrypt op je Synology

### Ik wil een andere poort gebruiken
Edit het bestand `docker-compose.yml`:
```yaml
ports:
  - "8080:8124"  # Verander 8080 naar jouw gewenste poort
```
Stop en herstart het project.

### Hoe update ik de app?
1. Download de nieuwste versie van GitHub
2. Vervang de bestanden in `/docker/vinyl-app`
3. Container Manager → Project → vinyl-collection
4. Klik **Build** en dan **Start**

### Waar staat mijn database?
In de Docker volume `mongodb-data`. Je kunt een backup maken:
- Container Manager → Volume
- Selecteer `mongodb-data`
- Export naar een backup locatie

---

## 💾 Data Backup

Je vinyl collectie wordt opgeslagen in de MongoDB database. Maak regelmatig een backup:

**Automatisch via Hyper Backup:**
1. Installeer **Hyper Backup** uit Package Center
2. Maak backup taak aan
3. Selecteer de folder `/docker/vinyl-app`
4. Kies backup bestemming (externe disk, cloud, etc.)
5. Plan dagelijkse backups

**Handmatig:**
1. File Station → docker/vinyl-app
2. Selecteer alles
3. Rechtermuisknop → Download

---

## 🎯 Pro Tips

1. **Sneller scannen**: Gebruik een dedicated barcode scanner die als keyboard werkt
2. **Bulk import**: Als je veel vinyl hebt, vraag vrienden om te helpen scannen!
3. **Bookmark**: Voeg de URL toe als bookmark op je iPhone home screen
4. **Notities**: Gebruik het notities veld voor de staat van je vinyl, aankoopdatum, etc.

---

## 🆘 Hulp nodig?

- Check de volledige `DEPLOYMENT.md` voor meer details
- Synology support: https://www.synology.com/support
- Open een GitHub issue als er bugs zijn

**Veel plezier met je vinyl collectie! 🎵📀**
