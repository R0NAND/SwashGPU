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
@group(0) @binding(1) var<uniform> ray_origin: vec3f;
@group(0) @binding(2) var<uniform> ray_dir: vec3f;
@group(0) @binding(3) var<storage, read_write> positions: array<vec3f>;
@group(0) @binding(4) var<storage, read_write> velocities: array<vec3f>;
@group(0) @binding(5) var<storage, read_write> forces: array<vec3f>;
@group(0) @binding(6) var<storage, read_write> densities: array<f32>;
@group(0) @binding(7) var<storage, read_write> pressures: array<f32>;
  @compute @workgroup_size(256)
  fn computeMain(@builtin(global_invocation_id) global_id: vec3<u32>) {
    let diff = positions[global_id.x] - ray_origin;
    let t = dot(diff, ray_dir);
    let closest = ray_origin + t * ray_dir;
    let distance = length(positions[global_id.x] - closest);

    if (distance < 20) { //TODO: Add this to sim params
      velocities[global_id.x] += sim_params.dt * vec3f(0.0f, 20.0f, 0.0f);
    }
    velocities[global_id.x] += sim_params.dt * sim_params.gravity;
    velocities[global_id.x] += sim_params.dt * forces[global_id.x] / densities[global_id.x];
    positions[global_id.x] += velocities[global_id.x];
    if positions[global_id.x].y < 0.0 {
      positions[global_id.x].y = 0.0;
      velocities[global_id.x].y *= -0.95;
    }
    if positions[global_id.x].y > sim_params.walls.y {
      positions[global_id.x].y = sim_params.walls.y;
      velocities[global_id.x].y *= -0.95;
    }
    if positions[global_id.x].x < 0.0 {
      positions[global_id.x].x = 0.0;
      velocities[global_id.x].x *= -0.95;
    }
    if positions[global_id.x].x > sim_params.walls.x {
      positions[global_id.x].x = sim_params.walls.x;
      velocities[global_id.x].x *= -0.95;
    }
    if positions[global_id.x].z < 0.0 {
      positions[global_id.x].z = 0.0;
      velocities[global_id.x].z *= -0.95;
    }
    if positions[global_id.x].z > sim_params.walls.z {
      positions[global_id.x].z = sim_params.walls.z;
      velocities[global_id.x].z *= -0.95;
    }
    forces[global_id.x] = vec3(0.0, 0.0, 0.0);
    densities[global_id.x] = 0.0;
    pressures[global_id.x] = 0.0;
  }