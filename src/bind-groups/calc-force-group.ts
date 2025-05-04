import { createCalcForceBindGroupLayout } from "../bind-group-layouts/calc-force-layout";

export const createMainBindGroup = (
  device: GPUDevice,
  params: GPUBuffer,
  position: GPUBuffer,
  velocity: GPUBuffer,
  density: GPUBuffer,
  pressure: GPUBuffer,
  force: GPUBuffer
) => {
  return device.createBindGroup({
    layout: createCalcForceBindGroupLayout(device),
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
        resource: { buffer: velocity },
      },
      {
        binding: 3,
        resource: { buffer: density },
      },
      {
        binding: 4,
        resource: { buffer: pressure },
      },
      {
        binding: 5,
        resource: { buffer: force },
      },
    ],
  });
};
