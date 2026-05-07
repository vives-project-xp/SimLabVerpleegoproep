# Home Assistant Koppelen aan de SimLab Website

## Moderne REST-Architectuur

Deze handleiding beschrijft hoe de SimLab website gekoppeld is aan Home Assistant in de huidige productieopstelling.

De webapplicatie draait lokaal op een Debian VM en gebruikt een Node.js / Express backend. Home Assistant stuurt knopacties via REST commands naar deze backend. De frontend toont de toestand door regelmatig `/api/state` op te halen.

> Deze documentatie beschrijft de huidige productieflow. De website werkt volledig via REST en polling.

## Projectcontext

Het SimLab verpleegoproepsysteem is een lokaal oproepsysteem voor simulatiekamers. Per bed kan een Zigbee-knop gebruikt worden om een oproepstatus te wijzigen. Het dashboard geeft leerkrachten en studenten een live overzicht van alle bedden.

## Technologieen

| Laag | Technologie |
| --- | --- |
| Frontend | HTML, CSS, Vanilla JavaScript |
| PWA | `manifest.webmanifest`, service worker, push notifications |
| Backend | Node.js, Express.js, express-session |
| Integratie | Home Assistant, Zigbee, REST commands, automations |
| Hosting | Debian VM, PM2, Nginx reverse proxy |

## Bestandslocaties

| Onderdeel | Pad |
| --- | --- |
| Backend | `software/webbsiteLayout/PWA/backend/server.js` |
| Dashboard | `software/webbsiteLayout/PWA/frontend/index.html` |
| Loginpagina | `software/webbsiteLayout/PWA/frontend/login.html` |
| Instellingen | `software/webbsiteLayout/PWA/frontend/settings.html` |
| Dashboard JS | `software/webbsiteLayout/PWA/frontend/resources/js/script.js` |
| Login JS | `software/webbsiteLayout/PWA/frontend/resources/js/login.js` |
| Settings JS | `software/webbsiteLayout/PWA/frontend/resources/js/settings.js` |
| Styling | `software/webbsiteLayout/PWA/frontend/resources/css/stylesheet.css` |
| Service worker | `software/webbsiteLayout/PWA/frontend/sw.js` |
| Manifest | `software/webbsiteLayout/PWA/frontend/manifest.webmanifest` |

## Architectuur

```text
Zigbee knop
  -> Home Assistant
  -> automation
  -> rest_command
  -> POST /api/call
  -> Node.js backend bewaart status
  -> frontend pollt GET /api/state
  -> dashboard update kaarten, tellers en meldingen
```

## Rollen van de Systemen

### Home Assistant

Home Assistant is verantwoordelijk voor:

- koppeling met Zigbee-knoppen;
- detecteren van single, double en long click;
- uitvoeren van automations;
- versturen van REST commands naar de backend.

### Node.js / Express Backend

De backend is verantwoordelijk voor:

- serveren van de frontend;
- sessieauthenticatie;
- ontvangen van statusupdates via `/api/call`;
- bewaren van de actuele bedstatussen;
- teruggeven van dashboardstate via `/api/state`;
- push subscriptions beheren;
- push notifications versturen;
- wachtwoorden beheren.

### Frontend

De frontend is verantwoordelijk voor:

- loginflow;
- dashboardweergave;
- statuskaarten per bed;
- tellers;
- toastmeldingen;
- push notification registratie;
- PWA-functionaliteit;
- responsive weergave op desktop, tablet en mobiel.

## Kamer- en Bedmodel

De huidige configuratie bevat:

| Kamer | Bedden |
| --- | --- |
| C302 | 4 |
| C314 | 6 |

Elke bedstatus heeft een unieke `bedId`:

```text
C302_1
C302_2
C302_3
C302_4
C314_1
C314_2
C314_3
C314_4
C314_5
C314_6
```

## Statussen

| Status | UI-class | Label |
| --- | --- | --- |
| `idle` | `free` | Geen melding |
| `call` | `alert` | Hulp gevraagd |
| `present` | `busy` | Collega aanwezig |
| `extra` | `extra` | Extra hulp nodig |

## Knopflows

Aanbevolen productieflow:

