import { createAssignCellBindGroupLayout } from "../bind-group-layouts/assign-cell-layout";

export const createAssignCellBindGroup = (
  device: GPUDevice,
  params: GPUBuffer,
  position: GPUBuffer,
  index: GPUBuffer,
  cell: GPUBuffer
) => {
  return device.createBindGroup({
    layout: createAssignCellBindGroupLayout(device),
    entries: [
      {
        binding: 0,
        resource: { buffer: params },
      },
      {
        binding: 1,
        resource: { buffer: position },
      },
      {
        binding: 2,
        resource: { buffer: index },
      },
      {
        binding: 3,
        resource: { buffer: cell },
      },
    ],
  });
};
