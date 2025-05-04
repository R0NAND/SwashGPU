import { createCalcPressureBindGroupLayout } from "../bind-group-layouts/calc-pressure-layout";

export const createMainBindGroup = (
  device: GPUDevice,
  params: GPUBuffer,
  position: GPUBuffer,
  density: GPUBuffer,
  pressure: GPUBuffer
) => {
  return device.createBindGroup({
    layout: createCalcPressureBindGroupLayout(device),
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
        resource: { buffer: density },
      },
      {
        binding: 3,
        resource: { buffer: pressure },
      },
    ],
  });
};
