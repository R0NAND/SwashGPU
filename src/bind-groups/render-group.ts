import { createRenderBindGroupLayout } from "../bind-group-layouts/render-layout";

export const createRenderBindGroup = (
  device: GPUDevice,
  view: GPUBuffer,
  projection: GPUBuffer
) => {
  return device.createBindGroup({
    layout: createRenderBindGroupLayout(device),
    entries: [
      {
        //view matrix
        binding: 0,
        resource: { buffer: view },
      },
      {
        //view matrix
        binding: 1,
        resource: { buffer: projection },
      },
    ],
  });
};
