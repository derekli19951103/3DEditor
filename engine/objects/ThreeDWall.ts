import { Mesh, Shape } from "three";
import ThreeDNode from "../ThreeDNode";
import Viewport from "../Viewport";

export default class ThreeDWall extends ThreeDNode {
  shape: Shape;
  height: number;
  constructor(viewport: Viewport, shape: Shape, height: number) {
    super(viewport);
    this.shape = shape;
    this.height = height;
  }
}
