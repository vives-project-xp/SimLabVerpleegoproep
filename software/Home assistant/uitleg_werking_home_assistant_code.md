# Werking Home Assistant YAML: Van Knop tot Ledstrip en Website

In dit project werken verschillende YAML-bestanden samen om de status van ziekenhuisbedden (of vergelijkbare statussen) bij te houden, dit weer te geven op een dashboard (de website) en een fysieke ledstrip de juiste kleur te geven. 

Hieronder volgt een korte uitleg van de werking:

## 1. De Status: `input_select` (De Website/Backend)
Alles draait om zogenaamde `input_select` entiteiten (zoals `input_select.bed1_c314`). Dit zijn in wezen dropdown-menu's in Home Assistant. 
- Deze houden de huidige status van een bed bij: bijvoorbeeld `standby`, `call` (oproep), `extra` (nood), of `present` (aanwezig).
- **Op de website:** Je ziet deze statussen direct terug op het Home Assistant dashboard. Als de status in de achtergrond verandert, verandert dit ook op je scherm.

## 2. De Knoppen
De bestanden voor de knoppen bevatten automatisaties of acties die gekoppeld zijn aan fysieke zigbee knopen. 
- Zodra iemand op een knop drukt, voert de code in het YAML-bestand een actie uit.
- Die actie past de status van een `input_select` (bijv. van bed 1) aan naar `call` of `present`.

## 3. De Master Ledstrip
De ledstrip automatisatie functioneert als de regisseur voor de lampen. Het proces werkt in 4 stappen:

1. **Triggers:** Het bestand "luistert" constant naar **veranderingen** in alle gekoppelde `input_select` entiteiten. Zodra er via de UI/website óf via een fysieke knop iets verandert, start deze automatisatie.
2. **Variabelen (Tellen):** De code verzamelt alle bedden en telt hoeveel bedden er de status `extra`, `call` of `present` hebben.
3. **Logica (Choose/Conditions):** Home Assistant kijkt aan de hand van voorwaarden (prioriteiten) welke kleur de strip moet krijgen:
   - **Blauw:** Als er minstens 1 `extra` (nood) is, of als er **meer dan 1** `call` tegelijk is.
   - **Rood:** Als er precies **1** `call` is (en geen `extra`).
   - **Oranje:** Als er geen calls zijn, maar er wel iemand `present` is.
4. **Actie (Uitvoering):** Tot slot stuurt Home Assistant een commando naar de slimme ledstrip (`light.0xe4b3...`) met de juiste kleur en maximale helderheid (255), of schakelt hij deze uit (default) als er geen actieve statussen zijn.

## Samenvatting van de keten (Flow)
1. Verpleger/Patiënt drukt op fysieke knop 
2. `input_select` (status) verandert. 👉 *(Website toont de nieuwe status)* 🌐
3. `ledstrip...yml` registreert de verandering en telt de prioriteiten op.
4. De ledstrip (hardware) kleurt automatisch mee. 💡
