import {
  Box3,
  BufferGeometry,
  ExtrudeBufferGeometry,
  Mesh,
  Shape,
  Vector2,
  Vector3,
} from "three";

export const ThickWireframe = (bbox: Box3) => {
  const bboxMin = bbox.min;
  const bboxMax = bbox.max;
  return new BufferGeometry().setFromPoints([
    //1
    new Vector3(bboxMin.x, bboxMin.y, bboxMin.z),
    //2
    new Vector3(bboxMin.x, bboxMin.y, bboxMax.z),
    //3
    new Vector3(bboxMin.x, bboxMax.y, bboxMax.z),
    //4
    new Vector3(bboxMin.x, bboxMax.y, bboxMin.z),
    //1
    new Vector3(bboxMin.x, bboxMin.y, bboxMin.z),
    //5
    new Vector3(bboxMax.x, bboxMin.y, bboxMin.z),
    //6
    new Vector3(bboxMax.x, bboxMin.y, bboxMax.z),
    //7
    new Vector3(bboxMax.x, bboxMax.y, bboxMax.z),
    //8
    new Vector3(bboxMax.x, bboxMax.y, bboxMin.z),
    //4
    new Vector3(bboxMin.x, bboxMax.y, bboxMin.z),
    //3
    new Vector3(bboxMin.x, bboxMax.y, bboxMax.z),
    //7
    new Vector3(bboxMax.x, bboxMax.y, bboxMax.z),
    //6
    new Vector3(bboxMax.x, bboxMin.y, bboxMax.z),
    //2
    new Vector3(bboxMin.x, bboxMin.y, bboxMax.z),
    //1
    new Vector3(bboxMin.x, bboxMin.y, bboxMin.z),
    //5
    new Vector3(bboxMax.x, bboxMin.y, bboxMin.z),
    //8
    new Vector3(bboxMax.x, bboxMax.y, bboxMin.z),
  ]);
};

export const StraightWall = (points: Vector2[], depth: number) => {
  const wallShape = new Shape();

  wallShape.moveTo(points[0].x, points[0].y);
  points.forEach((v) => {
    wallShape.lineTo(v.x, v.y);
  });
  wallShape.lineTo(points[0].x, points[0].y);

  const geo = new ExtrudeBufferGeometry(wallShape, {
    steps: 1,
    depth,
    bevelEnabled: false,
  });
  const center = new Vector3();
  geo.computeBoundingBox();

  geo.boundingBox!.getCenter(center);
  geo.center();

  return geo;
};
