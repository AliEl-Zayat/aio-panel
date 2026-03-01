declare module "three/examples/jsm/loaders/STLLoader.js" {
  import type { BufferGeometry } from "three";
  export class STLLoader {
    parse(data: ArrayBuffer): BufferGeometry;
  }
}

declare module "three/examples/jsm/loaders/3MFLoader.js" {
  import type { Group } from "three";
  export class ThreeMFLoader {
    parse(data: ArrayBuffer): Group;
  }
}
