#include "particle.h"

Particle::Particle(Vec3 _pos)
{
  pos = _pos;
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
