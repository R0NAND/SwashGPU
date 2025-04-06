#pragma once
#include <math.h>
#include "vec3.h"
struct Particle
{
  Particle(Vec3 _pos);
  Vec3 pos;
  Vec3 vel;
  Vec3 acc;
  float dens;
  float press;
  void addForce(Vec3 f);
  void update(float dt);
};
