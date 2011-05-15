function Input(camera, universe) {
  var self = this;

  this.newCamera = camera;
  this.universe = universe;
  this.userInteracting = false;
  this.handlers = handlers.apply(self);
  this.mouse = {x: 0, y: 0};
  this.mouseOnDown = {x: 0, y: 0};
  this.targetOnDown = {x: 0, y: 0};

  document.addEventListener('mousedown', this.handlers.handleMouseDown, false);
  document.addEventListener('mousewheel', this.handlers.handleMouseWheel, false);
  document.addEventListener('mouseover', function() {
    self.overRenderer = true;
  }, false);
  document.addEventListener('mouseout', function() {
    self.overRenderer = false;
  }, false);

  this.projector = null;
  this.projector = new THREE.Projector();
}

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

Input.prototype.handleMouseWheel = function(event) {
  event.preventDefault();
  if(this.overRenderer) {
    this.newCamera.zoom(event.wheelDeltaY * 0.3);
  }
  return false;
};

Input.prototype.handleMouseOut = function(event) {
  document.removeEventListener('mouseup', this.handlers.handleMouseUp, false);
  document.removeEventListener('mousemove', this.handlers.handleMouseMove, false);
  document.removeEventListener('mouseout', this.handlers.handleMouseOut, false);
};

Input.prototype.handleMouseUp = function(event) {
  event.preventDefault();

  // if mouse was moved less than threshold, act like it was a click
  var threshold = 20;
  var distanceX = Math.abs(- event.clientX - this.mouseOnDown.x);
  var distanceY = Math.abs(event.clientY - this.mouseOnDown.y);
  if(distanceX < threshold || distanceY < threshold) {
    var clickedObject = this.getIntersectingObject(event);
    this.universe.clickedObject(clickedObject);
  }

  document.removeEventListener('mouseup', this.handlers.handleMouseUp, false);
  document.removeEventListener('mousemove', this.handlers.handleMouseMove, false);
  document.removeEventListener('mouseout', this.handlers.handleMouseOut, false);

  document.body.style.cursor = 'auto';
};

var PI_HALF = Math.PI / 2;

Input.prototype.handleMouseMove = function(event) {
  this.mouse.x = - event.clientX;
  this.mouse.y = event.clientY;

  var zoomDamp = this.newCamera.distance/1000;

  this.newCamera.target.x = this.targetOnDown.x + (this.mouse.x - this.mouseOnDown.x) * 0.005 * zoomDamp;
  this.newCamera.target.y = this.targetOnDown.y + (this.mouse.y - this.mouseOnDown.y) * 0.005 * zoomDamp;

  this.newCamera.target.y = this.newCamera.target.y > PI_HALF ? PI_HALF : this.newCamera.target.y;
  this.newCamera.target.y = this.newCamera.target.y < - PI_HALF ? - PI_HALF : this.newCamera.target.y;
};

Input.prototype.getIntersectingObject = function(event) {
  var vector = new THREE.Vector3(
      ( event.clientX / window.innerWidth ) * 2 - 1,
      - ( event.clientY / window.innerHeight ) * 2 + 1,
      0.5 );

  this.projector.unprojectVector( vector, this.newCamera.camera );

  var ray = new THREE.Ray( this.newCamera.camera.position, vector.subSelf( this.newCamera.camera.position ).normalize() );

  var intersects = ray.intersectScene( this.universe.scene );

  if ( intersects.length > 0 ) {
    var clickedObject = intersects[0].object;
    return clickedObject;
  }
  return null;
};

Input.prototype.handleMouseDown = function(event) {
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


