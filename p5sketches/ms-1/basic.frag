#ifdef GL_ES
precision highp float;
#endif

#define NUM_BLOBS 7

uniform vec2 u_resolution;
uniform float u_blobx[NUM_BLOBS];
uniform float u_bloby[NUM_BLOBS];

const float r = 0.07 / float(NUM_BLOBS);

float processBlob(vec2 blob, vec2 uv) {
  vec2 blob0_uv = blob.xy / u_resolution.xy;
  vec2 diff0 = uv.xy - blob0_uv.xy;
  float d0 = length(diff0);
  return 1.0 * r / d0;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;

  float sum = 0.0;

  for (int i = 0; i < NUM_BLOBS; i++) {
    sum += processBlob(vec2(u_blobx[i], u_bloby[i]), uv);
  }

  // 将 sum 的值映射为灰度或其他可视化颜色
  gl_FragColor = vec4(vec3(sum), 1.0);
}
