#include "particle.h"

Particle::Particle(Vec3 _pos, float _mass, float _visc, float _c, float _restDens)
{
  pos = _pos;
  mass = _mass;
  visc = _visc;
  c = _c;
  restDens = _restDens;
}

void Particle::update(float dt)
{
  vel += acc * dt;
  pos += vel * dt;
  acc.zero();
  dens = 0;
  press = 0;
}

void Particle::addForce(Vec3 f)
{
  acc += f / dens;
}
