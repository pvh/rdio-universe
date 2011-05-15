function Universe() {
  log('creating the universe');

  this.stars = [];
  this.keyStarLookup = {};
  this.keyPlanetLookup = {};

  this.lastUpdate = new Date().getTime();

  this.renderer = null;
  this.projector = null;

  this.newCamera = new Camera();

  this.userInteracting = false;

  this.handlers = handlers.apply(this);

  this.mouse = {x: 0, y: 0};
  this.mouseOnDown = {x: 0, y: 0};
  this.targetOnDown = {x: 0, y: 0};
  this.createRenderer();
}

Universe.prototype.createRenderer = function() {

  var self = this;

  this.scene = new THREE.Scene();
  this.scene.fog = new THREE.FogExp2(0x000000, 0.00015);

  this.scene.addObject(this.newCamera.dummyTarget);


  var ambientLight = new THREE.AmbientLight(0xcccccc);
  this.scene.addLight(ambientLight);

  /*var directionalLight = new THREE.DirectionalLight( 0xffffff, 1.5 );
  directionalLight.position.x = 1;
  directionalLight.position.y = 1;
  directionalLight.position.z = 0.5;
  directionalLight.position.normalize();
  this.scene.addLight( directionalLight );*/

  this.projector = new THREE.Projector();

  this.renderer = new THREE.WebGLRenderer({clearAlpha: 1});
  this.renderer.setSize( window.innerWidth, window.innerHeight );

  document.getElementById('scene').appendChild( this.renderer.domElement );

  this.update();

  document.addEventListener('mousedown', this.handlers.handleMouseDown, false);
  document.addEventListener('mousewheel', this.handlers.handleMouseWheel, false);
  document.addEventListener('mouseover', function() {
    self.overRenderer = true;
  }, false);
  document.addEventListener('mouseout', function() {
    self.overRenderer = false;
  }, false);
};

var handlers = function() {
  var self = this;
  return {
    handleMouseDown: function() {
      self.handleMouseDown.apply(self, arguments);
    },
    handleMouseUp: function() {
      self.handleMouseUp.apply(self, arguments);
    },
    handleMouseMove: function() {
      self.handleMouseMove.apply(self, arguments);
    },
    handleMouseOut: function() {
      self.handleMouseOut.apply(self, arguments);
    },
    handleMouseWheel: function() {
      self.handleMouseWheel.apply(self, arguments);
    }
  };
};

Universe.prototype.handleMouseWheel = function(event) {
  event.preventDefault();
  if(this.overRenderer) {
    this.newCamera.zoom(event.wheelDeltaY * 0.3);
  }
  return false;
};

Universe.prototype.handleMouseOut = function(event) {
  document.removeEventListener('mouseup', this.handlers.handleMouseUp, false);
  document.removeEventListener('mousemove', this.handlers.handleMouseMove, false);
  document.removeEventListener('mouseout', this.handlers.handleMouseOut, false);
};

Universe.prototype.handleMouseUp = function(event) {
  event.preventDefault();

  // if mouse was moved less than threshold, act like it was a click
  var threshold = 20;
  var distanceX = Math.abs(- event.clientX - this.mouseOnDown.x);
  var distanceY = Math.abs(event.clientY - this.mouseOnDown.y);
  if(distanceX < threshold || distanceY < threshold) {
    var clickedObject = this.getIntersectingObject(event);
    if(clickedObject) {
      if(clickedObject.star) {
        clickedObject.star.handleClick();
        this.zoomToStar(clickedObject.star);
      } else if(clickedObject.planet) {
        clickedObject.planet.handleClick();
      }
    }
  }

  document.removeEventListener('mouseup', this.handlers.handleMouseUp, false);
  document.removeEventListener('mousemove', this.handlers.handleMouseMove, false);
  document.removeEventListener('mouseout', this.handlers.handleMouseOut, false);

  document.body.style.cursor = 'auto';
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

var PI_HALF = Math.PI / 2;

Universe.prototype.handleMouseMove = function(event) {
  this.mouse.x = - event.clientX;
  this.mouse.y = event.clientY;

  var zoomDamp = this.newCamera.distance/1000;

  this.newCamera.target.x = this.targetOnDown.x + (this.mouse.x - this.mouseOnDown.x) * 0.005 * zoomDamp;
  this.newCamera.target.y = this.targetOnDown.y + (this.mouse.y - this.mouseOnDown.y) * 0.005 * zoomDamp;

  this.newCamera.target.y = this.newCamera.target.y > PI_HALF ? PI_HALF : this.newCamera.target.y;
  this.newCamera.target.y = this.newCamera.target.y < - PI_HALF ? - PI_HALF : this.newCamera.target.y;
};

Universe.prototype.getIntersectingObject = function(event) {
  var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );

  this.projector.unprojectVector( vector, this.newCamera.camera );

  var ray = new THREE.Ray( this.newCamera.camera.position, vector.subSelf( this.newCamera.camera.position ).normalize() );

  var intersects = ray.intersectScene( this.scene );

  if ( intersects.length > 0 ) {
    var clickedObject = intersects[0].object;
    return clickedObject;
  }
  return null;
};

Universe.prototype.handleMouseDown = function(event) {
  event.preventDefault();

  document.addEventListener('mousemove', this.handlers.handleMouseMove, false);
  document.addEventListener('mouseup', this.handlers.handleMouseUp, false);
  document.addEventListener('mouseout', this.handlers.handleMouseOut, false);

  var self = this;

  this.userInteracting = true;

  this.mouseOnDown.x = - event.clientX;
  this.mouseOnDown.y = event.clientY;

  this.targetOnDown.x = this.newCamera.target.x;
  this.targetOnDown.y = this.newCamera.target.y;

  document.body.style.cursor = 'move';
};


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
