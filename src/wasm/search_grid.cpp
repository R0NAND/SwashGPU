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
  grid_map.resize(n_cells_x * n_cells_y * n_cells_z);
  for (auto &cell : grid_map)
  {
    cell.reserve(20);
  }
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
    grid_map[i].clear();
  }
}

void SearchGrid::insert(const Vec3 &pos, int index)
{
  grid_map[getCell(pos)].push_back(index);
}

std::vector<std::vector<int>> SearchGrid::getNeighbors(const Particle &ptcl)
{
  std::vector<std::vector<int>> neighbors;
  int starting_cell = getCell(ptcl.pos);
  for (auto &offset : offsets)
  {
    int key = getCell(ptcl.pos + offset * cell_size);
    if (key != -1)
    {
      std::vector<int> cell_indices = grid_map[key];
      if (cell_indices.size())
      {
        neighbors.push_back(grid_map[key]);
      }
    }
  }
  return neighbors;
}
