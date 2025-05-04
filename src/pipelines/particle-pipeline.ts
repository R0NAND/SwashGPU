import { createMainBindGroupLayout } from "../bind-group-layouts/main-layout";
import particleShader from "../compute-shaders/step-particle.wgsl";

export const createParticlePipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [createMainBindGroupLayout(device)],
    }),
    compute: {
      module: device.createShaderModule({
        label: "Particle Shader",
        code: particleShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
