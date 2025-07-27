export async function debugUint32Buffer(
  device: GPUDevice,
  source: GPUBuffer,
  size: number // in bytes
): Promise<Uint32Array> {
  const readBuffer = device.createBuffer({
    size,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  const encoder = device.createCommandEncoder();
  encoder.copyBufferToBuffer(source, 0, readBuffer, 0, size);
  device.queue.submit([encoder.finish()]);

  await readBuffer.mapAsync(GPUMapMode.READ);
  const arrayBuffer = readBuffer.getMappedRange();
  const copy = new Uint32Array(arrayBuffer.slice());
  readBuffer.unmap();
  readBuffer.destroy();
  return copy;
}

export async function debugFloat32Buffer(
  device: GPUDevice,
  source: GPUBuffer,
  size: number // in bytes
): Promise<Float32Array> {
  const readBuffer = device.createBuffer({
    size,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  const encoder = device.createCommandEncoder();
  encoder.copyBufferToBuffer(source, 0, readBuffer, 0, size);
  device.queue.submit([encoder.finish()]);

  await readBuffer.mapAsync(GPUMapMode.READ);
  const arrayBuffer = readBuffer.getMappedRange();
  const copy = new Float32Array(arrayBuffer.slice());
  readBuffer.unmap();
  readBuffer.destroy();
  return copy;
}
