import { createCalcPressureBindGroupLayout } from "../bind-group-layouts/calc-pressure-layout";
import pressureShader from "../compute-shaders/compute-pressure.wgsl";

export const createPressurePipeline = (device: GPUDevice) => {
  return device.createComputePipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [createCalcPressureBindGroupLayout(device)],
    }),
    compute: {
      module: device.createShaderModule({
        label: "Pressure Shader",
        code: pressureShader,
      }),
      entryPoint: "computeMain",
    },
  });
};
