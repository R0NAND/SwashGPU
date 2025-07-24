@group(0) @binding(0) var<uniform> counterpart_stride: u32;
@group(0) @binding(1) var<uniform> direction_stride: u32;
@group(1) @binding(0) var<storage, read> keys_read: array<u32>;
@group(1) @binding(1) var<storage, read> values_read: array<u32>;
@group(1) @binding(2) var<storage, read_write> keys_write: array<u32>;
@group(1) @binding(3) var<storage, read_write> values_write: array<u32>;
@compute @workgroup_size(256)
fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
  var direction: i32; 
  if((global_id.x / counterpart_stride) % 2 == 0){
    direction = 1;
  }else{
    direction = -1;
  };

  var order: i32;
  if((global_id.x / direction_stride) % 2 == 0){
    order = 1;
  }else{
    order = -1;
  }
  let counterpart = i32(global_id.x) + direction * i32(counterpart_stride);
  let comparator = direction * order;

  if (comparator == 1){
    keys_write[global_id.x] = min(keys_read[global_id.x], keys_read[counterpart]);
    values_write[global_id.x] = min(values_read[global_id.x], values_read[counterpart]);
  }else{ //else -1
    keys_write[global_id.x] = max(keys_read[global_id.x], keys_read[counterpart]);
    values_write[global_id.x] = max(values_read[global_id.x], values_read[counterpart]);
  }
  values_write[global_id.x] = 42;
  keys_write[global_id.x] = 42;
}
