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
    particles[global_id.x].velocity += sim_params.dt * particles[global_id.x].net_force / particles[global_id.x].density;
    particles[global_id.x].velocity += sim_params.dt * sim_params.gravity;
    particles[global_id.x].position += particles[global_id.x].velocity;
    if particles[global_id.x].position.y < 0.0 {
      particles[global_id.x].position.y = 0.0;
      particles[global_id.x].velocity.y *= -0.95;
    }
    if particles[global_id.x].position.x < 0.0 {
      particles[global_id.x].position.x = 0.0;
      particles[global_id.x].velocity.x *= -0.95;
    }
    if particles[global_id.x].position.x > 100.0 {
      particles[global_id.x].position.x = 100.0;
      particles[global_id.x].velocity.x *= -0.95;
    }
    if particles[global_id.x].position.z < 0.0 {
      particles[global_id.x].position.z = 0.0;
      particles[global_id.x].velocity.z *= -0.95;
    }
    if particles[global_id.x].position.z > 100.0 {
      particles[global_id.x].position.z = 100.0;
      particles[global_id.x].velocity.z *= -0.95;
    }
    particles[global_id.x].net_force = vec3(0.0, 0.0, 0.0);
    particles[global_id.x].density = 0.0;
    particles[global_id.x].pressure = 0.0;
  }