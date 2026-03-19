# Home Assistant Backup en Herstel (SD-card crash)

Deze handleiding is bedoeld voor het scenario: SD-kaart crasht en je wil zo snel mogelijk terug online.

Bronnen:
- https://www.home-assistant.io/integrations/backup/
- https://www.home-assistant.io/common-tasks/general/#backups
- https://www.home-assistant.io/common-tasks/general/#restoring-a-backup
- https://www.home-assistant.io/common-tasks/general/#defining-backup-locations
- https://www.home-assistant.io/more-info/backup-emergency-kit/

## Waarom dit belangrijk is

Backups zijn de snelste manier om:
- na crash te herstellen
- naar nieuwe hardware te migreren
- configuratieverlies te vermijden

Als backups alleen lokaal op de SD-kaart staan en die kaart faalt, ben je ze kwijt. Bewaar daarom altijd minstens 1 kopie buiten Home Assistant.

## Aanbevolen backup-strategie

1. Zet automatische backups aan (liefst dagelijks).
2. Gebruik meerdere locaties:
- lokaal (snelle restore)
- extern (NAS/cloud/off-site)
3. Bewaar de Backup Emergency Kit op een veilige plek buiten HA.
4. Hou meerdere recente backups bij (bijv. 7 of 14).

## Automatische backups instellen

1. Ga naar `Settings > System > Backups`.
2. Kies `Set up backups`.
3. Download de `Backup emergency kit` en bewaar die veilig.
4. Stel schema in:
- frequentie: bij voorkeur dagelijks
- tijdstip: wanneer netwerkopslag beschikbaar is
5. Stel in of je ook voor updates automatisch wil backuppen.
6. Kies retentie (hoeveel backups je bewaart).
7. Kies wat je opneemt in de backup.
- tip: `media` en `share` uitschakelen als backup te groot is
8. Zet backup-locaties aan (lokaal + extern).

## Backup-locaties

Aanbevolen minimum:
- 1 lokale backup
- 1 externe backup (NAS / cloud / Home Assistant Cloud)

Belangrijk:
- Home Assistant Cloud bewaart 1 backup (max 5 GB) en die is altijd encrypted.
- Voor andere locaties kan je encryptie per locatie instellen.

## Handmatige backup (voor grote wijzigingen)

Maak handmatig een backup voor je grote updates doet:

1. `Settings > System > Backups`
2. `Backup now` > `Manual backup`
3. Naam geven
4. Locaties kiezen
5. Backup starten

## Noodherstel na SD-card crash (nieuw toestel of nieuwe SD)

1. Installeer Home Assistant opnieuw op het nieuwe medium/toestel.
2. Start onboarding.
3. Kies hersteloptie:
- `Upload backup` (lokale .tar)
- of `Home Assistant Cloud` (inloggen en backup kiezen)
4. Kies onderdelen om te herstellen (meestal alles).
5. Geef encryptiesleutel in uit de Backup Emergency Kit.
6. Wacht tot restore volledig klaar is (kan lang duren).
- pagina niet forceren verversen tijdens restore
7. Log in met dezelfde credentials als op moment van backup.
8. Controleer nadien:
- integraties online
- netwerkopslag opnieuw gekoppeld
- Zigbee/Z-Wave sticks correct aangesloten

## Wat in de emergency kit moet staan

Bewaar buiten HA (bijvoorbeeld password manager + versleutelde USB):
- encryptiesleutel
- backup naam + datum
- HA URL
- beheerderslogin (of verwijzing ernaar)
- notitie welke sleutel bij welke oudere backups hoort

Opmerking:
Als je ooit de encryptiesleutel wijzigt, hou ook de oude sleutel bij voor oudere backups.

## Snelle maandelijkse checklist

1. Is er een recente succesvolle backup?
2. Staat er een kopie buiten Home Assistant?
3. Is de emergency kit up-to-date en terugvindbaar?
4. Is backupgrootte nog onder controle?
5. Is minstens 1 restore-test ooit uitgevoerd?

## Optioneel: backup via automation action

Als de standaard planning niet volstaat, kan je de backup actions gebruiken:
- `backup.create_automatic`
- `backup.create` (core/container)

Voorbeeld:

```yaml
automation:
  - alias: "Backup Home Assistant every night at 3 AM"
    triggers:
      - trigger: time
        at: "03:00:00"
    actions:
      - alias: "Create backup now"
        action: backup.create
```

## Besluit

Voor SD-card crash bescherming heb je 3 dingen nodig:
- automatische backups
- externe opslag
- emergency kit

Als die 3 op orde staan, kan je meestal snel volledig herstellen.
