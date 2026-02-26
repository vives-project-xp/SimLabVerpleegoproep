# Home Assistant koppelen aan een eigen webinterface

## SimLab Verpleegoproepsysteem – Technische Integratiegids

---

## Doel van deze handleiding

Deze handleiding beschrijft stap voor stap hoe we:

- Een eigen webpagina koppelen aan Home Assistant
- Via de website REST API-calls uitvoeren
- Automatisch een geldige toegangstoken genereren
- Service calls uitvoeren (zoals meldingen of lampen aansturen)
- Dit alles volledig lokaal op de Raspberry Pi

Dit vormt de technische basis voor:

- Webdashboard voor het verpleegoproepsysteem
- Kamerstatus monitoring
- Scenario simulaties
- Integratie met Zigbee / WLED / andere devices

---

## Systeemarchitectuur

```
Webinterface (/local/testsite)
        ↓
REST API
        ↓
Home Assistant (Raspberry Pi 5)
        ↓
Zigbee / WLED / Statuslampen / Knoppen
```

**Alles draait lokaal. Geen cloud nodig.**

---

## 1. Vereisten

- Raspberry Pi met Home Assistant OS
- Toegang tot Home Assistant dashboard
- File Editor add-on geïnstalleerd
- Browser waarin je bent ingelogd op Home Assistant

---

## 2. Controleren dat de Home Assistant API werkt

Voordat we een website maken, testen we eerst of de API correct bereikbaar is.

### Stap 2.1 – Open de browser console

1. Open je Home Assistant dashboard  
   Bijvoorbeeld: `http://10.10.201.171:8123`

2. Druk **F12**

3. Ga naar tab **Console**

### Stap 2.2 – Test een API-call

Voer dit uit in de console:

```javascript
fetch("/api/config", {
  headers: {
    Authorization: `Bearer ${JSON.parse(localStorage.getItem("hassTokens")).access_token}`
  }
})
.then(r => r.json())
.then(console.log)
```

**Verwacht resultaat:**
```json
{
  "version": "2026.2.1",
  "location_name": "Thuis"
}
```

Als dit werkt betekent dat:

- API is actief
- Authenticatie werkt
- Home Assistant draait correct

---

## 3. Webfolder aanmaken in Home Assistant

Home Assistant serveert statische bestanden via:

```
/config/www/  →  bereikbaar via  /local/
```

In Home Assistant OS is de map `homeassistant/` gelijk aan `/config/`.

### Stap 3.1 – File Editor installeren

1. Ga naar: **Instellingen → Add-ons → Add-on Store**

2. Installeer: **File Editor**

3. Start de add-on en klik op **Open Web UI**

### Stap 3.2 – Mapstructuur aanmaken

Maak volgende structuur:

```
homeassistant/
 └── www/
      └── testsite/
           └── index.html
```

**Belangrijk:**

- Alles in `www/` wordt bereikbaar via `/local/`
- Bestanden buiten deze map zijn niet publiek toegankelijk

---

## 4. Automatische authenticatie via refresh_token

Access tokens verlopen na ±30 minuten.  
Daarom gebruiken we de bestaande `refresh_token` uit de actieve Home Assistant sessie.

**De webpagina:**

- Leest `hassTokens` uit localStorage
- Vraagt via `/auth/token` een nieuwe access_token op
- Gebruikt die token voor API-calls

**Hierdoor is er:**

- Geen handmatige token copy/paste nodig
- Geen 30-minuten probleem
- Geen extra configuratie in Home Assistant nodig

---

## 5. Volledige werkende testpagina

Plaats onderstaande code in:

**`homeassistant/www/testsite/index.html`**

<details>
<summary><strong>Klik hier om de volledige HTML code te bekijken</strong></summary>

