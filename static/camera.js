function Camera() {
  var self = this;

  this.lastUpdate = new Date().getTime();

  this.camera = new THREE.Camera(70, window.innerWidth / window.innerHeight, 1, 50000);
  this.cameraBase = {x: 0, y: 0, z: 0};
  this.rotation = {x: 0, y: 0};
  this.target = {x: Math.PI * 3/2, y: Math.PI / 6.0};
  this.cameraPath = null;
  this.cameraTargetPath = null;
  this.cameraPathStartTime = null;

  this.camera.position.x = 0;
  this.camera.position.y = 0;
  this.camera.position.z = -5000;

  this.distanceTarget = 100000;
  this.distance = this.distanceTarget;

  // dummy object for the camera to track
  var geometry = new THREE.Cube(1, 1, 1);
  var material = new THREE.MeshBasicMaterial();
  this.dummyTarget = new THREE.Mesh(geometry, material);
  this.dummyTarget.materials[0].opacity = 0;
  this.dummyTarget.position.x = 0;
  this.dummyTarget.position.y = 0;
  this.dummyTarget.position.z = 0;
  this.camera.target = this.dummyTarget;
}

Camera.prototype.zoomToDestination = function(destination) {
  var waypoints = [
    [this.cameraBase.x, this.cameraBase.y, this.cameraBase.z],
    destination
  ];
  log('waypoints: ',waypoints);

  var cameraSpline = new THREE.Spline();
  cameraSpline.initFromArray(waypoints);
  this.cameraPath = cameraSpline;

  waypoints = [
    [this.dummyTarget.position.x, this.dummyTarget.position.y, this.dummyTarget.position.z],
    destination
  ];

  var cameraTargetSpline = new THREE.Spline();
  cameraTargetSpline.initFromArray(waypoints);
  this.cameraTargetPath = cameraTargetSpline;

  this.distanceTarget = 300;
};

Camera.prototype.zoom = function(delta) {
  this.distanceTarget -= delta;
  this.distanceTarget = this.distanceTarget > 10000 ? 10000 : this.distanceTarget;
  this.distanceTarget = this.distanceTarget < 250 ? 250 : this.distanceTarget;
};

var cameraMoveTime = 1000;

Camera.prototype.update = function() {
  this.rotation.x += (this.target.x - this.rotation.x) * 0.1;
  this.rotation.y += (this.target.y - this.rotation.y) * 0.1;
  this.distance += (this.distanceTarget - this.distance) * 0.03;

  var time = new Date().getTime();
  this.tdiff = (time - this.lastUpdate) / 1000;
  this.lastUpdate = time;

  if(this.cameraPath) {
    if(!this.cameraPathStart) {
      this.cameraPathStart = time;
    }

    if(time - this.cameraPathStart > cameraMoveTime) {
      // final step, move to end of spline and unset cameraPath
      this.cameraPath = null;
      this.cameraPathStart = null;
    } else {

      var moment = (time - this.cameraPathStart) / cameraMoveTime;
      var point = this.cameraPath.getPoint(moment);

      this.cameraBase.x = point.x;
      this.cameraBase.y = point.y;
      this.cameraBase.z = point.z;

      point = this.cameraTargetPath.getPoint(moment);
      this.dummyTarget.position.x = point.x;
      this.dummyTarget.position.y = point.y;
      this.dummyTarget.position.z = point.z;
    }
  }

  this.camera.position.x = this.cameraBase.x +
    this.distance * Math.sin(this.rotation.x) * Math.cos(this.rotation.y);
  this.camera.position.y = this.cameraBase.y +
    this.distance * Math.sin(this.rotation.y);
  this.camera.position.z = this.cameraBase.z +
    this.distance * Math.cos(this.rotation.x) * Math.cos(this.rotation.y);
}

