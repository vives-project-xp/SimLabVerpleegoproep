# Scènes Toevoegen

We maken gebruik van scènes omdat we daarmee een vaste kleur voor de ledstrip kunnen instellen wanneer een bepaalde scène wordt geactiveerd. In een automatisering zelf kunnen we namelijk niet rechtstreeks bepalen welke kleur de ledstrip moet hebben. Dit is dus een kleine omweg om dat toch mogelijk te maken.

## Scènes aanmaken

In Home Assistant ga je naar Instellingen → Automatiseringen en scènes, en klik je vervolgens bovenaan op Scènes.
[Instelling Home assitant](/software/afbeeldingen/Instellingen%20Home%20Assistant.png)

[Automatisering en Scènes](/software/afbeeldingen/automatisering%20en%20scènes.png)

[Tablad scènes](/software/afbeeldingen/Tablad%20scènes.png)


Zodra je hier bent, kun je onderaan op Scène toevoegen klikken.
[Scène Toevoegen](/software/afbeeldingen/scène%20toevoegen.png)


Vervolgens voeg je bij Apparaten een nieuw apparaat toe en zoek je in de lijst naar het juiste apparaat. In dit geval is dat “unk_manufacturer unk_model”.

Zodra dit is gelukt, klik je op het lampje om de kleur in te stellen die je wilt gebruiken.
[Kleur instellen](/software/afbeeldingen/kleur%20instellen.png) 

Als dit gelukt is, zie je dat het lampje de kleur heeft die je hebt gekozen.
[kleur ingesteld](/software/afbeeldingen/kleur%20ingesteld.png)


Daarna hoef je de scène alleen nog op te slaan en een naam te geven naar keuze.


# Automatisering Toevoegen

Dit moet worden gedaan omdat de knop en de ESP met ledstrip twee aparte apparaten zijn en dus niet rechtstreeks met elkaar kunnen 
verbinden. Daarom wordt er gebruikgemaakt van een automatisering die bepaalt: als dit gebeurt, moet dat worden uitgevoerd.

## Automatisering maken 

In Home Assistant ga je naar Instellingen → Automatiseringen en scènes, en klik je vervolgens bovenaan op Scènes.
[Instelling Home assitant](/software/afbeeldingen/Instellingen%20Home%20Assistant.png)

[Automatisering en Scènes](/software/afbeeldingen/automatisering%20en%20scènes.png)

[Tablad automatisering](/software/afbeeldingen/Tablad%20scènes.png)

Je komt standaard op het automatiseringsblad terecht, dus druk je rechtsonder op ‘Automatisering toevoegen’.
[automatisering toevoegen](/software/afbeeldingen/automatisering%20toevoegen.png)

Op het tweede scherm klik je op ‘Automatisering toevoegen’ en daarna krijg je dit scherm te zien.

[automatisering maken](/software/afbeeldingen/automatisering%20maken.png)

Het eerste wat je doet, is een trigger aanmaken voor de knop. Klik hiervoor op ‘Trigger toevoegen’ en kies ‘Apparaat’. Daarna 
verschijnt dit scherm.

[trigger_apparaat](/software/afbeeldingen/trigger_apparaat.png)

Daarna ga je in de lijst zoeken naar het apparaat dat je wilt gebruiken voor de trigger. In ons geval is dit de eWeLink SNZB-01P. 
Selecteer dit apparaat. Vervolgens moet je de trigger kiezen; in dit geval kiezen we voor "Drukknop" knop ingedrukt. Dan moet je 
dit zien staan. 

[trigger correct](/software/afbeeldingen/trigger%20correct.png)

De volgende stap is het toevoegen van een actie. Klik op ‘Actie toevoegen’ en kies ‘Scène toevoegen’. Selecteer daarna ‘Inschakelen’. Vervolgens klik je op ‘Doel toevoegen’ en kies je de gewenste scène; in ons geval is dat ‘demo’.
 
[actie aanmaken](/software/afbeeldingen/actie%20maken.png)

Daarna hoef je enkel nog de automatisering op te slaan en een naam naar keuze te geven. Vervolgens is de automatisering klaar 
voor gebruik.

## Automatisering uitzetten(dit moet je maar doen bij 1 van de drie automatiseringen)
Nu heb je wel het probleem dat je de scène kunt aanzetten, maar nog niet kunt uitzetten. Hiervoor moet je een kleine aanpassing 
doen in je demo.
Als je meerdere scènes gebruikt die je met één drukknop inschakelt, hoef je maar één keer een uit-functie te maken om alle scènes 
die je hebt uit te schakelen.

Bij ‘Actie toevoegen’ ga je nu bovenaan naar ‘Bouwstenen’ en kies je ‘Als-dan voorwaarde’.
Bij ‘Als’ voeg je het apparaat unk_manufacturer unk_model toe en stel je in dat het uitgeschakeld is.
Daarna voeg je bij ‘Dan’ de instelling ‘Scène toevoegen’ toe en selecteer je de gewenste scène.
Vervolgens voeg je bij ‘Anders’ de actie toe om unk_manufacturer unk_model uit te zetten.

[als dan functie](/software/afbeeldingen/Als%20dan%20functie.png)