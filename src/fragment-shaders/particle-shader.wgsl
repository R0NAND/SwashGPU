@fragment fn fs_main(@location(0) localOffset: vec2<f32>, @location(1) velocity: f32) -> @location(0) vec4<f32> {
  let dist = length(localOffset);

  if (dist > 1.0) {
    discard;
  }

  let shading = 1.0 - dist;
  return vec4(shading * 0.7 * velocity, shading * 0.75, shading * 1.0, 1.0); 
}