# Vinyl Collection Feature

## Overzicht

Deze nieuwe feature maakt het mogelijk om je vinylcollectie eenvoudig te archiveren met behulp van barcode scanning.

## Functionaliteit

### 1. Barcode Scanner
- **Camera scanning**: Gebruik je webcam of smartphone camera om barcodes direct te scannen
- **Handmatige invoer**: Of voer de barcode handmatig in
- De app gebruikt de Discogs API om automatisch albumgegevens op te halen

### 2. Automatische Album Herkenning
Wanneer een barcode gescand wordt, haalt het systeem automatisch de volgende informatie op:
- Albumtitel
- Artiest
- Uitgavejaar
- Label
- Formaat
- Albumhoes afbeelding

### 3. Collectie Beheer
- **Toevoegen**: Met één druk op de knop wordt het album toegevoegd aan je collectie
- **Bekijken**: Overzichtelijke grid-weergave van je hele collectie
- **Verwijderen**: Eenvoudig verwijderen van albums uit je collectie
- **Notities**: Voeg persoonlijke notities toe aan elk album

## Hoe te gebruiken

1. **Navigeer naar de Vinyl pagina**: Klik op "VINYL" in het hoofdmenu
2. **Voeg een vinyl toe**: Klik op "+ Add Vinyl"
3. **Scan of voer barcode in**:
   - Klik op "Start Camera" en scan de barcode van je vinyl
   - Of voer de barcode handmatig in en klik op "Search"
4. **Bekijk resultaat**: Het album wordt automatisch herkend met alle details
5. **Voeg toe**: Klik op "Add to Collection" om het album op te slaan

## Technische Details

### Frontend
- **Barcode scanning**: Gebruikt ZXing library voor browser-gebaseerde barcode scanning
- **Responsive design**: Werkt op desktop en mobiele apparaten
- **Real-time feedback**: Directe resultaten na het scannen

### Backend
- **Database**: MongoDB collectie `vinyls`
- **API**: Discogs API voor album informatie
- **Routes**:
  - `GET /vinyls` - Toon collectie
  - `GET /vinyls/add` - Voeg vinyl toe pagina
  - `GET /api/vinyls/search/:barcode` - Zoek vinyl op barcode
  - `POST /api/vinyls` - Voeg vinyl toe aan collectie
  - `DELETE /api/vinyls/:id` - Verwijder vinyl uit collectie

### Database Schema
```javascript
{
  userId: ObjectID,
  title: String,
  artist: String,
  year: Number,
  label: String,
  format: String,
  coverUrl: String,
  barcode: String,
  discogsId: Number,
  notes: String,
  addedAt: Date
}
```

## Bestanden

- `/lib/vinyl.js` - Vinyl model
- `/lib/controllers/vinyls.js` - Controller met routes
- `/lib/views/vinyls/index.ejs` - Collectie overzicht
- `/lib/views/vinyls/add.ejs` - Voeg vinyl toe pagina

## Afhankelijkheden

- **ZXing Library**: Voor barcode scanning in de browser
- **Discogs API**: Voor album informatie (geen API key vereist voor basis gebruik)

## Toekomstige Uitbreidingen

Mogelijke verbeteringen:
- Export functionaliteit (CSV, PDF)
- Zoek- en filterfunctionaliteit
- Sorteren op artiest, jaar, etc.
- Statistieken en grafieken
- Delen van collectie met anderen
- Wenslijst functionaliteit
- Barcode scanner via smartphone app
