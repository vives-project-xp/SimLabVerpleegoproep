# Website ↔ Home Assistant Realtime Communicatie

Deze handleiding beschrijft hoe onze webinterface realtime communiceert met Home Assistant en reageert op een Zigbee drukknop.

De volledige communicatie verloopt lokaal via de Raspberry Pi.

## Architectuur Overzicht

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

## 1 Zigbee Knop Event Detecteren

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

## 2 Helper Entities Aanmaken

We maken 2 interne status-entities die de website volgt.

- Instellingen -> Apparaten & diensten -> Helpers
- Type: Tekst (Input Text)
- `input_text.last_button_press` (single click -> hulp gevraagd)
- `input_text.colleague_present` (double click -> collega toggle)

## 3 Automations Maken

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

Maak 2 varianten:

- Single click automation -> update `input_text.last_button_press`
- Double click automation -> update `input_text.colleague_present`

**Resultaat:**
Single click zet de website op rood. Double click toggelt oranje/groen.

## 4 Website Integratie

De website wordt gehost via:

`/config/www/testsite/index.html`

Bereikbaar via:

`http://<IP>:8123/local/testsite/index.html`

## 5 Authenticatie

De website gebruikt voor WebSocket auth (in volgorde):

- `window.HA_CONFIG.token`
- `localStorage.hassTokens.access_token`
- `localStorage.ha_token` (fallback)

Advies: geen hardcoded token in `index.html` plaatsen.

## 6 Realtime WebSocket Flow

Na authenticatie:

```json
{
  "type": "subscribe_events",
  "event_type": "state_changed"
}
```

De website filtert vervolgens op:

- `input_text.last_button_press`
- `input_text.colleague_present`

Wanneer deze entity verandert:

- De website ontvangt een `state_changed` event
- Een visuele melding (toast) wordt getoond

## 7 Waarom deze architectuur?

- √ Volledig lokaal
- √ Realtime
- √ Geen polling
- √ Geen hardcoded tokens
- √ Schaalbaar naar meerdere kamers
- √ Event-driven design

## Beveiliging

- Website draait binnen Home Assistant (`/local/`)
- Authenticatie via bestaande HA sessie
- OAuth token flow
- Geen externe API exposure

## Uitbreidbaar naar

- Meerdere kamers
- Urgentie levels (normaal / hoog)
- Statuslamp kleursturing
- Logging in database
- Monitoring dashboard met meerdere entities
