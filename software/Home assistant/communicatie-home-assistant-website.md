# Communicatie tussen Home Assistant en de Website

## SimLab Verpleegoproepsysteem

Dit document beschrijft de productiearchitectuur waarmee Home Assistant, Zigbee-knoppen en de SimLab website met elkaar communiceren.

De huidige versie gebruikt REST-communicatie. Home Assistant stuurt statusupdates via HTTP POST requests naar de Node.js backend. De frontend haalt de actuele toestand daarna op via polling.

> Belangrijk: de website communiceert niet rechtstreeks met Home Assistant. Alle statusupdates lopen via REST naar de backend.

## Doel van de Communicatie

Het SimLab verpleegoproepsysteem wordt gebruikt in simulatiekamers van de opleiding verpleegkunde. Studenten kunnen met een fysieke Zigbee-knop een oproepstatus doorgeven. Leerkrachten en studenten zien de status live op een lokaal dashboard.

Belangrijke doelen:

| Doel | Uitleg |
| --- | --- |
| Volledig lokaal | De communicatie blijft binnen het schoolnetwerk. |
| Geen cloudafhankelijkheid | Home Assistant, backend en frontend draaien lokaal. |
| Eenvoudige uitbreiding | Nieuwe kamers en bedden kunnen met extra REST commands worden toegevoegd. |
| Stabiel dashboard | De frontend haalt status op via een eenvoudige REST endpoint. |
| Gebruiksvriendelijk | Statussen worden als duidelijke kleuren, labels, tellers en meldingen getoond. |

## Architectuur Overzicht

```text
Zigbee knop
    |
    v
Home Assistant
    |
    v
Automation trigger
    |
    v
REST command
    |
    v
HTTP POST /api/call
    |
    v
Node.js / Express backend
    |
    v
Interne bedstatus wordt bijgewerkt
    |
    v
Frontend pollt GET /api/state
    |
    v
Dashboard toont actuele kamerstatus
```

## Netwerkarchitectuur

```text
Schoolnetwerk / lokaal SimLab netwerk

+-------------------+        Zigbee        +----------------------+
| Zigbee knoppen    | -------------------> | Home Assistant       |
| per bed           |                      | Raspberry Pi / VM    |
+-------------------+                      +----------+-----------+
                                                      |
                                                      | HTTP POST
                                                      | REST command
                                                      v
                                           +----------+-----------+
                                           | Debian VM            |
                                           | Node.js / Express    |
                                           | PM2                  |
                                           +----------+-----------+
                                                      |
                                                      | reverse proxy
                                                      v
                                           +----------+-----------+
                                           | Nginx                |
                                           | Website / PWA        |
                                           +----------+-----------+
                                                      ^
                                                      |
                                             Browser pollt /api/state
```

## Hoofdcomponenten

| Component | Rol |
| --- | --- |
| Zigbee knop | Fysieke invoer per bed. |
| Home Assistant | Ontvangt knopacties en voert automations uit. |
| REST command | Stuurt vanuit Home Assistant een HTTP POST naar de backend. |
| Node.js backend | Ontvangt statusupdates, bewaart de actuele state en levert API endpoints. |
| Frontend | Toont kamers, bedden, tellers, toastmeldingen en push notification controls. |
| Nginx | Reverse proxy naar de Node.js app. |
| PM2 | Houdt de Node.js backend actief op de Debian VM. |

## Statusmodel

Elke bedkaart heeft een unieke `bedId` in dit formaat:

```text
<kamer>_<bednummer>
```

Voorbeelden:

```text
C302_1
C302_2
C314_1
C314_6
```

De backend bewaart de actuele status in geheugen:

```js
const beds = {
  C302_1: "idle",
  C302_2: "idle",
  C302_3: "idle",
  C302_4: "idle",
  C314_1: "idle",
  C314_2: "idle",
  C314_3: "idle",
  C314_4: "idle",
  C314_5: "idle",
  C314_6: "idle"
};
```

## Ondersteunde Statussen

| Status | Betekenis | UI-kleur | Dashboardtekst |
| --- | --- | --- | --- |
| `idle` | Geen actieve melding | Groen | Geen melding |
| `call` | Hulp gevraagd | Rood | Hulp gevraagd |
| `present` | Collega aanwezig | Oranje | Collega aanwezig |
| `extra` | Extra hulp nodig | Blauw | Extra hulp nodig |
| `low_battery` | Lage batterij | Teller | Lage batterij |

`low_battery` wordt in de backend meegeteld in `counts.lowBat`. De huidige frontend toont vooral `idle`, `call`, `present` en `extra` als bedstatus.

## Statusflows

De knopacties worden in Home Assistant vertaald naar REST updates.

### Single Click

```text
idle -> call
```

