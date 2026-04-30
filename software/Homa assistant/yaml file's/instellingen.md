# Yamle file's gebruik

De gegevenen yaml file's zijn voor de automatisering dat je moet aanmaken in home assistant zelf. In princiepe kun je deze ook zelf aanmaken maar het is makelijker om ze te schrijven. In deze folder zul je 2 mappen zijn namleijk kamer C302 en C305 dit zijn al de voorgemaakt yaml bestanden voor ieder knop en ledstrip voor in die bepaalde kamer. Om zelf deze bestanden te kunnen aanmaken moet je een paar dingen veranderen en hieronder word uitgelegd wat je precies moet veranderen.

## Knoppen

### Id aanpassen 

Iedere knop heeft zijn eigen Id en die moest je in de file op 3 plaatsen invullen zodat het duidelijk is dat deze automatisering aan deze knop is gelinkt. Je moet ze op deze plaatsen aanpassen. 
[Id aanpassen](./Afbeeldingen/id%20instellingen.png)

De Id kun je halen als je de knop hebt toegevoegd in Home assistant zelf kun je deze zien in de zoekbalk van home assitant als je naar de specifiek gaat.
[Id vinden](./Afbeeldingen/Id%20vinden.png)

### Naam aanpassen 
De namen worden aangepast naar de namen van je helper dat je hebt aangemaakt dit word uitgeleg in deze file: [helper aanmaken](/software/Homa%20assistant/Helpers%20en%20Automatisering%20.md) Nu moet je kijken naar de helper namen en deze worden ingevuld op de entity_id. De action moet je iedere keer aanpassen naar het zelfde formaat dat je nu ziet namelijk eerst het lokaal en dan het bed. 

[namenknop](./Afbeeldingen/namenknop.png)

## ledstrip

Per kamer heb je 1 yaml file voor de ledstrip deze steek je in een nieuwe automatisering en pas je ook nog aan naar de juist namen en id.

### Id aanpassen 
Iedere ledstrip heeft zijn eigen Id dus die moet je iedere keer aanpassen naar de juist dat je gebruikt dit doe je op 4 plaatsen.

[Id aanpassen](./Afbeeldingen/id%20ledstrip.png)

De Id van de ledstrip vind je als je naar apparaten en diesten → mqtt en dan je kamer selecteren die je wilt. Dan klik je rechtsboven op de 3 puntjes rechtsboven en klik je op entiteiten. Dan kies je het lampje en druk je op het tandwieltje en dan kun je zijn identiteit zien. 

[id_zoeken](./Afbeeldingen/id_zoeken.png)

[id vinden ledstrip](./Afbeeldingen/id%20ledstrip%20vinden.png)

### bedden toevoegen
In de ledstrip code kun je makelijk bedden toevoegen door gewoon de naam van je helper toe te voegen in deze 2 code blokken.
[bedden toevoegen](./Afbeeldingen/bedden%20toevoegen.png)
