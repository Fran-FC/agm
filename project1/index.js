import * as THREE from './threejs/three.module.js';
import {STLLoader} from './threejs/STLLoader.js';
import {OrbitControls} from './threejs/OrbitControls.js';

let scene, 
    camera, 
    renderer, 
    cameraControls, 
    object,
    angle;

// different slides of the page 
let rotationObject,
    mainSlide,
    slide1,
    slide2,
    slide3,
    slide4;

var antes = Date.now();

(function init(){
    // RENDERER
    // document.body.appendChild(renderer.domElement);
    const canvas = document.querySelector("#threejs-canvas");
    renderer = new THREE.WebGLRenderer({canvas});

    
    // SCENE
    scene = new THREE.Scene();
    scene.background = new THREE.Color(255, 255, 255);

    // CAMERA
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );


	// Control de camara
	cameraControls = new OrbitControls( camera, renderer.domElement );
	cameraControls.target.set( 0, 20, 0 );
    cameraControls.enablePan=false;
    scene.add( new THREE.AxesHelper(3) );
    camera.position.set(0,22,20);
    camera.lookAt(new THREE.Vector3(0,20,0)); 
    loadScene();
})();

function loadScene() {
    // background scene image from: https://downloadhdwallpapers.in/sky-cloud/ 
    var textBackground = new THREE.TextureLoader().load("/images/sky.jpg");
    scene.background = textBackground;

    var material = new THREE.MeshPhongMaterial();
    var geometry = new THREE.BoxGeometry(1,1,1);


    rotationObject = new THREE.Mesh(geometry, material.clone());
    rotationObject.position.set(0,0,0);
    scene.add(rotationObject);    

    { // slides
        // slide2 parent 
        mainSlide = new THREE.Mesh( geometry, material.clone() );
        mainSlide.material.visible = false;
        mainSlide.position.set(0,20,0);
        scene.add(mainSlide);    

        slide1 = new THREE.Mesh( geometry, material.clone() );
        // slide1.material.visible = false;
        slide1.position.set(0,20,0);
        rotationObject.add(slide1);
        // slide2 parent add
        slide2 = new THREE.Mesh( geometry, material.clone() );
        slide2.material.visible = false;
        slide2.position.set(20,0,0);
        rotationObject.add(slide2);
        // slide2 parent add
        slide3 = new THREE.Mesh( geometry, material.clone() );
        slide3.material.visible = false;
        slide3.position.set(0,-20,0);
        rotationObject.add(slide3);
        // slide2 parent add
        slide4 = new THREE.Mesh( geometry, material.clone() );
        slide4.material.visible = false;
        slide4.position.set(-20,0,0);
        rotationObject.add(slide4);
    }

    {// lights
        var ambiental = new THREE.AmbientLight(0xbceaff);
        scene.add(ambiental);

        let lightBottom = new THREE.SpotLight(0xffd797, 0.5)
        lightBottom.position.set(0,-10,5);
        lightBottom.target = mainSlide;
        scene.add(lightBottom);

        let lightLeft = new THREE.SpotLight(0x33096b, 0.3)
        lightLeft.position.set(-10,0,5);
        lightLeft.target = mainSlide;
        scene.add(lightLeft);

        let lightRight = new THREE.SpotLight(0xb1ebff);
        lightRight.position.set(10,10,5);
        lightRight.target = mainSlide;
        scene.add(lightRight);

        let lightTop = new THREE.SpotLight(0xb1ebff, 0.6);
        lightTop.position.set(10,5,10);
        lightTop.target = mainSlide;
        scene.add(lightTop);
        // load sliders
    }
   
    { // first load     
        // load 3d model of github contribution graph
        let loader = new STLLoader();
        // extracted from https://skyline.github.com/ 
        loader.load('/3dmodels/Fran-FC-2021.stl', (model)=>{
            object = new THREE.Mesh(
                model,
                new THREE.MeshStandardMaterial({
                    color: 0xdddddd,
                    emissive: 0x000000,
                    roughness: 0.4,
                    metalness: 0.5
                })
            );
            object.scale.set(0.1, 0.1, 0.1);
            object.position.set(3, 0, 0);
            object.rotation.x = -Math.PI/2;
            slide1.add(object);
        });
        // extracted from https://cults3d.com/en/3d-model/art/github-octocat
        loader.load('/3dmodels/octo.stl', (model)=>{
            object = new THREE.Mesh(
                model,
                new THREE.MeshStandardMaterial({
                    color: 0xdddddd,
                    emissive: 0x000000,
                    roughness: 0.4,
                    metalness: 0.5
                })
            );
            object.scale.set(0.02, 0.02, 0.02);
            object.position.set(-7,0.85,0);
            object.rotation.x = -Math.PI/2;
            slide1.add(object);
        })
    }

   
    animate();
}

// resize 
function resizeRendererToDisplaySize(){
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
    }
    return needResize;
}

// update scene for each frame
function update(){
    // object.rotations
	var ahora = Date.now();
	// Incremento de 20º por segundo
	rotationObject.rotation.z += Math.PI/3 * (ahora-antes)/1000;
	antes = ahora;

    console.log("Camera target: "+cameraControls.target.z);
}
 // refresh loop
function animate(){
    requestAnimationFrame(animate);

    // check if renderer needs resize and change camera if it does
    if (resizeRendererToDisplaySize()) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }

    update();
    renderer.render(scene, camera);
}
