#include "search_grid.h"
#include <iostream>

SearchGrid::SearchGrid()
{
  bounds = Vec3{0, 0, 0};
  cell_size = 0;
  n_cells_x = 0;
  n_cells_y = 0;
  n_cells_z = 0;
}

SearchGrid::SearchGrid(Vec3 _bounds, float _cell_size)
{
  bounds = _bounds;
  cell_size = _cell_size;
  n_cells_x = ceil((bounds.x) / cell_size);
  n_cells_y = ceil((bounds.y) / cell_size);
  n_cells_z = ceil((bounds.z) / cell_size);
  arr_map = new std::vector<Particle *>[n_cells_x * n_cells_y * n_cells_z];
}

int SearchGrid::getCell(const Vec3 &pos)
{
  if (pos.x < 0 || pos.x > bounds.x || pos.y < 0 || pos.y > bounds.y || pos.z < 0 || pos.z > bounds.z)
  {
    return -1;
  }
  else
  {
    return (floor(pos.x / cell_size) +
            floor(pos.y / cell_size) * n_cells_x +
            floor(pos.z / cell_size) * n_cells_x * n_cells_y);
  }
}

void SearchGrid::clear()
{
  for (int i = 0; i < n_cells_x * n_cells_y * n_cells_z; ++i)
  {
    arr_map[i].clear();
  }
}

void SearchGrid::insert(Particle &ptcl)
{
  // grid_map[getCell(ptcl.pos)].push_back(&ptcl);
  arr_map[getCell(ptcl.pos)].push_back(&ptcl);
}

std::vector<std::vector<Particle *>> SearchGrid::getNeighbors(const Particle &ptcl)
{
  std::vector<std::vector<Particle *>> neighbors;
  int starting_cell = getCell(ptcl.pos);
  for (int dx = -1; dx <= 1; ++dx)
  {
    for (int dy = -1; dy <= 1; ++dy)
    {
      for (int dz = -1; dz <= 1; ++dz)
      {
        int key = getCell(ptcl.pos + Vec3{
                                         dx * cell_size, dy * cell_size, dz * cell_size});
        if (key != -1 && arr_map[key].size())
        {
          neighbors.push_back(arr_map[key]);
        }
      }
    }
  }
  return neighbors;
}
