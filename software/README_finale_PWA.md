# SimLab Verpleegoproep - Finale PWA (Proof of Concept)

## 1. Projectbeschrijving
Dit project is een demo van een verpleegoproepsysteem voor een simulatieomgeving verpleegkunde.

Het systeem koppelt Home Assistant aan een aparte website op een andere VM. Wanneer een knop in Home Assistant wordt ingedrukt, wordt de status van een kamer doorgestuurd naar een webdashboard. Dat dashboard toont live de status van de kamer.

Dit project is gebouwd als **proof of concept** voor een simulatiekamer, met focus op:

- knopdrukken detecteren
- verschillende statussen tonen
- live updates op de website
- dashboard op gsm tonen
- demo-klaar opleveren

## 2. Doel van het systeem
Het doel is om op een eenvoudige, visuele manier te tonen welke kamer hulp nodig heeft en in welke status die oproep zit.

Concreet:

- snelle opvolging van oproepen in een simulatiecontext
- duidelijke kleurfeedback per kamer
- centrale logica in Home Assistant
- lichte en toegankelijke webweergave op mobiel en desktop

## 3. Architectuur en communicatie tussen de onderdelen
### Overzicht van de 2 hoofdonderdelen
1. **Home Assistant VM** (op Proxmox)
2. **Website VM** (Debian + Node.js + nginx)

### Eenvoudige tekstuele architectuurweergave
```text
[Knop / Event]
      |
      v
[Home Assistant VM]
  - Automations
  - Scenes
  - Notificaties
  - rest_command
      |
      | HTTP POST /api/call
      v
[Website VM - Node.js/Express API]
  - bewaart actuele kamerstatus
      |
      | GET /api/state (polling)
      v
[Frontend Dashboard]
  - kamerkaarten
  - tellers
  - kleuren en iconen
  - toastmeldingen
```

### Waarom deze opzet
Door de netwerkopstelling kon de website VM niet rechtstreeks naar Home Assistant communiceren, maar Home Assistant kon wel naar de website VM sturen.

Daarom is gekozen voor:

- Home Assistant als centrale logica
- website als visuele laag
- unidirectionele flow van Home Assistant naar website

## 4. Overzicht van de gebruikte technologieen
- Home Assistant
- Home Assistant automations
- Home Assistant `rest_command`
- Node.js
- Express
- HTML
- CSS
- JavaScript
- nginx
- Proxmox
- Debian Linux

## 5. Setup van de website server
### Node.js installeren
```bash
apt update
apt install -y nodejs npm
```

### Projectmap aanmaken
```bash
cd /root/simlab-api/backend
npm install
```

De dependencies staan in `backend/package.json`. De huidige backend gebruikt onder andere:

```json
{
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "body-parser": "^1.20.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "web-push": "^3.6.6"
  }
}
```

### Server starten
Voor tijdelijk testen:
```bash
npm start
```

Voor op de achtergrond:
```bash
pm2 start server.js --name simlab-api
pm2 save
```

### nginx reverse proxy
Gebruik nginx om domeinverkeer door te sturen naar Node.js op poort `3000`.

Voorbeeldconfiguratie:
```nginx
server {
    listen 80;
    server_name verpleegkunde.voltlab.net;

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

## 6. Setup van Home Assistant
Home Assistant draait op een aparte VM in Proxmox en bevat:

- automations
- knoplogica
- scenes
- notificaties
- `rest_command` configuratie

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

## 7. Uitleg van de API
De Node.js server draait op poort `3000`.

### `POST /api/call`
Wordt gebruikt door Home Assistant om een status door te sturen.

Voorbeeld payload:

```json
{
  "room": "C302",
  "bed": "1",
  "bedId": "C302_1",
  "status": "call"
}
```

De echte backend verwerkt deze payload zo:

```js
app.post("/api/call", (req, res) => {
    const { room, bed, bedId, status } = req.body;
    const normalizedStatus = status || "idle";
    const normalizedBedId = normalizeBedId(room, bed, bedId);

    beds[normalizedBedId] = normalizedStatus;

    console.log("Update ontvangen:", {
        room,
        bed,
        bedId: normalizedBedId,
        status: normalizedStatus
    });

    sendNotifications({
        room,
        bed,
        bedId: normalizedBedId,
        status: normalizedStatus
    });

    res.json({ success: true });
});
```

Ondersteunde statussen:

- `idle` = geen melding
- `call` = hulp gevraagd
- `present` = collega aanwezig
- `extra` = extra hulp nodig / collega hulp gevraagd
- `low_battery` = lage batterij

### `GET /api/state`
Geeft de huidige toestand van alle kamers terug in JSON-formaat.

Deze endpoint wordt door de frontend periodiek opgevraagd om live te updaten.

De huidige backend houdt deze bedden bij:

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

De response wordt opgebouwd met tellers:

```js
app.get("/api/state", requireLogin, (req, res) => {
    res.json({
        beds,
        counts: calculateCounts()
    });
});
```

## 8. Uitleg van de frontend
De frontend bestaat uit:

- `index.html`
- `resources/css/stylesheet.css`
- `resources/js/script.js`

Functionaliteit:

- toont kamerkaarten
- toont overzicht met tellers
- toont legende met kleuren
- controleert de login via `/api/me`
- haalt ongeveer elke 1,2 seconden status op via `/api/state`
- past kleuren en iconen dynamisch aan
- toont toastmelding bij statusverandering

De echte polling-code uit `resources/js/script.js`:

```js
async function fetchState() {
    try {
        const res = await fetch("/api/state", { cache: "no-store" });

        if (res.status === 401) {
            window.location.href = "/login.html";
            return;
        }

        const data = await res.json();
        const beds = data.beds || {};
        const counts = data.counts || { help: 0, colleague: 0, lowBat: 0 };

        for (const bedId of Object.keys(beds)) {
            updateBed(bedId, beds[bedId]);
        }

        updateCounters(counts);
        maybeNotify(beds);
    } catch (err) {
        console.error(err);
    }
}
```

De frontend start daarna met:

```js
async function init() {
    const user = await fetchCurrentUser();
    if (!user) return;

    await fetchState();
    setInterval(fetchState, 1200);
}
```

Kleurlegende:

- groen = geen hulp
- rood = hulp gevraagd
- oranje = collega aanwezig
- blauw = collega hulp gevraagd / extra hulp nodig

## 9. Uitleg van de Home Assistant automatisaties
Er zijn drie hoofdacties via de knop:

- korte klik -> hulp nodig
- dubbele klik -> hulp aanwezig
- lang indrukken -> extra hulp nodig

Daarnaast is er reset naar groen (`idle`).

De automatisaties sturen:

- scenes
- notificaties
- het juiste `rest_command` naar de website API

Belangrijk:

- de website-status klopt alleen als de juiste payload verstuurd wordt
- als steeds dezelfde payload verstuurd wordt, blijven kleuren fout of onveranderd

## 10. Stap-voor-stap workflow van knopdruk tot website update
1. Er wordt op een knop gedrukt.
2. Home Assistant vangt het event op.
3. Een automation wordt uitgevoerd.
4. Eventueel worden scene en notificatie geactiveerd.
5. Home Assistant stuurt via `rest_command` een HTTP POST naar `POST /api/call`.
6. De Node.js server verwerkt en bewaart de nieuwe status.
7. De frontend vraagt via `GET /api/state` de actuele status op.
8. De kamerkaart op de website verandert van kleur/tekst en eventueel verschijnt een toast.

## 11. Troubleshooting
### Website laadt niet
Controleer of Node.js draait:

```bash
pm2 status
```

### Oude website blijft zichtbaar
Leeg browsercache met harde refresh:

```text
Ctrl + Shift + R
```

### API niet bereikbaar
Test lokaal op de website VM:

```bash
curl -X POST http://127.0.0.1:3000/api/call \
  -H "Content-Type: application/json" \
  -d '{"room":"C302","bed":"1","bedId":"C302_1","status":"call"}'
