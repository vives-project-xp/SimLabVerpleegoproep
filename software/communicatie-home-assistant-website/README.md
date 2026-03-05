# Website ↔ Home Assistant Realtime Communicatie

Deze handleiding beschrijft hoe onze webinterface realtime communiceert met Home Assistant en reageert op een Zigbee drukknop.

De volledige communicatie verloopt lokaal via de Raspberry Pi.

## 🏗 Architectuur Overzicht

```text
Zigbee Button
    ↓
ZHA (Zigbee Home Automation)
    ↓
zha_event
    ↓
Home Assistant Automation
    ↓
Helper Entity Update
    ↓
WebSocket API
    ↓
Website toont melding (realtime)
```

**Belangrijk:**
De communicatie is event-driven en niet polling-based.

## 1️⃣ Zigbee Knop Event Detecteren

In Home Assistant:

- Ontwikkelaarstools → Gebeurtenissen
- Luisteren naar: `zha_event`

Bij indrukken van de knop krijgen we:

```yaml
event_type: zha_event
device_ieee: d4:48:67:ff:fe:46:80:a3
command: toggle
```

Dit is onze trigger.

## 2️⃣ Helper Entity Aanmaken

We maken een interne status-entity die de website kan volgen.

- Instellingen → Apparaten & diensten → Helpers
- Type: Tekst (Input Text)
- Naam: `last_button_press`
- Entity ID: `input_text.last_button_press`

## 3️⃣ Automation Maken

**Trigger:**

- Type: Gebeurtenis
- Event type: `zha_event`
- Event data filter:

```yaml
device_ieee: d4:48:67:ff:fe:46:80:a3
command: toggle
```

**Actie:**

- Service: `input_text.set_value`
- Target: `input_text.last_button_press`
- Waarde (Template):

```jinja2
{{ now().isoformat() }}
```

**Resultaat:**
Elke knopdruk update de helper met een nieuwe timestamp.

## 4️⃣ Website Integratie

De website wordt gehost via:

`/config/www/testsite/index.html`

Bereikbaar via:

`http://<IP>:8123/local/testsite/index.html`

## 5️⃣ Authenticatie

De website:

- Leest `hassTokens` uit `localStorage`
- Gebruikt de `refresh_token`
- Vraagt via `/auth/token` een nieuwe `access_token` op
- Verbindt met `/api/websocket`

Er worden geen hardcoded API keys gebruikt.

## 6️⃣ Realtime WebSocket Flow

Na authenticatie:

```json
{
  "type": "subscribe_events",
  "event_type": "state_changed"
}
```

De website filtert vervolgens op:

`input_text.last_button_press`

Wanneer deze entity verandert:

- De website ontvangt een `state_changed` event
- Een visuele melding (toast) wordt getoond

## 7️⃣ Waarom deze architectuur?

- ✅ Volledig lokaal
- ✅ Realtime
- ✅ Geen polling
- ✅ Geen hardcoded tokens
- ✅ Schaalbaar naar meerdere kamers
- ✅ Event-driven design

## 🔐 Beveiliging

- Website draait binnen Home Assistant (`/local/`)
- Authenticatie via bestaande HA sessie
- OAuth token flow
- Geen externe API exposure

## 🚀 Uitbreidbaar naar

- Meerdere kamers
- Urgentie levels (normaal / hoog)
- Statuslamp kleursturing
- Logging in database
- Monitoring dashboard met meerdere entities
