// import "../style.css";
// import { createSortPipeline } from "./pipelines/sort-pipeline";
// import { createSortStridesBindGroup } from "./bind-groups/sort-strides-group";
// import { createSortBuffersBindGroup } from "./bind-groups/sort-buffers-group";

// const n = 16;

// const keys_in = new Uint32Array(n);
// const values_in = new Uint32Array(n);
// const arrOut = new Uint32Array(n);

// for (let i = 0; i < n; i++) {
//   keys_in[i] = n - i;
//   values_in[i] = n - i;
// }

// console.log("Initial array:", keys_in);

// if (!navigator.gpu) {
//   throw new Error("WebGPU not supported on this browser.");
// }

// const adapter = await navigator.gpu.requestAdapter();
// if (!adapter) {
//   throw new Error("No appropriate GPUAdapter found.");
// }

// const device = await adapter.requestDevice();

// const keyBufferA = device.createBuffer({
//   size: keys_in.byteLength,
//   usage:
//     GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
// });

// const keyBufferB = device.createBuffer({
//   size: keys_in.byteLength,
//   usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
// });

// const valueBufferA = device.createBuffer({
//   size: keys_in.byteLength,
//   usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
// });

// const valueBufferB = device.createBuffer({
//   size: keys_in.byteLength,
//   usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
// });

// const counterpartStrideBuffer = device.createBuffer({
//   size: 4,
//   usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
// });

// const directionStrideBuffer = device.createBuffer({
//   size: 4,
//   usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
// });

// const readBuffer = device.createBuffer({
//   size: keys_in.byteLength,
//   usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
// });

// device.queue.writeBuffer(keyBufferA, 0, keys_in);

// const sortBindGroups = [
//   createSortBuffersBindGroup(
//     device,
//     keyBufferA,
//     valueBufferA,
//     keyBufferB,
//     valueBufferB
//   ),
//   createSortBuffersBindGroup(
//     device,
//     keyBufferB,
//     valueBufferB,
//     keyBufferA,
//     valueBufferA
//   ),
// ];

// const sortStrideGroup = createSortStridesBindGroup(
//   device,
//   counterpartStrideBuffer,
//   directionStrideBuffer
// );

// const sortPipeline = createSortPipeline(device);

// const n_stages = Math.ceil(Math.log2(n));
// let bufferState = 0;
// let encoder = device.createCommandEncoder();
// for (let i = 1; i <= n_stages; i++) {
//   let direction_stride = new Uint32Array([Math.pow(2, i)]);
//   device.queue.writeBuffer(directionStrideBuffer, 0, direction_stride);
//   for (let j = 1; j <= i; j++) {
//     console.log("stage", i, "pass", j);
//     let counterpart_stride = new Uint32Array([Math.pow(2, i - j)]);
//     device.queue.writeBuffer(counterpartStrideBuffer, 0, counterpart_stride);
//     encoder = device.createCommandEncoder();
//     const pass = encoder.beginComputePass();
//     pass.setPipeline(sortPipeline);
//     pass.setBindGroup(0, sortStrideGroup);
//     pass.setBindGroup(1, sortBindGroups[bufferState]);
//     pass.dispatchWorkgroups(Math.ceil(n / 64));
//     pass.end();
//     if (bufferState === 0) {
//       bufferState = 1;
//       encoder.copyBufferToBuffer(
//         keyBufferB, // src
//         0, // srcOffset
//         readBuffer, // dst
//         0, // dstOffset
//         n * Uint32Array.BYTES_PER_ELEMENT // size
//       );
//       device.queue.submit([encoder.finish()]);
//       await readBuffer.mapAsync(GPUMapMode.READ);
//       const arrayBuffer = readBuffer.getMappedRange();
//       const data = new Uint32Array(arrayBuffer.slice());
//       console.log("Output data:", data);
//       readBuffer.unmap();
//     } else {
//       bufferState = 0;
//       encoder.copyBufferToBuffer(
//         keyBufferA, // src
//         0, // srcOffset
//         readBuffer, // dst
//         0, // dstOffset
//         n * Uint32Array.BYTES_PER_ELEMENT // size
//       );
//       device.queue.submit([encoder.finish()]);
//       await readBuffer.mapAsync(GPUMapMode.READ);
//       const arrayBuffer = readBuffer.getMappedRange();
//       const data = new Uint32Array(arrayBuffer.slice());
//       console.log("Output data:", data);
//       readBuffer.unmap();
//     }
//   }
// }
