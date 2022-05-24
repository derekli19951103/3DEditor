import {
  Box3,
  BufferGeometry,
  ExtrudeBufferGeometry,
  Float32BufferAttribute,
  Matrix3,
  Shape,
  Vector2,
  Vector3,
} from "three";

export const ThickWireframeGeometry = (bbox: Box3) => {
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

export const StraightWallGeometry = (points: Vector2[], depth: number) => {
  const rotatedShape = new Shape();

  const x = points[5].x - points[4].x;
  const y = points[5].y - points[4].y;

  const angle = Math.atan2(y, x);

  const rotation = new Matrix3().rotate(angle);

  const rotatedPoints = points.map((point) => {
    const rotatedPoint = point.clone().applyMatrix3(rotation);
    return rotatedPoint;
  });

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

  const center = new Vector2()
    .addVectors(points[3], points[0])
    .multiplyScalar(0.5);

  const center3D = new Vector3(center.x, depth / 2, center.y);

  rotatedGeo.center();

  return { geo: rotatedGeo, center: center3D, angle };
};

export const DotGeometry = (point: Vector3) => {
  const dotGeometry = new BufferGeometry();
  dotGeometry.setAttribute(
    "position",
    new Float32BufferAttribute([point.x, point.y, point.z], 3)
  );

  return dotGeometry;
};
