/**
 * Render STL/3MF to a PNG image (white background; vertex/file colors or black).
 * Used when adding a print job to inventory as product image.
 */

import {
  Scene,
  OrthographicCamera,
  WebGLRenderer,
  Mesh,
  MeshBasicMaterial,
  Box3,
  Vector3,
  Color,
  AmbientLight,
  DirectionalLight,
  type BufferGeometry,
  type Group,
} from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";

const RENDER_SIZE = 512;
const WHITE = 0xffffff;
const BLACK = 0x000000;

function setupScene(): {
  scene: Scene;
  camera: OrthographicCamera;
  renderer: WebGLRenderer;
} {
  const scene = new Scene();
  const aspect = 1;
  const camera = new OrthographicCamera(
    -1,
    1,
    1,
    -1,
    0.1,
    1000
  );
  const canvas = document.createElement("canvas");
  canvas.width = RENDER_SIZE;
  canvas.height = RENDER_SIZE;
  const renderer = new WebGLRenderer({
    canvas,
    alpha: false,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setClearColor(WHITE, 1);
  renderer.setSize(RENDER_SIZE, RENDER_SIZE);
  return { scene, camera, renderer };
}

function fitCameraToObject(
  camera: OrthographicCamera,
  object: Scene | Group | Mesh,
  size: number
): void {
  const box = new Box3().setFromObject(object);
  const center = new Vector3();
  const dim = new Vector3();
  box.getCenter(center);
  box.getSize(dim);
  const maxDim = Math.max(dim.x, dim.y, dim.z, 0.001);
  const distance = maxDim * 1.5;
  camera.position.set(center.x + distance, center.y + distance, center.z + distance);
  camera.lookAt(center);
  const half = (maxDim / 2) * 1.2;
  camera.left = -half;
  camera.right = half;
  camera.top = half;
  camera.bottom = -half;
  camera.near = distance * 0.1;
  camera.far = distance * 3;
  camera.updateProjectionMatrix();
}

async function loadStlMesh(buffer: ArrayBuffer): Promise<Mesh> {
  const loader = new STLLoader();
  const geometry = loader.parse(buffer);
  const hasColors = "hasColors" in geometry && (geometry as BufferGeometry & { hasColors?: boolean }).hasColors;
  const material = new MeshBasicMaterial({
    vertexColors: hasColors,
    color: hasColors ? undefined : new Color(BLACK),
  });
  const mesh = new Mesh(geometry, material);
  return mesh;
}

async function load3mfGroup(buffer: ArrayBuffer): Promise<Group> {
  const loader = new ThreeMFLoader();
  const group = loader.parse(buffer);
  return group;
}

/**
 * Render STL or 3MF file to PNG blob; white background; uses file colors if present, else black.
 */
export async function renderModelToImageBlob(file: File): Promise<Blob> {
  const ext = file.name.toLowerCase().slice(-4);
  const buffer = await file.arrayBuffer();
  const { scene, camera, renderer } = setupScene();

  if (ext === ".stl") {
    const mesh = await loadStlMesh(buffer);
    scene.add(mesh);
    scene.add(new AmbientLight(0xffffff, 0.8));
    scene.add(new DirectionalLight(0xffffff, 0.6));
  } else if (ext === ".3mf") {
    const group = await load3mfGroup(buffer);
    scene.add(group);
    scene.add(new AmbientLight(0xffffff, 0.9));
    scene.add(new DirectionalLight(0xffffff, 0.7));
  } else {
    throw new Error("Unsupported file type for preview. Use .stl or .3mf.");
  }

  fitCameraToObject(camera, scene, RENDER_SIZE);
  renderer.render(scene, camera);

  return new Promise<Blob>((resolve, reject) => {
    renderer.domElement.toBlob(
      (blob) => {
        scene.traverse((obj) => {
          const m = obj as Mesh;
          if (m.geometry) m.geometry.dispose();
          if (m.material) {
            const mat = Array.isArray(m.material) ? m.material : [m.material];
            mat.forEach((mm) => mm.dispose());
          }
        });
        renderer.dispose();
        if (blob) resolve(blob);
        else reject(new Error("Failed to create image blob"));
      },
      "image/png",
      0.92
    );
  });
}
