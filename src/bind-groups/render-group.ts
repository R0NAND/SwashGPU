import { createRenderBindGroupLayout } from "../bind-group-layouts/render-layout";

export const createRenderBindGroup = (device: GPUDevice, mvp: GPUBuffer) => {
  return device.createBindGroup({
    layout: createRenderBindGroupLayout(device),
    entries: [
      {
        //position
        binding: 0,
        resource: { buffer: mvp },
      },
    ],
  });
};
