import {
  AmbientLight,
  Camera,
  Color,
  GridHelper,
  HemisphereLight,
  Object3D,
  PerspectiveCamera,
  Plane,
  Raycaster,
  Scene,
  sRGBEncoding,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { DragControls } from "three/examples/jsm/controls/DragControls";
import TNode from "./TNode";

export default class Viewport {
  scene: Scene;
  renderer: WebGLRenderer;
  camera: Camera = new PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  objects: Object3D[] = [];
  nodes: TNode[] = [];
  dragControls: DragControls;
  orbitControls: OrbitControls;

  grid: GridHelper;
  gridPlane: Plane = new Plane(new Vector3(0, 1, 0), 0);

  raycaster: Raycaster = new Raycaster();
  pointer: Vector2 = new Vector2();

  gridPlanePointerIntersect = new Vector3();

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new Scene();
    this.renderer = new WebGLRenderer({
      canvas,
    });

    this.renderer.outputEncoding = sRGBEncoding;

    this.camera.position.set(5, 5, 5);

    window.addEventListener(
      "mousemove",
      (e) => {
        this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      },
      false
    );

    window.addEventListener("click", () => {
      this.nodes.forEach((n) => {
        n.isSelected = false;
      });
      this.nodes.forEach((n) => {
        if (n.isRayCasted) {
          n.isSelected = true;
        }
      });
    });

    this.scene.background = new Color(255, 255, 255);
    const hemiLight = new HemisphereLight(0xffeeb1, 0x080820, 4);
    this.scene.add(hemiLight);

    this.grid = new GridHelper(200, 200);
    this.scene.add(this.grid);

    this.orbitControls = new OrbitControls(this.camera, canvas);
    this.dragControls = new DragControls(this.objects, this.camera, canvas);

    this.dragControls.addEventListener("dragstart", () => {
      this.orbitControls.enabled = false;
    });

    this.dragControls.addEventListener("drag", (event) => {
      this.raycaster.ray.intersectPlane(
        this.gridPlane,
        this.gridPlanePointerIntersect
      );

      if (event.object.parent.isGroup) {
        event.object.parent.position.set(
          this.gridPlanePointerIntersect.x,
          this.gridPlanePointerIntersect.y,
          this.gridPlanePointerIntersect.z
        );
      } else {
        event.object.position.set(
          this.gridPlanePointerIntersect.x,
          this.gridPlanePointerIntersect.y,
          this.gridPlanePointerIntersect.z
        );
      }
    });

    this.dragControls.addEventListener("dragend", () => {
      this.orbitControls.enabled = true;
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.renderer.render(this.scene, this.camera);
  }

  add(...nodes: TNode[]) {
    const objects = [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.object) {
        objects.push(node.boudingGroup);
      }
    }
    this.objects.push(...objects);
    this.nodes.push(...nodes);
    this.scene.add(...objects);
  }

  render() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    this.renderer.render(this.scene, this.camera);
    this.nodes.forEach((n) => {
      if (n.boudingGroup) {
        const intersect = this.raycaster.intersectObjects([n.boudingGroup]);
        if (intersect.length) {
          n.isRayCasted = true;
          if (!n.isSelected && !n.isHovered) {
            n.isHovered = true;
          }
        } else {
          n.isRayCasted = false;
          if (!n.isSelected && n.isHovered) {
            n.isHovered = false;
          }
        }
      }
    });
    requestAnimationFrame(this.render.bind(this));
  }
}