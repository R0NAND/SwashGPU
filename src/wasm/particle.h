#pragma once
#include <math.h>
#include "vec3.h"
struct Particle
{
  Particle(Vec3 _pos, float _mass, float _visc, float _c, float _restDens);
  Vec3 pos;
  Vec3 vel;
  Vec3 acc;
  float mass;
  float visc;
  float dens;
  float avgDens;
  float press;
  float press0;
  float restDens;
  float c;
  float minDens;
  void addForce(Vec3 f);
  void update(float dt);
};