```text
single click: idle -> call
double click: call -> present
long click: present -> idle
```

Extra scenario:

```text
long click: call -> extra
```

Gebruik dit alleen wanneer de simulatie expliciet een aparte status "extra hulp nodig" vereist.

## REST Commands in Home Assistant

Een REST command stuurt een JSON payload naar de backend.

Voorbeeld:

```yaml
rest_command:
  send_call_c302_1:
    url: "http://<BACKEND-IP>:3000/api/call"
    method: post
    content_type: "application/json"
    payload: >
      {
        "room": "C302",
        "bed": "1",
        "bedId": "C302_1",
        "status": "call"
      }
```

Maak per bed en status een duidelijk command:

| Command | Status |
| --- | --- |
| `rest_command.send_call_c302_1` | `call` |
| `rest_command.send_present_c302_1` | `present` |
| `rest_command.send_idle_c302_1` | `idle` |
| `rest_command.send_extra_c302_1` | `extra` |

## Automation Voorbeeld

```yaml
alias: Knop C302 Bed 1
description: "Stuurt knopacties naar de SimLab backend"
triggers:
  - domain: mqtt
    device_id: 1788389a3b7df7b0d78b85bb4de7f5d9
    type: action
    subtype: single
    trigger: device
    id: single

  - domain: mqtt
    device_id: 1788389a3b7df7b0d78b85bb4de7f5d9
    type: action
    subtype: double
    trigger: device
    id: double

  - domain: mqtt
    device_id: 1788389a3b7df7b0d78b85bb4de7f5d9
    type: action
    subtype: long
    trigger: device
    id: long

actions:
  - choose:
      - conditions:
          - condition: trigger
            id: single
        sequence:
          - action: rest_command.send_call_c302_1

      - conditions:
          - condition: trigger
            id: double
        sequence:
          - action: rest_command.send_present_c302_1

      - conditions:
          - condition: trigger
            id: long
        sequence:
          - action: rest_command.send_idle_c302_1

mode: single
```

## API Documentatie

### Overzicht

| Methode | Endpoint | Gebruikt door | Doel |
| --- | --- | --- | --- |
| `GET` | `/api/state` | Frontend | Dashboardstatus ophalen |
| `GET` | `/api/me` | Frontend | Huidige gebruiker ophalen |
| `GET` | `/api/push/public-key` | Frontend | VAPID public key ophalen |
| `POST` | `/api/call` | Home Assistant | Bedstatus aanpassen |
| `POST` | `/api/login` | Frontend | Inloggen |
| `POST` | `/api/logout` | Frontend | Uitloggen |
| `POST` | `/api/push/subscribe` | Frontend | Push subscription opslaan |
| `POST` | `/api/push/unsubscribe` | Frontend | Push subscription verwijderen |
| `POST` | `/api/change-password` | Frontend | Leerkrachtwachtwoord wijzigen |
| `POST` | `/api/change-student-password` | Frontend | Leerlingwachtwoord wijzigen |

### `GET /api/state`

Doel:

- geeft alle bedstatussen terug;
- geeft tellers terug voor het dashboard.

Frontendgebruik:

- `script.js` haalt deze endpoint ongeveer elke 1,2 seconden op;
- de UI wordt volledig vanuit deze response opgebouwd.

