import * as THREE from './js/libs/three.module.js';
import {OrbitControls} from 'https://cdn.skypack.dev/three@0.136/examples/jsm/controls/OrbitControls.js';
import Stats from './js/libs/stats.module.js';

// Graphics variables
let container, stats;
let camera, controls, scene, renderer;
let textureLoader;
const clock = new THREE.Clock();
let clickRequest = false;
const mouseCoords = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

var ballMaterial;
const pos = new THREE.Vector3();
const quat = new THREE.Quaternion();

// Physics variables
const gravityConstant = - 9.8;
let physicsWorld;
const rigidBodies = [];
const margin = 0.05;
let transformAux1;

var throwForce = 0;
var charging = false;
const maxForce = 50;
const pv = document.getElementById("power-value");

Ammo().then( function ( AmmoLib ) {

	Ammo = AmmoLib;

	init();
	animate();

} );

function init() {

	initGraphics();

	initPhysics();

	createObjects();

	initInput();

}

function initGraphics() {
	container = document.getElementById( 'container' );

	camera = new THREE.PerspectiveCamera( 100, window.innerWidth / window.innerHeight, 0.2, 2000 );
	camera.position.set(0,5, 15);

	scene = new THREE.Scene();
	scene.background = new THREE.Color( 0xbfd1e5 );
	scene.fog = new THREE.Fog(0xebe7ee, 1, 40);


	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.shadowMap.enabled = true;
	container.appendChild( renderer.domElement );

	controls = new OrbitControls( camera, renderer.domElement );
	controls.enableDamping = false;
	controls.enablePan = false;
	controls.enableZoom = false;
	controls.maxPolarAngle = Math.PI/2.5;
	controls.target.set( 0, 0, 0 );
	controls.update();

	textureLoader = new THREE.TextureLoader();

	const ambientLight = new THREE.AmbientLight( 0x404040 );
	scene.add( ambientLight );

	const light = new THREE.DirectionalLight( 0xffffff, 1 );
	light.position.set( - 10, 10, 5 );
	light.castShadow = true;
	const d = 20;
	light.shadow.camera.left = - d;
	light.shadow.camera.right = d;
	light.shadow.camera.top = d;
	light.shadow.camera.bottom = - d;

	light.shadow.camera.near = 2;
	light.shadow.camera.far = 50;

	light.shadow.mapSize.x = 1024;
	light.shadow.mapSize.y = 1024;

	scene.add( light );

	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild( stats.domElement );


	window.addEventListener( 'resize', onWindowResize );
 	ballMaterial=  new THREE.MeshPhongMaterial({color: 0x808080, map:textureLoader.load("./textures/ball.png"), 
          normalMap:textureLoader.load("./textures/ball_normal.png")})
}

function initPhysics() {

	// Physics configuration
	const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
	const dispatcher = new Ammo.btCollisionDispatcher( collisionConfiguration );
	const broadphase = new Ammo.btDbvtBroadphase();
	const solver = new Ammo.btSequentialImpulseConstraintSolver();
	physicsWorld = new Ammo.btDiscreteDynamicsWorld( dispatcher, broadphase, solver, collisionConfiguration);
	physicsWorld.setGravity( new Ammo.btVector3( 0, gravityConstant, 0 ) );

	transformAux1 = new Ammo.btTransform();
}

function createObjects() {

	// Ground
	pos.set( 0, - 0.5, 0 );
	quat.set( 0, 0, 0, 1 );
	const ground = createParalellepiped( 100, 1, 100, 0, pos, quat, new THREE.MeshPhongMaterial( { color: 0xFFFFFF } ) );
	ground.castShadow = true;
	ground.receiveShadow = true;
	textureLoader.load( 'textures/grid.png', function ( texture ) {

		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set( 40, 40 );
		ground.material.map = texture;
		ground.material.needsUpdate = true;

	} );

	for (let i = 0; i < 20; i++) {
		
		const rx = randomNumber(),
			ry = randomNumber(),
			rz = randomNumber();
		pos.set(rx*35, Math.abs(ry*15), rz*25);
		var targetRot = new THREE.Quaternion()
		const obstacle = createParalellepiped( 2, 2, 2, 0, pos, targetRot, new THREE.MeshPhongMaterial( { color: 0x606060 } ) );
		obstacle.castShadow = true;
		obstacle.receiveShadow = true;
	}
}

