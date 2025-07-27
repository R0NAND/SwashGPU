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
@group(0) @binding(1) var<storage> cell_start: array<u32>;
@group(0) @binding(2) var<storage> cell_end: array<u32>;
@group(0) @binding(3) var<storage> positions: array<vec3f>;
@group(0) @binding(4) var<storage> velocities: array<vec3f>;
@group(0) @binding(5) var<storage> densities: array<f32>;
@group(0) @binding(6) var<storage> pressures: array<f32>;
@group(0) @binding(7) var<storage, read_write> forces: array<vec3f>;
@group(1) @binding(0) var<storage> particle_indices: array<u32>;
@compute @workgroup_size(256)
fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let cell_coords = vec3<i32>(i32(positions[global_id.x].x / sim_params.kernel_r), 
                      (i32(positions[global_id.x].y / sim_params.kernel_r)),
                      (i32(positions[global_id.x].z / sim_params.kernel_r))); 
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
          var dx = positions[global_id.x] - positions[particle_indices[i]];
          var r2 = dot(dx, dx);
          if(r2 < sim_params.kernel_r2 && r2 != 0){
            var r: f32 = sqrt(r2);
            var delta_r: f32 = sim_params.kernel_r - r;

            // pressure
            var avg_press: f32 = (pressures[global_id.x] + pressures[particle_indices[i]]) / 2.0f;
            var common_term: f32 = sim_params.mass * avg_press * sim_params.k_spiky * pow(delta_r, 2);
            var normalized_dir: vec3<f32> = dx / r;
            forces[global_id.x] += (common_term / densities[particle_indices[i]]) * normalized_dir;

            // viscosity
            var vel_ij: vec3<f32> = velocities[global_id.x] - velocities[particle_indices[i]];
            var common_term_visc: vec3<f32> = vel_ij * sim_params.viscosity * sim_params.mass * sim_params.k_visc * delta_r; // TODO: THis is wrong!
            forces[global_id.x] += common_term_visc * -1.0f /densities[particle_indices[i]];

            // surface tension
            var n: f32 = sim_params.mass * sim_params.k_poly_6 * pow((sim_params.kernel_r2 - r2), 2);
            var common_term_st: f32 = sim_params.surface_tension * (sim_params.mass / densities[global_id.x]) * sim_params.k_lap_poly_6 * (sim_params.kernel_r2 - r2) * (3 * sim_params.kernel_r2 - r2) * n / abs(n);
            forces[global_id.x] += normalized_dir * -common_term_st / densities[particle_indices[i]]; 
          }
        }
      }
    }
  } 
}