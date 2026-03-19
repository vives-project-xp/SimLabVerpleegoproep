# Home Assistant koppelen aan de website

## SimLab Verpleegoproepsysteem - huidige werking

Deze handleiding beschrijft hoe de huidige webpagina in deze repo realtime communiceert met Home Assistant.

## Doel

- Kamerstatus live tonen op de website
- Klik en dubbelklik van de Zigbee knop vertalen naar duidelijke statuskleuren
- Volledig lokaal werken op Home Assistant (zonder cloud)

## Architectuur

```text
Zigbee knop
  -> zha_event
  -> Home Assistant automations
  -> input_text helpers updaten
  -> Home Assistant WebSocket API (/api/websocket)
  -> Website luistert op state_changed
  -> UI update (groen/oranje/rood + toast)
```

## Entities die de website volgt

De website luistert op deze 2 entities in `resources/js/script.js`:

- `input_text.last_button_press`
- `input_text.colleague_present`

## Gewenst gedrag

- 1x klik: hulp gevraagd -> kaart wordt rood
- 1e dubbelklik: collega aanwezig -> kaart wordt oranje
- 2e dubbelklik: geen melding -> kaart wordt groen

In de code wordt dat zo verwerkt:

- Event op `input_text.last_button_press` -> status `alert` (rood)
- Event op `input_text.colleague_present` -> toggle tussen `busy` (oranje) en `free` (groen)

## Waar staat de code

- Pagina: `software/webbsiteLayout/WebsiteLayout/index.html`
- Logica: `software/webbsiteLayout/WebsiteLayout/resources/js/script.js`
- Styling: `software/webbsiteLayout/WebsiteLayout/resources/css/stylesheet.css`

## WebSocket communicatie (huidige flow)

1. Browser opent `/local/testsite/index.html`
2. `script.js` maakt verbinding naar `/api/websocket`
3. Authenticatie gebeurt met token uit:
   - `window.HA_CONFIG.token` (indien voorzien), of
   - `localStorage.hassTokens.access_token` (Home Assistant sessie), of
   - `localStorage.ha_token` (fallback)
4. Na `auth_ok` wordt geabonneerd op:

```json
{ "type": "subscribe_events", "event_type": "state_changed" }
```

5. Bij wijziging van de 2 relevante entities update de website direct de statuskaart en tellers

## Home Assistant configuratie

Maak of controleer deze helpers:

- `input_text.last_button_press`
- `input_text.colleague_present`

Maak 2 automations:

1. Klik automation
- Trigger: `zha_event` voor de knop (single click)
- Actie: `input_text.set_value` op `input_text.last_button_press`
- Waarde: bijvoorbeeld `{{ now().timestamp() }}`

2. Dubbelklik automation
- Trigger: `zha_event` voor de knop (double click)
- Actie: `input_text.set_value` op `input_text.colleague_present`
- Waarde: bijvoorbeeld `{{ now().timestamp() }}`

Let op: gebruik een waarde die verandert per event, anders wordt er geen `state_changed` verstuurd.

## Testen

1. Open website via `/local/testsite/index.html`
2. Open browser console (F12)
3. Controleer op:
- `WebSocket connected`
- `Authenticated`
- `State changed: input_text.last_button_press ...`
- `State changed: input_text.colleague_present ...`
4. Druk knop:
- single click -> rood
- double click -> oranje
- double click opnieuw -> groen

## Belangrijke security-opmerking

- Zet geen long-lived token hardcoded in `index.html`.
- Gebruik bij voorkeur HA sessietokens (`hassTokens`) of een veilige server-side injectie via `window.HA_CONFIG.token`.
