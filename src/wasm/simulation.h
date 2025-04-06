#pragma once
#include <vector>
#include "particle.h"
#include "search_grid.h"

struct Simulation
{
  Simulation(float _kernel_r = 1.5f, float _mass = 1.0f, float _visc = 0.05f, float _repulse = 100.0f, float _restDens = 0.05f, float _st = 100.0f);
  Vec3 bounds;
  float kernel_r;
  float kernel_r2;
  float mass;
  float visc;
  float repulsion;
  float restDens;
  float st; // surface tension
  std::vector<Particle> particles;
  SearchGrid search_grid;
  Vec3 gravity;

  float k_poly_6;
  float k_lap_poly_6;
  float k_spiky;
  float k_visc;

  void update(float dt);
};