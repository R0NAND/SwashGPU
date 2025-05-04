struct Particle {
  position: vec3<f32>,   // 4 floats
  velocity: vec3<f32>,   // 4 floats
  net_force: vec3<f32>,  // 4 floats
  color: vec3<f32>,    // 4 floats
  density: f32, // 2 floats
  pressure: f32
};

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
};


@group(0) @binding(0) var<uniform> sim_params: SimParams;
@group(0) @binding(1) var<storage, read_write> particles: array<Particle>;
@compute @workgroup_size(256)
fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
  for(var i: u32 = 0; i < sim_params.n; i = i + 1){
    var dx = particles[global_id.x].position - particles[i].position;
    var r2 = dot(dx, dx);
    if(r2 < sim_params.kernel_r2 && i != global_id.x){
      var r: f32 = sqrt(r2);
      var delta_r: f32 = sim_params.kernel_r - r;

      // pressure
      var avg_press: f32 = (particles[global_id.x].pressure + particles[i].pressure) / 2.0f;
      var common_term: f32 = sim_params.mass * avg_press * sim_params.k_spiky * pow(delta_r, 2);
      var normalized_dir: vec3<f32> = dx / r;
      particles[global_id.x].net_force += (common_term / particles[i].density) * normalized_dir;

      // viscosity
      var vel_ij: vec3<f32> = particles[global_id.x].velocity - particles[i].velocity;
      var common_term_visc: vec3<f32> = vel_ij * sim_params.viscosity * sim_params.mass * sim_params.k_visc * delta_r; // TODO: THis is wrong!
      particles[global_id.x].net_force += common_term_visc * -1.0f / particles[i].density;

      // surface tension
      var n: f32 = sim_params.mass * sim_params.k_poly_6 * pow((sim_params.kernel_r2 - r2), 2);
      var common_term_st: f32 = sim_params.surface_tension * (sim_params.mass / particles[global_id.x].density) * sim_params.k_lap_poly_6 * (sim_params.kernel_r2 - r2) * (3 * sim_params.kernel_r2 - r2) * n / abs(n);
      particles[global_id.x].net_force += normalized_dir * -common_term_st / particles[i].density; 
    }
  }
}