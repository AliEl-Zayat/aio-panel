import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseFileVolume, parseStlVolume } from "./parse-volume";

function createMinimalBinaryStl(): ArrayBuffer {
  // Binary STL: 80-byte header + 4-byte triangle count (1) + 50 bytes per triangle
  const buffer = new ArrayBuffer(134);
  const view = new DataView(buffer);
  // Header: 80 bytes (zeros)
  for (let i = 0; i < 80; i++) {
    view.setUint8(i, 0);
  }
  view.setUint32(80, 1, true); // 1 triangle, little-endian
  // Triangle: normal (0,0,0) at 84, vertices at 96, 108, 120
  let offset = 84;
  view.setFloat32(offset, 0, true);
  offset += 4;
  view.setFloat32(offset, 0, true);
  offset += 4;
  view.setFloat32(offset, 0, true);
  offset += 4; // 96
  // v0 (1,0,0) v1 (0,1,0) v2 (0,0,1) → tetrahedron volume 1/6 mm³
  view.setFloat32(offset, 1, true);
  offset += 4;
  view.setFloat32(offset, 0, true);
  offset += 4;
  view.setFloat32(offset, 0, true);
  offset += 4; // 108
  view.setFloat32(offset, 0, true);
  offset += 4;
  view.setFloat32(offset, 1, true);
  offset += 4;
  view.setFloat32(offset, 0, true);
  offset += 4; // 120
  view.setFloat32(offset, 0, true);
  offset += 4;
  view.setFloat32(offset, 0, true);
  offset += 4;
  view.setFloat32(offset, 1, true);
  offset += 4;
  view.setUint16(offset, 0, true); // attribute
  return buffer;
}

describe("print-calculator parse-volume", () => {
  describe("parseStlVolume", () => {
    it("returns volume in cm³ for minimal binary STL", async () => {
      const buffer = createMinimalBinaryStl();
      const volumeCm3 = await parseStlVolume(buffer);
      expect(volumeCm3).toBeGreaterThan(0);
      // Triangle (0,0,0), (1,0,0), (0,1,1) has signed volume 1/6 mm³ → cm³ = 1/6000
      expect(volumeCm3).toBeCloseTo(1 / 6000, 10);
    });
  });

  describe("parseFileVolume", () => {
    it("dispatches by .stl extension and returns volumeCm3", async () => {
      const buffer = createMinimalBinaryStl();
      const file = new File([buffer], "model.stl", {
        type: "application/vnd.ms-pki.stl",
      });
      const result = await parseFileVolume(file);
      expect(result).toEqual({ volumeCm3: expect.any(Number) });
      expect(result.volumeCm3).toBeGreaterThan(0);
    });

    it("throws for unsupported extension", async () => {
      const file = new File([new ArrayBuffer(0)], "model.obj", {
        type: "application/octet-stream",
      });
      await expect(parseFileVolume(file)).rejects.toThrow(
        /Unsupported or invalid file/
      );
    });
  });
});
