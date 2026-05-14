# Netwerkconfiguratie Raspberry Pi 5

Deze documentatie beschrijft hoe de Raspberry Pi 5 verbonden werd met het netwerk voor het gebruik van Zigbee2MQTT en Home Assistant.

---

## 1. Oorspronkelijke bedoeling

De oorspronkelijke bedoeling was om de Raspberry Pi rechtstreeks via ethernet te verbinden met het schoolnetwerk.

Schema:

```text
Schoolnetwerk
        ↓ ethernet
Raspberry Pi 5
```

Hiervoor moest het MAC-adres van de Raspberry Pi eerst goedgekeurd/geregistreerd worden door de school.

De Raspberry Pi gebruikte hiervoor het ethernet MAC-adres:

```text
<ethernet-mac>
```

Na goedkeuring zou de Raspberry Pi rechtstreeks netwerktoegang krijgen via het schoolnetwerk.

Voordelen van deze oplossing:

- stabiele ethernetverbinding
- geen extra netwerkapparatuur nodig
- rechtstreeks bereikbaar op schoolnetwerk
- eenvoudigere netwerkstructuur

---

## 2. Tijdelijke oplossing via hotspot

Omdat de netwerkregistratie nog niet volledig in orde was, werd tijdelijk een hotspot gebruikt.

Schema:

```text
Telefoon hotspot
        ↓
Raspberry Pi 5
```

Nadelen van deze oplossing:

- minder stabiele verbinding
- IP-adres kon regelmatig veranderen
- afhankelijk van mobiele data
- minder geschikt voor langdurig gebruik

---

## 3. Huidige oplossing via mini-router

Momenteel wordt een mini-router gebruikt als tussenoplossing.

Schema:

```text
Schoolwifi
        ↓
Mini-router
        ↓ ethernet
Raspberry Pi 5
```

De mini-router verbindt eerst met de schoolwifi.

Daarna maakt de mini-router een eigen lokaal netwerk aan.

De Raspberry Pi is via ethernet verbonden met deze mini-router.

Hierdoor krijgt de Raspberry Pi een lokaal IP-adres van de mini-router.

Voorbeeld:

```text
192.168.8.42
```

---

## 4. Huidige netwerkwerking

De Raspberry Pi gebruikt momenteel:

```text
eth0 (ethernet)
```

De Pi gebruikt dus niet rechtstreeks de schoolwifi.

De mini-router verzorgt:

- wifi verbinding met schoolnetwerk
- lokaal netwerk voor de Raspberry Pi
- DHCP/IP-adressen
- internettoegang

Ondanks deze tussenlaag kan de Raspberry Pi nog steeds communiceren met:

- MQTT broker
- Home Assistant
- internet

---

## 5. MQTT en Home Assistant connectiviteit

De Raspberry Pi maakt verbinding met de MQTT broker via:

```text
<mqtt-broker-ip>:1883
```

Home Assistant draait op:

```text
http://<home-assistant-ip>:8123
```

De connectiviteit kan gecontroleerd worden met:

```bash
ping -c 3 <mqtt-broker-ip>
```

Als deze ping werkt, kan Zigbee2MQTT normaal communiceren met Home Assistant via MQTT.

---

## 6. Belangrijke gevolgen van deze netwerkstructuur

### IP-adres van de Pi kan veranderen

Omdat de mini-router DHCP gebruikt, kan het IP-adres van de Raspberry Pi veranderen.

Bijvoorbeeld:

```text
192.168.8.42
```

kan later veranderen naar:

```text
192.168.8.55
```

Hierdoor veranderen:

- SSH verbinding
- Zigbee2MQTT webinterface URL

Voorbeelden:

```bash
ssh <username>@<nieuw-ip>
```

```text
http://<nieuw-ip>:8080
```

---

## 7. Wat verandert NIET bij een nieuw IP-adres

Deze onderdelen blijven normaal werken:

- Docker
- Zigbee2MQTT configuratie
- gekoppelde Zigbee apparaten
- MQTT instellingen
- Home Assistant MQTT discovery
- Home Assistant automations

Omdat Zigbee2MQTT zelf verbinding maakt naar de MQTT broker via:

```yaml
mqtt:
  server: mqtt://<mqtt-broker-ip>:1883
```

wordt het lokale IP-adres van de Raspberry Pi hier niet gebruikt.

---

## 8. Netwerkgegevens controleren

IP-adressen bekijken:

```bash
hostname -I
```

Ethernet interface bekijken:

```bash
ip a show eth0
```

Wifi verbinding controleren:

```bash
iwgetid
```

Netwerkinterfaces bekijken:

```bash
ip link
```

---

## 9. Zigbee2MQTT webinterface

De Zigbee2MQTT webinterface is bereikbaar via:

```text
http://<ip-van-de-pi>:8080
```

Voorbeeld:

```text
http://192.168.8.42:8080
```

---

## 10. SSH verbinding

SSH verbinding maken met de Raspberry Pi:

```bash
ssh <username>@<ip-van-de-pi>
```

Voorbeeld:

```bash
ssh simlab@192.168.8.42
```