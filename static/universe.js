function Universe() {
  log('creating the universe');

  this.stars = [];
  this.keyStarLookup = {};
  this.keyPlanetLookup = {};

  this.renderer = null;

  this.createRenderer();
}

Universe.prototype.createRenderer = function() {

  var self = this;

  this.scene = new THREE.Scene();
  this.scene.fog = new THREE.FogExp2(0x000000, 0.00015);

  this.newCamera = new Camera();
  this.input = new Input(this.newCamera, this);

  this.scene.addObject(this.newCamera.dummyTarget);


  var ambientLight = new THREE.AmbientLight(0xcccccc);
  this.scene.addLight(ambientLight);

  /*var directionalLight = new THREE.DirectionalLight( 0xffffff, 1.5 );
  directionalLight.position.x = 1;
  directionalLight.position.y = 1;
  directionalLight.position.z = 0.5;
  directionalLight.position.normalize();
  this.scene.addLight( directionalLight );*/


  this.renderer = new THREE.WebGLRenderer({clearAlpha: 1});
  this.renderer.setSize( window.innerWidth, window.innerHeight );

  document.getElementById('scene').appendChild( this.renderer.domElement );

  this.update();

};

Universe.prototype.zoomToStar = function(star) {
  if (this.zoomedStar == star) return;

  if(this.zoomedStar) {
    this.zoomedStar.hidePlanets();
  }
  this.zoomedStar = star;

  log('moving to star at position ',star.mesh.position);

  var destination = [
    star.mesh.position.x,
    star.mesh.position.y,
    star.mesh.position.z,
  ];

  this.newCamera.zoomToDestination(destination)

  star.showPlanets();
}

Universe.prototype.hasPlanet = function(key) {
  if(this.keyPlanetLookup[key]) {
    return true;
  }
  return false;
};

Universe.prototype.addPlanet = function(obj) {
  log('universe added planet ' + obj.key);
  if(!this.hasStar(obj.artistKey)) {
    this.addStar(obj);
  }
  var star = this.keyStarLookup[obj.artistKey];
  var newPlanet = new Planet(star, obj);
  star.addPlanet(newPlanet);
  this.keyPlanetLookup[obj.key] = newPlanet;
};

Universe.prototype.hasStar = function(key) {
  if(this.keyStarLookup[key]) {
    return true;
  }
  return false;
};

Universe.prototype.addStar = function(obj) {
  log('universe added star ' + obj.key);
  var newStar = new Star(this, this.scene, obj);
  this.stars.push(newStar);
  this.keyStarLookup[obj.artistKey] = newStar;
};

Universe.prototype.update = function() {
  var self = this;
  requestAnimationFrame(function() {
    self.update();
  });

  for (var i = 0; i < this.stars.length; i++) {
    var star = this.stars[i];
    star.update()
  }
  this.newCamera.zoom(0);
  
  this.newCamera.update();

  this.renderer.render(this.scene, this.newCamera.camera);
};
