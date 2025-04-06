#define _USE_MATH_DEFINES
#include "simulation.h"
#include <emscripten/emscripten.h>
#include <iostream>

Simulation::Simulation(float _kernel_r, float _mass, float _visc, float _repulse, float _restDens, float _st)
{
  kernel_r = _kernel_r;
  kernel_r2 = kernel_r * kernel_r;
  mass = _mass;
  visc = _visc;
  st = _st;
  repulsion = _repulse;
  restDens = _restDens;
  k_poly_6 = 315.0f / (64.0f * M_PI * pow(kernel_r, 9));
  k_lap_poly_6 = 945.0f / (32.0f * M_PI * pow(kernel_r, 9));
  k_spiky = 45.0f / (M_PI * pow(kernel_r, 6));
  k_visc = 45.0f / (M_PI * pow(kernel_r, 6));
  bounds = Vec3{10.0f, 10.0f, 10.0f};
  gravity = Vec3{0.0f, -2.0f, 0.0f};
  for (int x = 0; x < 6; ++x)
  {
    for (int y = 0; y < 9; ++y)
    {
      for (int z = 0; z < 6; ++z)
      {
        particles.emplace_back(Vec3{0.5f + x * 1.0f, 1.5f + y * 1.0f, 0.5f + z * 1.0f});
      }
    }
  }
  search_grid = SearchGrid(bounds, kernel_r);
};

void Simulation::update(float dt)
{
  search_grid.clear();
  for (auto &pi : particles)
  {
    search_grid.insert(pi);
  }

  // calculate density and pressure
  for (auto &pi : particles)
  {
    for (const auto &group : search_grid.getNeighbors(pi))
    {
      for (auto *pj : group)
      {
        float r2 = (pi.pos - pj->pos).len2();
        if (r2 < kernel_r2)
        {
          pi.dens += k_poly_6 * pow(kernel_r2 - r2, 3);
        }
      }
    }
    pi.dens *= mass;
    pi.press = repulsion * (pi.dens - restDens);
  }

  // calculate forces
  for (auto &pi : particles)
  {
    for (const auto &group : search_grid.getNeighbors(pi))
    {
      for (auto *pj : group)
      {
        if (&pi < pj)
        {
          float r2 = (pi.pos - pj->pos).len2();
          if (r2 < kernel_r2)
          {
            Vec3 ij = pi.pos - pj->pos;
            float r = sqrt(r2);
            float delta_r = kernel_r - r;

            // pressure
            float avg_press = (pi.press + pj->press) / 2.0f;
            float f_press_i = mass * (avg_press / pi.dens) * k_spiky * pow(delta_r, 2);
            Vec3 normalized_dir = ij / r;
            pi.addForce(normalized_dir * f_press_i);
            pj->addForce(normalized_dir * -f_press_i);

            // viscosity
            Vec3 vel_ij = pi.vel - pj->vel;
            Vec3 f_visc = vel_ij * (k_visc * (delta_r)) * visc / mass / pj->dens;
            pi.addForce(f_visc * -1.0f);
            pj->addForce(f_visc);

            // Surface tension
            float n = mass / pi.dens * k_poly_6 * pow((kernel_r2 - r2), 2);
            float surface_force = st * (mass / pi.dens) * k_lap_poly_6 * (kernel_r2 - r2) * (3 * kernel_r2 - r2) * n / std::abs(n);
            pi.addForce(normalized_dir * -surface_force);
            pj->addForce(normalized_dir * surface_force);
          }
        }
      }
    }
  }

  for (auto &pi : particles)
  {
    pi.addForce(gravity);
    pi.update(dt);
    if (pi.pos.x <= 0)
    {
      pi.pos.x = 0;
      pi.vel.x = pi.vel.x * -0.5;
    }
    if (pi.pos.y <= 0)
    {
      pi.pos.y = 0;
      pi.vel.y = pi.vel.y * -0.5;
    }
    if (pi.pos.z <= 0)
    {
      pi.pos.z = 0;
      pi.vel.z = pi.vel.z * -0.5;
    }
    if (pi.pos.x >= bounds.x)
    {
      pi.pos.x = bounds.x;
      pi.vel.x = pi.vel.x * -0.5;
    }
    if (pi.pos.y >= bounds.y)
    {
      pi.pos.y = bounds.y;
      pi.vel.y = pi.vel.y * -0.5;
    }
    if (pi.pos.z >= bounds.z)
    {
      pi.pos.z = bounds.z;
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

EXTERN EMSCRIPTEN_KEEPALIVE Simulation *initializeSim(float _kernel_r, float _mass, float _visc, float _repulse, float _restDens, float _st)
{
  Simulation *sim = new Simulation(_kernel_r, _mass, _visc, _repulse, _restDens, _st);
  return sim;
}
