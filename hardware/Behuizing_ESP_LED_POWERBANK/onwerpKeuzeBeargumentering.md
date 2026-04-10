# **Beargumentatie ontwerp keuzes behuizing**

# Inleiding

In dit bestand zal de argumentatie rond de keuzes die werden gemaakt voor het eind ontwerp van de behuizing terug te vinden zijn, ook de meerdere iteraties van het ontwerp worden hier besproken en waarom we bepaalde keuzes hebben gemaakt.

# Argumentatie

## Lay-out

Na veel proberen, zijn we uitgekomen bij de powerbank aan de onderzijde en de ESP32 ernaast aan de bovenzijde gepositioneerd (gezien van bovenaf). We hebben hiervoor gekozen omwille van de positionering van de knoppen en de poorten van de powerbank. Op deze manier is alles makkelijk bereikbaar en ziet de behuizing er niet lomp uit omwille van de diepte.

### Andere iteraties
Voordien waren er andere iteraties van de behuizing, waarbij we potentiële ontwerpen uit tekenden om de voordelen en nadelen af te wegen.
Deze worden hier besproken.

#### Versie 1
Versie 1 was meer bedoelt als startpunt voor de andere versies. Er werd een eerste 3D ontwerp getekend dat kan gebruikt worden om op verder te bouwen of als referentie.

#### Versie 2
Versie 2 was een ontwerp voor het visualiseren van een concept die we hadden. Bij deze versie was de ESP32 bovenop de powerbank. Dit zou er wel voor zorgen dat de behuizing smaller is, het is dan echter wel hoger en lomper van vorm en vraagt voor een complexere structuur. Daarom hebben we hiervoor ook niet gekozen.

#### Versie 3
Versie 3 was de eerste versie waarvan we zeker genoeg waren om deze te 3D printen. Het ontwerp had de ESP32 boven de powerbank gelegen aan de bovenzijde gepositioneerd (gezien van bovenaf).
We zagen echter een probleem die pas heel duidelijk werd bij het 3D printen van de behuizing, de manier waarop we het deksel inschuiven en uitschuiven.
Bij het ontwerpen Leek deze methode stevig en betrouwbaar, dit was echter niet volledig zo. Door het 3D printen zelf is de onderkant van de opening om het deksel door te schuiven beginnen hangen. Dit zorgt ervoor dat de opening niet groot genoeg was. Een ander nadeel is dat de dikte van het stuk boven de opening niet dik genoeg was, dit zorgde ervoor dat dit stuk makkelijk heen en weer kon geplooid worden.

#### Versie 4
Versie 4 is het uiteindelijke ontwerp geworden. Deze versie lijkt zeer veel op versie 3 met een aantal kleine veranderingen. De grootste aanpassing is het systeem dat we gebruiken om de behuizing te openen.

### Belangrijke onderdelen
-	Bevat kleine binnenmuren: Dit zorgt voor het in plaats houden van de losse componenten.
-	Bevat gaten voor bereik: Dit zorgt ervoor dat de knoppen en poorten van de powerbank makkelijk bereikbaar zijn.
-	Bevat gaten voor riemen: Er zijn gaten voorzien om los liggende kabels vast te hangen met behulp van een spanband of riem.
-	Bevat ventilatiegaten: Deze gaten zijn niet heel noodzakelijk omdat de componenten niet extreem warm worden, toch worden deze gebruikt vooral voor de ESP32 omdat deze wel wat warm wordt bij langdurig gebruik.
-	Bevat schuifgleuven: Dit wordt gebruikt om het deksel in te schuiven.



## Toegang poorten en knoppen

We hielden er telkens rekening mee dat de interne componenten vlot bereikbaar moeten zijn.

We zorgden er voor dat er openingen voorzien zijn om de power knop van de powerbank in te kunnen drukken en zodat de oplaad poort van de powerbank naar buiten kan gebracht worden, op deze manier moet de behuizing niet geopend worden om het op te laden

## LED strip

De LED strip wordt aan de binnenkant van de behuizing bevestigd. Door een melk plectieplaat te gebruiken als deksel, zullen de LED’s goed zichtbaar zijn. Er zijn dan ook gleuven voorzien om deze plaat door te schuiven.

## Zichtbaarheid licht

Omdat de LED strip aan de binnenkant van de behuizing zit, moeten we ervoor zorgen dat alles goed zichtbaar is naar buiten toe. Op het eerste zicht ziet alles er duidelijk uit, door het gebruik van een witte PLA en de goede hangplaats van de LED strip kaatst het licht genoeg rond. Het licht is fel genoeg om van ver duidelijk het kleur te zien. Ook al is de zichtbaarheid goed, gebruiken we toch een reflecterende rol zodat het licht nog extra goed kan rondkaatsen. Dit helpt ook met het even belichten van het deksel, zodat er zeker geen donkere plekken meer zichtbaar zijn.