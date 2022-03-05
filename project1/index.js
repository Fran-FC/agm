import * as THREE from './threejs/three.module.js';
import {STLLoader} from './threejs/STLLoader.js';
import {OrbitControls} from './threejs/OrbitControls.js';

let scene, camera, renderer;

(function init(){
    // RENDERER
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    // SCENE
    scene = new THREE.Scene();
    scene.background = new THREE.Color(255, 255, 255);

    // CAMERA
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        10000
    );
    camera.position.z = 12;
	// Control de camara
	var cameraControls = new OrbitControls( camera, renderer.domElement );
	cameraControls.target.set( 0, 0, 0 );
    cameraControls.enablePan=false;



    // LISGHTS
    let light = new THREE.DirectionalLight(0xeeeeee);
    light.position.set(10,10,0);
    scene.add(light);

    let light2 = new THREE.DirectionalLight(0xeeeeee);
    light2.position.set(-10,10,0);
    scene.add(light2);


    // load 3d model of github contribution graph
    let loader = new STLLoader();
    loader.load('/3dmodels/Fran-FC-2021.stl', (model)=>{
        var object = new THREE.Mesh(
            model,
            new THREE.MeshStandardMaterial({
                color: 0xdddddd,
                emissive: 0x000000,
                roughness: 0.4,
                metalness: 0.5
            })
        );
        object.scale.set(0.1, 0.1, 0.1);
        object.position.set(0,0,0);
        object.rotation.x = -Math.PI/2;
        scene.add(object);
    });


    animate();
})();

// update scene for each frame
function update(){

}
 // refresh loop
function animate(){
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}
