const executeComputePass = (
  encoder: GPUCommandEncoder,
  pipeline: GPUComputePipeline,
  bindGroups: GPUBindGroup[],
  workgroupSize: number,
  n_threads: number
) => {
  const pass = encoder.beginComputePass();
  pass.setPipeline(pipeline);
  for (let i = 0; i < bindGroups.length; i++) {
    pass.setBindGroup(i, bindGroups[i]);
  }
  pass.dispatchWorkgroups(Math.ceil(n_threads / workgroupSize));
  pass.end();
};
