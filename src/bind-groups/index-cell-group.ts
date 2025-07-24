import { createIndexCellBindGroupLayout } from "../bind-group-layouts/index-cell-layout";

export const createIndexCellBindGroup = (
  device: GPUDevice,
  params: GPUBuffer,
  sorted_cells: GPUBuffer,
  cell_start_indices: GPUBuffer,
  cell_end_indices: GPUBuffer
) => {
  return device.createBindGroup({
    layout: createIndexCellBindGroupLayout(device),
    entries: [
      {
        binding: 0,
        resource: { buffer: params },
      },
      {
        binding: 1,
        resource: { buffer: sorted_cells },
      },
      {
        binding: 2,
        resource: { buffer: cell_start_indices },
      },
      {
        binding: 3,
        resource: { buffer: cell_end_indices },
      },
    ],
  });
};
