import {
  ACESFilmicToneMapping,
  Clock,
  Color,
  CubeTextureLoader,
  GridHelper,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Plane,
  PlaneBufferGeometry,
  Raycaster,
  RepeatWrapping,
  Scene,
  sRGBEncoding,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "../engine/three/OrbitControls";
import Stats from "three/examples/jsm/libs/stats.module";
import { TransformControls } from "../engine/three/TransformControls";
import ThreeDNode from "./ThreeDNode";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";

export default class Viewport {
  scene: Scene;
  renderer: WebGLRenderer;
  camera: PerspectiveCamera;

  nodes: ThreeDNode[] = [];
  selectedNodes: ThreeDNode[] = [];

  orbitControls: OrbitControls;
  transformControls: TransformControls;

  grid: GridHelper;
  gridPlane: Plane = new Plane(new Vector3(0, 1, 0), 0);

  raycaster: Raycaster = new Raycaster();
  pointer: Vector2 = new Vector2();

  gridPlanePointerIntersect = new Vector3();

  width: number;
  height: number;
  private fixed: boolean = false;

  private dragging: boolean = false;
  private dragStartPoint: Vector3 = new Vector3();
  private dragNodesInitPos: Vector3[] = [];

  private stats: Stats;

  wireMaterial = new LineMaterial({
    color: 0x4080ff,
    linewidth: 2,
  });

  //testing
  collisionWireMaterial = new LineMaterial({
    color: 0xff0000,
    linewidth: 2,
  });

  constructor(props: {
    canvas: HTMLCanvasElement;
    width?: number;
    height?: number;
    stats?: any;
  }) {
    const { canvas, width, height, stats } = props;

    this.stats = stats;

    this.scene = new Scene();
    this.renderer = new WebGLRenderer({
      canvas,
      // antialias: true,
    });

    this.renderer.outputEncoding = sRGBEncoding;
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = ACESFilmicToneMapping;

    this.width = width || window.innerWidth;
    this.height = height || window.innerHeight;
    if (width && height) {
      this.fixed = true;
    }
    this.wireMaterial.resolution.set(this.width, this.height);
    this.collisionWireMaterial.resolution.set(this.width, this.height);

    this.camera = new PerspectiveCamera(45, this.width / this.height, 0.1, 600);

    this.camera.position.set(5, 5, 5);

    this.scene.add(this.camera);

    canvas.addEventListener(
      "mousemove",
      (e) => {
        this.pointer.x = (e.clientX / this.width) * 2 - 1;
        this.pointer.y = -(e.clientY / this.height) * 2 + 1;
      },
      false
    );

    this.orbitControls = new OrbitControls(this.camera, canvas);
    this.orbitControls.listenToKeyEvents(canvas);
    this.orbitControls.panSpeed = 2;
    this.orbitControls.screenSpacePanning = false;
    this.orbitControls.keyPanSpeed = 50;
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.075;

    this.transformControls = new TransformControls(this.camera, canvas);

    this.transformControls.addEventListener("dragging-changed", (e) => {
      this.orbitControls.enabled = !e.value;
      this.selectedNodes.forEach((n) => {
        n.updateBoundingBox();
      });
    });

    this.scene.add(this.transformControls);

    canvas.addEventListener("click", (e) => {
      if (!this.nodes.some((n) => n.isRayCasted)) {
        this.nodes.forEach((n) => {
          n.setSelected(false);
        });
        this.selectedNodes = [];
      }
      this.nodes.forEach((n) => {
        if (n.isRayCasted) {
          if (this.selectedNodes.length >= 1) {
            if (e.shiftKey) {
              if (!n.isSelected) {
                this.selectedNodes.push(n);
                n.setSelected(true);
              } else {
                this.selectedNodes = this.selectedNodes.filter(
                  (sn) => sn !== n
                );
                n.setSelected(false);
              }
            } else {
              if (this.selectedNodes.length === 1) {
                this.selectedNodes[0].setSelected(false);
                this.selectedNodes = [n];
                n.setSelected(true);
              }
            }
          } else {
            if (!n.isSelected) {
              this.selectedNodes.push(n);
            }
            n.setSelected(true);
          }
        }
      });
    });

    canvas.addEventListener("mousedown", (e) => {
      if (
        this.selectedNodes.length > 0 &&
        this.selectedNodes.some((n) => n.isRayCasted)
      ) {
        this.dragging = true;
        this.orbitControls.enabled = false;

        this.raycaster.ray.intersectPlane(this.gridPlane, this.dragStartPoint);

        this.dragNodesInitPos = this.selectedNodes.map((n) =>
          n.object.position.clone()
        );
      }
    });

    canvas.addEventListener("mousemove", () => {
      this.raycaster.ray.intersectPlane(
        this.gridPlane,
        this.gridPlanePointerIntersect
      );

      if (this.dragging && !this.transformControls.dragging) {
        const diff = new Vector3().subVectors(
          this.gridPlanePointerIntersect,
          this.dragStartPoint
        );

        this.selectedNodes.forEach((node, i) => {
          node.object.position.set(
            diff.x + this.dragNodesInitPos[i].x,
            diff.y + this.dragNodesInitPos[i].y,
            diff.z + this.dragNodesInitPos[i].z
          );

          node.updateBoundingBox();
          node.updateOBB();
        });
      }
    });

    canvas.addEventListener("mouseup", (e) => {
      this.dragging = false;
      this.orbitControls.enabled = true;
    });

    canvas.addEventListener("keydown", (e) => {
      if (this.selectedNodes.length > 0) {
        switch (e.code) {
          case "KeyR": {
            this.transformControls.setMode("rotate");
            //@ts-ignore
            this.transformControls.showX = false;
            //@ts-ignore
            this.transformControls.showZ = false;
            break;
          }
          case "KeyT": {
            this.transformControls.setMode("translate");
            //@ts-ignore
            this.transformControls.showX = true;
            //@ts-ignore
            this.transformControls.showZ = true;
            break;
          }
        }
      }
    });

    const hemiLight = new HemisphereLight(0xffeeb1, 0x080820, 4);
    this.scene.add(hemiLight);

    this.scene.background = new CubeTextureLoader().load([
      "/textures/sky/right.jpg",
      "/textures/sky/left.jpg",
      "/textures/sky/top.jpg",
      "/textures/sky/bottom.jpg",
      "/textures/sky/front.jpg",
      "/textures/sky/back.jpg",
    ]);

    const textureLoader = new TextureLoader();
    const texture = textureLoader.load("/textures/gp.png");
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(50, 50);
    const geo = new PlaneBufferGeometry(200, 200, 1, 1);
    this.grid = new GridHelper(200, 200);
    const ground = new Mesh(
      geo,
      new MeshBasicMaterial({
        color: new Color(0xcccccc),
      })
    );
    ground.receiveShadow = true;
    ground.position.y -= 0.02;
    ground.rotation.x -= Math.PI / 2;
    this.grid.position.y -= 0.001;
    this.scene.add(this.grid, ground);

    this.renderer.setSize(this.width, this.height);

    window.addEventListener("resize", () => {
      if (!this.fixed) {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.wireMaterial.resolution.set(this.width, this.height);
        this.collisionWireMaterial.resolution.set(this.width, this.height);

        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.width, this.height);
      }
    });
  }

  add(...nodes: ThreeDNode[]) {
    const objects = [];
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.object) {
        objects.push(node.object);
      }
    }

    this.nodes.push(...nodes);
    this.scene.add(...objects);
  }

  public enableTransformControls(node: ThreeDNode) {
    this.transformControls.attach(node.object);
  }

  public disableTransformControls() {
    this.transformControls.detach();
  }

  logNodes() {
    console.log(this.nodes);
  }

  render() {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    this.stats.update();

    this.orbitControls.update();

    this.nodes.forEach((n) => {
      const subsets: Mesh[] = [];
      n.object.traverse((o) => {
        //@ts-ignore
        if (!o.isLine2 && o.isMesh) {
          subsets.push(o as Mesh);
        }
      });
      const intersect = this.raycaster.intersectObjects([n.object], false);
      const subsetIntersect = this.raycaster.intersectObjects(subsets, false);
      if (intersect.length || subsetIntersect.length) {
        n.isRayCasted = true;
        if (!n.isSelected && !n.isHovered) {
          n.setHovered(true);
        }
      } else {
        n.isRayCasted = false;
        if (!n.isSelected && n.isHovered) {
          n.setHovered(false);
        }
      }
    });

    for (let i = 0, il = this.nodes.length; i < il; i++) {
      const node = this.nodes[i];
      const obb = node.obb;

      node.collisionList = this.nodes.filter((other, j) => {
        return i !== j && obb.intersectsOBB(other.obb);
      });
    }

//     this.nodes.forEach((node) => {
//       node.collisionWire.visible = node.collisionList.length > 0;
//     });

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
  }
}
