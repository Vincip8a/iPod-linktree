# Dein Name · Linktree im Click-Wheel-Look

Eine Linktree-Seite, die aussieht wie ein Click-Wheel-MP3-Player (iPod Classic, 6./7. Generation,
silber oder schwarz) in einem Mac-OS-X-Aqua-Fenster auf einem nachtblauen Desktop. Gebaut mit **Vite** und **Three.js**,
ausgeliefert als statische Seite über GitHub Pages.

Alle Inhalte (Menü, Texte, Links, Playlist, Downloads) stehen in einer einzigen Datei:
[`public/config.json`](public/config.json). Für Textänderungen ist kein Build-Wissen nötig.
Social-Bild, Cover und PDFs lesen Name, Monogramm, E-Mail und Menüpunkte ebenfalls aus dieser
Datei, müssen nach einer Namensänderung aber neu erzeugt werden, siehe
[Assets neu erzeugen](#assets-neu-erzeugen).

Sämtliche Grafiken (Favicon, Playlist-Cover, Social-Bild, PDFs) sind selbst gezeichnet und
werden reproduzierbar aus Skripten in [`tools/`](tools/) erzeugt.

---

## Schnellstart

```bash
npm install     # Abhängigkeiten installieren
npm run dev     # Entwicklungsserver starten (URL steht im Terminal)
npm run build   # Produktions-Build nach dist/
npm run preview # Build lokal gegenprüfen
```

Benötigt **Node 22** oder neuer.

---

## Inhalte ändern: `public/config.json`

Die Datei wird zur Laufzeit geladen. Nach dem Speichern reicht ein Neuladen im Browser,
ein Neustart des Dev-Servers ist nicht nötig. Titel, Meta-Tags und die Linkliste für Besucher
ohne JavaScript schreibt der Build aus dieser Datei in `index.html`: nach Änderungen also neu
bauen (das erledigt der Deploy-Workflow bei jedem Push). Ein Tippfehler in der Datei (z. B. ein
Komma nach dem letzten Eintrag) bricht Dev-Server und Build mit
`public/config.json is not valid JSON: … (line …)` ab: die genannte Zeile prüfen.

**Zwei Sprachen:** Jeder Text kann statt einer Zeichenkette ein Objekt mit einem Eintrag pro Sprache
aus `settings.languages` sein, z. B. `"label": { "de": "Über mich", "en": "About me" }`. Ein
einfacher Text gilt in jeder Sprache (z. B. „Free Guide“). Fehlt einer Sprache der Eintrag, steht
dort der Text der ersten Sprache, die einen hat. Rechts in der Menüleiste wechselt „DE | EN“ die
Sprache; mehr dazu unter `settings`.

**Pfade** zu eigenen Dateien (Cover, Downloads, Rechtliches) relativ angeben, ohne `/` am Anfang,
z. B. `"downloads/media-kit.pdf"`. Sie gelten relativ zur Seite und funktionieren so auch unter
`https://<nutzer>.github.io/<repo>/`. Ein führendes `/` wird genauso behandelt. Erlaubt sind
außerdem vollständige `https://`-, `http://`-, `mailto:`- und `tel:`-Adressen; andere Adressen
(z. B. `javascript:`) und unvollständige (z. B. nur `"https://"`) werden mit einem Hinweis in der
Browser-Konsole ignoriert, die Zeile erscheint dann ohne Link (auf dem iPod und in der Linkliste
ohne JavaScript).

### `brand`

Steht für Kopfzeile, Fenstertitel und Absender.

| Feld          | Typ    | Bedeutung                                                   |
| ------------- | ------ | ----------------------------------------------------------- |
| `name`        | String | Dein Name: Menüleiste, Tab-Titel, Kopf des iPod-Hauptmenüs  |
| `monogram`    | String | Zwei Buchstaben für Icon, Cover und die Menüleiste auf schmalen Handys (dort statt des Namens), z. B. `"DN"` |
| `monogramArt` | String | Optional: Pfad zu einem gezeichneten Monogramm für den Boot-Screen, z. B. `"assets/monogram.svg"` (sonst das Kürzel als Text). `node tools/make-monogram.mjs` zeichnet `monogram` in der Markenschrift Bricolage Grotesque, ein Punkt in Mint (braucht einen Mac mit Swift) |
| `tagline`     | String | Einzeiler: Statuszeile unter dem iPod, Meta-Beschreibung und Text der Social-Media-Vorschau |
| `windowTitle` | String | Text in der Titelleiste des Aqua-Fensters                    |
| `email`       | String | Kontaktadresse für „Kontakt“ in der Menüleiste (ohne sie entfällt der Punkt) |

### `siteUrl`

Optional: die öffentliche Adresse der Seite, z. B. `"https://<nutzer>.github.io/<repo>/"`.
Social-Media-Vorschauen (LinkedIn, X, WhatsApp, Slack) brauchen eine absolute Bild-URL; der Build
schreibt `og:image` und `og:url` deshalb absolut, sobald er die Adresse kennt. Im
GitHub-Pages-Workflow ermittelt er sie selbst aus dem Repository
(`https://<nutzer>.github.io/<repo>/`). `siteUrl` ist also nur nötig für eine eigene Domain oder
einen anderen Host (alternativ die Umgebungsvariable `SITE_URL` beim Build). Eine Adresse ohne
`https://` (z. B. `"deinname.de"`) ergänzt der Build selbst; ein Wert, der keine Webadresse ist,
wird mit einer Warnung in der Build-Ausgabe übergangen. Ohne bekannte Adresse (z. B. bei einem
lokalen Build) bleibt das Vorschaubild relativ und wird von den meisten Diensten nicht angezeigt.

### `menu[]`

Die Liste der Einträge im Hauptmenü: eine Zeile pro Eintrag, in genau dieser Reihenfolge.
Jeder Eintrag hat vier gemeinsame Felder und zwei optionale:

| Feld    | Typ    | Bedeutung                                                              |
| ------- | ------ | ---------------------------------------------------------------------- |
| `id`    | String | Eindeutiger Schlüssel, intern verwendet (klein, ohne Leerzeichen)      |
| `label` | String | Beschriftung im Menü                                                    |
| `type`  | String | Bauart der Unterseite: `list`, `page`, `nowplaying`, `downloads`, `game` oder `menu` |
| `title` | String | Überschrift der Unterseite                                              |
| `icon`  | String | Optional: das Bild des Eintrags in der Vorschau rechts im Hauptmenü und unter kurzen Texten: `book`, `box`, `film`, `person`, `games`, `game`, `blocks`, `contacts`, `chat`, `download` oder `monogram` (das Kürzel). Ohne `icon` wählt der Typ: `contacts` für `list`, `download` für `downloads`, `chat` für eine Seite mit Schaltflächen, sonst `monogram`. `nowplaying` zeigt sein Cover rund im selben Medaillon |
| `lang`  | String | Optional: Sprache von `label` und `title`, wenn sie nicht Deutsch ist, z. B. `"en"` für „Work Together“ (Screenreader sprechen sie dann richtig aus). Gilt für beide Felder: nur setzen, wenn `label` und `title` in dieser Sprache sind |

Je nach `type` kommen weitere Felder dazu. Zeilen (`items[]`, `actions[]`) können ebenfalls ein
`lang` haben. Fehlt einer Zeile das `label`, zeigt sie ihr `detail`, die Adresse oder den
Dateinamen; eine Zeile ganz ohne Angaben wird mit einem Hinweis in der Browser-Konsole übersprungen.

#### `type: "list"`: eine Liste von Links

| Feld             | Typ    | Bedeutung                              |
| ---------------- | ------ | -------------------------------------- |
| `items[].label`  | String | Beschriftung der Zeile                 |
| `items[].detail` | String | Zusatz rechts in der Zeile             |
| `items[].href`   | String | Ziel-URL (oder `mailto:` / `tel:`)     |

#### `type: "page"`: ein Textblock mit Schaltflächen

| Feld               | Typ    | Bedeutung                                  |
| ------------------ | ------ | ------------------------------------------ |
| `body`             | String | Fließtext der Seite                        |
| `actions[].label`  | String | Beschriftung der Schaltfläche              |
| `actions[].href`   | String | Ziel-URL der Schaltfläche                  |

#### `type: "nowplaying"`: Playlist-Ansicht

| Feld                | Typ    | Bedeutung                                               |
| ------------------- | ------ | ------------------------------------------------------- |
| `artist`            | String | Name über der Titelliste                                |
| `cover`             | String | Pfad zum Cover, z. B. `"assets/playlist-cover.svg"`     |
| `spotifyUrl`        | String | Link zur Playlist bei einem Streamingdienst (Spotify, Apple Music, YouTube Music, SoundCloud, Deezer, Tidal, Amazon Music); die Schaltfläche heißt passend „In Spotify öffnen“, „In Apple Music öffnen“ usw., bei anderen Adressen „Playlist öffnen“ |
| `tracks[].title`    | String | Titel des Stücks                                        |
| `tracks[].artist`   | String | Interpret                                               |
| `tracks[].duration` | String | Länge als Text, z. B. `"3:48"`                          |

#### `type: "downloads"`: Dateiliste

| Feld              | Typ    | Bedeutung                                               |
| ----------------- | ------ | ------------------------------------------------------- |
| `items[].label`   | String | Beschriftung des Eintrags                               |
| `items[].file`    | String | Pfad zur Datei, z. B. `"downloads/media-kit.pdf"`       |
| `items[].format`  | String | Dateiformat als Text, z. B. `"PDF"`                     |
| `items[].size`    | String | Dateigröße als Text, z. B. `"386 kB"`. Für Dateien in `public/` trägt der Build die echte Größe automatisch ein |

Die Datei am besten in `public/downloads/` ablegen. Eine Datei auf einem anderen Server (z. B.
einem Cloud-Speicher) öffnet sich in einem neuen Tab, weil Browser dort nicht direkt
herunterladen.

#### `type: "menu"`: ein Untermenü

| Feld    | Typ   | Bedeutung                                                                 |
| ------- | ----- | ------------------------------------------------------------------------- |
| `items` | Array | Einträge wie im Hauptmenü (gleiche Felder und Typen), z. B. die beiden Spiele |

So stehen Snake und Blocks unter „Spiele“ / „Games“ (`icon: "games"`, ein Gamepad).

#### `type: "game"`: Snake oder Blocks

| Feld   | Typ    | Bedeutung                                                          |
| ------ | ------ | ------------------------------------------------------------------ |
| `game` | String | `"snake"` (Standard) oder `"blocks"`                               |

**Snake** (`icon: "game"`): die Schlange wächst mit jedem Punkt und wird schneller; Wand oder
eigener Körper beenden die Runde. Gelenkt wird mit den vier Tasten des Rads oder den Pfeiltasten,
Drehen am Rad lenkt nach links oder rechts.

**Blocks** (`icon: "blocks"`): unser eigenes Fallblock-Spiel. Teile aus vier Feldern fallen in einen
Schacht, eine volle Reihe verschwindet, alle zehn Reihen wird es schneller. Drehen am Rad oder links
und rechts schiebt das Teil, hoch dreht es, runter lässt es schneller fallen.

Bei beiden startet und pausiert die Mitte (Enter, Leertaste); steht das Spiel, geht „links“ wie
überall zurück. Der Rekord gilt nur für den Besuch, auf dem Gerät wird nichts gespeichert.

### `legal`

Die Links rechts in der Menüleiste (auch auf `impressum.html`, `datenschutz.html` und der
Fehlerseite `404.html`) und unter der Linkliste ohne JavaScript. In Deutschland Pflicht für
geschäftsmäßige Seiten: die beiden Platzhalter-Seiten durch eigene Texte ersetzen oder hier auf
die eigenen Seiten verweisen. Die Platzhalter tragen `<meta name="robots" content="noindex">`,
damit Suchmaschinen sie nicht aufnehmen; nach dem Ersetzen dort `index, follow` eintragen.

| Feld          | Typ    | Bedeutung                                                    |
| ------------- | ------ | ------------------------------------------------------------ |
| `impressum`   | String | Pfad oder URL des Impressums, z. B. `"impressum.html"`       |
| `datenschutz` | String | Pfad oder URL der Datenschutzerklärung, `"datenschutz.html"` |

Fehlt ein Feld, fehlt auch der Link.

### `settings`

| Feld         | Typ     | Bedeutung                                                            |
| ------------ | ------- | -------------------------------------------------------------------- |
| `finish`     | String  | Farbe der Front: `"black"` (schwarz eloxiert im Nachtblau der Marke, dunkles Click Wheel) oder `"silver"` (Standard, auch bei jedem anderen Wert). Gilt für iPod, Intro, Desktop-Symbol, Favicon und Social-Bild (diese beiden nach `node tools/make-all.mjs`) |
| `clickSound` | Boolean | `true` spielt beim Navigieren ein Klickgeräusch                      |
| `intro`      | Boolean | `true` zeigt die 3D-Einstiegsanimation beim ersten Aufruf, `false` nie |
| `languages`  | Array   | Die Sprachen der Texte, z. B. `["de", "en"]`; die erste gilt für die gebaute Seite (Meta-Tags, Linkliste ohne JavaScript, Social-Bild). Ab zwei Sprachen zeigt die Menüleiste den Umschalter. Ohne Angabe: nur Deutsch |

Als „aus“ gelten bei beiden auch `"false"`, `"off"`, `"never"`, `"no"` und `0` (z. B. versehentlich
in Anführungszeichen geschrieben). Die Animation läuft einmal pro Browser-Sitzung: wer vom
Impressum zurückkommt oder neu lädt, sieht gleich den iPod. Sie lässt sich jederzeit mit „Intro
überspringen“, Esc oder „Links“ in der Menüleiste abbrechen; ohne WebGL und bei der
Systemeinstellung „Bewegung reduzieren“ entfällt sie, auf einem zu langsamen Gerät endet sie früher. Wer sie nur in der
veröffentlichten `config.json` abschaltet, ohne neu zu bauen, spart die Animation, aber nicht den
Download ihres Skripts: dafür neu bauen.

**Welche Sprache ein Besucher sieht:** `?lang=en` (oder `?lang=de`) in der Adresse, sonst die zuletzt
in der Menüleiste gewählte (auf dem Gerät gemerkt, `localStorage` `anstatt-lang`), sonst die erste
Browsersprache, die die Seite hat, sonst Englisch. Der Umschalter baut Fenster und iPod in der neuen
Sprache neu auf (zurück zum Hauptmenü). Impressum und Datenschutz bleiben deutsch; auf Englisch heißen
die Links „Imprint“ und „Privacy“.

### Beispiel

```json
{
  "siteUrl": "https://deinname.github.io/linktree/",
  "brand": {
    "name": "Dein Name",
    "monogram": "DN",
    "tagline": "Design, Code und Konzept",
    "windowTitle": "Dein Name · Linktree",
    "email": "dein.name@example.com"
  },
  "menu": [
    {
      "id": "kontakt",
      "label": "Kontakt",
      "type": "list",
      "title": "Kontakt",
      "items": [
        { "label": "E-Mail", "detail": "dein.name@example.com", "href": "mailto:dein.name@example.com" },
        { "label": "LinkedIn", "detail": "@deinname", "href": "https://www.linkedin.com/in/deinname" }
      ]
    },
    {
      "id": "work-together",
      "label": "Work Together",
      "lang": "en",
      "type": "page",
      "title": "Work Together",
      "body": "Kurz beschreiben, woran du arbeitest und wofür dich Leute anfragen können.",
      "actions": [
        { "label": "Projekt anfragen", "href": "mailto:dein.name@example.com" }
      ]
    },
    {
      "id": "playlist",
      "label": "Playlist",
      "type": "nowplaying",
      "title": "Meine Playlist",
      "artist": "Dein Name",
      "cover": "assets/playlist-cover.svg",
      "spotifyUrl": "https://open.spotify.com/",
      "tracks": [
        { "title": "Titel eins", "artist": "Interpret eins", "duration": "3:48" },
        { "title": "Titel zwei", "artist": "Interpret zwei", "duration": "4:12" }
      ]
    },
    {
      "id": "downloads",
      "label": "Downloads",
      "type": "downloads",
      "title": "Downloads",
      "items": [
        { "label": "Portfolio 2026", "file": "downloads/portfolio-2026.pdf", "format": "PDF", "size": "440 kB" },
        { "label": "Case Study: Projekt X", "file": "downloads/case-study-projekt-x.pdf", "format": "PDF", "size": "386 kB" },
        { "label": "Media Kit", "file": "downloads/media-kit.pdf", "format": "PDF", "size": "386 kB" }
      ]
    }
  ],
  "legal": {
    "impressum": "impressum.html",
    "datenschutz": "datenschutz.html"
  },
  "settings": {
    "clickSound": true,
    "intro": true
  }
}
```

---

## PDFs ersetzen

Die drei mitgelieferten PDFs in `public/downloads/` sind **gestaltete Platzhalter**. Inhalte,
Zahlen und Kontaktdaten darin sind frei erfunden und als Platzhalter gekennzeichnet.

So ersetzt du sie durch eigene:

1. Eigenes PDF nach `public/downloads/` legen.
2. In `public/config.json` im `downloads`-Eintrag `file`, `label` und `format` auf die neue
   Datei anpassen. Die Dateigröße (`size`) musst du nicht pflegen: Beim Bauen und im
   Entwicklungsserver wird sie aus der echten Datei berechnet (1 kB = 1000 Byte, z. B.
   `"386 kB"`, ab 1 MB `"1,2 MB"`). Nur für Dateien auf einem anderen Server gilt der Wert aus
   `config.json`. Zum Nachsehen gibt `node tools/file-sizes.mjs` die Größen aus.

Alternativ die Platzhalter weiterverwenden und nur die Texte austauschen: Die Inhalte stehen
als HTML-Vorlagen in [`tools/make-downloads.mjs`](tools/make-downloads.mjs). Nach dem Ändern

```bash
node tools/make-downloads.mjs
```

ausführen. Das überschreibt die drei PDFs; die Größen im Downloads-Menü zieht der nächste Build
von selbst nach.

---

## Assets neu erzeugen

Alle Grafiken entstehen aus Skripten in `tools/`. Gerendert wird mit einem lokal vorhandenen
Chromium, es wird **kein** npm-Paket dafür gebraucht.

```bash
node tools/make-all.mjs        # alles auf einmal
node tools/make-icons.mjs      # favicon.svg, playlist-cover.svg, apple-touch-icon.png
node tools/make-og.mjs         # og-image.png (1200x630)
node tools/make-downloads.mjs  # die drei PDFs
node tools/make-monogram.mjs   # assets/monogram.svg (Boot-Screen), nur auf einem Mac mit Swift
```

Die Skripte suchen sich ein Chromium in dieser Reihenfolge (die Screenshot-Skripte in
`scripts/` ebenso):

1. Umgebungsvariable `CHROME_PATH`
2. Chromium von Playwright (`npx playwright install chromium`; auch unter
   `PLAYWRIGHT_BROWSERS_PATH`)
3. System-Installation von Chrome, Chromium oder Edge

Wird keines gefunden, bricht das Skript mit einem Hinweis ab. Ein anderer Pfad lässt sich
erzwingen:

```bash
CHROME_PATH="/Pfad/zu/chromium" node tools/make-all.mjs
```

Gestaltung und Farben liegen zentral in [`tools/lib/brand.mjs`](tools/lib/brand.mjs)
(Palette, gezeichnete Motive) und [`tools/lib/pdf.mjs`](tools/lib/pdf.mjs)
(Seitenlayout der PDFs).

> **Wichtig nach einer Namensänderung:** Die Skripte lesen `brand` (Name, Monogramm, E-Mail),
> den Titel der Playlist und die Menüpunkte aus `public/config.json`. Nach einer Änderung dort
> `node tools/make-all.mjs` ausführen, sonst zeigen Social-Bild, Cover und PDFs die alten
> Angaben. Die übrigen PDF-Texte stehen in [`tools/make-downloads.mjs`](tools/make-downloads.mjs).

---

## Gratis-Guide unter `/guide/`

`public/guide/index.html` ist der englische Gratis-Guide „The 6 parts of every AI video pipeline“,
erreichbar unter `anstattpunkt.com/guide/` und im iPod-Menü unter „Free Guide“. Die Seite wird
nicht von Hand bearbeitet: Sie entsteht aus `free_guide.html` im Motion-Studio (ein
Artifact-Body ohne `<head>`).

```bash
node tools/sync-guide.mjs                        # Quelle: ../motion_studio/sales/creator/free_guide.html
node tools/sync-guide.mjs pfad/free_guide.html   # andere Quelle
node tools/sync-guide.mjs --check                # ändert nichts, Code 1, wenn die Seite veraltet ist
```

Das Skript ergänzt doctype, Viewport, Beschreibung und og-Tags (absolute Adressen aus `siteUrl`),
lädt die Schriften aus `public/fonts/` statt von Google Fonts (siehe [Schriften](#schriften)) und
ersetzt den Impressum-Platzhalter im Footer durch Links auf die Seiten aus `legal`. Shop-Links
und das Entwurfsbanner stehen in der Quelle: dort ändern und neu synchronisieren. Der
Entwicklungsserver liefert `/guide/` wie GitHub Pages aus (jeder Ordner in `public/` mit eigener
`index.html`).

## Link-Seiten-Anleitung unter `/linkseite/`

`public/linkseite/index.html` ist die deutsche Anleitung „So baust du deine Link-Seite mit Claude
Code“ unter `anstattpunkt.com/linkseite/`, im iPod-Menü unter „Link-Seite bauen“ („Build this
page“). Sie entsteht wie der Guide aus einer Quelle im Motion-Studio
(`sales/creator/linkseite_guide.html`) und wird nicht von Hand bearbeitet.

```bash
node tools/sync-linkseite.mjs                              # Quelle: ../motion_studio/sales/creator/linkseite_guide.html
node tools/sync-linkseite.mjs pfad/linkseite_guide.html    # andere Quelle
node tools/sync-linkseite.mjs --check                      # ändert nichts, Code 1, wenn die Seite veraltet ist
```

Sprache `de`, Footer-Links „Impressum · Datenschutz“, Schriften aus `public/fonts/`. Die Seite hat
keine eigenen Medien.

## Angebotsseite unter `/angebot/`

`public/angebot/` ist die deutsche B2B-Angebotsseite „Erklärvideos aus Code“ unter
`anstattpunkt.com/angebot/`. Sie steht nicht im iPod-Menü. Wie der Guide entsteht sie aus einer
Quelle im Motion-Studio (`sales/offer_page.html`) und wird nicht von Hand bearbeitet.

```bash
node tools/sync-offer.mjs                        # Quelle: ../motion_studio/sales/offer_page.html
node tools/sync-offer.mjs pfad/offer_page.html   # andere Quelle (Videos und Bilder relativ zu deren Ordner)
node tools/sync-offer.mjs --check                # ändert nichts, Code 1, wenn Seite oder Medien veraltet sind
```

Das Skript baut `index.html` wie beim Guide (Sprache `de`, og-Bild = Standbild des ersten Videos,
Footer-Links „Impressum · Datenschutz“) und kopiert die Medien nach `public/angebot/media/`: ein
Video `media/<name>.mp4` aus `demos/deliver/preview/<name>_preview.mp4`, ein Standbild
`media/<name>_poster.jpg` aus `offer_media/`. Dateien in `media/`, auf die die Seite nicht mehr
zeigt, löscht es. Zum Schluss prüft es, dass jede relative Adresse der Seite auf eine Datei zeigt.
Videos und Standbilder kosten zusammen knapp 10 MB im Repository; ein Video lädt erst, wenn jemand auf Play drückt.

### Schriften

Guide, Link-Seiten-Anleitung und Angebotsseite nutzen Bricolage Grotesque, Instrument Sans und JetBrains Mono (alle SIL
Open Font License 1.1). Sie liegen als variable woff2 in `public/fonts/`, je Familie eine Datei für
Latin und eine für Latin Extended, so wie Google Fonts sie ausliefert; der Browser lädt Latin
Extended nur bei Bedarf. Die Sync-Skripte ersetzen die Google-Fonts-Links der Quellen durch
`@font-face`-Regeln auf diese Dateien (Tabelle `FONTS` in `tools/lib/artifact-page.mjs`), damit
beim Aufruf keine IP-Adresse an Google geht. Braucht eine Quelle eine neue Schrift oder eine
Stärke außerhalb der Dateien, bricht das Skript mit einer Meldung ab: dann die woff2-Dateien von
Google Fonts (`fonts.googleapis.com/css2?family=…`, darin die Adressen für `latin` und
`latin-ext`) nach `public/fonts/` legen und `FONTS` ergänzen.

---

## Deployment auf GitHub Pages

Der Workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) baut das Projekt
und veröffentlicht `dist/`. Er läuft bei jedem Push auf `main` und lässt sich zusätzlich von
Hand starten (Actions → *Deploy to GitHub Pages* → *Run workflow*).

Einmalig einzurichten:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions** auswählen.
2. Auf `main` pushen (oder den Workflow von Hand starten).
3. Die Adresse der Seite steht danach unter Settings → Pages und in der Ausgabe des Workflows.

Der Workflow verwendet Node 22, installiert mit `npm ci` und baut mit `npm run build`. Vorher
erzeugt er `og-image.png`, die Icons und das Standard-Cover mit Name und Kürzel aus
`public/config.json` neu (mit dem Chrome des Runners; klappt das nicht, bleiben die Bilder aus
dem Repo). Die
nötigen Rechte (`pages: write`, `id-token: write`) sind darin bereits gesetzt.

> **Hinweis bei Projekt-Seiten:** `vite.config.js` nutzt `base: './'` (relative Pfade). Die Seite
> funktioniert damit ohne Anpassung sowohl unter `https://<nutzer>.github.io/<repo>/` als auch auf
> einer eigenen Domain: Config, Assets und Downloads werden relativ zur Seite geladen. Nur bei
> einer eigenen Domain für Social-Media-Vorschauen `siteUrl` in `config.json` setzen (siehe oben).

---

## Projektstruktur

Aufbau, Ablauf und Modul-Schnittstellen im Detail: [`ARCHITECTURE.md`](ARCHITECTURE.md).

```
.
├─ .github/workflows/deploy.yml  GitHub-Pages-Deployment
├─ public/                       wird unverändert ausgeliefert
│  ├─ config.json                alle Inhalte der Seite
│  ├─ impressum.html             Impressum (Platzhalter, bitte ersetzen)
│  ├─ datenschutz.html           Datenschutzerklärung (Platzhalter, bitte ersetzen)
│  ├─ 404.html                   eigene Fehlerseite für GitHub Pages
│  ├─ static.css, static.js      gemeinsamer Desktop-Look und Menüleiste dieser drei Seiten
│  ├─ favicon.svg                Player-Silhouette, auch bei 16 px lesbar
│  ├─ apple-touch-icon.png       180x180, für den Homescreen
│  ├─ og-image.png               1200x630, Social-Media-Vorschau
│  ├─ assets/
│  │  └─ playlist-cover.svg      600x600, Album-Cover der Playlist
│  ├─ guide/index.html           Gratis-Guide, erzeugt von tools/sync-guide.mjs
│  ├─ linkseite/index.html       Link-Seiten-Anleitung, erzeugt von tools/sync-linkseite.mjs
│  ├─ angebot/                   Angebotsseite mit media/, erzeugt von tools/sync-offer.mjs
│  ├─ fonts/                     Schriften für Guide, Anleitung und Angebotsseite (woff2, SIL OFL)
│  └─ downloads/                 die drei Platzhalter-PDFs
├─ src/                          Anwendungscode
│  ├─ main.js                    Ablauf: Desktop, iPod, Intro, Übergabe
│  ├─ base.css                   Grundstil, Button „Intro überspringen“
│  ├─ shared/ipodSpec.js         Maße und Farben des iPods (eine Quelle für 3D und DOM)
│  ├─ shared/config.js           lädt config.json
│  ├─ shared/href.js             die Link-Regeln (iPod, Menüleiste, Linkliste ohne JavaScript)
│  ├─ shared/dom.js              DOM-Helfer h()
│  ├─ window/                    Aqua-Desktop, Menüleiste und Fenster
│  ├─ ipod/                      die iPod-Oberfläche (Click Wheel, Menüs, Now Playing)
│  └─ intro/                     3D-Intro mit Three.js (wird nachgeladen)
├─ dev/                          Testseiten für Intro, iPod und Fenster
├─ scripts/                      Screenshots per Headless-Chromium
├─ tools/                        Skripte, die alle Grafiken erzeugen
│  ├─ lib/brand.mjs              Farben, Schrift, gezeichnete Motive
│  ├─ lib/pdf.mjs                Seitenlayout der PDFs
│  ├─ lib/render.mjs             HTML → PDF/PNG via Chromium
│  ├─ make-all.mjs               erzeugt alles
│  ├─ make-icons.mjs             Icons und Playlist-Cover
│  ├─ make-og.mjs                Social-Media-Bild
│  ├─ make-downloads.mjs         die drei PDFs
│  ├─ file-sizes.mjs             Dateigrößen für "size" in config.json
│  ├─ sync-guide.mjs             baut public/guide/ aus dem Gratis-Guide
│  ├─ sync-linkseite.mjs         baut public/linkseite/ aus der Link-Seiten-Anleitung
│  ├─ sync-offer.mjs             baut public/angebot/ aus der Angebotsseite, samt Videos
│  ├─ lib/artifact-page.mjs      gemeinsamer Teil der drei: Kopf, Schriften, Footer-Links
│  ├─ make-monogram.mjs          Monogramm in der Markenschrift (lib/glyphs.swift, CoreText)
│  └─ fonts/                     Bricolage Grotesque (SIL OFL) für Monogramm und Social-Bild
├─ index.html                    Einstiegspunkt
├─ vite.config.js                Build-Konfiguration (füllt Meta-Tags und <noscript> aus config.json)
├─ ARCHITECTURE.md               Architektur für Entwickler
└─ package.json
```

---

## Rechtliches zu den Grafiken

Favicon, Touch-Icon, Playlist-Cover, Social-Bild und die PDFs sind vollständig selbst
gezeichnet (SVG und HTML, reine Geometrie). Es werden keine fremden Bilder und keine Logos
verwendet. Die Player-Darstellung ist eine stilisierte Eigenzeichnung und zitiert nur die
allgemeine Formensprache von Geräten dieser Bauart. Diese Aussage gilt für die Grafiken. Im
Seitentext kommt der Produktname „iPod“ vor (Fenstertitel, Symbolname, Hinweis ohne JavaScript,
Rechtsseiten); er ist eine Marke ihres Inhabers und wird nur beschreibend verwendet. Wer das
vermeiden möchte, ändert `windowTitle` in `config.json` und die übrigen Stellen im Code.
