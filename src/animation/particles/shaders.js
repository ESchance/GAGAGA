// GLSL 着色器：单 Points + 单 ShaderMaterial 承载全部粒子
// 位置由 CPU（ParticleSystem）更新写入 buffer；shader 只负责点大小、颜色、发光与拖尾

export const particleVertexShader = `
attribute float aSize;
attribute float aPhase;
attribute vec3  aVelocity;
attribute vec3  aColor;

uniform float uTime;
uniform float uPixelRatio;
uniform float uTrailLen;   // >0 表示拖尾阶段（沿运动方向拉伸）

varying vec3  vColor;
varying float vAlpha;

void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float dist = max(-mv.z, 0.001);

  // 距离衰减：越近越大，产生穿越感
  float baseSize = aSize * uPixelRatio * (300.0 / dist);

  // 星光闪烁：按每粒子相位 + 时间正弦
  float twinkle = 0.75 + 0.25 * sin(uTime * 2.0 + aPhase);

  // 拖尾：沿运动方向拉长点精灵
  float velLen = length(aVelocity);
  float trailLen = uTrailLen * velLen * 18.0;

  gl_PointSize = baseSize * twinkle + trailLen;

  // 拖尾时顶点沿速度反向偏移，产生扫线感
  if (uTrailLen > 0.0 && velLen > 0.001) {
    mv.xyz -= normalize(aVelocity) * trailLen * 0.25;
  }

  vColor = aColor;
  vAlpha = twinkle;

  gl_Position = projectionMatrix * mv;
}
`

export const particleFragmentShader = `
varying vec3  vColor;
varying float vAlpha;

void main() {
  // 软圆点：中心亮、边缘柔化
  float d = length(gl_PointCoord - vec2(0.5));
  float alpha = smoothstep(0.5, 0.12, d);

  // 轻微中心高光
  float core = smoothstep(0.25, 0.0, d) * 0.6;

  gl_FragColor = vec4(vColor + core, alpha * vAlpha);
}
`
