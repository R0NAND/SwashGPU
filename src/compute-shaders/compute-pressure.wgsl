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
  n: i32,
  gravity: vec3<f32>,
};


@group(0) @binding(0) var<uniform> sim_params: SimParams;
@group(0) @binding(1) var<storage, read_write> particles: array<Particle>;
@compute @workgroup_size(256)
fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
  for(var i = 0; i < sim_params.n; i = i + 1){
    var dx: vec3<f32> = particles[global_id.x].position - particles[i].position;
    var r2: f32 = dot(dx, dx);
    if(r2 < sim_params.kernel_r2){
      var dist: f32 = sqrt(r2);
      particles[global_id.x].density += sim_params.k_poly_6 * pow(sim_params.kernel_r2 - r2, 3.0);
    }
  }
  particles[global_id.x].density *= sim_params.mass;
  particles[global_id.x].pressure = sim_params.stiffness * (particles[global_id.x].density - sim_params.rest_density);
}