#pragma once
#include <vector>
#include "particle.h"
#include "search_grid.h"

struct Simulation
{
  Simulation();
  Vec3 bounds[2];
  float kernel_r;
  std::vector<Particle> particles;
  SearchGrid search_grid;
  Vec3 gravity;

  float k_poly_6;
  float k_spiky;
  float k_visc;

  void update(float dt);
};