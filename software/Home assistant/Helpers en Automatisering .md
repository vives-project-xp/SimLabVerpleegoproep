# Helpers Toevoegen

We maken gebruik van Helpers om zo goed te communiceren met de website voor het meldingsysteem. 

## Helpers maken

Om een helper aan te maken ga je naar instellingen → Apparaten en diensten 
<img src="../afbeeldingen/Instellingen Home Assistant.png" alt="Instelling Home assitant" width="600" />
<img src="../afbeeldingen/apparaten%20en%20diensten.png" alt="Apparaten en diensten " width="600" />

Dan selecteer je het tablad bovenaan naar helper.
<img src="../afbeeldingen/helpers%20tablad.png" alt="helpers tablad" width="600" />

Dan klik je onderaan op helper aanmaken.

Dan ga je in de lijst zoeken naar keuzeliijst kies je een naam best in het formaat Bed..._C... zodat je makelijk in je automatisering de namen zelf kunt aanpassen zonder te kopiëren. 
Daarna ga je bij opties er 4 toevoegen namelijk: idle,present, call en extra.
<img src="../afbeeldingen/helper%20aanmaken.png" alt="Helper aanmaken" width="600" />




# Automatisering Toevoegen(dit is een testvoorbeeld maar gebruiken we niet)

Dit moet worden gedaan omdat de knop en de ESP met ledstrip twee aparte apparaten zijn en dus niet rechtstreeks met elkaar kunnen 
verbinden. Daarom wordt er gebruikgemaakt van een automatisering die bepaalt: als dit gebeurt, moet dat worden uitgevoerd.

## Automatisering maken 

In Home Assistant ga je naar Instellingen → Automatiseringen en scènes, en klik je vervolgens bovenaan op Scènes.
<img src="../afbeeldingen/Instellingen%20Home%20Assistant.png" alt="Instelling Home assitant" width="600" />

<img src="../afbeeldingen/automatisering%20en%20scènes.png" alt="Automatisering en Scènes" width="600" />



Je komt standaard op het automatiseringsblad terecht, dus druk je rechtsonder op ‘Automatisering toevoegen’.
<img src="../afbeeldingen/automatisering%20toevoegen.png" alt="automatisering toevoegen" width="600" />

Op het tweede scherm klik je op ‘Automatisering toevoegen’ en daarna krijg je dit scherm te zien.

<img src="../afbeeldingen/automatisering%20maken.png" alt="automatisering maken" width="600" />

Het eerste wat je doet, is een trigger aanmaken voor de knop. Klik hiervoor op ‘Trigger toevoegen’ en kies ‘Apparaat’. Daarna 
verschijnt dit scherm.

<img src="../afbeeldingen/trigger_apparaat.png" alt="trigger_apparaat" width="600" />

Daarna ga je in de lijst zoeken naar het apparaat dat je wilt gebruiken voor de trigger. In ons geval is dit de eWeLink SNZB-01P. 
Selecteer dit apparaat. Vervolgens moet je de trigger kiezen; in dit geval kiezen we voor "Drukknop" knop ingedrukt. Dan moet je 
dit zien staan. 

<img src="../afbeeldingen/trigger%20correct.png" alt="trigger correct" width="600" />

De volgende stap is het toevoegen van een actie. Klik op ‘Actie toevoegen’ en kies ‘Scène toevoegen’. Selecteer daarna ‘Inschakelen’. Vervolgens klik je op ‘Doel toevoegen’ en kies je de gewenste scène; in ons geval is dat ‘demo’.
 
<img src="../afbeeldingen/actie%20maken.png" alt="actie aanmaken" width="600" />

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

<img src="../afbeeldingen/Als%20dan%20functie.png" alt="als dan functie" width="600" />
