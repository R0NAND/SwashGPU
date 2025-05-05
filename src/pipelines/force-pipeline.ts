import { createCalcForceBindGroupLayout } from "../bind-group-layouts/calc-force-layout";
import forceShader from "../compute-shaders/compute-force.wgsl";

export const createForcePipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [createCalcForceBindGroupLayout(device)],
    }),
    compute: {
      module: device.createShaderModule({
        label: "Force Shader",
        code: forceShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
