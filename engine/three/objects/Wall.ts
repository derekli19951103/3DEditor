import {
  ExtrudeBufferGeometry,
  Mesh,
  MeshStandardMaterial,
  Shape,
  Vector3,
} from "three";
import ThreeDNode from "../../ThreeDNode";
import Viewport from "../../Viewport";

export const create3DWall = (
  viewport: Viewport,
  shape: Shape,
  height: number
) => {
  const geo = new ExtrudeBufferGeometry(shape, {
    steps: 1,
    depth: height,
    bevelEnabled: false,
  });

  const center = new Vector3();
  geo.computeBoundingBox();
  geo.boundingBox!.getCenter(center);
  geo.center();

  const mesh = new Mesh(geo, new MeshStandardMaterial({ color: "gray" }));

  const node = new ThreeDNode(viewport, mesh);

  node.object.rotateX(-Math.PI / 2);
  node.object.translateX(center.x);
  node.object.translateY(center.y);
  node.object.translateZ(center.z);

  return node;
};
