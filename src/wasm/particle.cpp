#include "particle.h"

Particle::Particle(Vec3 _pos)
{
  pos = _pos;
}

void Particle::update(float dt)
{
  vel += force / dens * dt;
  pos += vel * dt;
  force.zero();
  dens = 0;
  press = 0;
}

void Particle::addForce(Vec3 f)
{
  force += f;
}
