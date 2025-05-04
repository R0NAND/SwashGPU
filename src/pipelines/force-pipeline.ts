import { createMainBindGroupLayout } from "../bind-group-layouts/main-layout";
import forceShader from "../compute-shaders/compute-force.wgsl";

export const createForcePipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [createMainBindGroupLayout(device)],
    }),
    compute: {
      module: device.createShaderModule({
        label: "Particle Shader",
        code: forceShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
