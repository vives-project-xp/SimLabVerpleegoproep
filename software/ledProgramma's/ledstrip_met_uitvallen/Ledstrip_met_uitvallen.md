# Ledstrip met uitvallen

Deze code is gebaseerd op `ledstrip.ino`.

Toegevoegd:
- Na het opstarten en verbinden met Zigbee blijft de ledstrip 3 seconden groen.
- Na 1 uur zonder activiteit gaat de ESP32 in deep sleep.
- Daarna valt de powerbank automatisch uit.

Om de ledstrip opnieuw te gebruiken, moet je de powerbank opnieuw inschakelen.