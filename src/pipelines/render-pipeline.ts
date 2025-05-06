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
          arrayStride: 8,
          attributes: [
            {
              shaderLocation: 0,
              offset: 0,
              format: "float32x2",
            },
          ],
        },
        {
          //position
          arrayStride: 16,
          stepMode: "instance",
          attributes: [
            {
              shaderLocation: 1,
              offset: 0,
              format: "float32x3",
            },
          ],
        },
        {
          //velocity
          arrayStride: 16,
          stepMode: "instance",
          attributes: [
            {
              shaderLocation: 2,
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
    depthStencil: {
      format: "depth24plus",
      depthWriteEnabled: true,
      depthCompare: "less", // nearer fragments win
    },
  });
};
