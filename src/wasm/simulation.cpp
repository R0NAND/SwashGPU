#define _USE_MATH_DEFINES
#include "simulation.h"
#include <emscripten/emscripten.h>
#include <iostream>

Simulation::Simulation()
{
  kernel_r = 1.5f;
  k_poly_6 = 315.0f / (64.0f * M_PI * pow(kernel_r, 9));
  k_spiky = 15.0f / (M_PI * pow(kernel_r, 6));
  k_visc = 45.0f / (M_PI * pow(kernel_r, 6));
  bounds[0] = Vec3{0.0f, 0.0f, 0.0f};
  bounds[1] = Vec3{10.0f, 10.0f, 10.0f};
  gravity = Vec3{0.0f, -2.0f, 0.0f};
  for (int x = 0; x < 5; ++x)
  {
    for (int y = 0; y < 7; ++y)
    {
      for (int z = 0; z < 5; ++z)
      {
        particles.emplace_back(Vec3{0.5f + x * 1.3f, 0.5f + y * 1.3f, 0.5f + z * 1.3f}, 1, 0.2, 1000.0f, 0.01f);
      }
    }
  }
  search_grid = SearchGrid(bounds, kernel_r);
};

void Simulation::update(float dt)
{
  search_grid.grid_map.clear();
  for (auto &pi : particles)
  {
    search_grid.insert(pi);
  }

  // calculate density and pressure
  for (auto &pi : particles)
  {
    std::vector<Particle *> neighbors = search_grid.getNeighbors(pi);
    for (auto *pj : search_grid.getNeighbors(pi))
    {
      if (abs(pi.pos.x - pj->pos.x) < kernel_r && abs(pi.pos.y - pj->pos.y) < kernel_r && abs(pi.pos.z - pj->pos.z) < kernel_r)
      {
        if ((pi.pos - pj->pos).len2() < kernel_r * kernel_r)
        {
          float r2 = (pi.pos - pj->pos).len2();
          pi.dens += pj->mass * k_poly_6 * pow(kernel_r * kernel_r - r2, 3);
        }
      }
      pi.press = pi.c * (pi.dens - pi.restDens);
    }
  }

  // calculate forces
  for (auto &pi : particles)
  {
    for (auto *pj : search_grid.getNeighbors(pi))
    {
      if (abs(pi.pos.x - pj->pos.x) < kernel_r && abs(pi.pos.y - pj->pos.y) < kernel_r && abs(pi.pos.z - pj->pos.z) < kernel_r)
      {
        if ((pi.pos - pj->pos).len2() < kernel_r * kernel_r)
        {
          if (&pi != pj)
          {
            Vec3 ij = pi.pos - pj->pos;
            float r = ij.len();
            if (&pi < pj)
            {
              // pressure
              float avg_press = (pi.press + pj->press) / 2.0f;
              float common_term = (avg_press / pi.dens) * k_spiky * pow(kernel_r - r, 3);
              float f_press_i = pj->mass * common_term;
              float f_press_j = pi.mass * common_term;
              pi.addForce((ij / r) * f_press_i);
              pj->addForce((ij / r) * -f_press_j);

              // viscosity
              Vec3 vel_ij = pi.vel - pj->vel;
              Vec3 common_vec = vel_ij * (k_visc * (kernel_r - r));
              Vec3 f_visc_i = common_vec * -1.0f * pi.visc / pj->mass / pj->dens;
              Vec3 f_visc_j = common_vec * pj->visc / pi.mass / pi.dens;
              pi.addForce(f_visc_i);
              pj->addForce(f_visc_j);
            }
          }
        }
      }
    }
  }

  for (auto &pi : particles)
  {
    pi.addForce(gravity);
    //  std::cout << "gravity added";
    //  std::cout << pi.acc.y << std::endl;
    pi.update(dt);
    if (pi.pos.y <= bounds[0].y)
    {
      pi.pos.y = bounds[0].y + 0.001;
      pi.vel.y = pi.vel.y * -0.5;
    }
    if (pi.pos.x <= bounds[0].x)
    {
      pi.pos.x = bounds[0].x + 0.001;
      pi.vel.x = pi.vel.x * -0.5;
    }
    if (pi.pos.z <= bounds[0].z)
    {
      pi.pos.z = bounds[0].z + 0.001;
      pi.vel.z = pi.vel.z * -0.5;
    }
    if (pi.pos.x >= bounds[1].x)
    {
      pi.pos.x = bounds[1].x - 0.001;
      pi.vel.x = pi.vel.x * -0.5;
    }
    if (pi.pos.z >= bounds[1].z)
    {
      pi.pos.z = bounds[1].z - 0.001;
      pi.vel.z = pi.vel.z * -0.5;
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
