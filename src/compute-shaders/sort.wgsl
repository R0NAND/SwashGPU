struct SimParams{
  dt: f32,
  kernel_r: f32,
  kernel_r2: f32,
  mass: f32,
  viscosity: f32,
  stiffness: f32,
  rest_density: f32,
  surface_tension: f32,
  k_poly_6: f32,
  k_lap_poly_6: f32,
  k_spiky: f32,
  k_visc: f32,
  n: u32,
  gravity: vec3<f32>,
  sim_cells: vec3<u32>,
  walls: vec3<f32>
};

@group(0) @binding(0) var<uniform> sim_params: SimParams;
@group(0) @binding(1) var<uniform> counterpart_stride: u32;
@group(0) @binding(2) var<uniform> direction_stride: u32;
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
  let counterpart = u32(i32(global_id.x) + direction * i32(counterpart_stride)) ;
  let comparator = direction * order;

  if ((comparator == 1 && keys_read[global_id.x] < keys_read[counterpart]) || 
    (comparator == -1 && keys_read[global_id.x] > keys_read[counterpart])) {
    keys_write[global_id.x] = keys_read[global_id.x];
    values_write[global_id.x] = values_read[global_id.x];
  } else {
    keys_write[global_id.x] = keys_read[counterpart];
    values_write[global_id.x] = values_read[counterpart];
  }
}
