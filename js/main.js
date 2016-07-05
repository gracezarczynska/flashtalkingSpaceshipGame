(function(){//Initiate all the variables
var Colors = {
    red:0xBD125E,
    white:0xFFFFFF,
    brown:0x59332e,
    pink:0xF5986E,
    brownDark:0x23190f,
    blue:0x68c3c0,
};

var scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH, renderer, container, hemisphereLight, shadowLight;

//on load, initiate the animation
window.addEventListener('load', init, false);

function init(event){

    //set up the scene, the camera and the renderer
    createScene();

    //add the lights
    createLights();

    //add the objects
    createSpaceship();
    // createSea();
    createSky();

    //add the listener
    document.addEventListener('mousemove', handleMouseMove, false);

    //start a loop that will update the objects' positions
    //and render the scene on each frame
     loop();

}

function createScene(){

    // Get the width and the height of the screen,
    // use them to set up the aspect ratio of the camera
    // and the size of the renderer.
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;

    //Create the scene
    scene = new THREE.Scene();

    //Add a fog effect to the scene; same color as the
    //background color used in the style sheet
    scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

    //Create the camera
    aspectRatio = WIDTH/HEIGHT;
    fieldOfView = 60;
    nearPlane = 1;
    farPlane = 10000;
    camera = new THREE.PerspectiveCamera(
        fieldOfView,
        aspectRatio,
        nearPlane,
        farPlane
        );

    //Set the position of the camera
    camera.position.x = 0;
    camera.position.z = 200;
    camera.position.y = 100;

    //Create the renderer
    renderer = new THREE.WebGLRenderer({
        //Allow transparency to show the gradient background we defined in the CSS
        alpha: true,

        //Activate the anti-aliasing; this is less performant, but as our project is low-poly based, it should be fine
        antialias: true
    });

    //Define the size of the renderer; in this case it will fill the entire screen
    renderer.setSize(WIDTH, HEIGHT);

    //Enable shadow rendering
    renderer.shadowMap.enabled = true;

    //Add the DOM element of the renderer to the container we created in the HTML
    container = document.getElementById("world");
    container.appendChild(renderer.domElement);

    //listen to the screen: if the user resizes it
    //we have to update the camera and the renderer size
    window.addEventListener('resize', handleWindowResize, false);
}

function handleWindowResize(){
    //update height and width of the renderer and the camera
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH/HEIGHT;
    camera.updateProjectionMatrix();
}

function createLights(){
    // A hemisphere light is a gradient colored light;
    // the first parameter is the sky color, the second parameter is the ground color,
    // the third parameter is the intensity of the light.
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 0.9);

    // A directional light shines from a speficic direction.
    // It acts like the sun, that means that all of the rays produced are parallel.
    shadowLight = new THREE.DirectionalLight(0xffffff, .9);

    //set the direction
    shadowLight.position.set(150, 350, 350);

    //allow shadow casting
    shadowLight.castShadow = true;

    //define the visible area of the projected shadow
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;

    // define the resolution of the shadow; the higher the better, 
    // but also the more expensive and less performant.
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;

    //to activate the lights, just add them to the scene
    scene.add(hemisphereLight);
    scene.add(shadowLight);

    // an ambient light modifies the global color of a scene and makes the shadows softer
    ambientLight = new THREE.AmbientLight(0x897857, 0.0001);
    scene.add(ambientLight);
}

// define sea object

Sea = function(){

    //create the geometry (shape) of the cylinder;
    //the parameters are
    //radius top, radius bottom, height, number of segments on the radius, number of segments vertically
    var geom = new THREE.CylinderGeometry(600, 600, 800, 40, 10);

    //rotate the geometry on the x axis
    geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));

    //create the material
    var mat = new THREE.MeshPhongMaterial({
        color:Colors.blue,
        transparent:true,
        opacity:0.6,
        shading:THREE.FlatShading
    });

    // To create an object in Three.js, we have to create a mesh 
    // which is a combination of a geometry and some material
    this.mesh = new THREE.Mesh(geom, mat);

    //allow the sea to receive shadows
    this.mesh.receiveShadow = true;

}

var sea;

// function createSea(){
//     sea = new Sea();

//     //push it a little bit at the bottom of the scene
//     sea.mesh.position.y = -600;

//     //add the mesh of the sea to the scene
//     scene.add(sea.mesh);
// }

