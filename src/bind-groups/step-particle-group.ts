import { createStepParticleBindGroupLayout } from "../bind-group-layouts/step-particle-layout";

export const createMainBindGroup = (
  device: GPUDevice,
  params: GPUBuffer,
  position: GPUBuffer,
  velocity: GPUBuffer,
  force: GPUBuffer,
  density: GPUBuffer,
  pressure: GPUBuffer
) => {
  return device.createBindGroup({
    layout: createStepParticleBindGroupLayout(device),
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
        resource: { buffer: force },
      },
      {
        binding: 4,
        resource: { buffer: density },
      },
      {
        binding: 5,
        resource: { buffer: pressure },
      },
    ],
  });
};
