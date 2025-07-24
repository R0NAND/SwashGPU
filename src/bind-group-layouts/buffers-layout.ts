export const createReadBufferBindGroupLayout = (
  device: GPUDevice,
  buffers: string[]
) => {
  return device.createBindGroupLayout({
    entries: buffers.map((buffer, index) => ({
      binding: index,
      visibility: GPUShaderStage.COMPUTE,
      buffer: { type: buffer },
    })),
  });
};