```

Let op: `GET /api/state` vraagt een ingelogde browsersessie. Voor een snelle API-test is `POST /api/call` daarom makkelijker.

### Home Assistant stuurt niets door
Controleer:

- `configuration.yaml`
- `rest_command` definities
- automation triggers en acties
- payloadinhoud (`room`, `bed`, `bedId` en `status`)

### Website verandert niet van kleur
Controleer of de status exact overeenkomt met de frontend-logica:

- `idle`
- `call`
- `present`
- `extra`

## 12. Bekende beperkingen
- momenteel gericht op kamers C302 en C314
- frontend gebruikt polling (geen websockets)
- login/rollenmodel is aanwezig, maar wachtwoorden staan eenvoudig in `users.json`
- pushnotificaties zijn aanwezig, maar vragen correcte VAPID keys en HTTPS buiten localhost
- reset naar `idle` moet expliciet doorgestuurd worden

## 13. Mogelijke uitbreidingen
- meerdere kamers tegelijk live koppelen
- wachtwoorden veilig hashen in plaats van plain text bewaren
- API-key toevoegen voor `POST /api/call`
- websockets in plaats van polling
- live batterijtelemetrie
- logging en historiek
- rechten per gebruiker

## 14. Folderstructuur
### Deploy-structuur op de website VM
```text
/root/simlab-api
|-- backend
|   |-- server.js
|   |-- package.json
|   |-- users.json
|   `-- push-subscriptions.json
`-- frontend
    |-- index.html
    |-- login.html
    |-- settings.html
    |-- manifest.webmanifest
    |-- sw.js
    |-- icon.svg
    `-- resources
        |-- css
        |   `-- stylesheet.css
        `-- js
            |-- script.js
            |-- push.js
            |-- login.js
            `-- settings.js
```

### Relevante structuur in deze repository
```text
software/
|-- readme.md
|-- README_finale_PWA.md
|-- Home assistant/
|-- ledProgramma's/
`-- webbsiteLayout/
    `-- PWA/
        |-- backend/
        |   |-- server.js
        |   |-- package.json
        |   |-- users.example.json
        |   `-- push-subscriptions.example.json
        `-- frontend/
            |-- index.html
            |-- login.html
            |-- settings.html
            `-- resources/
                |-- css/stylesheet.css
                `-- js/
                    |-- script.js
                    `-- push.js
```

## 15. Demo-uitleg
Tijdens de demo verloopt de flow als volgt:

1. Een gebruiker drukt op de knop.
2. Home Assistant verwerkt het event in een automation.
3. Home Assistant activeert (indien nodig) scene en notificatie.
4. Home Assistant stuurt de nieuwe status naar de website API.
5. Het dashboard toont vrijwel meteen de nieuwe toestand.

Demo-statussen:

- groen = geen hulp
- rood = hulp gevraagd
- oranje = collega aanwezig
- blauw = collega hulp gevraagd / extra hulp nodig

---

## Korte samenvatting
Dit project toont een werkende keten van **fysieke knopactie** naar **live webvisualisatie** via Home Assistant en een Node.js API. De gekozen architectuur is eenvoudig, robuust genoeg voor demo-doeleinden en vormt een goede basis voor latere uitbreiding naar een volledige productieoplossing met PWA, rollen en realtime communicatie.
