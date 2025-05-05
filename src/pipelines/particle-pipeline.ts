import { createStepParticleBindGroupLayout } from "../bind-group-layouts/step-particle-layout";
import particleShader from "../compute-shaders/step-particle.wgsl";

export const createParticlePipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [createStepParticleBindGroupLayout(device)],
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