function createParalellepiped( sx, sy, sz, mass, pos, quat, material ) {

	const threeObject = new THREE.Mesh( new THREE.BoxGeometry( sx, sy, sz, 1, 1, 1 ), material );
	const shape = new Ammo.btBoxShape( new Ammo.btVector3( sx * 0.5, sy * 0.5, sz * 0.5 ) );
	shape.setMargin( margin );

	createRigidBody( threeObject, shape, mass, pos, quat );

	return threeObject;

}

function createRigidBody( threeObject, physicsShape, mass, pos, quat, parent=scene ) {

	threeObject.position.copy( pos );
	threeObject.quaternion.copy( quat );

	const transform = new Ammo.btTransform();
	transform.setIdentity();
	transform.setOrigin( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
	transform.setRotation( new Ammo.btQuaternion( quat.x, quat.y, quat.z, quat.w ) );
	const motionState = new Ammo.btDefaultMotionState( transform );

	const localInertia = new Ammo.btVector3( 0, 0, 0 );
	physicsShape.calculateLocalInertia( mass, localInertia );

	const rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, physicsShape, localInertia );
	const body = new Ammo.btRigidBody( rbInfo );

	threeObject.userData.physicsBody = body;

	scene.add( threeObject );

	if ( mass > 0 ) {

		rigidBodies.push( threeObject );

		// Disable deactivation
		body.setActivationState( 4 );

	}

	physicsWorld.addRigidBody( body );

	return body;

}

function initInput() {

	window.addEventListener('pointerdown', function ( event ) {
		
		if(event.buttons == 2) charging = true;

	});
	
	window.addEventListener( 'pointerup', function ( event ) {

		if ( !clickRequest && charging ) {

			mouseCoords.set(
				( event.clientX / window.innerWidth ) * 2 - 1,
				- ( event.clientY / window.innerHeight ) * 2 + 1
			);

			clickRequest = true;
			charging = false;
		}

	} );

}

function chargeThrow() {

	if ( charging ) {
		throwForce += .5;
		var percentageForce = throwForce*100/maxForce;
		percentageForce = percentageForce<=100?percentageForce:100;
		pv.innerHTML = "Power "+percentageForce.toPrecision(3)+"%";
	} 

}

function processClick() {

	if ( clickRequest ) {
		raycaster.setFromCamera( mouseCoords, camera );

		// Creates a ball
		const ballMass = 3;
		const ballRadius = 0.4;

		const ball = new THREE.Mesh( new THREE.SphereGeometry( ballRadius, 18, 16 ), ballMaterial );
		ball.castShadow = true;
		ball.receiveShadow = true;
		const ballShape = new Ammo.btSphereShape( ballRadius );
		ballShape.setMargin( margin );
		pos.copy( raycaster.ray.direction );
		pos.add(camera.position );
		quat.set( 0, 0, 0, 1 );
		const ballBody = createRigidBody( ball, ballShape, ballMass, pos, quat, camera);
		ballBody.setFriction( 1 );

		pos.copy( raycaster.ray.direction );
		const multiplier = throwForce<maxForce?throwForce:maxForce;
		pos.multiplyScalar( multiplier );
		ballBody.setLinearVelocity( new Ammo.btVector3( pos.x, pos.y, pos.z ) );
		ballBody.setAngularVelocity( new Ammo.btQuaternion(0, 0, 10, 10));

		clickRequest = false;
		throwForce = 0;
		pv.innerHTML = "Power 0%";
	}

}

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

	requestAnimationFrame( animate );

	render();
	stats.update();

}

function render() {

	const deltaTime = clock.getDelta();

	updatePhysics( deltaTime );

	chargeThrow();

	processClick();

	renderer.render( scene, camera );

}

function updatePhysics( deltaTime ) {

	// Step world
	physicsWorld.stepSimulation( deltaTime, 10 );

	// Update rigid bodies
	for ( let i = 0, il = rigidBodies.length; i < il; i ++ ) {
		const objThree = rigidBodies[ i ];
		const objPhys = objThree.userData.physicsBody;
		const ms = objPhys.getMotionState();
		if ( ms ) {
			ms.getWorldTransform( transformAux1 );
			const p = transformAux1.getOrigin();
			const q = transformAux1.getRotation();
			objThree.position.set( p.x(), p.y(), p.z() );
			objThree.quaternion.set( q.x(), q.y(), q.z(), q.w() );
		}
	}
}

function randomNumber(min=-1, max=1) {
  return Math.random() * (max - min) + min;
}