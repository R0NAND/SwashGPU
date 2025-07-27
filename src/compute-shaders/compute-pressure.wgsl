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
  n: i32,
  gravity: vec3<f32>,
  sim_cells: vec3<u32>,
  walls: vec3<f32>
};


@group(0) @binding(0) var<uniform> sim_params: SimParams;
@group(0) @binding(1) var<storage> cell_start: array<u32>;
@group(0) @binding(2) var<storage> cell_end: array<u32>;
@group(0) @binding(3) var<storage> positions: array<vec3f>;
@group(0) @binding(4) var<storage> velocities: array<vec3f>;
@group(0) @binding(5) var<storage, read_write> densities: array<f32>;
@group(0) @binding(6) var<storage, read_write> pressures: array<f32>;
@group(1) @binding(0) var<storage> particle_indices: array<u32>;
@compute @workgroup_size(256)
fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let cell_coords = vec3<i32>(i32(positions[global_id.x].x / sim_params.kernel_r), 
                      (i32(positions[global_id.x].y / sim_params.kernel_r)),
                      (i32(positions[global_id.x].z / sim_params.kernel_r))); 
  let predicted_pos = positions[global_id.x];// + velocities[global_id.x] * sim_params.dt; // improves simulation stability
  for(var x = -1; x <= 1; x = x + 1){
    for(var y = -1; y <= 1; y = y + 1){
      for(var z = -1; z <= 1; z = z + 1){
        let cell = cell_coords + vec3<i32>(x, y, z);
        if(cell.x < 0 || cell.y < 0 || cell.z < 0 ||
           cell.x >= i32(sim_params.sim_cells.x) || 
           cell.y >= i32(sim_params.sim_cells.y) || 
           cell.z >= i32(sim_params.sim_cells.z)) {
          continue; // Skip out of bounds cells
        }
        let cell_index = u32(cell.x) + u32(cell.y) * sim_params.sim_cells.x + u32(cell.z) * sim_params.sim_cells.x * sim_params.sim_cells.y;
        let start_index = cell_start[cell_index];
        let end_index = cell_end[cell_index];
        if(end_index == 0xFFFFFFFF){
          continue;
        }
        for(var i = start_index; i < end_index; i = i + 1){
          let dx: vec3<f32> = positions[particle_indices[i]] - predicted_pos;
          let r2: f32 = dot(dx, dx);
          if(r2 < sim_params.kernel_r2) {
            densities[global_id.x] += sim_params.k_poly_6 * pow(sim_params.kernel_r2 - r2, 3.0);
          }
        }
      }
    }
  } 
  densities[global_id.x] *= sim_params.mass;
  pressures[global_id.x] = sim_params.stiffness * (densities[global_id.x] - sim_params.rest_density);
}