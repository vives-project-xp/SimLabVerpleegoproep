# Uitleg ledstrip.ino

Dit bestand bevat de eerste versie van de code voor de ESP32-C6 die de ledstrip aanstuurt, maar zonder het automatisch uitvallen.

De ESP32-C6 werkt als Zigbee-apparaat en wordt gekoppeld met Zigbee2MQTT. Via Zigbee ontvangt de ESP32 signalen van Home Assistant. Op basis van deze signalen wordt de ledstrip aangestuurd.

## Wat doet deze code?

De code zorgt ervoor dat:

- de ESP32-C6 verbinding maakt via Zigbee
- de ledstrip kan worden aangestuurd
- verschillende statussen zichtbaar worden via kleuren of effecten
- de ledstrip reageert op commando’s vanuit Home Assistant/Zigbee2MQTT

## Waarvoor wordt deze code gebruikt?

Deze code werd gebruikt voor de ledstrip aan het bed.  
De ledstrip geeft visueel de status van het meldingssysteem weer.

## Belangrijk

Dit bestand bevat een oudere versie van de code.

De huidige versie die gebruikt wordt in het project is:
`ledstrip_met_uitvallen.ino`