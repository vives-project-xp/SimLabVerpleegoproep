# SimLab Verpleegoproepsysteem - Website en PWA

Deze map documenteert alleen de webapplicatie van het SimLab verpleegoproepsysteem: frontend, backend, API, login, instellingen, PWA en push notifications.

Hardware, Home Assistant, Zigbee, MQTT en fysieke installatie worden elders uitgelegd.

## Wat hoort hier thuis

- Node.js/Express backend.
- Frontendbestanden uit de VM-map `public/`.
- Loginpagina en dashboard.
- Instellingenpagina voor wachtwoorden.
- PWA-bestanden: `manifest.webmanifest`, `sw.js`, icons.
- Push notification code.
- API-documentatie.
- Website troubleshooting.
- Deploymentbestanden voor de website.

## Mooie folderstructuur

Gebruik deze structuur wanneer je de bestanden van de VM in GitHub plaatst:

```text
simlab-verpleegoproepsysteem/
|
|-- README.md
|-- INSTALLATIE.md
|-- API_DOCUMENTATIE.md
|-- TROUBLESHOOTING.md
|-- .gitignore
|-- .env.example
|
|-- backend/
|   |-- server.js
|   |-- server.backup.js
|   |-- package.json
|   |-- package-lock.json
|   |-- users.example.json
|   |-- push-subscriptions.example.json
|   |
|   `-- data/
|       `-- rooms.example.json
|
`-- frontend/
    |-- index.html
    |-- login.html
    |-- settings.html
    |-- manifest.webmanifest
    |-- sw.js
    |-- icon.svg
    |-- icon-192.png
    |-- icon-512.png
    |
    `-- resources/
        |-- css/
        |   `-- stylesheet.css
        |
        `-- js/
            |-- script.js
            |-- login.js
            `-- settings.js
```

## VM-bestanden overzetten

Op de VM staat de webapp momenteel ongeveer zo:

```text
~/simlab-api/
|
|-- node_modules/
|-- package.json
|-- package-lock.json
|-- public/
|-- push-subscriptions.json
|-- server.backup.js
|-- server.js
|-- simlab.log
`-- users.json
```

Zet dit in de repo als volgt:

| VM | Repo | Committen? |
| --- | --- | --- |
| `server.js` | `backend/server.js` | Ja |
| `server.backup.js` | `backend/server.backup.js` | Optioneel |
| `package.json` | `backend/package.json` | Ja |
| `package-lock.json` | `backend/package-lock.json` | Ja |
| `public/index.html` | `frontend/index.html` | Ja |
| `public/login.html` | `frontend/login.html` | Ja |
| `public/settings.html` | `frontend/settings.html` | Ja |
| `public/resources/` | `frontend/resources/` | Ja |
| `public/manifest.webmanifest` | `frontend/manifest.webmanifest` | Ja |
| `public/sw.js` | `frontend/sw.js` | Ja |
| `public/icon.svg` | `frontend/icon.svg` | Ja |
| `public/icon-192.png` | `frontend/icon-192.png` | Ja |
| `public/icon-512.png` | `frontend/icon-512.png` | Ja |
| `users.json` | `backend/users.example.json` | Alleen als voorbeeld zonder echte wachtwoorden |
| `push-subscriptions.json` | `backend/push-subscriptions.example.json` | Alleen leeg of voorbeelddata |
| `node_modules/` | Niet overzetten | Nee |
| `simlab.log` | Niet overzetten | Nee |
| `.env` | Niet overzetten | Nee |

## Frontend

De frontend bestaat uit drie hoofdschermen.

### `index.html`

Dashboard voor de simulatiekamers.

Belangrijkste onderdelen:

- topbar met ingelogde gebruiker;
- knop `Meldingen inschakelen`;
- link naar instellingen voor leerkrachten;
- teller voor hulp gevraagd, collega aanwezig en lage batterij;
- kamer C302 met 4 bedden;
- kamer C314 met 6 bedden;
- legende voor statussen;
- service worker registratie;
- push subscription flow.

Gebruikte scripts en styles:

```html
<link rel="stylesheet" href="resources/css/stylesheet.css">
<script defer src="resources/js/script.js"></script>
```

### `login.html`

Loginpagina voor `Leerkracht` en `Leerling`.

Gebruikt:

```html
<script defer src="resources/js/login.js"></script>
```

