#include "simulation.h"
#include <emscripten/emscripten.h>
#include <iostream>

Simulation::Simulation()
{
  bounds[0] = Vec3{0.0f, 0.0f, 0.0f};
  bounds[1] = Vec3{10.0f, 10.0f, 10.0f};
  kernel_r = 1;
  gravity = Vec3{0.0f, -1.0f, 0.0f};
  for (int x = 0; x < 10; ++x)
  {
    for (int y = 0; y < 10; ++y)
    {
      for (int z = 0; z < 10; ++z)
      {
        particles.emplace_back(Vec3{0.5f + x, 0.5f + y, 0.5f + z}, 1, 1, 1, 1);
      }
    }
  }
  search_grid = SearchGrid(bounds, kernel_r);
};

void Simulation::update(float dt)
{
  search_grid.grid_map.clear();
  for (int i = 0; i < particles.size(); i++)
  {
    search_grid.insert(particles[i]);
  }
  for (int i = 0; i < particles.size(); i++)
  {
    particles[i].addForce(gravity);
    particles[i].update(dt);
    if (particles[i].pos.y <= bounds[0].y)
    {
      particles[i].pos.y = bounds[0].y + 0.1;
      particles[i].vel.y = particles[i].vel.y * -0.5;
    }
    if (particles[i].pos.x <= bounds[0].x)
    {
      particles[i].pos.x = bounds[0].x + 0.1;
      particles[i].vel.x = particles[i].vel.x * -0.5;
    }
    if (particles[i].pos.z <= bounds[0].z)
    {
      particles[i].pos.z = bounds[0].z + 0.1;
      particles[i].vel.z = particles[i].vel.z * -0.5;
    }
    if (particles[i].pos.x >= bounds[1].x)
    {
      particles[i].pos.x = bounds[1].x - 0.1;
      particles[i].vel.x = particles[i].vel.x * -0.5;
    }
    if (particles[i].pos.z >= bounds[1].z)
    {
      particles[i].pos.z = bounds[1].z - 0.1;
      particles[i].vel.z = particles[i].vel.z * -0.5;
    }
  }
}

#ifdef __cplusplus
#define EXTERN extern "C"
#else
#define EXTERN
#endif

EXTERN EMSCRIPTEN_KEEPALIVE Particle *updateSim(Simulation *s)
{
  s->update(0.01666666);
  return s->particles.data();
}

EXTERN EMSCRIPTEN_KEEPALIVE Simulation *initializeSim()
{
  Simulation *sim = new Simulation();
  return sim;
}
