import { Shape, Vector2 } from "three";

export const StraightWallShape = (start: Vector2, end: Vector2) => {
  const shape = new Shape();

  const points = [start];

  shape.moveTo(start.x, start.y);
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
