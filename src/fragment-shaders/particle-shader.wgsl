// @fragment fn fs_main() -> @location(0) vec4<f32> {
//   return vec4(0.3, 0.8, 1.0, 1.0);
// }

@fragment fn fs_main(@location(0) localOffset: vec2<f32>, @location(1) velocity: f32) -> @location(0) vec4<f32> {
  let dist = length(localOffset);

  if (dist > 1.0) {
    discard; // outside the circle
  }

  let shading = 1.0 - dist;
  return vec4(shading * 0.7 * velocity, shading * 0.75, shading * 1.0, 1.0); 
}