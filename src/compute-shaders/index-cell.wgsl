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
@group(0) @binding(1) var<storage, read_write> cell_start_index: array<u32>;
@group(0) @binding(2) var<storage, read_write> cell_end_index: array<u32>;
@group(1) @binding(0) var<storage> sorted_cells: array<u32>;
@compute @workgroup_size(256)
fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let cell_index = sorted_cells[global_id.x];
  if (global_id.x == 0){
    cell_start_index[cell_index] = 0;
    if (cell_index != sorted_cells[global_id.x + 1]) {
      cell_end_index[cell_index] = 1;
    }
    return;
  }

  if(global_id.x == sim_params.n - 1){
    cell_end_index[cell_index] = sim_params.n;
    if (cell_index != sorted_cells[global_id.x - 1]) {
      cell_start_index[cell_index] = sim_params.n - 1;
    }
    return;
  }

  if (cell_index != sorted_cells[global_id.x - 1]) {
    cell_start_index[cell_index] = global_id.x;
  }

  if (cell_index != sorted_cells[global_id.x + 1]) {
    cell_end_index[cell_index] = global_id.x + 1;
  }
}
