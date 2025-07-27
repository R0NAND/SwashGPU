struct VertexInput {
  @location(0) offset: vec2<f32>,          
  @location(1) center: vec3<f32>,          
};

struct VSOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) localOffset: vec2<f32>,     
  @location(1) velocity: f32,
};

@group(0) @binding(0) var<uniform> viewMatrix : mat4x4<f32>;
@group(0) @binding(1) var<uniform> projectionMatrix : mat4x4<f32>;

@vertex fn vs_main(
  @location(0) offset: vec2<f32>,
  @location(1) center: vec3<f32>,
  @location(2) velocity: vec3<f32>,
) -> VSOutput {
  let viewCenter = viewMatrix * vec4(center, 1.0);

  let size = 5.0;
  let viewOffset = vec4(offset * size, 0.0, 0.0);
  let viewPos = viewCenter + viewOffset;

  let clipPos = projectionMatrix * viewPos;

  var out: VSOutput;
  out.position = clipPos;
  out.localOffset = offset;
  out.velocity = length(velocity);
  return out;
}