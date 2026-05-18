#ifndef ZIGBEE_MODE_ED
#error "Zigbee end device mode is not selected in Tools->Zigbee mode"
#endif

#include "Zigbee.h"
#include <Adafruit_NeoPixel.h>
#include "esp_sleep.h"

/* Zigbee light bulb configuration */
#define ZIGBEE_LIGHT_ENDPOINT 10

#define LED_PIN 2
#define NUM_LEDS 12
Adafruit_NeoPixel strip(NUM_LEDS, LED_PIN, NEO_GRB + NEO_KHZ800);

uint8_t button = BOOT_PIN;

unsigned long lastActivityTime = 0;
const unsigned long sleepTimeout = 3600000; // 1h

// We gebruiken hier nu ZigbeeColorDimmableLight ipv ZigbeeLight
ZigbeeColorDimmableLight zbLight = ZigbeeColorDimmableLight(ZIGBEE_LIGHT_ENDPOINT);

/********************* RGB LED functions **************************/
// Callback voor als Home Assistant een nieuwe commando (kleur/helderheid/status) doorstuurt
void setLightAndColor(bool state, uint8_t red, uint8_t green, uint8_t blue, uint8_t level) {
  lastActivityTime = millis();

  if (state) {
    // Stel we gebruiken brightless/level
    strip.setBrightness(level);
    for(int i=0; i<strip.numPixels(); i++) {
        strip.setPixelColor(i, strip.Color(red, green, blue));
    }
  } else {
    // Zet alle LEDs uit
    strip.clear();
  }
  strip.show();
}

/********************* Arduino functions **************************/
void setup() {
  Serial.begin(115200);

  // Init LED strip
  strip.begin();
  strip.show();

  // Init button for factory reset
  pinMode(button, INPUT_PULLUP);

  //Optional: set Zigbee device name and model
  //zbLight.setManufacturerAndModel("Espressif", "Ledstrip");

  // Set callback function for light and color change
  zbLight.onLightChange(setLightAndColor);

  //Add endpoint to Zigbee Core
  Serial.println("Adding ZigbeeLight endpoint to Zigbee Core");
  Zigbee.addEndpoint(&zbLight);

  // When all EPs are registered, start Zigbee. By default acts as ZIGBEE_END_DEVICE
  if (!Zigbee.begin()) {
    Serial.println("Zigbee failed to start!");
    Serial.println("Rebooting...");
    ESP.restart();
  }

  Serial.println("Connecting to network");
  while (!Zigbee.connected()) {
    Serial.print(".");
    delay(100);
  }
  Serial.println();

  // Zigbee is verbonden: 3 seconden groen
  strip.setBrightness(100);
  for (int i = 0; i < strip.numPixels(); i++) {
    strip.setPixelColor(i, strip.Color(0, 255, 0));
  }
  strip.show();
  delay(3000);
  strip.clear();
  strip.show();

  lastActivityTime = millis();
}

void loop() {
  // Checking button for factory reset
  if (digitalRead(button) == LOW) {  // Push button pressed
    // Key debounce handling
    delay(100);
    lastActivityTime = millis();

    int startTime = millis();
    while (digitalRead(button) == LOW) {
      delay(50);
      if ((millis() - startTime) > 3000) {
        // If key pressed for more than 3secs, factory reset Zigbee and reboot
        Serial.println("Resetting Zigbee to factory and rebooting in 1s.");
        delay(1000);
        Zigbee.factoryReset();
      }
    }
    // Toggle light by pressing the button
    zbLight.setLightState(!zbLight.getLightState());
  }

  if (millis() - lastActivityTime > sleepTimeout) {
    Serial.println("No activity for 1 h. Going to deep sleep.");

    strip.clear();
    strip.show();

    delay(100);

    esp_deep_sleep_start();
  }

  delay(100);
}