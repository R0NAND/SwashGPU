struct VertexInput {
  @location(0) offset: vec2<f32>,          // [-1,1] quad vertex
  @location(1) center: vec3<f32>,          // particle center
};

struct VSOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) localOffset: vec2<f32>,     // pass to fragment
  @location(1) velocity: f32,
};

@group(0) @binding(0) var<uniform> viewMatrix : mat4x4<f32>;
@group(0) @binding(1) var<uniform> projectionMatrix : mat4x4<f32>;

@vertex fn vs_main(
  @location(0) offset: vec2<f32>,
  @location(1) center: vec3<f32>,
  @location(2) velocity: vec3<f32>,
) -> VSOutput {
  // Step 1: transform to view space
  let viewCenter = viewMatrix * vec4(center, 1.0);

  // Step 2: apply offset in view space (aligned to screen X/Y)
  let size = 5.0; // use a uniform for radius if needed
  let viewOffset = vec4(offset * size, 0.0, 0.0);
  let viewPos = viewCenter + viewOffset;

  // Step 3: project to clip space
  let clipPos = projectionMatrix * viewPos;

  var out: VSOutput;
  out.position = clipPos;
  out.localOffset = offset;
  out.velocity = length(velocity);
  return out;
}