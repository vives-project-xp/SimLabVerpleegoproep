## Voordelen bluetooth (BLE / BLE Mesh)
- Werkt zonder WiFi-infrastructuur (geen access points nodig om te functioneren).
- Laag energieverbruik is haalbaar met BLE, dus geschikt voor batterijgevoede 
drukknoppen/sensor-nodes.
- ESP32 heeft native BLE-ondersteuning (dus je hoeft geen extra radio-module te
 plaatsen als je bij ESP32 blijft).
- Uitbreidbaar naar veel apparaten als je BLE Mesh gebruikt (BLE Mesh is ontworpen om 
grote aantallen nodes te ondersteunen).
- Beveiliging: BLE Mesh gebruikt encryptie en authenticatie (AES-CCM) om berichten te 
beschermen.
- Wordt al gebruikt in healthcare-contexten (bv. asset tracking/RTLS), dus er is 
relevante praktijkervaring en ecosysteem.
​
## Nadelen bluetooth
- Kortere indoor range is typisch (vaak rond 10–50 m; afhankelijk van muren/omgeving), 
dus je hebt sneller meerdere “tussen-nodes” nodig.
- “Klassieke” BLE is vooral point-to-point; voor meerdere kamers/beds heb je BLE Mesh 
nodig, en dat is aanzienlijk complexer om goed op te zetten en te testen.
- Op ESP32 kan BLE tijdens actieve verbinding relatief veel stroom trekken (orde 50–70 
mA), waardoor je ontwerp sterk moet leunen op sleep/advertising om echt low-power te
 blijven.
- Op ESP32 delen WiFi en Bluetooth dezelfde radio/antenne-resources, wat gelijktijdig 
gebruik kan beperken (relevant als je toch ergens WiFi wil combineren).
- In ziekenhuizen zie je Bluetooth vaker als infrastructuur voor tracking/management 
dan als primair “kritisch” oproepsysteem, dus je moet extra aandacht geven aan 
betrouwbaarheid en fail-safe ontwerp.


## Meer info over bluetooth mesh 
https://novelbits.io/bluetooth-mesh-networking-the-ultimate-guide/