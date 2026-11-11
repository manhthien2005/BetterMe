// Colors enter in linear space; every fragment converts once to renderer output space.
export const SKY_VERTEX = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vDirection = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const SKY_FRAGMENT = /* glsl */ `
  uniform vec3 zenith, mid, horizon, glow, sunDirection;
  uniform float twilight, sunVisibility, aurora, time;
  varying vec3 vDirection;
  void main() {
    vec3 ray = normalize(vDirection);
    float height = max(0.0, ray.y);
    vec3 sky = mix(horizon, mid, smoothstep(0.0, 0.32, height));
    sky = mix(sky, zenith, smoothstep(0.25, 0.95, height));
    float facing = max(0.0, dot(ray, sunDirection));
    float warmBand = exp(-height * 4.0) * pow(facing, 3.0);
    sky = mix(sky, glow, (warmBand * twilight * 0.48 + pow(facing, 28.0) * 0.12) * sunVisibility);
    // A restrained northern veil, analytic and seamless around the dome.
    float ribbonY = 0.38 + 0.055*sin(ray.x*9.0 + time*0.025) + 0.025*sin(ray.x*21.0);
    float ribbon = exp(-pow((ray.y-ribbonY)/0.045, 2.0));
    ribbon += 0.35 * exp(-pow((ray.y-ribbonY-0.065)/0.08, 2.0));
    float north = smoothstep(0.05, 0.65, -ray.z);
    vec3 veil = mix(vec3(0.18,0.52,0.45), vec3(0.29,0.2,0.55), smoothstep(0.32,0.57,ray.y));
    sky += veil * ribbon * north * aurora;
    gl_FragColor = vec4(sky, 1.0);
    #include <colorspace_fragment>
  }
`;

export const CARD_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const CLOUD_FRAGMENT = /* glsl */ `
  uniform sampler2D cloudMap;
  uniform vec3 body, lightColor, shadowColor, haze;
  uniform float opacity, skyBlend, sunFacing;
  varying vec2 vUv;
  void main() {
    vec4 shape = texture2D(cloudMap, vUv);
    float alpha = shape.a * opacity;
    if(alpha < 0.003) discard;
    float crown = smoothstep(0.28, 0.82, vUv.y);
    vec3 color = mix(shadowColor, body, 0.3 + 0.58*shape.g + 0.12*crown);
    float rim = shape.b * (0.24 + 0.48*sunFacing);
    color = mix(color, lightColor, clamp(rim + crown*0.27, 0.0, 0.9));
    color = mix(color, haze, skyBlend);
    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
  }
`;

export const STAR_VERTEX = /* glsl */ `
  attribute float size, brightness, amplitude, frequency, phase;
  uniform float time, pixelRatio;
  varying float vBrightness;
  void main() {
    vBrightness = brightness * (1.0 - amplitude*0.5 + amplitude*0.5*sin(time*frequency + phase));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = max(1.5, size*1.7) * pixelRatio;
  }
`;

export const STAR_FRAGMENT = /* glsl */ `
  uniform float opacity;
  uniform vec3 starColor;
  varying float vBrightness;
  void main() {
    float radius = length(gl_PointCoord-0.5)*2.0;
    float alpha = (1.0-smoothstep(0.0,1.0,radius))*vBrightness*opacity;
    gl_FragColor = vec4(starColor, alpha);
    #include <colorspace_fragment>
  }
`;

export const GLOW_FRAGMENT = /* glsl */ `
  uniform vec3 color;
  uniform float opacity;
  varying vec2 vUv;
  void main() {
    float r = length(vUv-0.5)*2.0;
    float glow = exp(-r*r*9.0)*(1.0-smoothstep(0.65,1.0,r));
    gl_FragColor = vec4(color, glow*opacity);
    #include <colorspace_fragment>
  }
`;
