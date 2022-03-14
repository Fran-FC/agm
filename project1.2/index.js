import * as THREE from 'https://cdn.skypack.dev/three@0.136';
import {STLLoader} from './threejs/STLLoader.js';
import {OrbitControls} from 'https://cdn.skypack.dev/three@0.136/examples/jsm/controls/OrbitControls.js';

let scene, 
    camera, 
    renderer, 
    object,
    cameraControls, 
    physicsWorld,
    rigidBodies;

let photoSphere;

// const pos = THREE.Vector3();

(function init(){
	// PHYSICS 
    let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    let dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    let broadphase = new Ammo.btDbvtBroadphase();
    let solver = new Ammo.btSequentialImpulseConstraintSolver();
    physicsWorld = new Ammo.btDiscreteDynamicsWorld(
        dispatcher, broadphase, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -100, 0));
	
    // RENDERER
    const canvas = document.querySelector("#threejs-canvas");
    renderer = new THREE.WebGLRenderer({canvas});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // SCENE
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xbfd1e5 );

    // CAMERA
    camera = new THREE.PerspectiveCamera(
        100,
        window.innerWidth / window.innerHeight,
        0.5,
        1000
    );

    // Control de camara
    cameraControls = new OrbitControls( camera, renderer.domElement );
    cameraControls.target.set( 0, 20, 0 );
    // cameraControls.enablePan=false;
    scene.add(camera);
    scene.add( new THREE.AxesHelper(3) );
    camera.position.set(0,20,20);
    camera.lookAt(new THREE.Vector3(0,20,0)); 

    loadScene();
})();

function loadScene() {
    const ground = new THREE.Mesh(
      new THREE.BoxGeometry(100, 1, 100),
      new THREE.MeshStandardMaterial({color: 0x404040}));
    ground.castShadow = false;
    ground.receiveShadow = true;
    scene.add(ground);

    const rbGround = new RigidBody();
    rbGround.createBox(0, ground.position, ground.quaternion, 
							new THREE.Vector3(100, 1, 100));
    rbGround.setRestitution(0.99);
    physicsWorld.addRigidBody(rbGround.body_);

    rigidBodies = [];

    var ambiental = new THREE.AmbientLight(0xbceaff);
    scene.add(ambiental);

    let lightBottom = new THREE.SpotLight(0xffd797, 1)
    lightBottom.position.set(0,-10,5);
    scene.add(lightBottom);

	var focal = new THREE.SpotLight(0xFFFFFF,0.3);
	focal.position.set(-2,20,4);
	focal.target.position.set(0,20,0);
	focal.angle = Math.PI/7;
	camera.add(focal);

    { // first load     
        // load 3d model of github contribution graph
        let stl_loader = new STLLoader();
        // extracted from https://skyline.github.com/ 
        // extracted from https://cults3d.com/en/3d-model/art/github-octocat
        stl_loader.load('/3dmodels/canasta_color.stl', (model)=>{
            object = new THREE.Mesh(
                model,
                new THREE.MeshStandardMaterial({
                    color: 0xdddddd,
                    emissive: 0x000000,
                    roughness: 0.4,
                    metalness: 0.5
                })
            );
            object.scale.set(0.5,0.5,0.5);
            object.position.set(0,0,-100);
            object.rotation.set(-Math.PI/2, 0, Math.PI);
            scene.add(object);
        })
        var floor = new THREE.Mesh(new THREE.CubeGeometry(500))

        const photoMaterial = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load('images/me.jpeg'),
        });
        photoSphere =  new THREE.Mesh( new THREE.SphereGeometry(10,50,50), 
										photoMaterial);
        photoSphere.position.set(-20, 25, -10);
        photoSphere.rotation.y = -1;
        scene.add(photoSphere);
        var photoRotation = new TWEEN.Tween(photoSphere.rotation)
                            .to({ y: photoSphere.rotation.y - Math.PI/2 }, 700)
                            .easing(TWEEN.Easing.Quadratic.Out)
                            // .start();
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


 // refresh loop
function animate(){
    requestAnimationFrame(animate);
    TWEEN.update();

    // check if renderer needs resize and change camera if it does
    if (resizeRendererToDisplaySize()) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);
}
