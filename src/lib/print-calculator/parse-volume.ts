/**
 * Parse STL/3MF files and compute mesh volume (cm³).
 * Assumes file units are mm; volume is converted to cm³.
 */

import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";
import type { BufferGeometry } from "three";

/** Compute signed volume of a closed mesh (BufferGeometry) in cubic mm. */
function signedVolumeMm3(geometry: BufferGeometry): number {
  const pos = geometry.getAttribute("position");
  if (!pos || pos.count < 3) return 0;
  let sum = 0;
  for (let i = 0; i < pos.count; i += 3) {
    const x0 = pos.getX(i);
    const y0 = pos.getY(i);
    const z0 = pos.getZ(i);
    const x1 = pos.getX(i + 1);
    const y1 = pos.getY(i + 1);
    const z1 = pos.getZ(i + 1);
    const x2 = pos.getX(i + 2);
    const y2 = pos.getY(i + 2);
    const z2 = pos.getZ(i + 2);
    sum += signedVolumeOfTriangle(x0, y0, z0, x1, y1, z1, x2, y2, z2);
  }
  return Math.abs(sum);
}

function signedVolumeOfTriangle(
  x0: number,
  y0: number,
  z0: number,
  x1: number,
  y1: number,
  z1: number,
  x2: number,
  y2: number,
  z2: number
): number {
  return (x0 * (y1 * z2 - z1 * y2) + y0 * (z1 * x2 - x1 * z2) + z0 * (x1 * y2 - y1 * x2)) / 6;
}

/** mm³ to cm³ */
function mm3ToCm3(mm3: number): number {
  return mm3 / 1000;
}

/**
 * Parse binary or ASCII STL and return volume in cm³.
 */
export async function parseStlVolume(buffer: ArrayBuffer): Promise<number> {
  const loader = new STLLoader();
  const geometry = loader.parse(buffer);
  const mm3 = signedVolumeMm3(geometry);
  geometry.dispose();
  return mm3ToCm3(mm3);
}

/**
 * Parse 3MF and return total mesh volume in cm³.
 */
export async function parse3mfVolume(buffer: ArrayBuffer): Promise<number> {
  const loader = new ThreeMFLoader();
  const group = loader.parse(buffer);
  let totalMm3 = 0;
  group.traverse((obj) => {
    const mesh = obj as { geometry?: BufferGeometry };
    if (mesh.geometry) {
      totalMm3 += signedVolumeMm3(mesh.geometry);
    }
  });
  return mm3ToCm3(totalMm3);
}

export interface ParseFileVolumeResult {
  volumeCm3: number;
}

/**
 * Parse a file by extension (.stl or .3mf) and return volume in cm³.
 */
export async function parseFileVolume(
  file: File
): Promise<ParseFileVolumeResult> {
  const ext = file.name.toLowerCase().slice(-4);
  const buffer = await file.arrayBuffer();
  let volumeCm3: number;
  if (ext === ".stl") {
    volumeCm3 = await parseStlVolume(buffer);
  } else if (ext === ".3mf") {
    volumeCm3 = await parse3mfVolume(buffer);
  } else {
    throw new Error("Unsupported or invalid file. Use .stl or .3mf.");
  }
  return { volumeCm3 };
}
