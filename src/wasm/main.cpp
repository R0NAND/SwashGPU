#include <emscripten.h>
#include <vector>
extern "C"
{
  EMSCRIPTEN_KEEPALIVE
  int add(int a, int b)
  {
    printf("ayoooo");
    return a + b;
  }
}