De pagina stuurt een loginrequest naar:

```text
POST /api/login
```

### `settings.html`

Instellingenpagina voor leerkrachten.

Functies:

- huidig leerkrachtwachtwoord wijzigen;
- leerlingwachtwoord wijzigen;
- terug naar dashboard;
- uitloggen.

Gebruikt:

```html
<script defer src="resources/js/settings.js"></script>
```

## JavaScript-bestanden

### `resources/js/script.js`

Hoofdlogica van het dashboard.

Doet onder andere:

- controleert huidige gebruiker via `/api/me`;
- redirect naar `/login.html` wanneer niemand is ingelogd;
- haalt statussen op via `/api/state`;
- update bedkaarten met statuskleuren;
- update tellers;
- toont toastmeldingen;
- logt uit via `/api/logout`;
- schrijft push unsubscribe weg via `/api/push/unsubscribe`.

Statussen in de UI:

| Status | CSS-class | Tekst |
| --- | --- | --- |
| `idle` | `free` | Geen melding |
| `call` | `alert` | Hulp gevraagd |
| `present` | `busy` | Collega aanwezig |
| `extra` | `extra` | Extra hulp nodig |

### `resources/js/login.js`

Verwerkt het loginformulier.

Flow:

```text
formulier submit
-> POST /api/login
-> success: naar /
-> error: foutmelding tonen
```

### `resources/js/settings.js`

Verwerkt de instellingenpagina.

Gebruikte endpoints:

- `GET /api/me`
- `POST /api/change-password`
- `POST /api/change-student-password`
- `POST /api/logout`

Alleen gebruikers met rol `leerkracht` mogen deze pagina gebruiken.

## PWA

### `manifest.webmanifest`

De webapp gebruikt een manifest met:

- naam: `SimLab Verpleegoproepsysteem`;
- short name: `SimLab`;
- start URL: `/`;
- display: `standalone`;
- theme color: `#0f172a`;
- icons:
  - `/icon-192.png`;
  - `/icon-512.png`.

### `sw.js`

De service worker doet drie dingen:

- oude caches opruimen bij activatie;
- fetch fallback via cache;
- push notifications tonen.

Bij push wordt een notificatie getoond met:

- titel;
- body;
- icon;
- badge;
- vibratiepatroon;
- klikactie naar `/`.

## Backend

De backend draait als Node.js/Express-app en serveert de frontend.

Belangrijke taken:

- sessies beheren;
- login controleren;
- huidige gebruiker teruggeven;
- kamerstatussen bewaren en teruggeven;
- updates ontvangen via API;
- push subscriptions opslaan;
- push notifications versturen;
- wachtwoorden wijzigen.

## API-documentatie

Deze endpoints worden door de frontend gebruikt of verwacht.

| Methode | Endpoint | Doel |
| --- | --- | --- |
| `POST` | `/api/login` | Inloggen |
| `POST` | `/api/logout` | Uitloggen |
| `GET` | `/api/me` | Huidige gebruiker ophalen |
| `GET` | `/api/state` | Dashboardstatus ophalen |
| `POST` | `/api/call` | Bedstatus aanpassen |
| `GET` | `/api/push/public-key` | VAPID public key ophalen |
| `POST` | `/api/push/subscribe` | Push subscription opslaan |
| `POST` | `/api/push/unsubscribe` | Push subscription verwijderen |
| `POST` | `/api/change-password` | Leerkrachtwachtwoord wijzigen |
| `POST` | `/api/change-student-password` | Leerlingwachtwoord wijzigen |

### `POST /api/login`

Request:

```json
{
  "username": "Leerkracht",
  "password": "Leerkracht1"
}
```

Response:

```json
{
  "success": true,
  "user": {
    "username": "Leerkracht",
    "role": "leerkracht"
  }
}
```

### `GET /api/me`

Response wanneer ingelogd:

```json
{
  "success": true,
  "user": {
    "username": "Leerling",
    "role": "leerling"
  }
}
```

Wanneer niet ingelogd stuurt de frontend de gebruiker terug naar:

```text
/login.html
```

### `GET /api/state`

Wordt ongeveer elke 1,2 seconden opgehaald door `script.js`.

Voorbeeldresponse:

```json
{
  "beds": {
    "C302_1": "idle",
    "C302_2": "call",
    "C302_3": "present",
    "C302_4": "extra",
    "C314_1": "idle"
  },
  "counts": {
    "help": 1,
    "colleague": 1,
    "lowBat": 0
  }
}
```

### `POST /api/call`

Wordt gebruikt om een statusupdate door te geven aan de website.

Request:

```json
{
  "room": "C302",
  "bed": "3",
  "bedId": "C302_3",
  "status": "call"
}
```

Ondersteunde statussen:

```text
idle
call
present
extra
```

Voorbeelden uit de log:

```text
Update ontvangen: { room: 'C302', bed: '3', bedId: 'C302_3', status: 'call' }
Update ontvangen: { room: 'C302', bed: '1', bedId: 'C302_1', status: 'extra' }
Update ontvangen: { room: 'C314', bed: '1', bedId: 'C314_1', status: 'present' }
```

### `GET /api/push/public-key`

Geeft de VAPID public key terug zodat de browser een push subscription kan maken.

Voorbeeldresponse:

```json
{
  "publicKey": "..."
}
```

### `POST /api/push/subscribe`

Slaat een browser push subscription op.

Request is de subscription die uit `registration.pushManager.subscribe()` komt.

### `POST /api/push/unsubscribe`

Verwijdert een push subscription.

Request:

```json
{
  "endpoint": "https://..."
}
```

### `POST /api/change-password`

Wijzigt het wachtwoord van de ingelogde leerkracht.

Request:

```json
{
  "currentPassword": "oud-wachtwoord",
  "newPassword": "nieuw-wachtwoord",
  "confirmPassword": "nieuw-wachtwoord"
}
```

### `POST /api/change-student-password`

Wijzigt het wachtwoord van de leerling-account.

Request:

```json
{
  "newPassword": "nieuw-wachtwoord",
  "confirmPassword": "nieuw-wachtwoord"
}
```

## Configuratiebestanden

### `.env.example`

```env
PORT=3000
SESSION_SECRET=change-this-secret

VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
```

### `.gitignore`

```gitignore
node_modules/
.env
push-subscriptions.json
users.json
*.log
.DS_Store
```

`users.json` bevat wachtwoorden en hoort normaal niet publiek in GitHub. Maak liever een veilig voorbeeldbestand:

```json
{
  "Leerkracht": {
    "password": "change-me",
    "role": "leerkracht"
  },
  "Leerling": {
    "password": "change-me",
    "role": "leerling"
  }
}
```

## Aanbevolen extra documentatie

Maak naast deze README eventueel deze bestanden aan:

```text
INSTALLATIE.md
API_DOCUMENTATIE.md
TROUBLESHOOTING.md
```

Hou die beperkt tot de website.

### `INSTALLATIE.md`

Alleen:

- Node.js dependencies;
- `.env` aanmaken;
- server starten;
- PM2;
- NGINX;
- HTTPS voor PWA/push.

### `API_DOCUMENTATIE.md`

Alleen:

- endpoints;
- requestvoorbeelden;
- responsevoorbeelden;
- statuswaarden;
- foutmeldingen.

### `TROUBLESHOOTING.md`

Alleen:

- login werkt niet;
- `/api/state` geeft niets terug;
- push notifications werken niet;
- service worker cached oude versie;
- PM2 draait niet;
- NGINX proxy werkt niet.

## Niet committen

Deze bestanden mogen niet in GitHub:

```text
node_modules/
.env
push-subscriptions.json
users.json
simlab.log
*.log
```

## Checklist

- [ ] VM-map `public/` staat als `frontend/` in de repo.
- [ ] `server.js` staat in `backend/`.
- [ ] `package.json` en `package-lock.json` staan in `backend/`.
- [ ] `.env.example` staat in de root van deze webapp-repo.
- [ ] `.env` staat niet in Git.
- [ ] `users.json` staat niet in Git.
- [ ] `users.example.json` staat wel in Git.
- [ ] `push-subscriptions.json` staat niet in Git.
- [ ] `push-subscriptions.example.json` staat wel in Git.
- [ ] `simlab.log` staat niet in Git.
- [ ] `manifest.webmanifest` verwijst naar bestaande icons.
- [ ] `sw.js` staat op de juiste publieke locatie.
- [ ] API-routes in frontend en backend gebruiken dezelfde namen.