var cloudArray=[];

Cloud = function (){
    //Create an empty container that will hold the different parts of the cloud
    this.mesh = new THREE.Object3D();

    //create a cube geometry;
    //this shape will be duplicated to create the cloud
    var geom = new THREE.BoxGeometry(20,20,20);

    //create a material; a simple white material will do the trick
    var mat = new THREE.MeshPhongMaterial({
        color:Colors.white
    });

    //duplicate the geometry a random number of times
    var nBlocks = 3+Math.floor(Math.random()*3);
    for (var i=0; i<nBlocks; i++){

        //create the mesh by cloning the geometry
        var m = new THREE.Mesh(geom, mat);


        //set the position and the rotation of each cube randoml
        m.position.x = i*15;
        m.position.y = Math.random()*10;
        m.position.z = Math.random()*10;
        m.rotation.z = Math.random()*Math.PI*2;
        m.rotation.y = Math.random()*Math.PI*2;

        //set the size of the cube randomly
        var s = .1 + Math.random()*.9;
        m.scale.set(s,s,s);

        //allow each cube to cast and to receive shadows
        m.castShadow = true;
        m.receiveShadow = true;

        //add the cube to the container we first created
        this.mesh.add(m);
    }
}

//define a Sky object
Sky = function(){
       //Create an empty container
    this.mesh = new THREE.Object3D();

    //chose a number of clouds to be scattered in the sky
    this.nClouds = 40;

    //To distribute the clouds consistently,
    //we need to place them according to a uniform angle
    var distribution = 1 / this.nClouds;

    //create the clouds
    for(var i=0; i<this.nClouds; i++){
        var c = new Cloud();

        //set the rotation and the position of each cloud;
        //for that we use a bit of trigonometry
        var a = distribution*i; // this is the final angle of the cloud
        var h = 750 + Math.random()*200; // this is the distance between the center of the axis and the cloud

       // Trigonometry!!! I hope you remember what you've learned in Math :)
        // in case you don't: 
        // we are simply converting polar coordinates (angle, distance) into Cartesian coordinates (x, y)
        c.mesh.position.x = 2 *(Math.random() - 0.5) * WIDTH;
        c.mesh.position.y =  2 * (Math.random() - 0.5) * 2 * HEIGHT;

        // rotate the cloud according to its position
        c.mesh.rotation.z =  Math.PI;

        // for a better result, we position the clouds 
        // at random depths inside of the scene
        c.mesh.position.z = -400-Math.random()*400;
        
        // we also set a random scale for each cloud
        var s = 1+Math.random()*3;
        c.mesh.scale.set(s,s,s);

        // do not forget to add the mesh of each cloud in the scene
        this.mesh.add(c.mesh);  
        cloudArray[i]=c;
    }  

}

// Now we instantiate the sky and push its center a bit
// towards the bottom of the screen

var sky;

function createSky(){
    sky = new Sky();
    sky.mesh.position.y = -600;
    scene.add(sky.mesh);
}

