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

@group(0) @binding(0) var<uniform> params: SimParams;
@group(0) @binding(1) var<storage> pos_buffer: array<vec3<f32>>;
@group(1) @binding(0) var<storage, read_write> index_buffer: array<u32>;
@group(1) @binding(1) var<storage, read_write> cell_buffer: array<u32>;
@compute @workgroup_size(256)
fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
  if (global_id.x < params.n) {
    let pos = pos_buffer[global_id.x];
    index_buffer[global_id.x] = global_id.x;
    cell_buffer[global_id.x] = u32(pos.x / params.kernel_r) +
                              u32(pos.y / params.kernel_r) * params.sim_cells.x +
                              u32(pos.z / params.kernel_r) * params.sim_cells.x * params.sim_cells.y;
  }else{
    index_buffer[global_id.x] = 0xFFFFFFFF;
    cell_buffer[global_id.x] = 0xFFFFFFFF; //TODO: check bounds
  }
}
