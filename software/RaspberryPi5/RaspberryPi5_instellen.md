# Raspberry Pi 5 configuratie voor Zigbee2MQTT

Deze documentatie beschrijft wat er op de Raspberry Pi 5 werd geïnstalleerd en aangepast om Zigbee-apparaten via Zigbee2MQTT te kunnen gebruiken in Home Assistant.

---

## 1. Doel van de Raspberry Pi

De Raspberry Pi 5 wordt gebruikt als Zigbee gateway.

De Pi doet het volgende:

* leest Zigbee-apparaten uit via de SONOFF Zigbee USB dongle
* draait Zigbee2MQTT in Docker
* stuurt Zigbee-data door naar de MQTT broker
* Home Assistant leest daarna deze MQTT-data uit

Schema:

```text
Zigbee apparaat
        ↓
SONOFF Zigbee USB dongle
        ↓
Raspberry Pi 5
        ↓
Zigbee2MQTT
        ↓
MQTT broker
        ↓
Home Assistant
```

---

## 2. Besturingssysteem

Op de Raspberry Pi werd geïnstalleerd:

```text
Raspberry Pi OS 64-bit
```

Raspberry Pi OS Lite was ook mogelijk, maar de gewone 64-bit versie werkt ook.

---

## 3. Gebruiker op de Pi

Gebruiker:

```text
<username>
```

Wachtwoord:

```text
<password>
```

SSH gebruiken:

```bash
ssh <username>@<ip-van-de-pi>
```

---

## 4. Netwerkgegevens Raspberry Pi

Ethernet MAC-adres:

```text
<ethernet-mac>
```

Wi-Fi MAC-adres:

```text
<wifi-mac>
```

Deze MAC-adressen kunnen gebruikt worden om een vast IP-adres te reserveren via DHCP.

IP-adres controleren:

```bash
hostname -I
```

`hostname -I` toont meerdere IP-adressen.  
Het relevante LAN IP is:

```text
<ip-van-de-pi>
```

Actieve wifi controleren:

```bash
iwgetid
```

Netwerkinterfaces bekijken:

```bash
ip link
```

---

## 5. Systeem updaten

Na installatie werd het systeem geüpdatet:

```bash
sudo apt update
sudo apt full-upgrade -y
sudo reboot
```

---

## 6. Docker installeren

Zigbee2MQTT draait in Docker.

Docker werd geïnstalleerd met:

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo reboot
```

Na reboot werd Docker gecontroleerd met:

```bash
docker --version
docker compose version
```

---

## 7. Mapstructuur voor Zigbee2MQTT

Er werd een map aangemaakt voor Zigbee2MQTT:

```bash
mkdir -p ~/zigbee2mqtt/data
cd ~/zigbee2mqtt
```

De hoofdmap is:

```text
/home/<username>/zigbee2mqtt
```

De configuratiemap is:

```text
/home/<username>/zigbee2mqtt/data
```

---

## 8. SONOFF Zigbee dongle

De SONOFF Zigbee USB dongle werd in de Raspberry Pi gestoken.

De juiste seriële poort werd gecontroleerd met:

```bash
ls -l /dev/ttyUSB*
ls -l /dev/serial/by-id/
dmesg | tail -n 30
```

De dongle werd herkend als:

```text
/dev/ttyUSB0
```

In `dmesg` werd zichtbaar:

```text
Product: SONOFF Zigbee 3.0 USB Dongle Plus V2
Manufacturer: Itead
cp210x converter now attached to ttyUSB0
```

---

## 9. Docker Compose bestand

Het bestand werd aangemaakt met:

```bash
nano ~/zigbee2mqtt/docker-compose.yml
```

Inhoud:

```yaml
services:
  zigbee2mqtt:
    container_name: zigbee2mqtt
    image: koenkk/zigbee2mqtt
    restart: unless-stopped

    volumes:
      - ./data:/app/data

    ports:
      - 8080:8080

    environment:
      - TZ=Europe/Brussels

    devices:
      - /dev/ttyUSB0:/dev/ttyUSB0