Betekenis: student vraagt hulp.

Voorbeeldrequest naar de backend:

```http
POST /api/call
Content-Type: application/json

{
  "room": "C302",
  "bed": "1",
  "bedId": "C302_1",
  "status": "call"
}
```

### Double Click

```text
call -> present
```

Betekenis: een collega of leerkracht is aanwezig bij het bed.

Voorbeeldrequest:

```http
POST /api/call
Content-Type: application/json

{
  "room": "C302",
  "bed": "1",
  "bedId": "C302_1",
  "status": "present"
}
```

### Long Click

```text
present -> idle
```

Betekenis: de oproep is afgehandeld en het bed keert terug naar normale status.

Voorbeeldrequest:

```http
POST /api/call
Content-Type: application/json

{
  "room": "C302",
  "bed": "1",
  "bedId": "C302_1",
  "status": "idle"
}
```

> In sommige configuraties kan long click ook gebruikt worden voor `extra`. Kies per kamer een vaste afspraak en documenteer die in de automation.

## Home Assistant REST Commands

Home Assistant gebruikt `rest_command` om HTTP requests naar de Node.js backend te sturen. Elk command bevat:

- de URL van de backend;
- HTTP methode `POST`;
- JSON headers;
- een JSON body met kamer, bed en status.

Voorbeeld in `configuration.yaml`:

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

  send_present_c302_1:
    url: "http://<BACKEND-IP>:3000/api/call"
    method: post
    content_type: "application/json"
    payload: >
      {
        "room": "C302",
        "bed": "1",
        "bedId": "C302_1",
        "status": "present"
      }

  send_idle_c302_1:
    url: "http://<BACKEND-IP>:3000/api/call"
    method: post
    content_type: "application/json"
    payload: >
      {
        "room": "C302",
        "bed": "1",
        "bedId": "C302_1",
        "status": "idle"
      }
```

Vervang `<BACKEND-IP>` door het IP-adres of de DNS-naam van de Debian VM waarop de Node.js backend draait.

## Home Assistant Automation

Een automation koppelt een knopactie aan een REST command.

Voorbeeld:

```yaml
alias: Knop C302 Bed 1
description: "Verstuurt bedstatus naar SimLab backend"
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

## Waarom Polling in de Frontend?

De frontend gebruikt polling naar:

```text
GET /api/state
```

De huidige polling interval is ongeveer:

```js
setInterval(fetchState, 1200);
```

Polling werd gekozen omdat deze aanpak in een schoolomgeving eenvoudiger en stabieler is:

| Reden | Uitleg |
| --- | --- |
| Minder afhankelijkheden | De browser hoeft geen Home Assistant sessie of token te beheren. |
| Simpel netwerkverkeer | Alleen gewone HTTP requests naar de eigen backend. |
| Betere fouttolerantie | Als een request faalt, probeert de volgende pollingronde opnieuw. |
| Eenvoudige debugging | API calls zijn zichtbaar in browser DevTools, PM2 logs en Nginx logs. |
| Geschikt voor lokaal gebruik | De updatefrequentie van 1,2 seconden voelt realtime aan voor een dashboard. |

## Backend Update Flow

Wanneer Home Assistant een REST command uitvoert:

```text
POST /api/call
    |
    v
Backend leest room, bed, bedId en status
    |
    v
Backend normaliseert bedId
    |
    v
beds[bedId] = status
    |
    v
Backend berekent tellers bij GET /api/state
    |
    v
Frontend ziet wijziging bij volgende pollingronde
```

## API Endpoints

### `GET /api/state`

Geeft de actuele bedstatussen en tellers terug.

Gebruikt door:

- frontend dashboard;
- niet rechtstreeks door Home Assistant.

Authenticatie:

- vereist een geldige sessie;
- zonder sessie antwoordt de backend met `401`.

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

Ontvangt een statusupdate voor een bed.

Gebruikt door:

- Home Assistant REST commands;
- eventueel testtools zoals `curl` of Postman.

Authenticatie:

- deze endpoint is bedoeld voor Home Assistant en vereist in de huidige code geen browsersessie.

Request body:

```json
{
  "room": "C302",
  "bed": "1",
  "bedId": "C302_1",
  "status": "call"
}
```

Velden:

| Veld | Verplicht | Uitleg |
| --- | --- | --- |
| `room` | Aanbevolen | Kamernaam, bijvoorbeeld `C302`. |
| `bed` | Aanbevolen | Bednummer als string of nummer. |
| `bedId` | Optioneel | Volledige ID, bijvoorbeeld `C302_1`. |
| `status` | Optioneel | Nieuwe status. Zonder status wordt `idle` gebruikt. |

Response:

```json
{
  "success": true
}
```

Test:

