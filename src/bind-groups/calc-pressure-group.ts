import { createCalcPressureBindGroupLayout } from "../bind-group-layouts/calc-pressure-layout";

export const createCalcPressureBindGroup = (
  device: GPUDevice,
  params: GPUBuffer,
  position: GPUBuffer,
  velocity: GPUBuffer,
  density: GPUBuffer,
  pressure: GPUBuffer
) => {
  return device.createBindGroup({
    layout: createCalcPressureBindGroupLayout(device),
    entries: [
      {
        //params
        binding: 0,
        resource: { buffer: params },
      },
      {
        //positions
        binding: 1,
        resource: { buffer: position },
      },
      {
        //velocities
        binding: 2,
        resource: { buffer: velocity },
      },
      {
        //density
        binding: 3,
        resource: { buffer: density },
      },
      {
        //pressure
        binding: 4,
        resource: { buffer: pressure },
      },
    ],
  });
};