```

Opslaan in nano:

```text
Ctrl + O
Enter
Ctrl + X
```

---

## 10. Zigbee2MQTT configuratie

Het configuratiebestand staat hier:

```text
/home/<username>/zigbee2mqtt/data/configuration.yaml
```

Openen:

```bash
nano ~/zigbee2mqtt/data/configuration.yaml
```

Huidige configuratie:

```yaml
homeassistant:
  enabled: true

mqtt:
  server: mqtt://<mqtt-broker-ip>:1883
  user: <mqtt-username>
  password: <mqtt-password>

serial:
  port: /dev/ttyUSB0
  adapter: ember

frontend:
  enabled: true
  port: 8080

version: 5
```

Na het koppelen van apparaten voegt Zigbee2MQTT automatisch een `devices:` sectie toe aan `configuration.yaml`.

Voorbeeld:

```yaml
devices:
  '0xd44867fffe4680a2':
    friendly_name: '0xd44867fffe4680a2'
```

Belangrijke instellingen:

| Instelling | Betekenis |
|---|---|
| `homeassistant.enabled: true` | apparaten automatisch doorsturen naar Home Assistant |
| `mqtt.server` | MQTT broker waar Zigbee2MQTT mee verbindt |
| `serial.port` | USB-poort van de Zigbee dongle |
| `adapter: ember` | adaptertype voor de SONOFF dongle |
| `frontend.port: 8080` | webinterface van Zigbee2MQTT |

---

## 11. MQTT broker

De MQTT broker draait niet op de Pi.

De MQTT broker draait op:

```text
<mqtt-broker-ip>
```

Home Assistant draait op:

```text
http://<home-assistant-ip>:8123
```

MQTT gegevens:

```text
Broker/server: <mqtt-broker-ip>
Poort: 1883
Username: <mqtt-username>
Password: <mqtt-password>
```

Netwerkconnectiviteit controleren:

```bash
ping -c 3 <mqtt-broker-ip>
nc -vz <mqtt-broker-ip> 1883
```

---

## 12. Zigbee2MQTT starten

Zigbee2MQTT starten:

```bash
cd ~/zigbee2mqtt
docker compose up -d
```

Status/logs bekijken:

```bash
cd ~/zigbee2mqtt
docker compose logs --tail=50
```

Live logs bekijken:

```bash
cd ~/zigbee2mqtt
docker compose logs -f
```

Herstarten:

```bash
cd ~/zigbee2mqtt
docker compose restart
```

Stoppen:

```bash
cd ~/zigbee2mqtt
docker compose down
```

Status van containers bekijken:

```bash
docker compose ps
```

---

## 13. Controleren of Zigbee2MQTT werkt

In de logs moet staan:

```text
Connected to MQTT server
Started frontend on port 8080
Zigbee2MQTT started!
```

Voorbeeld van werkende logs:

```text
Connected to MQTT server
Started frontend on port 8080
Currently 12 devices are joined.
Zigbee2MQTT started!
```

De webinterface is bereikbaar via:

```text
http://<ip-van-de-pi>:8080
```

Voorbeeld:

```text
http://192.168.1.100:8080 (dit is niet het echte ip-adres)
```

---

## 14. Problemen oplossen

### USB dongle niet gevonden

Controleer:

```bash
ls -l /dev/ttyUSB*
dmesg | tail -n 30
```

### Zigbee2MQTT kan MQTT niet bereiken

Controleer:

```bash
ping -c 3 <mqtt-broker-ip>
nc -vz <mqtt-broker-ip> 1883
```

### Logs bekijken

```bash
cd ~/zigbee2mqtt
docker compose logs -f
```

### Container status bekijken

```bash
docker compose ps
```

### Container volledig herstarten

```bash
cd ~/zigbee2mqtt
docker compose down
docker compose up -d
```