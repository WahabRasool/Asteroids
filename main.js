    import * as THREE from "three";
    import { OrbitControls } from "three/addons/controls/OrbitControls.js";

    class Asteroids extends THREE.InstancedMesh{
    constructor(amount = 5000){
        let dimension = 500;
        let g = new THREE.IcosahedronGeometry(1, 1);
        let m = new THREE.MeshLambertMaterial({
        color: "brown",
        flatShading: true,
        onBeforeCompile: shader => {
            shader.vertexShader = `
            ${noise}
            ${shader.vertexShader}
            `.replace(
            `#include <begin_vertex>`,
            `#include <begin_vertex>
            
            float iID = float(gl_InstanceID);
            float n = noise(position + iID);
            transformed += normalize(position) * n * 3.;
            
            `
            );
            console.log(shader.vertexShader);
        }
        });
        super(g, m, amount);
        this.dimension = dimension;
        this.halfDim = dimension * 0.5;
        this.initData = [];
        this.dummy = new THREE.Object3D();
        for(let i = 0; i < amount; i++){
        let dummy = this.dummy;
        dummy.position.random().subScalar(0.5).multiplyScalar(dimension);
        dummy.rotation.set(Math.PI * 2 * Math.random(), Math.PI * 2 * Math.random(), Math.PI * 2 * Math.random());
        dummy.scale.setScalar(Math.random() * 0.5 + 0.5);
        this.initData.push({
            pos: dummy.position.clone(),
            rot: dummy.rotation.clone(),
            sca: dummy.scale.clone()
        })
        }
    }
    
    update(t){
        let dummy = this.dummy;
        this.initData.forEach((iData, idx) => {
        dummy.position.copy(iData.pos);
        dummy.rotation.copy(iData.rot);
        dummy.scale.copy(iData.sca);
        
        dummy.position.z = -this.halfDim + (((iData.pos.z + t * 50) + this.halfDim) % this.dimension);
        
        dummy.updateMatrix();
        this.setMatrixAt(idx, dummy.matrix)
        });
        this.instanceMatrix.needsUpdate = true;
    }
    }

    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 1, 2000);
    camera.position.set(0, 0, 1).setLength(200);
    let renderer = new THREE.WebGLRenderer({ antialias: false });
    renderer.setPixelRatio(devicePixelRatio);
    renderer.setSize(innerWidth, innerHeight);
    document.body.appendChild(renderer.domElement);

    window.addEventListener("resize", (event) => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    });

    let controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    let light = new THREE.DirectionalLight(0xffffff, Math.PI);
    light.position.setScalar(1);
    scene.add(light, new THREE.AmbientLight(0xffffff, Math.PI * 0.5));

    let asteroids = new Asteroids();
    scene.add(asteroids);

    let clock = new THREE.Clock();
    let t = 0;

    renderer.setAnimationLoop(() => {
    let dt = clock.getDelta();
    t += dt;
    controls.update();
    asteroids.update(t);
    renderer.render(scene, camera);
    });