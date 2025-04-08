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
  bounds = Vec3{15.0f, 15.0f, 15.0f};
  gravity = Vec3{0.0f, -1.0f, 0.0f};
  for (int x = 0; x < 8; ++x)
  {
    for (int y = 0; y < 8; ++y)
    {
      for (int z = 0; z < 8; ++z)
      {
        pos[x + y * 8 + z * 8 * 8] = Vec3{2.5f + x * 0.7f, 2.5f + y * 0.7f, 2.5f + z * 0.7f};
      }
    }
  }
  search_grid = SearchGrid(bounds, kernel_r);
};

void Simulation::update(float dt)
{
  search_grid.clear();
  for (int i = 0; i < n; ++i)
  {
    search_grid.insert(pos[i], i);
  }

  // // calculate density and pressure
  for (int i = 0; i < n; ++i)
  {
    int n_neighbors = 0;
    for (const auto &cell : search_grid.getNeighbors(pos[i]))
    {
      for (auto &j : cell)
      {
        float r2 = (pos[i] - pos[j]).len2();
        if (r2 < kernel_r2)
        {
          n_neighbors++;
          density[i] += k_poly_6 * pow(kernel_r2 - r2, 3);
        }
      }
    }
    density[i] *= mass;
    pressure[i] = repulsion * (density[i] - restDens);
  }

  // calculate forces
  for (int i = 0; i < n; ++i)
  {
    for (const auto &cell : search_grid.getNeighbors(pos[i]))
    {
      for (auto &j : cell)
      {
        if (i < j)
        {
          float r2 = (pos[i] - pos[j]).len2();
          if (r2 < kernel_r2)
          {
            Vec3 ij = pos[i] - pos[j];
            float r = sqrt(r2);
            float delta_r = kernel_r - r;

            // pressure
            float avg_press = (pressure[i] + pressure[j]) / 2.0f;
            float common_term = mass * avg_press * k_spiky * pow(delta_r, 2);
            Vec3 normalized_dir = ij / r;
            force[i] += normalized_dir * common_term / density[j];
            force[j] += normalized_dir * -common_term / density[i];

            // viscosity
            Vec3 vel_ij = vel[i] - vel[j];
            Vec3 common_term_visc = vel_ij * visc * mass * k_visc * delta_r; // TODO: THis is wrong!
            force[i] += common_term_visc * -1.0f / density[j];
            force[j] += common_term_visc / density[j];

            // Surface tension
            float n = mass * k_poly_6 * pow((kernel_r2 - r2), 2);
            common_term = st * (mass / density[i]) * k_lap_poly_6 * (kernel_r2 - r2) * (3 * kernel_r2 - r2) * n / std::abs(n);
            force[i] += normalized_dir * -common_term / density[j];
            force[j] += normalized_dir * common_term / density[i];
          }
        }
      }
    }
  }

  for (int i = 0; i < n; ++i)
  {
    vel[i] += gravity * dt;
    vel[i] += force[i] / density[i] * dt;
    pos[i] += vel[i] * dt;
    force[i].x = 0;
    force[i].y = 0;
    force[i].z = 0;
    density[i] = 0;
    pressure[i] = 0;
    Vec3 pos_rel = pos[i] - Vec3{5.0f, 5.0f, 5.0f};
    if (pos_rel.len2() > 25)
    {
      pos[i] = pos_rel * 5 / pos_rel.len() + Vec3{5.0f, 5.0f, 5.0f};
      Vec3 normal = (pos[i] - Vec3{5.0f, 5.0f, 5.0f}) / 5;
      vel[i] = (vel[i] - normal * (vel[i].x * normal.x + vel[i].y * normal.y + vel[i].z * normal.z) * 2);
    }
  }
}

#ifdef __cplusplus
#define EXTERN extern "C"
#else
#define EXTERN
#endif

EXTERN EMSCRIPTEN_KEEPALIVE Vec3 *updateSim(Simulation *s)
{
  s->update(0.0166666666f);
  return s->pos;
}

EXTERN EMSCRIPTEN_KEEPALIVE Simulation *initializeSim(float _kernel_r, float _mass, float _visc, float _repulse, float _restDens, float _st)
{
  Simulation *sim = new Simulation(_kernel_r, _mass, _visc, _repulse, _restDens, _st);
  return sim;
}
