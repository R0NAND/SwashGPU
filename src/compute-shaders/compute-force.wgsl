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
};


@group(0) @binding(0) var<uniform> sim_params: SimParams;
@group(0) @binding(1) var<storage> positions: array<vec3f>;
@group(0) @binding(2) var<storage> velocities: array<vec3f>;
@group(0) @binding(3) var<storage> densities: array<f32>;
@group(0) @binding(4) var<storage> pressures: array<f32>;
@group(0) @binding(5) var<storage, read_write> forces: array<vec3f>;
@compute @workgroup_size(256)
fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
  for(var i: u32 = 0; i < sim_params.n; i = i + 1){
    var dx = positions[global_id.x] - positions[i];
    var r2 = dot(dx, dx);
    if(r2 < sim_params.kernel_r2 && i != global_id.x && r2 != 0){
      var r: f32 = sqrt(r2);
      var delta_r: f32 = sim_params.kernel_r - r;

      // pressure
      var avg_press: f32 = (pressures[global_id.x] + pressures[i]) / 2.0f;
      var common_term: f32 = sim_params.mass * avg_press * sim_params.k_spiky * pow(delta_r, 2);
      var normalized_dir: vec3<f32> = dx / r;
      if(r == 0){
        normalized_dir = vec3f(sin(f32(global_id.x)) * cos(f32(global_id.x)), cos(f32(global_id.x)), cos(f32(global_id.x)) * sin(f32(global_id.x)));//TODO: get better way
      }
      forces[global_id.x] += (common_term / densities[i]) * normalized_dir;

      // viscosity
      var vel_ij: vec3<f32> = velocities[global_id.x] - velocities[i];
      var common_term_visc: vec3<f32> = vel_ij * sim_params.viscosity * sim_params.mass * sim_params.k_visc * delta_r; // TODO: THis is wrong!
      forces[global_id.x] += common_term_visc * -1.0f /densities[i];

      // surface tension
      var n: f32 = sim_params.mass * sim_params.k_poly_6 * pow((sim_params.kernel_r2 - r2), 2);
      var common_term_st: f32 = sim_params.surface_tension * (sim_params.mass / densities[global_id.x]) * sim_params.k_lap_poly_6 * (sim_params.kernel_r2 - r2) * (3 * sim_params.kernel_r2 - r2) * n / abs(n);
      forces[global_id.x] += normalized_dir * -common_term_st / densities[i]; 
    }
  }
}