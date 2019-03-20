/* global THREE */

class ColorTester {
  raycaster = new THREE.Raycaster();
  currentRaycastData = {};
  screen = {};

  constructor(_camera, _target) {
    this.handleResize();
    this.camera = _camera;
    this.object = _target;
  }

  destroy() {
    document.removeEventListener(
      "pointermove",
      this.mouseMove.bind(this),
      false
    );
    window.removeEventListener("resize", this.handleResize.bind(this), false);
  }

  setTestTexture(_texture) {
    this.map = _texture || this.object.material.map;

    if (this.map.image instanceof HTMLCanvasElement) {
      this.canvas = this.map.image;
      this.ctx = this.canvas.getContext("2d");
    } else {
      this.createCanvasTexture(this.map);
    }
  }

  createCanvasTexture(orig) {
    if (!this.canvas) this.canvas = document.createElement("canvas");

    this.ctx = this.canvas.getContext("2d");

    this.canvas.width = orig.image.width;
    this.canvas.height = orig.image.height;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(orig.image, 0, 0);

    return this.canvas;
  }

  raycastColor(event) {
    var screen = this.getMouseOnScreen(event.clientX, event.clientY);
    var interesects = this.getIntersect(screen, this.object);
    if (interesects.length === 0) return null;

    var uv = interesects[0].uv;
    this.object.material.map.transformUv(uv);

    var x = (uv.x * this.canvas.width) >> 0;
    var y = (uv.y * this.canvas.height) >> 0;

    this.currentRaycastData.point = {
      x: interesects[0].point.x,
      y: interesects[0].point.y
    };
    this.currentRaycastData.texturePoint = { x: x, y: y };

    var data = this.ctx.getImageData(x, y, 1, 1).data;

    if (data[3] < 10) return null;

    return new THREE.Color(data[0] / 255, data[1] / 255, data[2] / 255);
  }

  getIntersect(point, object) {
    var mouse = new THREE.Vector2(point.x * 2 - 1, -(point.y * 2) + 1);
    this.raycaster.setFromCamera(mouse, this.camera);
    return this.raycaster.intersectObject(object);
  }

  getMouseOnScreen(clientX, clientY) {
    return new THREE.Vector2(
      clientX / this.screen.width,
      clientY / this.screen.height
    );
  }

  handleResize() {
    this.screen.width = window.innerWidth;
    this.screen.height = window.innerHeight;
  }

  // так как в ThreeJS прикол с цветами и они разные
  colorEq(a, b, epsilon = 3) {
    var summ = Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);

    return summ <= epsilon / 256.0;
  }
}
