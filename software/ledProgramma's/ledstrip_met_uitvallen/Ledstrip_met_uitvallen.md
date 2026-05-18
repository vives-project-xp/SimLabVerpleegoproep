# Ledstrip met automatisch uitschakelen

Deze code is gebaseerd op `ledstrip.ino`.

## Wat is er toegevoegd?

- Na het opstarten en succesvol verbinden met Zigbee blijft de ledstrip 3 seconden groen als indicatie dat alles correct werkt.
- De code houdt bij wanneer de laatste activiteit gebeurt.
- Activiteit betekent:
  - een Zigbee-commando vanuit Home Assistant
  - of een druk op de knop
- Bij elke activiteit wordt de timer opnieuw gestart.
- Als er gedurende 1 uur geen activiteit is, gaat de ESP32 automatisch in deep sleep.
- Voor de ESP32 in deep sleep gaat, wordt de ledstrip volledig uitgeschakeld.
- Omdat de ESP32 daarna bijna geen stroom meer verbruikt, schakelt de powerbank zichzelf automatisch uit na ongeveer 30 seconden.

Om de ledstrip opnieuw te gebruiken, moet de powerbank opnieuw ingeschakeld worden.

---

## Timer voor geen activiteit

```cpp
unsigned long lastActivityTime = 0;
const unsigned long sleepTimeout = 3600000; // 1h
```

`lastActivityTime` houdt bij wanneer de laatste activiteit was.

`sleepTimeout` bepaalt hoelang de ESP32 mag aanblijven zonder activiteit.

Voorbeelden:

```cpp
const unsigned long sleepTimeout = 60000;   // 1 minuut
const unsigned long sleepTimeout = 300000;  // 5 minuten
const unsigned long sleepTimeout = 3600000; // 1 uur
```

Alles staat in milliseconden.

---

## Timer resetten bij Zigbee-activiteit

```cpp
lastActivityTime = millis();
```

Deze regel staat in `setLightAndColor()`.

Daardoor wordt de timer opnieuw gestart wanneer Home Assistant een commando naar de ledstrip stuurt.

---

## Groene indicatie na Zigbee-verbinding

```cpp
strip.setBrightness(100);

for (int i = 0; i < strip.numPixels(); i++) {
  strip.setPixelColor(i, strip.Color(0, 255, 0));
}

strip.show();

delay(3000);

strip.clear();
strip.show();
```

Als de ESP32 verbonden is met Zigbee, brandt de ledstrip 3 seconden groen.

Daarna wordt de ledstrip terug uitgezet.

---

## Timer resetten bij knopdruk

```cpp
lastActivityTime = millis();
```

Deze regel staat ook bij de knopcontrole.

Daardoor telt een knopdruk ook als activiteit.

---

## Deep sleep na 1 uur zonder activiteit

```cpp
if (millis() - lastActivityTime > sleepTimeout) {

  Serial.println("No activity for 1 h. Going to deep sleep.");

  strip.clear();
  strip.show();

  delay(100);

  esp_deep_sleep_start();
}
```

Deze code controleert of er langer dan `sleepTimeout` geen activiteit is geweest.

Als dat zo is:
- de ledstrip wordt uitgezet
- de ESP32 gaat in deep sleep
- de powerbank schakelt daarna vanzelf uit

---

## Opnieuw gebruiken

Om de ledstrip opnieuw te gebruiken, moet de powerbank opnieuw ingeschakeld worden.