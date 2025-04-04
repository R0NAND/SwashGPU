#include "search_grid.h"
#include <iostream>

SearchGrid::SearchGrid()
{
  bounds[0] = Vec3{0, 0, 0};
  bounds[1] = Vec3{0, 0, 0};
  cell_size = 0;
  n_cells_x = 0;
  n_cells_y = 0;
  n_cells_z = 0;
}

SearchGrid::SearchGrid(Vec3 _bounds[2], float _cell_size)
{
  bounds[0] = _bounds[0];
  bounds[1] = _bounds[1];
  cell_size = _cell_size;
  n_cells_x = ceil((bounds[1].x - bounds[0].x) / cell_size);
  n_cells_y = ceil((bounds[1].y - bounds[0].y) / cell_size);
  n_cells_z = ceil((bounds[1].z - bounds[0].z) / cell_size);
}

int SearchGrid::getCell(const Vec3 &pos)
{
  Vec3 pos_rel = pos - bounds[0];

  return (floor(pos_rel.x / cell_size) +
          floor(pos_rel.y / cell_size) * n_cells_x +
          floor(pos_rel.z / cell_size) * n_cells_x * n_cells_y);
}

void SearchGrid::insert(Particle &ptcl)
{
  grid_map[getCell(ptcl.pos)].push_back(&ptcl);
}

std::vector<Particle *> SearchGrid::getNeighbors(const Particle &ptcl)
{
  std::vector<Particle *> neighbors;
  int starting_cell = getCell(ptcl.pos);
  for (int dx = -1; dx <= 1; ++dx)
  {
    for (int dy = -1; dy <= 1; ++dy)
    {
      for (int dz = -1; dz <= 1; ++dz)
      {
        int key = getCell(ptcl.pos + Vec3{
                                         dx * cell_size, dy * cell_size, dz * cell_size});
        if (grid_map.count(key))
        {
          neighbors.insert(neighbors.end(), grid_map[key].begin(), grid_map[key].end());
        }
      }
    }
  }
  return neighbors;
}
