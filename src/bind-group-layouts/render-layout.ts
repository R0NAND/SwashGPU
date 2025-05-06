export const createRenderBindGroupLayout = (device: GPUDevice) => {
  return device.createBindGroupLayout({
    entries: [
      {
        //view matrix
        binding: 0,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" },
      },
      {
        //projection matrix
        binding: 1,
        visibility: GPUShaderStage.VERTEX,
        buffer: { type: "uniform" },
      },
    ],
  });
};
