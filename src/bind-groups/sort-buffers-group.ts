import { createSortBuffersBindGroupLayout } from "../bind-group-layouts/sort-buffers-layout";

export const createSortBuffersBindGroup = (
  device: GPUDevice,
  keysRead: GPUBuffer,
  keysWrite: GPUBuffer,
  valuesRead: GPUBuffer,
  valuesWrite: GPUBuffer
) => {
  return device.createBindGroup({
    layout: createSortBuffersBindGroupLayout(device),
    entries: [
      {
        binding: 0,
        resource: { buffer: keysRead },
      },
      {
        binding: 1,
        resource: { buffer: keysWrite },
      },
      {
        binding: 2,
        resource: { buffer: valuesRead },
      },
      {
        binding: 3,
        resource: { buffer: valuesWrite },
      },
    ],
  });
};
