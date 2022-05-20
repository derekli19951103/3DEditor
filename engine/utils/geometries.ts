import {
  Box3,
  BufferGeometry,
  ExtrudeBufferGeometry,
  Matrix3,
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
  const shape = new Shape();
  const rotatedShape = new Shape();

  const x = points[5].x - points[4].x;
  const y = points[5].y - points[4].y;

  const angle = Math.atan2(y, x);

  const rotation = new Matrix3().rotate(angle);

  const rotatedPoints = points.map((point) => {
    const rotatedPoint = point.clone().applyMatrix3(rotation);
    return rotatedPoint;
  });

  shape.moveTo(points[0].x, points[0].y);
  points.forEach((v) => {
    shape.lineTo(v.x, v.y);
  });
  shape.lineTo(points[0].x, points[0].y);

  rotatedShape.moveTo(rotatedPoints[0].x, rotatedPoints[0].y);
  rotatedPoints.forEach((v) => {
    rotatedShape.lineTo(v.x, v.y);
  });
  rotatedShape.lineTo(rotatedPoints[0].x, rotatedPoints[0].y);

  const rotatedGeo = new ExtrudeBufferGeometry(rotatedShape, {
    steps: 1,
    depth,
    bevelEnabled: false,
  });
  const geo = new ExtrudeBufferGeometry(shape, {
    steps: 1,
    depth,
    bevelEnabled: false,
  });

  const center = new Vector3();

  geo.computeBoundingBox();

  geo.boundingBox!.getCenter(center);

  rotatedGeo.center();

  return { geo: rotatedGeo, center, angle };
};