```html
<!doctype html>
<html lang="nl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>HA Test Website</title>
  <style>
    body { font-family: system-ui, Arial, sans-serif; padding: 24px; max-width: 760px; margin: 0 auto; }
    button { padding: 10px 14px; border-radius: 10px; border: 1px solid #ccc; cursor: pointer; margin-right: 8px; }
    #log { white-space: pre-wrap; background: #f6f6f6; padding: 12px; border-radius: 12px; border: 1px solid #e5e5e5; margin-top: 12px; font-family: monospace; }
  </style>
</head>
<body>

  <h1>Home Assistant Test Website</h1>

  <div>
    <button id="btnConfig">Test: GET /api/config</button>
    <button id="btnNotify">Test: Notification</button>
  </div>

  <div id="log">Klaar.</div>

  <script>
    const logEl = document.getElementById("log");

    function log(msg) {
      const t = new Date().toLocaleTimeString();
      logEl.textContent = `[${t}] ${msg}\n` + logEl.textContent;
    }

    function getHassTokens() {
      const raw = localStorage.getItem("hassTokens");
      if (!raw) return null;
      try { return JSON.parse(raw); } catch { return null; }
    }

    async function refreshAccessToken() {
      const tokens = getHassTokens();
      if (!tokens || !tokens.refresh_token) {
        throw new Error("Geen refresh_token gevonden. Log eerst in op Home Assistant.");
      }

      const clientId = tokens.clientId || location.origin;

      const form = new URLSearchParams();
      form.set("grant_type", "refresh_token");
      form.set("client_id", clientId);
      form.set("refresh_token", tokens.refresh_token);

      const res = await fetch("/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString()
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(`Token refresh failed (${res.status}): ${text}`);
      }

      const data = JSON.parse(text);
      return data.access_token;
    }

    async function haGet(path) {
      const accessToken = await refreshAccessToken();

      const res = await fetch(path, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(`GET ${path} failed: ${text}`);
      }

      return JSON.parse(text);
    }

    async function haPost(path, bodyObj) {
      const accessToken = await refreshAccessToken();

      const res = await fetch(path, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bodyObj)
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(`POST ${path} failed: ${text}`);
      }

      return text;
    }

    document.getElementById("btnConfig").addEventListener("click", async () => {
      try {
        const data = await haGet("/api/config");
        log(`SUCCESS - version=${data.version} location_name=${data.location_name}`);
      } catch (e) {
        log(`ERROR - ${e.message}`);
      }
    });

    document.getElementById("btnNotify").addEventListener("click", async () => {
      try {
        await haPost("/api/services/persistent_notification/create", {
          title: "Test website",
          message: "Als je dit ziet, kan je website Home Assistant aansturen"
        });
        log("Notification gestuurd");
      } catch (e) {
        log(`ERROR - ${e.message}`);
      }
    });
  </script>

</body>
</html>
```

</details>

---

## 6. Website openen

Ga naar:

```
http://<IP-VAN-JE-HA>:8123/local/testsite/index.html
```

**Voorbeeld:**

```
http://10.10.201.171:8123/local/testsite/index.html
```

**Belangrijk:**

- Niet `/config/www/...`
- Niet `/www/...`
- Enkel `/local/...`

---

## 7. Testen

### Test 1 – API uitlezen

1. Klik: **Test: GET /api/config**

**Verwacht resultaat:**

```
SUCCESS - version=2026.2.1 location_name=Thuis
```

### Test 2 – Service call uitvoeren

1. Klik: **Test: Notification**

2. Controleer in Home Assistant of de melding verschijnt

---

## 8. Wat hebben we technisch gerealiseerd?

- Eigen webinterface geïntegreerd in Home Assistant
- Volledig lokale communicatie
- Automatische tokenvernieuwing
- Werkende REST API
- Service calls vanuit custom frontend

**Dit is de basis voor:**

- Webdashboard per kamer
- Statusmonitoring
- Scenario simulaties
- Integratie met Zigbee knoppen
- Integratie met WLED statuslampen

---

## Beveiligingsopmerking

Deze methode werkt zolang:

- De gebruiker ingelogd is in dezelfde browser
- De pagina via `/local/` wordt gehost

**Voor productieomgevingen kan later worden uitgebreid met:**

- Server-side proxy
- OAuth flow
- Reverse proxy authenticatie
- API rate limiting

---

## Volgende uitbreidingen

- Knoppen voor `light.turn_on`
- Realtime status via WebSocket API
- Kamer-overzicht dashboard
- Urgentie-kleuren automatisch aanpassen
- Logging van oproepen in database
