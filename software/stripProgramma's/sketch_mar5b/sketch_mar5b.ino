#include <Adafruit_NeoPixel.h>

#define LED_PIN     2
#define LED_COUNT   6

Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

void setup()
{
  strip.begin();
  strip.show();
}

void loop()
{
  colorWipe(strip.Color(255, 0, 0), 400);
  colorWipe(strip.Color(0, 255, 0), 400);
  colorWipe(strip.Color(0, 0, 255), 400);
}

void colorWipe(uint32_t color, int wait)
{
  for (int i = 0; i < strip.numPixels(); i++)
  {
    strip.setPixelColor(i, color);
    strip.show();
    delay(wait);
  }
}