Response:

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
    "help": 2,
    "colleague": 1,
    "lowBat": 0
  }
}
```

### `POST /api/call`

Doel:

- ontvangt een statusupdate van Home Assistant;
- past de interne backendstate aan;
- activeert push notification logica.

Home Assistant gebruik:

- REST commands sturen naar deze endpoint;
- de endpoint vereist in de huidige code geen ingelogde sessie, zodat Home Assistant zonder browsercookie kan posten.

Request:

```json
{
  "room": "C302",
  "bed": "1",
  "bedId": "C302_1",
  "status": "call"
}
```

Response:

```json
{
  "success": true
}
```

### `POST /api/login`

Doel:

- controleert gebruikersnaam en wachtwoord;
- maakt een `express-session` sessie aan.

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

### `POST /api/logout`

Doel:

- vernietigt de sessie;
- stuurt de gebruiker terug naar de loginpagina.

Response:

```json
{
  "success": true
}
```

### `GET /api/me`

Doel:

- controleert of de gebruiker ingelogd is;
- geeft username en rol terug.

Response:

```json
{
  "success": true,
  "user": {
    "username": "Leerling",
    "role": "leerling"
  }
}
```

### `GET /api/push/public-key`

Doel:

- geeft de VAPID public key terug voor push notifications.

Response:

```json
{
  "publicKey": "B..."
}
```

### `POST /api/push/subscribe`

Doel:

- slaat de browser push subscription op in `push-subscriptions.json`.

Request:

```json
{
  "endpoint": "https://...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}
```

Response:

```json
{
  "success": true
}
```

### `POST /api/push/unsubscribe`

Doel:

- verwijdert de push subscription wanneer de gebruiker uitlogt of meldingen stopzet.

Request:

```json
{
  "endpoint": "https://..."
}
```

Response:

```json
{
  "success": true
}
```

### `POST /api/change-password`

Doel:

- laat een leerkracht het eigen wachtwoord wijzigen.

Toegang:

- alleen ingelogde gebruikers met rol `leerkracht`.

Request:

```json
{
  "currentPassword": "oud",
  "newPassword": "nieuw",
  "confirmPassword": "nieuw"
}
```

Response:

```json
{
  "success": true,
  "message": "Eigen wachtwoord gewijzigd"
}
```

### `POST /api/change-student-password`

Doel:

- laat een leerkracht het wachtwoord van de leerling-account wijzigen.

Request:

```json
{
  "newPassword": "nieuw",
  "confirmPassword": "nieuw"
}
```

Response:

```json
{
  "success": true,
  "message": "Wachtwoord leerling gewijzigd"
}
```

## Frontend Documentatie

### `index.html`

Het dashboard bevat:

- PWA metadata;
- service worker registratie;
- topbar met gebruiker, instellingen en logout;
- knop om push notifications in te schakelen;
- toastmelding;
- overzichtstabel met tellers;
- room cards voor C302 en C314;
- bed status cards;
- legende.

Belangrijke DOM-elementen:

| Element | Doel |
| --- | --- |
| `#userInfo` | Toont ingelogde gebruiker en rol. |
| `#enablePushBtn` | Activeert push notifications. |
| `#settingsLink` | Zichtbaar voor leerkrachten. |
| `#logoutBtn` | Logt gebruiker uit. |
| `#toast` | Toont korte statusmelding. |
| `#countHelp` | Aantal oproepen. |
| `#countColleague` | Aantal bedden met collega aanwezig. |
| `#countLowBat` | Aantal lage batterijen. |
| `#C302_1` | Bedkaart kamer C302 bed 1. |

### `script.js`

Dashboardlogica:

```text
DOMContentLoaded
  -> GET /api/me
  -> redirect naar login indien nodig
  -> GET /api/state
  -> update kaarten en tellers
  -> setInterval(fetchState, 1200)
```

De functie `getBedConfig(status)` vertaalt backendstatussen naar:

- CSS-class;
- Font Awesome icoon;
- dashboardlabel.

De functie `maybeNotify(beds)` vergelijkt de vorige state met de nieuwe state en toont een toast als een bedstatus verandert.

### Login

`login.html` gebruikt `login.js`.

Flow:

```text
formulier submit
  -> POST /api/login
  -> success: redirect naar /
  -> fout: foutmelding tonen
```

### Instellingen

`settings.html` gebruikt `settings.js`.

Functies:

- controle via `/api/me`;
- alleen toegankelijk voor `leerkracht`;
- eigen wachtwoord wijzigen;
- leerlingwachtwoord wijzigen;
- logout.

### Sessieauthenticatie

De backend gebruikt `express-session`.

Belangrijk:

- na login staat `req.session.user` op de server;
- `/api/me`, `/api/state` en push endpoints vereisen login;
- instellingen endpoints vereisen rol `leerkracht`;
- bij logout wordt de sessie vernietigd.

## PWA en Service Worker

### Manifest

`manifest.webmanifest` bevat:

```json
{
  "id": "/",
  "name": "SimLab Verpleegoproepsysteem",
  "short_name": "SimLab",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0f172a"
}
```

### Service Worker

`sw.js` doet:

- oude caches verwijderen bij activatie;
- fetch fallback naar cache bij netwerkproblemen;
- pushberichten tonen als browser notificatie;
- notification click opent of focust het dashboard.

Push flow:

```text
Gebruiker klikt "Meldingen inschakelen"
  -> browser vraagt toestemming
  -> frontend vraagt VAPID public key op
  -> browser maakt push subscription
  -> POST /api/push/subscribe
  -> backend bewaart subscription
  -> nieuwe oproep via /api/call
  -> backend verstuurt push notification
```

## Performance en UX

### Polling Interval

De frontend pollt met een interval van ongeveer 1,2 seconden:

```js
setInterval(fetchState, 1200);
```

Dit is een bewuste balans:

| Eigenschap | Resultaat |
| --- | --- |
| Snel genoeg | Dashboard voelt realtime aan. |
| Licht genoeg | Beperkte belasting op lokale VM en netwerk. |
| Robuust | Een gemiste request wordt automatisch bij de volgende poll hersteld. |
| Simpel | Geen reconnect-logica nodig. |

### Minder Zware Animaties

Voor een dashboard in een schoolomgeving is leesbaarheid belangrijker dan visuele effecten. Daarom zijn zware animaties beperkt. Dat maakt de UI rustiger en beter bruikbaar op oudere laptops, tablets en smartphones.

### Smooth Room Collapsing

Wanneer room sections inklappen of uitklappen, moet de layout vloeiend blijven:

- gebruik vaste of voorspelbare hoogtes waar mogelijk;
- voorkom dat bedkaarten tijdens animatie verspringen;
- animeer liever `max-height` en opacity dan zware layout-effecten;
- hou de statusinformatie altijd leesbaar.

## Deployment

Aanbevolen productieopstelling:

```text
Debian VM
  -> Node.js backend op poort 3000
  -> PM2 beheert server.js
  -> Nginx reverse proxy publiceert de website
  -> Home Assistant post naar /api/call
```

PM2 voorbeeld:

```bash
cd ~/simlab-api
npm install
pm2 start server.js --name simlab-api
pm2 save
```

Nginx voorbeeld:

```nginx
server {
  listen 80;
  server_name simlab.local;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## Testen

### Statusupdate simuleren

```bash
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{"room":"C302","bed":"1","bedId":"C302_1","status":"call"}'
```

Verwacht:

- PM2 log toont `Update ontvangen`;
- dashboard toont C302 bed 1 als hulp gevraagd;
- teller `Hulp gevraagd` stijgt;
- toastmelding verschijnt bij de volgende poll.

### Terugzetten naar idle

```bash
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{"room":"C302","bed":"1","bedId":"C302_1","status":"idle"}'
```

## Uitbreiden naar Nieuwe Kamers

Checklist:

- voeg nieuwe bedden toe aan de backendstate;
- voeg HTML-bedkaarten toe met correcte `id`, bijvoorbeeld `C401_1`;
- zorg dat CSS grid voldoende flexibel blijft;
- maak REST commands voor elke status;
- maak Home Assistant automations per knop;
- test met `curl`;
- test met echte Zigbee-knop;
- controleer dashboard en push notifications.

## Beveiliging

Aanbevelingen:

- gebruik een sterk `SESSION_SECRET`;
- commit geen `.env`, `users.json` of `push-subscriptions.json`;
- beperk toegang tot het lokale netwerk;
- plaats de backend achter Nginx;
- gebruik HTTPS wanneer push notifications buiten localhost nodig zijn;
- overweeg een gedeelde API-key voor `/api/call` als Home Assistant en backend op een groter netwerk staan.

## Samenvatting

De huidige productiearchitectuur is REST-gebaseerd:

```text
Home Assistant stuurt updates naar Node.js.
Node.js bewaart de actuele state.
De frontend pollt Node.js.
Het dashboard blijft lokaal, snel en eenvoudig te onderhouden.
```

Deze aanpak past goed bij het SimLab: lokaal, overzichtelijk, uitbreidbaar en stabiel voor dagelijks gebruik in een onderwijsomgeving.
