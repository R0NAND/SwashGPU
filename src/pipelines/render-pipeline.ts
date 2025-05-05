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
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: 2 * 4, // vec2<f32> = 2 * 4 bytes
          attributes: [
            {
              shaderLocation: 0, // @location(0) for offset
              offset: 0,
              format: "float32x2",
            },
          ],
        },
        {
          arrayStride: 4 * 4, // vec3<f32> = 3 * 4 bytes
          stepMode: "instance", // This is important!
          attributes: [
            {
              shaderLocation: 1, // @location(1) for center
              offset: 0,
              format: "float32x3",
            },
          ],
        },
      ],
    },
    fragment: {
      module: device.createShaderModule({
        code: fragmentShader,
      }),
      entryPoint: "fs_main",
      targets: [
        {
          format: format, // e.g. "bgra8unorm"
        },
      ],
    },
    primitive: {
      topology: "triangle-list",
    },
  });
};
