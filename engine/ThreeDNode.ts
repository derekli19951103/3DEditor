import { extname } from "path";
import { Box3, LineSegments, Matrix4, Mesh, Vector3 } from "three";
import { Line2 } from "three/examples/jsm/lines/Line2";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { ThickWireframeGeometry } from "./utils/geometries";
import Viewport from "./Viewport";
import { OBB } from "three/examples/jsm/math/OBB";

export type ThreeDNodeType = "object" | "wall" | "floor" | "ceiling";
export default class ThreeDNode {
  viewport: Viewport;

  parent: ThreeDNode | undefined;
  children: ThreeDNode[] | undefined;

  object: Mesh;

  bbox: Box3;
  wire: Line2 = new Line2();
  obb: OBB;

  //testing
  collisionWire: Line2 = new Line2();

  collisionList: ThreeDNode[] = [];

  isRayCasted: boolean = false;
  private _isHovered: boolean = false;
  private _isSelected: boolean = false;

  type: ThreeDNodeType;

  constructor(
    viewport: Viewport,
    object?: Mesh,
    parent?: ThreeDNode,
    children?: ThreeDNode[]
  ) {
    this.parent = parent;
    this.children = children;
    this.object = object || new Mesh();
    this.viewport = viewport;
    this.type = "object";

    this.bbox = new Box3();
    this.obb = new OBB();

    if (object) {
      if (object.geometry.boundingBox) {
        this.bbox = object.geometry.boundingBox;
      } else {
        this.bbox = this.bbox.setFromObject(this.object);
      }
      this.calculateBoundingWireframe();
      this.updateOBB();
    }

    this.object.add(this.wire);
    this.object.add(this.collisionWire);
  }

  load(url: string) {
    return new Promise<void>((resolve, reject) => {
      let loader = null;

      const ext = extname(url).toLowerCase();

      switch (ext) {
        case ".gltf":
        case ".glb": {
          loader = new GLTFLoader();

          const dracoLoader = new DRACOLoader();
          dracoLoader.setDecoderPath("three/examples/js/libs/draco/gltf/");

          loader.setDRACOLoader(dracoLoader);
          break;
        }
      }
      if (loader) {
        loader.crossOrigin = "*";
        loader.load(
          url,
          (object) => {
            switch (ext) {
              case ".gltf":
              case ".glb":
                (object as GLTF).scene.traverse((child) => {
                  const pos = child.position;
                  const matrix = new Matrix4().makeTranslation(
                    -pos.x,
                    -pos.y,
                    -pos.z
                  );
                  child.applyMatrix4(matrix);
                });

                this.object.add(object.scene);

                break;
            }

            resolve();
          },
          (xhr) => {},
          (err) => {
            reject(err);
          }
        );
      }
    });
  }

  calculateBoundingWireframe() {
    const wireGeo = new LineGeometry().fromLineSegments(
      new LineSegments(ThickWireframeGeometry(this.bbox))
    );

    this.wire.geometry = wireGeo;
    this.wire.material = this.viewport.wireMaterial;

    this.wire.visible = false;

    // testing
    const wireGeoT = new LineGeometry().fromLineSegments(
      new LineSegments(ThickWireframeGeometry(this.bbox))
    );

    this.collisionWire.geometry = wireGeoT;
    this.collisionWire.material = this.viewport.collisionWireMaterial;

    this.collisionWire.visible = false;
  }

  calculateObjectWireFrame() {
    this.wire.geometry = new LineGeometry().fromMesh(this.object);

    this.wire.material = this.viewport.wireMaterial;

    this.wire.visible = false;
  }

  get isHovered() {
    return this._isHovered;
  }

  get isSelected() {
    return this._isSelected;
  }

  updateBoundingBox() {
    this.bbox = new Box3().setFromObject(this.object);
  }

  updateOBB() {
    this.obb = new OBB()
      .fromBox3(this.bbox)
      .applyMatrix4(this.object.matrixWorld);
  }

  setHovered(hovered: boolean) {
    this._isHovered = hovered;

    if (hovered === true) {
      this.wire.visible = true;
    } else {
      this.wire.visible = false;
    }
  }

  setSelected(selected: boolean) {
    this._isSelected = selected;

    if (selected === true) {
      this.wire.material.linewidth = 4;
      this.viewport.disableTransformControls();
      this.viewport.enableTransformControls(this);
    } else {
      this.wire.material.linewidth = 2;
      this.viewport.disableTransformControls();
    }
  }
}
