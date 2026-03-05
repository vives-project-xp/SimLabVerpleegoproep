# Arduino IDE instellen voor de ESP32-C6 als Zigbee-apparaat

Om je ESP32-C6 DevKit te gebruiken in een Zigbee-netwerk, moet je de Arduino IDE specifiek configureren. Volg hiervoor deze stappen:

## 1. De juiste library installeren
Zorg dat je de Espressif ESP32-boardmodule hebt geïnstalleerd.
1. Ga naar **File → Preferences**.
2. Voeg deze URL toe bij *Additional Board Manager URLs*: 
   `https://espressif.github.io/arduino-esp32/package_esp32_dev_index.json`
3. Ga naar **Tools → Board → Boards Manager**, zoek op `esp32` en installeer de versie van Espressif Systems.

## 2. Het juiste board selecteren
Sluit de ESP32-C6 aan op je computer. Ga naar **Tools → Board → esp32** en selecteer:
* **ESP32C6 Dev Module**
Je kunt dan links bovenaan zien in je arduino ide dat je het juiste board hebt:

[esp32_C6_devkit_tonen](./afbeeldingen/esp32%20c6%20devkit%20tonen.png)

## 3. Cruciale Zigbee-instellingen (Tools menu)
Pas vervolgens de volgende drie instellingen aan onder het **Tools** menu. Zonder deze instellingen zal je ESP32 nooit als Zigbee-apparaat werken.

### A. Erase All Flash Before Sketch Upload: `Enabled`
- **Wat het doet:** Wist het volledige flashgeheugen voordat de nieuwe code wordt geüpload.
- **Waarom:** Dit verwijdert eventuele oude code of achtergebleven Zigbee-netwerkgegevens. Als je dit niet doet, kan Home Assistant vaak moeite hebben om het apparaat te herkennen of te pairen. (Tip: zet dit na de eerste succesvolle upload weer uit, anders moet je hem telkens opnieuw pairen).

### B. Partition Scheme: `Zigbee 4MB with spiffs`
- **Wat het doet:** Deelt het geheugen van de ESP32 op een specifieke manier in.
- **Waarom:** De Zigbee-software heeft een gereserveerde partitie (`zb_storage`) nodig om netwerkgegevens en koppelingssleutels in op te slaan. Met een standaard partitieschema ontbreekt deze opslagruimte en zal de ESP blijven crashen tijdens het opstarten.

### C. Zigbee Mode: `Zigbee ED (end device)`
- **Wat het doet:** Bepaalt de rol van de ESP32 binnen het Zigbee-netwerk.
- **Waarom:** Een Zigbee-netwerk heeft maar één leider (de coördinator, in dit geval Home Assistant). Jouw ESP32 fungeert als een uitvoerend eindapparaat (End Device) dat opdrachten ontvangt, zoals het schakelen van een ledstrip.