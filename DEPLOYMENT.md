# Vinyl Collection App - Deployment Gids

Deze gids helpt je om de Vinyl Collection app te deployen, zowel op Railway.app (cloud) als op een Synology NAS (lokaal).

---

## 🚀 Optie 1: Railway.app (Cloud Hosting)

### Voordelen:
- ✅ Gratis tier beschikbaar
- ✅ Automatische HTTPS (nodig voor camera!)
- ✅ Overal toegankelijk via internet
- ✅ Geen eigen server nodig

### Stappen:

#### 1. Maak een Railway Account
- Ga naar [railway.app](https://railway.app)
- Klik op "Start a New Project"
- Login met GitHub

#### 2. Deploy vanuit GitHub
1. Klik op "Deploy from GitHub repo"
2. Selecteer je `webhookit` repository
3. Railway detecteert automatisch de Node.js app

#### 3. Voeg MongoDB toe
1. Klik op "+ New Service"
2. Kies "Database" → "MongoDB"
3. Railway maakt automatisch de connectie

#### 4. Configureer Environment Variables
Ga naar Settings → Variables en voeg toe:
```
NODE_ENV=production
SESSION_SECRET=jouw-random-secret-hier
PUBLIC_USER_CREATION=true
```

#### 5. Deploy!
- Railway deploy automatisch
- Je krijgt een URL zoals: `https://jouw-app.railway.app`
- Open deze URL op je iPhone!

### Kosten:
- Gratis tier: $5/maand credit (genoeg voor klein gebruik)
- Na gratis tier: ~$5-10/maand

---

## 🏠 Optie 2: Synology NAS (Lokale Hosting)

### Voordelen:
- ✅ Geen maandelijkse kosten
- ✅ Data blijft bij jou
- ✅ Werkt zonder internet (binnen netwerk)
- ✅ Altijd beschikbaar als NAS aan staat

### Vereisten:
- Synology NAS met Docker ondersteuning (de meeste modellen vanaf 2015)
- DSM 7.0 of hoger aanbevolen

### Stappen:

#### 1. Installeer Docker op Synology
1. Open **Package Center** op je Synology
2. Zoek naar **Docker** (of **Container Manager** in DSM 7.2+)
3. Klik op **Installeren**

#### 2. Installeer Git Server (optioneel)
1. In Package Center, installeer **Git Server**
2. Of gebruik File Station om de code handmatig te uploaden

#### 3. Upload de Code naar NAS

**Optie A: Via Git**
```bash
# Op je computer, clone de repo naar een Synology shared folder
git clone https://github.com/jouw-username/webhookit.git /volume1/docker/vinyl-app
```

**Optie B: Via File Station**
1. Open File Station op je Synology
2. Maak een folder aan: `docker/vinyl-app`
3. Upload alle bestanden vanuit je lokale webhookit folder

#### 4. Open Container Manager / Docker
1. Open de **Container Manager** (of Docker) app
2. Ga naar **Project**
3. Klik op **Create**

#### 5. Configureer het Project
1. **Project Name**: `vinyl-collection`
2. **Path**: Selecteer `/docker/vinyl-app`
3. **Source**: `Create docker-compose.yml`
4. Docker detecteert automatisch het `docker-compose.yml` bestand

#### 6. Start de Containers
1. Klik op **Build**
2. Wacht tot de containers zijn gebouwd
3. Klik op **Start**

#### 7. Check of het werkt
1. Ga naar je NAS IP-adres met poort 8124:
   ```
   http://[NAS-IP]:8124
   ```
   Bijvoorbeeld: `http://192.168.1.50:8124`

#### 8. Toegang vanaf iPhone (binnen netwerk)
1. Zorg dat je iPhone op hetzelfde WiFi netwerk zit
2. Open Safari en ga naar: `http://[NAS-IP]:8124`
3. Maak een account aan en begin met scannen!

#### 9. Externe Toegang (Optioneel)

**Via Synology QuickConnect:**
1. Activeer QuickConnect in je NAS (Control Panel → QuickConnect)
2. Gebruik reverse proxy in DSM:
   - Control Panel → Login Portal → Advanced → Reverse Proxy
   - Voeg regel toe:
     - Source: `vinyl.jouw-quickconnect-id.synology.me`
     - Port: 443
     - Destination: `localhost:8124`

**Via Port Forwarding:**
1. Open poort 8124 in je router
2. Toegang via: `http://jouw-externe-ip:8124`
3. ⚠️ Niet veilig zonder HTTPS! Gebruik alleen binnen netwerk.

---

## 🔧 Troubleshooting

### Railway Issues

**"Cannot connect to database"**
- Check of MongoDB service is gestart
- Verifieer dat MONGODB_URL environment variable is ingesteld

**"App keeps crashing"**
- Check logs in Railway dashboard
- Verifieer dat alle dependencies in package.json staan

### Synology Issues

**"Cannot find docker-compose.yml"**
- Zorg dat het bestand in de root van de project folder staat
- Check bestandsnaam (moet exact `docker-compose.yml` zijn)

**"Port 8124 already in use"**
- Verander de port in docker-compose.yml:
  ```yaml
  ports:
    - "8080:8124"  # Nu toegankelijk via poort 8080
  ```

**"Container keeps restarting"**
- Open Container Manager → Container → vinyl-app → Logs
- Check de foutmeldingen
- Vaak: MongoDB is nog niet klaar → wacht 30 seconden en probeer opnieuw

**Camera werkt niet op iPhone**
- Moderne browsers vereisen HTTPS voor camera toegang
- Binnen lokaal netwerk: gebruik handmatige barcode invoer
- Of: gebruik QuickConnect met HTTPS

---

## 📱 App Gebruiken

1. **Eerste keer:**
   - Maak een account aan
   - Klik op "VINYL" in menu

2. **Vinyl toevoegen:**
   - Klik "+ Add Vinyl"
   - Scan barcode of voer handmatig in
   - Album wordt automatisch herkend
   - Klik "Add to Collection"

3. **Collectie bekijken:**
   - Klik op "VINYL" in menu
   - Zie je hele collectie in grid-weergave

---

## 🔐 Beveiliging

### Voor Railway:
- Railway zorgt voor HTTPS
- Verander de `SESSION_SECRET` naar een random string

### Voor Synology:
- Schakel firewall in op je NAS
- Gebruik sterke wachtwoorden
- Overweeg VPN voor externe toegang
- Gebruik HTTPS via Let's Encrypt (in DSM: Security → Certificate)

---

## 💡 Tips

- **Backup**: Synology maakt automatisch backup van je database in `/docker/vinyl-app/mongodb-data`
- **Updates**: Pull de laatste code van GitHub en herstart de container
- **Performance**: NAS is vaak sneller dan gratis cloud hosting!

---

## 🆘 Hulp Nodig?

- Railway docs: https://docs.railway.app
- Synology Docker tutorial: https://www.synology.com/en-global/dsm/packages/Docker
- GitHub issues: Open een issue in je repo
