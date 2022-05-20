import { Button, Col, Input, Modal, Row, Select } from "antd";
import { useEffect, useRef, useState } from "react";
import {
  Box3,
  BoxBufferGeometry,
  BufferGeometry,
  Color,
  CubeCamera,
  CylinderGeometry,
  DoubleSide,
  Euler,
  ExtrudeBufferGeometry,
  Float32BufferAttribute,
  HalfFloatType,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  ShaderMaterial,
  Shape,
  ShapeGeometry,
  SphereBufferGeometry,
  SphereGeometry,
  Texture,
  TorusKnotGeometry,
  Vector2,
  Vector3,
  WebGLCubeRenderTarget,
} from "three";
import { SampleModelUrls } from "../constant/ModelURL";
import ThreeDNode from "../engine/ThreeDNode";
import Viewport from "../engine/Viewport";
import { useViewports } from "../store/viewports";
import { Reflector } from "three/examples/jsm/objects/Reflector";
import Stats from "three/examples/jsm/libs/stats.module";
import { CSG } from "../engine/three/CSG";
import Flatten from "@flatten-js/core";
import { StraightWall } from "../engine/utils/geometries";

const { Polygon, point } = Flatten;

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const statsRef = useRef<HTMLDivElement>(null);

  const { viewports, setViewports } = useViewports();
  const gl = viewports.viewport1;
  const [dataUrl, setDataUrl] = useState("");
  const [open, setOpen] = useState(false);

  const addNormalObj = () => {
    if (gl) {
      const geometry = new PlaneGeometry(5, 5, 100, 100);

      const sphere = new Reflector(geometry, {
        clipBias: 0.003,
        textureWidth: gl.width * window.devicePixelRatio,
        textureHeight: gl.height * window.devicePixelRatio,
      });

      const node = new ThreeDNode(gl, sphere);

      const size = new Vector3();

      node.bbox.getSize(size);

      node.object.translateY(size.y / 2);

      gl.add(node);
    }
  };

  const addGLB = async () => {
    if (gl) {
      const node = new ThreeDNode(gl);

      await node.load("/models/LCSHF30_mini1.glb");

      const size = new Vector3();

      node.bbox.getSize(size);

      node.object.position.y = size.y / 2;

      gl.add(node);
    }
  };

  const addUrl = async () => {
    if (gl) {
      const node = new ThreeDNode(gl);
      await node.load(dataUrl);
      const size = new Vector3();
      node.bbox.getSize(size);
      node.object.position.y = size.y / 2;
      gl.add(node);
      setOpen(false);
      setDataUrl("");
    }
  };

  const addHoleWall = () => {
    if (gl) {
      const material = new MeshStandardMaterial({ color: "red" });

      const box = new Mesh(new BoxBufferGeometry(0.3, 0.3, 1), material);

      const sphere = new Mesh(new SphereBufferGeometry(0.2), material);
      sphere.position.set(0, 0, 0.2);

      const sphereB = sphere.clone();
      sphereB.position.set(0, 0, -0.2);

      const csg = new CSG();

      csg.subtract([box, sphere, sphereB]);
      // csg.union([box, sphere, sphereB]);
      // csg.intersect([box, sphere]);

      const resultMesh = csg.toMesh();

      const node = new ThreeDNode(gl, resultMesh);

      // const x = poly.vertices[5].x - poly.vertices[4].x;
      // const y = poly.vertices[5].y - poly.vertices[4].y;

      // const quaternion = new Quaternion().setFromEuler(
      //   new Euler(-Math.PI / 2, 0, Math.atan(x / y))
      // );
      // mesh.quaternion.set(
      //   quaternion.x,
      //   quaternion.y,
      //   quaternion.z,
      //   quaternion.w
      // );

      // node2.object.translateX(center.x);
      // node2.object.translateY(center.y);
      // node2.object.translateZ(center.z);

      // node2.object.applyQuaternion(quaternion);
      // node2.bbox = node2.bbox
      //   .copy(mesh.geometry.boundingBox!)
      //   .applyMatrix4(mesh.matrixWorld);

      // node2.updateWireframe();

      gl.add(node);
    }
  };

  const addWall = () => {
    if (gl) {
      const points = [
        new Vector2(-4.999560546875, -5.046299831219087),
        new Vector2(-5.199560546875, -5.171031840285707),
        new Vector2(-3.0191434473777576, -6.2391937661373005),
        new Vector2(-2.972786458333333, -6.0391937661373),
        new Vector2(-2.9264294692889083, -5.8391937661373),
        new Vector2(-4.799560546875, -4.921567822152465),
      ];
      const { geo, center, angle } = StraightWall(points, 1);

      const mesh = new Mesh(geo, new MeshStandardMaterial({ color: "red" }));

      const node = new ThreeDNode(gl, mesh);

      const matrix = new Matrix4().makeRotationFromQuaternion(
        new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, -angle))
      );
      const centerMatrix = new Matrix4().makeRotationFromQuaternion(
        new Quaternion().setFromEuler(new Euler(-Math.PI / 2, 0, 0))
      );

      node.object.applyMatrix4(matrix);

      center.applyMatrix4(centerMatrix);

      node.object.position.copy(center);

      gl.add(node);
    }
  };

  useEffect(() => {
    if (canvasRef.current) {
      //@ts-ignore
      const stats: Stats = new Stats();

      statsRef.current?.appendChild(stats.dom);

      const viewport1 = new Viewport({ canvas: canvasRef.current, stats });

      setViewports({
        viewport1,
      });

      viewport1.render();
    }
  }, []);

  /**
   * Render
   */
  return (
    <>
      <style>{`
        .statsContainer div {
         right: 0;
         left: unset !important;
        }
      `}</style>
      <div style={{ width: "100vw", height: "100vh" }}>
        <nav className="nav" style={{ position: "absolute" }}>
          <Button className="btn" onClick={addNormalObj}>
            Add Mirror
          </Button>
          <Button className="btn" onClick={addGLB}>
            Add GLB
          </Button>
          <Button
            onClick={() => {
              setOpen(true);
            }}
          >
            Add Url
          </Button>

          <Button onClick={addHoleWall}>Add Hole Wall</Button>
          <Button onClick={addWall}>Add Wall</Button>

          <div ref={statsRef} className="statsContainer" />
        </nav>
        <canvas ref={canvasRef} tabIndex={1} />
      </div>
      <Modal
        title="Add Model Url"
        visible={open}
        onCancel={() => {
          setOpen(false);
        }}
        onOk={addUrl}
      >
        <Input
          value={dataUrl}
          onChange={(e) => {
            setDataUrl(e.target.value);
          }}
        />
        <Select
          style={{ width: "100%" }}
          options={SampleModelUrls.map((url) => ({ label: url, value: url }))}
          onChange={(e) => {
            setDataUrl(e);
          }}
        />
      </Modal>
    </>
  );
};
