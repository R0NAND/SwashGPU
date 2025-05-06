import { createStepParticleBindGroupLayout } from "../bind-group-layouts/step-particle-layout";

export const createStepParticleBindGroup = (
  device: GPUDevice,
  params: GPUBuffer,
  rayOrigin: GPUBuffer,
  rayDir: GPUBuffer,
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
        resource: { buffer: rayOrigin },
      },
      {
        binding: 2,
        resource: { buffer: rayDir },
      },
      {
        binding: 3,
        resource: { buffer: position },
      },
      {
        binding: 4,
        resource: { buffer: velocity },
      },
      {
        binding: 5,
        resource: { buffer: force },
      },
      {
        binding: 6,
        resource: { buffer: density },
      },
      {
        binding: 7,
        resource: { buffer: pressure },
      },
    ],
  });
};
