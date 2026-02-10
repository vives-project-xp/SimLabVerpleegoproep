# Soorten communicatie vergelijken

## Wi-Fi

**Voordelig:**

- **Schaalbaarheid:** Het is makkelijk om meerdere toestellen toe te voegen aan een netwerk. Voor ons is dit voordelig omdat ons project communicatie nodig heeft tussen meerdere onderdelen.

- **Mobiel:** Overal bereikbaar zolang het binnen de zone van het netwerk blijft.

- **Bandbreedte:** Ook al is dit een voordeel, is dit niet noodzakelijk. Wij zullen niet heel zware data moeten doorsturen.

**Nadelig:**

- **Bereikbeperkingen:** Wi-Fi heeft een beperkt bereik die kan worden beïnvloed door fysieke obstakels (muren, meubels) en door interferentie van andere apparaten. Dit kan ervoor zorgen dat er in bepaalde gebieden een zwak signaal is, zeker als het signaal al niet sterk was.

- **Stroomverbruik:** Het gebruik van Wi-Fi verbruikt redelijk veel stroom vergeleken met de andere opties. Dit is voor ons project nadelig omdat we met een low-power systeem willen werken en de batterij lang moet kunnen meegaan. Het is niet de bedoeling dat de batterij bijna dagelijks moet herladen worden, daarom weegt dit nadeel sterk door.

## Bluetooth

**Voordelig:**

- **Laag stroomverbruik**: Bluetooth is een goed keuze voor communicatie met een laag stroomverbruik, waardoor het geschikt is voor apparaten die op batterijen werken. Dit is perfect voor ons project.

- **Toegankelijkheid**: Bluetooth is een breed geaccepteerde standaard, waardoor het compatibel is met een groot aantal apparaten. Het kan met veel verschillende soorten toestellen verbinden en daardoor ook voor veel verschillende toepassingen gebruikt worden.

**Nadelig:**

- **Bereikbeperkingen:** Bluetooth heeft een kort bereik, waardoor het niet op heel lange afstanden kan gebruikt worden. Dit kan voor ons project eventueel voor problemen zorgen.

- **Schaalbaarheid**: Bluetooth heeft een limiet op het aantal apparaten dat tegelijkertijd verbonden kan worden, wat een beperking kan zijn in complexe opstellingen. Dit nadeel weegt veel door omdat ons project makkelijk uitbreid baar moet zijn en bestaat uit een netwerk van knoppen en lichten.

## Zigbee

**Voordelig:**

- **Laag stroomverbruik**: Zigbee apparaten gebruiken een systeem waarbij ze in een soort slaapstand staan, hierdoor wordt er heel weinig energie verbruikt. Dit is ideaal voor ons project. Hierdoor moet de batterij minder vaak herladen worden en zal het toestel lang kunnen gebruikt worden.

- **Mesh netwerk:** Zigbee maakt gebruik van een mesh netwerk, waarbij apparaten signalen versterken en doorgeven. Dit zorgt voor een stabiele verbinding en een groot bereik.

- **Schaalbaarheid**: Zigbee kan tot 65.000 apparaten in één netwerk ondersteunen, wat het zeer geschikt maakt voor grote installaties. Deze eigenschap is zeer nuttig bruikbaar voor ons project, dit systeem is perfect voor complexere netwerken en op deze manier voorzien we ook een mogelijkheid voor uitbreiding.

**Nadelig:**

- **Lagere bandbreedte**: De bandbreedte van Zigbee is relatief laag, waardoor het minder geschikt is voor toepassingen die veel data vereisen. Dit is niet een zeer groot nadeel omdat we geen zeer grote data zullen moeten doorsturen.

- **Lagere datasnelheid**: In vergelijking met de andere keuzes heeft Zigbee een lage snelheid voor dataoverdracht. Dit betekend niet dat het onbruikbaar is, Zigbee werkt uitstekend voor sensoren en automatisering. Voor onze toepassing is dit snel genoeg.

## Conclusie

We zullen gebruik maken van Zigbee, dit komt omdat we met ons project de nadruk leggen op de levensduur van de batterij en de uitbreid mogelijkheden. Zigbee verbruikt zeer weinig energie, waardoor de batterij lang meegaat. Ook is Zigbee goed voor het maken van complexere netwerken, wat nuttig is voor dit project. Dit betekend niet dat deze manier perfect is, Zigbee heeft geen heel hoge bandbreedte en is ook niet zeer snel. Dit zijn echter kleine compensaties vergeleken met de voordelen.

**Bronnen:**

[IoT Wireless Tech: Wi-Fi, Bluetooth, Zigbee – Guide & Comparison - Stats and Insights](https://statsandinsights.com/2025/01/13/iot-wireless-tech-wifi-bluetooth-zigbee-guide-comparison/?utm_source=copilot.com)

[Wat zijn de voor- en nadelen van wifi?](https://www.nldit.com/netwerken/wireless-networking/202510/327674.html)

[17 Voordelen en nadelen van Bluetooth](https://barrazacarlos.com/nl/voordelen-en-nadelen-van-bluetooth/)

[Zigbee vs. Z-Wave: Dit zijn de Verschillen!](https://domotiseren.nl/particulier/zigbee-vs-zwave/)