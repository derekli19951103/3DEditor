import { Button, Col, Input, Modal, Row, Select } from "antd";
import { useEffect, useRef, useState } from "react";
import {
  BoxBufferGeometry,
  BufferGeometry,
  Color,
  CubeCamera,
  CylinderGeometry,
  DoubleSide,
  ExtrudeBufferGeometry,
  Float32BufferAttribute,
  HalfFloatType,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  ShaderMaterial,
  Shape,
  ShapeGeometry,
  SphereBufferGeometry,
  SphereGeometry,
  Texture,
  TorusKnotGeometry,
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

const { Polygon, point } = Flatten;

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const statsRef = useRef<HTMLDivElement>(null);

  const { viewports, setViewports } = useViewports();
  const gl = viewports.viewport1;
  const [dataUrl, setDataUrl] = useState("");
  const [open, setOpen] = useState(false);

  const addCustomShaderObj = async () => {
    if (gl) {
      const geometry = new TorusKnotGeometry(0.5, 0.2, 100, 16);

      let uniforms = {
        Ka: { type: "float", value: 1.0 },
        Kd: { type: "float", value: 1.0 },
        Ks: { type: "float", value: 1.0 },
        shininess: { type: "float", value: 80.0 },
        lightPos: { type: "vec3", value: new Vector3(4, 4, 0) },
        ambientColor: { type: "vec3", value: new Color("#341900") },
        diffuseColor: { type: "vec3", value: new Color("#00ccc2") },
        specularColor: { type: "vec3", value: new Color("#ffffff") },
      };
      const material = new ShaderMaterial({
        uniforms: uniforms,
        fragmentShader: await fetch("/shaders/halftone_frag.glsl").then(
          async (res) => await res.text()
        ),
        vertexShader: await fetch("/shaders/halftone_vert.glsl").then(
          async (res) => await res.text()
        ),
      });

      const mesh = new Mesh(geometry, material);

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const node = new ThreeDNode(gl, mesh);

      const size = new Vector3();

      node.bbox.getSize(size);

      node.object.translateY(size.y / 2);
      node.object.translateX(4);

      gl.add(node);
    }
  };

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

      console.log(resultMesh);

      const node = new ThreeDNode(gl, resultMesh);

      const poly = new Polygon([
        point(-4.999560546875, -5.046299831219087),
        point(-5.199560546875, -5.171031840285707),
        point(-3.0191434473777576, -6.2391937661373005),
        point(-2.972786458333333, -6.0391937661373),
        point(-2.9264294692889083, -5.8391937661373),
        point(-4.799560546875, -4.921567822152465),
      ]);

      console.log(poly.vertices);

      const height = 3;

      const wallShape = new Shape();

      wallShape.moveTo(poly.vertices[0].x, poly.vertices[0].y);
      poly.vertices.forEach((v) => {
        wallShape.lineTo(v.x, v.y);
      });
      wallShape.lineTo(poly.vertices[0].x, poly.vertices[0].y);

      const plane = new Mesh(
        new ShapeGeometry(wallShape),
        new MeshStandardMaterial({ color: "red" })
      );

      const geo = new ExtrudeBufferGeometry(wallShape, {
        steps: 1,
        depth: height,
        bevelEnabled: false,
      });
      geo.computeVertexNormals();
      geo.computeBoundingBox();

      console.log(geo);

      const mesh = new Mesh(geo, material);

      console.log(mesh);

      const node2 = new ThreeDNode(gl, mesh);

      node2.object.rotateX(-Math.PI / 2);

      const node3 = new ThreeDNode(gl, plane);

      node3.object.rotateX(-Math.PI / 2);

      gl.add(node, node2, node3);
    }
  };

  useEffect(() => {
    if (canvasRef.current) {
      //@ts-ignore
      const stats: Stats = new Stats();

      statsRef.current?.appendChild(stats.dom);

      setViewports({
        viewport1: new Viewport({ canvas: canvasRef.current, stats }),
      });
    }
  }, []);

  useEffect(() => {
    if (gl) {
      gl.render();
    }
  }, [gl]);

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
          <Button className="btn" onClick={addCustomShaderObj}>
            Add Custom Shader Obj
          </Button>
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

          <Button onClick={addHoleWall}>Add</Button>

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
