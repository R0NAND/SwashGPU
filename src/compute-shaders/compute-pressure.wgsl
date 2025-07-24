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
};


@group(0) @binding(0) var<uniform> sim_params: SimParams;
@group(0) @binding(1) var<storage> positions: array<vec3f>;
@group(0) @binding(2) var<storage> velocities: array<vec3f>;
@group(0) @binding(3) var<storage, read_write> densities: array<f32>;
@group(0) @binding(4) var<storage, read_write> pressures: array<f32>;
@compute @workgroup_size(256)
fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let predicted_pos = positions[global_id.x] + velocities[global_id.x] * sim_params.dt; // improves simulation stability
  for(var i = 0; i < sim_params.n; i = i + 1){
    var dx: vec3<f32> = predicted_pos - positions[i];
    var r2: f32 = dot(dx, dx);
    if(r2 < sim_params.kernel_r2){
      var dist: f32 = sqrt(r2);
      densities[global_id.x] += sim_params.k_poly_6 * pow(sim_params.kernel_r2 - r2, 3.0);
    }
  }
  densities[global_id.x] *= sim_params.mass;
  pressures[global_id.x] = sim_params.stiffness * (densities[global_id.x] - sim_params.rest_density);
}