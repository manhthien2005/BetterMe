import { DataTexture, LinearFilter, LinearMipmapLinearFilter, RGBAFormat } from "three";
import { FANTASY_CLOUD_SHAPES, sampleFantasyCloudDensity, type FantasyCloudShapeId } from "@/lib/world/fantasy-sky-assets";

function noise(x: number, y: number): number {
  const hash = (a: number, b: number) => {
    const value = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return value - Math.floor(value);
  };
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy) * (1 - sx) + hash(ix + 1, iy) * sx;
  const b = hash(ix, iy + 1) * (1 - sx) + hash(ix + 1, iy + 1) * sx;
  return a * (1 - sy) + b * sy;
}

/** Bake organic edge/detail once; cloud fragments need only one texture sample. */
export function createFantasyCloudTextures(): Record<FantasyCloudShapeId, DataTexture> {
  const entries = Object.entries(FANTASY_CLOUD_SHAPES).map(([id, shape]) => {
    const width = 256, height = 256;
    const pixels = new Uint8Array(width * height * 4);
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const x = px / (width - 1) * 2 - 1, y = py / (height - 1) * 2 - 1;
        const detail = noise(x * 19 + 31, y * 19 + 13) * 0.65 + noise(x * 43, y * 43) * 0.35;
        const warpX = (noise(x * 9, y * 9) - 0.5) * 0.075;
        const warpY = (noise(x * 11 + 5, y * 11) - 0.5) * 0.07;
        const density = sampleFantasyCloudDensity(shape, x + warpX, y + warpY);
        const above = sampleFantasyCloudDensity(shape, x + warpX - 0.018, y + warpY + 0.035);
        const alpha = Math.max(0, Math.min(1, (density - 0.025) * 3.5));
        const smoothAlpha = alpha * alpha * (3 - 2 * alpha);
        const illumination = Math.max(0, Math.min(1, 0.48 + (density - above) * 3.8 + (detail - 0.5) * 0.28));
        const rim = Math.max(0, Math.min(1, (density - above) * 6));
        const offset = (py * width + px) * 4;
        pixels[offset] = Math.round(density * 255);
        pixels[offset + 1] = Math.round(illumination * 255);
        pixels[offset + 2] = Math.round(rim * 255);
        pixels[offset + 3] = Math.round(smoothAlpha * 255);
      }
    }
    const texture = new DataTexture(pixels, width, height, RGBAFormat);
    texture.name = `fantasy-cloud-${id}`;
    texture.generateMipmaps = true;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.magFilter = LinearFilter;
    texture.needsUpdate = true;
    return [id, texture];
  });
  return Object.fromEntries(entries) as Record<FantasyCloudShapeId, DataTexture>;
}
