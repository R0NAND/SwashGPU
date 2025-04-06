#pragma once
#include <unordered_map>
#include "particle.h"
#include <vector>

struct SearchGrid
{
  SearchGrid();
  SearchGrid(Vec3 _bounds, float _cell_size);
  float cell_size;
  Vec3 bounds;
  int n_cells_x;
  int n_cells_y;
  int n_cells_z;
  std::unordered_map<int, std::vector<Particle *>> grid_map;
  std::vector<Particle *> *arr_map;

  int getCell(const Vec3 &pos);
  void insert(Particle &ptcl);
  void clear();
  std::vector<std::vector<Particle *>> getNeighbors(const Particle &ptcl);
};