var AirPlane = function() {
    
    this.mesh = new THREE.Object3D();
    
    // Create the cabin top cone
    var topCockpit = new THREE.CylinderGeometry(0, 27, 80, 20, 1, true);
    var matCockpit = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
    var topcockpit = new THREE.Mesh(topCockpit, matCockpit);
    topcockpit.position.y = 40;
    topcockpit.castShadow = true;
    topcockpit.receiveShadow = true;
    this.mesh.add(topcockpit);

    var geoCircle1 = new THREE.CircleGeometry( 5, 32 );
    var matCircle1 = new THREE.MeshBasicMaterial( { color: Colors.white } );
    var circle1 = new THREE.Mesh( geoCircle1, matCircle1 );
    circle1.position.z = 15;
    topcockpit.add( circle1);

    var geoCircle2 = new THREE.CircleGeometry( 10, 32 );
    var circle2 = new THREE.Mesh( geoCircle2, matCircle1 );
    circle2.position.z = 24;
    circle2.position.y = -20;
    topcockpit.add( circle2);


    //bottom cone
    var bottomCockpit = new THREE.CylinderGeometry(27, 0, 80, 20, 1, true);
    var bottomcockpit = new THREE.Mesh(bottomCockpit, matCockpit);
    bottomcockpit.position.y = -40;
    bottomcockpit.castShadow = true;
    bottomcockpit.receiveShadow = true;
    this.mesh.add(bottomcockpit);


    // Create the leg
    var geoLeg = new THREE.BoxGeometry(10,10,10,1,1,1);
    var matLeg = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
    var leg1 = new THREE.Mesh(geoLeg, matLeg);
    leg1.position.x = -15;
    leg1.position.y = -55;
    leg1.rotation.z = -1.2;
    leg1.castShadow = true;
    leg1.receiveShadow = true;
    this.mesh.add(leg1);

    //create leg 2
    var leg2 = new THREE.Mesh(geoLeg, matLeg);
    leg2.position.x = 15;
    leg2.position.y = -55;
    leg2.rotation.z = 1.2;
    leg2.castShadow = true;
    leg2.receiveShadow = true;
    this.mesh.add(leg2);

    //create long leg1 
    var geoLongLeg = new THREE.CylinderGeometry(5.2,2,35,4,1,false, 0, 6.3);
    var matLongLeg = new THREE.MeshPhongMaterial({color:Colors.red, shading:THREE.FlatShading});
    var longLeg1 = new THREE.Mesh(geoLongLeg, matLongLeg);
    longLeg1.position.x = -20;
    longLeg1.position.y = -70;
    longLeg1.rotation.z = .4;
    longLeg1.castShadow = true;
    longLeg1.receiveShadow = true;
    this.mesh.add(longLeg1);

    //create long leg2
    var longLeg2 = new THREE.Mesh(geoLongLeg, matLongLeg);
    longLeg2.position.x = 20;
    longLeg2.position.y = -70;
    longLeg2.rotation.z = -.4;
    longLeg2.castShadow = true;
    longLeg2.receiveShadow = true;
    this.mesh.add(longLeg2);

    //create long leg 3
    var longLeg3 = new THREE.Mesh(geoLongLeg, matLongLeg);
    longLeg3.position.y = -70;
    longLeg3.position.z = 10;
    longLeg3.castShadow = true;
    longLeg3.receiveShadow = true;
    this.mesh.add(longLeg3);
    
   
};

var airplane;

function createSpaceship(){ 
    airplane = new AirPlane();
    airplane.mesh.scale.set(.25,.25,.25);
    airplane.mesh.position.y = 100;
    scene.add(airplane.mesh);
}

var heightCheck= (-1 * HEIGHT) - 100;

var mousePos={x:0, y:0};

// now handle the mousemove event

function handleMouseMove(event) {

    // here we are converting the mouse position value received 
    // to a normalized value varying between -1 and 1;
    // this is the formula for the horizontal axis:
    
    var tx = -1 + (event.clientX / WIDTH)*2;

    // for the vertical axis, we need to inverse the formula 
    // because the 2D y-axis goes the opposite direction of the 3D y-axis
    
    var ty = 1 - (event.clientY / HEIGHT)*2;
    mousePos = {x:tx, y:ty};

}

function loop(){
    // Rotate the propeller, the sea and the sky
    // airplane.propeller.rotation.x += 0.3;
    // sea.mesh.rotation.z += .005;

    for (i=0; i<cloudArray.length; i++){
        cloudArray[i].mesh.position.y += -3;
        if(cloudArray[i].mesh.position.y <= -1200){
            cloudArray[i].mesh.position.y = 1200;
        }
    }

    // update the plane on each frame
    updatePlane();
    // render the scene
    renderer.render(scene, camera);

    // call the loop function again
    requestAnimationFrame(loop);
}

function updatePlane(){

    var targetX = normalize(mousePos.x,-.75,.75,-100, 100);
    var targetY = normalize(mousePos.y,-.75,.75,-100, 100);
    
    // Move the plane at each frame by adding a fraction of the remaining distance
    airplane.mesh.position.x += (targetX-airplane.mesh.position.x)*0.1;

    // Rotate the plane proportionally to the remaining distance
    airplane.mesh.rotation.z = (targetX-airplane.mesh.position.x)*0.0075;
    airplane.mesh.rotation.y = (airplane.mesh.position.y-targetX)*0.0064;


}

function normalize(v,vmin,vmax,tmin, tmax){

    var nv = Math.max(Math.min(v,vmax), vmin);
    var dv = vmax-vmin;
    var pc = (nv-vmin)/dv;
    var dt = tmax-tmin;
    var tv = tmin + (pc*dt);
    return tv;

}



})();
