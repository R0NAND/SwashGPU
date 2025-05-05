@group(0) @binding(0)
var<uniform> modelViewProj: mat4x4<f32>;

@vertex fn main(@location(0) position: vec3<f32>) -> @builtin(position) vec4<f32> 
{
  return modelViewProj * vec4(position, 1.0);
}