```bash
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{"room":"C302","bed":"1","bedId":"C302_1","status":"call"}'
```

### `GET /api/me`

Geeft de ingelogde gebruiker terug.

Gebruikt door:

- dashboard bij het openen;
- instellingenpagina voor rolcontrole.

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

### `POST /api/login`

Maakt een sessie aan met `express-session`.

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

Fout:

```json
{
  "success": false,
  "error": "Login mislukt"
}
```

### `POST /api/logout`

Vernietigt de sessie.

Response:

```json
{
  "success": true
}
```

### `GET /api/push/public-key`

Geeft de VAPID public key terug voor browser push notifications.

Gebruikt door:

- frontend wanneer de gebruiker meldingen inschakelt.

Response:

```json
{
  "publicKey": "B..."
}
```

### `POST /api/push/subscribe`

Slaat een browser push subscription op.

Gebruikt door:

- frontend na toestemming voor meldingen.

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

Verwijdert een browser push subscription.

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

Wijzigt het wachtwoord van de ingelogde leerkracht.

Gebruikt door:

- instellingenpagina.

Authenticatie:

- vereist login;
- vereist rol `leerkracht`.

Request:

```json
{
  "currentPassword": "oud-wachtwoord",
  "newPassword": "nieuw-wachtwoord",
  "confirmPassword": "nieuw-wachtwoord"
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

Wijzigt het wachtwoord van de leerling-account.

Gebruikt door:

- instellingenpagina voor leerkrachten.

Request:

```json
{
  "newPassword": "nieuw-wachtwoord",
  "confirmPassword": "nieuw-wachtwoord"
}
```

Response:

```json
{
  "success": true,
  "message": "Wachtwoord leerling gewijzigd"
}
```

## Push Notifications

Wanneer de backend een statusupdate ontvangt via `/api/call`, kan hij een push notification versturen naar opgeslagen browser subscriptions.

Voorwaarde:

- `VAPID_PUBLIC_KEY` is ingesteld;
- `VAPID_PRIVATE_KEY` is ingesteld;
- gebruiker heeft meldingen toegestaan in de browser;
- frontend heeft de subscription opgeslagen via `/api/push/subscribe`.

Push payload:

```json
{
  "title": "Nieuwe oproep",
  "body": "Kamer C302 bed 1: call",
  "icon": "/icon.svg",
  "badge": "/icon.svg",
  "data": {
    "url": "/"
  }
}
```

## Schaalbaarheid naar Meerdere Kamers

Een nieuwe kamer toevoegen bestaat uit vier stappen:

1. Voeg bedden toe aan de backend state.
2. Voeg bedkaarten toe aan de frontend.
3. Maak per bed REST commands aan in Home Assistant.
4. Maak per knop een automation die de juiste REST commands uitvoert.

Voorbeeld voor kamer `C401` bed `2`:

```json
{
  "room": "C401",
  "bed": "2",
  "bedId": "C401_2",
  "status": "call"
}
```

## Waarom deze Architectuur Stabieler is

De vorige aanpak liet de website rechtstreeks reageren op Home Assistant statuswijzigingen. De huidige aanpak scheidt verantwoordelijkheden duidelijker:

| Oud probleem | Nieuwe oplossing |
| --- | --- |
| Browser moest Home Assistant sessie/token kennen. | Alleen de backend communiceert indirect met Home Assistant via REST requests. |
| Website was afhankelijk van event subscriptions. | Website vraagt periodiek de volledige actuele state op. |
| Debugging liep via meerdere realtimekanalen. | Debugging kan met gewone HTTP requests en serverlogs. |
| Uitbreiding vroeg extra frontend eventfilters. | Uitbreiding gebruikt consistente `bedId` en statuspayloads. |

## Controle en Troubleshooting

### Backend bereikbaar?

```bash
curl http://localhost:3000/api/state
```

Let op: `/api/state` vereist een sessie. Voor een snelle statusupdate-test gebruik je beter:

```bash
curl -X POST http://localhost:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{"room":"C302","bed":"1","status":"call"}'
```

### PM2 logs bekijken

```bash
pm2 logs
```

Zoek naar:

```text
Update ontvangen
SimLab API draait op poort 3000
```

### Home Assistant test

Voer in Home Assistant handmatig een REST command uit en controleer daarna:

- PM2 logs;
- browser dashboard;
- Network tab in DevTools;
- response van `/api/state` na login.

## Samenvatting

De productieflow is:

```text
Zigbee knop -> Home Assistant automation -> REST command -> POST /api/call -> backend state -> GET /api/state -> dashboard
```

Deze aanpak is lokaal, eenvoudig te testen, schaalbaar naar meerdere kamers en robuust genoeg voor gebruik in een schoolomgeving.
