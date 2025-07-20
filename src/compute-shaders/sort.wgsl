@group(0) @binding(0) var<uniform> counterpart_stride: u32;
@group(0) @binding(1) var<uniform> direction_stride: u32;
@group(1) @binding(0) var<storage, read> keys_read: array<u32>;
@group(1) @binding(1) var<storage, read> values_read: array<u32>;
@group(1) @binding(2) var<storage, read_write> keys_write: array<u32>;
@group(1) @binding(3) var<storage, read_write> values_write: array<u32>;
@compute @workgroup_size(256)
fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let direction = mod(global_id.x / counterpart_stride, 2u) == 0 ? 1 : -1;
  let counterpart = global_id.x + direction * counterpart_stride;
  let order = mod(global_id.x / direction_stride, 2u) == 0 ? 1 : -1;
  let operator = direction * order;

  keys_write[global_id.x] = operator == 1 ? 
    min(keys_read[global_id.x], keys_read[counterpart]) : 
    max(keys_read[global_id.x], keys_read[counterpart]);
  values_write[global_id.x] = operator == 1 ? 
    min(values_read[global_id.x], values_read[counterpart]) : 
    max(values_read[global_id.x], values_read[counterpart]);
}