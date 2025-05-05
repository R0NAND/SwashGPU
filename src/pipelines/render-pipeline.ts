import { createRenderBindGroupLayout } from "../bind-group-layouts/render-layout";
import vertexShader from "../vertex-shaders/mvp-shader.wgsl";
import fragmentShader from "../fragment-shaders/particle-shader.wgsl";

export const createRenderPipeline = (
  device: GPUDevice,
  format: GPUTextureFormat
) => {
  return device.createRenderPipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [createRenderBindGroupLayout(device)],
    }),
    vertex: {
      module: device.createShaderModule({
        code: vertexShader,
      }),
      entryPoint: "main",
      buffers: [
        {
          arrayStride: 16, // vec4<f32> (aligned to 16 bytes)
          attributes: [
            {
              shaderLocation: 0,
              offset: 0,
              format: "float32x3", // only using xyz
            },
          ],
        },
      ],
    },
    fragment: {
      module: device.createShaderModule({
        code: fragmentShader,
      }),
      entryPoint: "main",
      targets: [
        {
          format: format, // e.g. "bgra8unorm"
        },
      ],
    },
    primitive: {
      topology: "point-list",
    },
    depthStencil: undefined,
  });
};
