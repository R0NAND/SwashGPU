import { createMainBindGroupLayout } from "../bind-group-layouts/main-layout";

export const createMainBindGroup = (
  device: GPUDevice,
  params: GPUBuffer,
  particles: GPUBuffer
) => {
  return device.createBindGroup({
    layout: createMainBindGroupLayout(device),
    entries: [
      {
        binding: 0,
        resource: { buffer: params },
      },
      {
        binding: 1,
        resource: { buffer: particles },
      },
    ],
  });
};
