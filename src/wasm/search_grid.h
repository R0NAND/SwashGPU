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
  Vec3 offsets[27] = {
      {-1, -1, -1}, {-1, -1, 0}, {-1, -1, 1}, {-1, 0, -1}, {-1, 0, 0}, {-1, 0, 1}, {-1, 1, -1}, {-1, 1, 0}, {-1, 1, 1}, {0, -1, -1}, {0, -1, 0}, {0, -1, 1}, {0, 0, -1}, {0, 0, 0}, {0, 0, 1}, {0, 1, -1}, {0, 1, 0}, {0, 1, 1}, {1, -1, -1}, {1, -1, 0}, {1, -1, 1}, {1, 0, -1}, {1, 0, 0}, {1, 0, 1}, {1, 1, -1}, {1, 1, 0}, {1, 1, 1}};
  std::vector<std::vector<int>> grid_map;

  int getCell(const Vec3 &pos);
  void insert(const Vec3 &pos, int index);
  void clear();
  std::vector<std::vector<int>> getNeighbors(const Particle &ptcl);
};