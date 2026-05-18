# Helpers Toevoegen

We maken gebruik van Helpers om goed te communiceren met de website voor het meldingssysteem.

---

## Helpers maken

Om een helper aan te maken ga je naar:

**Instellingen → Apparaten en diensten**

<br>

<p align="center">
  <img src="../afbeeldingen/Instellingen Home Assistant.png" alt="Instellingen Home Assistant" width="600" />
</p>

<br>

<p align="center">
  <img src="../afbeeldingen/apparaten%20en%20diensten.png" alt="Apparaten en diensten" width="600" />
</p>

<br>

Dan selecteer je bovenaan het tabblad **Helpers**.

<br>

<p align="center">
  <img src="../afbeeldingen/helpers%20tablad.png" alt="Helpers tabblad" width="600" />
</p>

<br>

Klik daarna onderaan op **Helper aanmaken**.

Ga vervolgens in de lijst zoeken naar **Keuzelijst**.  
Kies een naam, bij voorkeur in het formaat:

`Bed..._C...`

Zo kun je later in je automatiseringen makkelijk namen aanpassen zonder alles te moeten kopiëren.

Daarna voeg je bij opties de volgende 4 waarden toe:

- idle
- present
- call
- extra

<br>

<p align="center">
  <img src="../afbeeldingen/helper%20aanmaken.png" alt="Helper aanmaken" width="600" />
</p>

---

# Automatisering Toevoegen  
*(Dit is een testvoorbeeld maar gebruiken we niet)*

Dit moet worden gedaan omdat de knop en de ESP met ledstrip twee aparte apparaten zijn en dus niet rechtstreeks met elkaar kunnen verbinden. Daarom wordt er gebruikgemaakt van een automatisering die bepaalt: als dit gebeurt, moet dat worden uitgevoerd.

---

## Automatisering maken

In Home Assistant ga je naar:

**Instellingen → Automatiseringen en scènes**

en klik je vervolgens bovenaan op **Scènes**.

<br>

<p align="center">
  <img src="../afbeeldingen/Instellingen%20Home%20Assistant.png" alt="Instellingen Home Assistant" width="600" />
</p>

<br>

<p align="center">
  <img src="../afbeeldingen/automatisering%20en%20scènes.png" alt="Automatiseringen en scènes" width="600" />
</p>

<br>

Je komt standaard op het automatiseringsblad terecht, dus druk je rechtsonder op **Automatisering toevoegen**.

<br>

<p align="center">
  <img src="../afbeeldingen/automatisering%20toevoegen.png" alt="Automatisering toevoegen" width="600" />
</p>

<br>

Op het tweede scherm klik je opnieuw op **Automatisering toevoegen**.  
Daarna krijg je dit scherm te zien.

<br>

<p align="center">
  <img src="../afbeeldingen/automatisering%20maken.png" alt="Automatisering maken" width="600" />
</p>

---

Het eerste wat je doet is een trigger aanmaken voor de knop.

Klik hiervoor op **Trigger toevoegen** en kies **Apparaat**.  
Daarna verschijnt dit scherm.

<br>

<p align="center">
  <img src="../afbeeldingen/trigger_apparaat.png" alt="Trigger apparaat" width="600" />
</p>

<br>

Daarna ga je in de lijst zoeken naar het apparaat dat je wilt gebruiken voor de trigger.  
In ons geval is dit de **eWeLink SNZB-01P**.

Selecteer dit apparaat. Vervolgens moet je de trigger kiezen.  
In dit geval kiezen we voor:

**Drukknop → knop ingedrukt**

Dan moet je dit zien staan.

<br>

<p align="center">
  <img src="../afbeeldingen/trigger%20correct.png" alt="Trigger correct" width="600" />
</p>

---

De volgende stap is het toevoegen van een actie.

Klik op **Actie toevoegen** en kies **Scène toevoegen**.  
Selecteer daarna **Inschakelen**.

Vervolgens klik je op **Doel toevoegen** en kies je de gewenste scène.  
In ons geval is dat **demo**.

<br>

<p align="center">
  <img src="../afbeeldingen/actie%20maken.png" alt="Actie maken" width="600" />
</p>

<br>

Daarna hoef je enkel nog de automatisering op te slaan en een naam naar keuze te geven.  
Vervolgens is de automatisering klaar voor gebruik.

---

# Automatisering uitzetten  
*(Dit moet je maar doen bij 1 van de drie automatiseringen)*

Nu heb je wel het probleem dat je de scène kunt aanzetten, maar nog niet kunt uitzetten. Hiervoor moet je een kleine aanpassing doen in je demo.

Als je meerdere scènes gebruikt die je met één drukknop inschakelt, hoef je maar één keer een uit-functie te maken om alle scènes die je hebt uit te schakelen.

---

## Als-dan functie toevoegen

Bij **Actie toevoegen** ga je bovenaan naar **Bouwstenen** en kies je **Als-dan voorwaarde**.

Bij **Als** voeg je het apparaat `unk_manufacturer unk_model` toe en stel je in dat het uitgeschakeld is.

Daarna voeg je bij **Dan** de instelling **Scène toevoegen** toe en selecteer je de gewenste scène.

Vervolgens voeg je bij **Anders** de actie toe om `unk_manufacturer unk_model` uit te zetten.

<br>

<p align="center">
  <img src="../afbeeldingen/Als%20dan%20functie.png" alt="Als-dan functie" width="600" />
</p>