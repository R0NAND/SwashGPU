struct VertexInput {
  @location(0) offset: vec2<f32>,          // [-1,1] quad vertex
  @location(1) center: vec3<f32>,          // particle center
};

struct VSOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) localOffset: vec2<f32>,     // pass to fragment
};

@group(0) @binding(0) var<uniform> mvp: mat4x4<f32>;

@vertex fn vs_main(input: VertexInput) -> VSOutput {
  var out: VSOutput;

  // Size of particle in screen space
  let radius = 5.0; // you can make this a uniform later
  let right = vec3<f32>(1.0, 0.0, 0.0); // screen-space right
  let up    = vec3<f32>(0.0, 1.0, 0.0); // screen-space up

  let worldPos = input.center +
                 right * input.offset.x * radius +
                 up * input.offset.y * radius;

  out.position = mvp * vec4(worldPos, 1.0);
  out.localOffset = input.offset;

  return out;
}
