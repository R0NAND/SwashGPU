import { createSortStridesBindGroupLayout } from "../bind-group-layouts/sort-strides-layout";

export const createSortStridesBindGroup = (
  device: GPUDevice,
  counterpartStride: GPUBuffer,
  directionStride: GPUBuffer
) => {
  return device.createBindGroup({
    layout: createSortStridesBindGroupLayout(device),
    entries: [
      {
        binding: 0,
        resource: { buffer: counterpartStride },
      },
      {
        binding: 1,
        resource: { buffer: directionStride },
      },
    ],
  });
};
