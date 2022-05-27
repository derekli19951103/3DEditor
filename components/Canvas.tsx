import Flatten from "@flatten-js/core";
import { Button, Input, Modal, Select } from "antd";
import { useEffect, useRef, useState } from "react";
import {
  BoxBufferGeometry,
  Euler,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Quaternion,
  SphereBufferGeometry,
  Vector2,
  Vector3,
} from "three";
import Stats from "three/examples/jsm/libs/stats.module";
import { Reflector } from "three/examples/jsm/objects/Reflector";
import { SampleModelUrls } from "../constant/ModelURL";
import { CSG } from "../engine/three/CSG";
import ThreeDNode from "../engine/ThreeDNode";
import { DotGeometry, StraightWallGeometry } from "../engine/utils/geometries";
import Viewport from "../engine/Viewport";
import { useViewports } from "../store/viewports";

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

      node.updateBoundingBox();

      node.calculateBoundingWireframe();

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

      node.updateBoundingBox();

      node.calculateBoundingWireframe();

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

      const resultMesh = csg.toMesh();

      const node = new ThreeDNode(gl, resultMesh);

      const size = new Vector3();

      node.bbox.getSize(size);

      node.object.position.copy(new Vector3(0, size.y / 2, 0));

      gl.add(node);
    }
  };

  const addWall = () => {
    if (gl) {
      const points = [
        new Vector2(-3.5, 1),
        new Vector2(-3, 1),
        new Vector2(-1, 3),
        new Vector2(-1, 3.5),
        new Vector2(-1, 4),
        new Vector2(-4, 1),
      ];
      const { geo, center, angle } = StraightWallGeometry(points, 1);

      const mesh = new Mesh(geo, new MeshStandardMaterial({ color: "red" }));

      const node = new ThreeDNode(gl, mesh);

      const matrix = new Matrix4().makeRotationFromQuaternion(
        new Quaternion().setFromEuler(new Euler(Math.PI / 2, 0, angle))
      );

      node.object.applyMatrix4(matrix);

      node.object.position.copy(center);

      node.updateBoundingBox();
      node.updateOBB();

      node.calculateObjectWireFrame();

      const p1 = new Points(
        DotGeometry(node.bbox.min),
        new PointsMaterial({ color: "red" })
      );
      const p2 = new Points(
        DotGeometry(node.bbox.max),
        new PointsMaterial({ color: "red" })
      );

      gl.scene.add(p1, p2);

      gl.add(node);
    }
  };

  const addRoom = () => {
    const thickness = 0.5;
    const start = 10;
    const mid = start + thickness / 2;
    const end = start + thickness;
    if (gl) {
      const walls = [
        [
          new Vector2(-mid, mid),
          new Vector2(-start, start),
          new Vector2(start, start),
          new Vector2(mid, mid),
          new Vector2(end, end),
          new Vector2(-end, end),
        ],
        [
          new Vector2(-mid, -mid),
          new Vector2(-start, -start),
          new Vector2(-start, start),
          new Vector2(-mid, mid),
          new Vector2(-end, end),
          new Vector2(-end, -end),
        ],
        [
          new Vector2(mid, -mid),
          new Vector2(start, -start),
          new Vector2(-start, -start),
          new Vector2(-mid, -mid),
          new Vector2(-end, -end),
          new Vector2(end, -end),
        ],
        [
          new Vector2(mid, mid),
          new Vector2(start, start),
          new Vector2(start, -start),
          new Vector2(mid, -mid),
          new Vector2(end, -end),
          new Vector2(end, end),
        ],
      ];

      const nodes = walls.map((points) => {
        const { geo, center, angle } = StraightWallGeometry(points, 4);

        const mesh = new Mesh(geo, new MeshStandardMaterial({ color: "gray" }));

        const node = new ThreeDNode(gl, mesh);

        const matrix = new Matrix4().makeRotationFromQuaternion(
          new Quaternion().setFromEuler(new Euler(Math.PI / 2, 0, angle))
        );

        node.object.applyMatrix4(matrix);

        node.object.position.copy(center);

        node.updateBoundingBox();

        node.calculateObjectWireFrame();

        return node;
      });

      gl.add(...nodes);
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
          <Button onClick={addRoom}>Add Room</Button>
          <Button
            onClick={() => {
              if (gl) {
                gl.logNodes();
              }
            }}
          >
            Log Nodes
          </Button>

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
