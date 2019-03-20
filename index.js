/* global THREE */
/* global ColorTester */

/*
Описание панорамы.
texture - сама панорама
ciolors - текстура с цветовой разметкой. черный = null
elements - объект, ключами которого является цвет на текстуре colors

*/
const MAP = {
  texture: "./maps/map.jpg",
  colors: "./maps/map_colors.jpg",
  elements: {
    ["#ff0000"]: {
      name: "Window 1",
      description: "Window Description"
    },
    ["#800000"]: {
      name: "Window 2",
      description: "Window 2 Description"
    },
    ["#400000"]: {
      name: "Window 3",
      description: "Window 3 Description"
    },
    ["#300000"]: {
      name: "Window 4",
      description: "Window 4 Description"
    },
    ["#00ff00"]: {
      name: "Дверь",
      description: "Дверь как дверь"
    },
    ["#0000ff"]: {
      name: "Комод",
      description: "Обычный старый комод"
    }
  }
};

let infoElement = document.querySelector("#description"),
  infoName = document.querySelector("#name"),
  infoDesc = document.querySelector("#desc");

var camera, scene, renderer, colorTester, colorMap;

var isUserInteracting = false,
  onMouseDownMouseX = 0,
  onMouseDownMouseY = 0,
  lon = 0,
  onMouseDownLon = 0,
  lat = 0,
  onMouseDownLat = 0,
  phi = 0,
  theta = 0;

init();
animate();

function init() {
  var container, mesh;

  container = document.getElementById("container");

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    1,
    1100
  );
  camera.target = new THREE.Vector3(0, 0, 0);

  scene = new THREE.Scene();

  var geometry = new THREE.SphereGeometry(500, 60, 40);
  geometry.scale(-1, 1, 1);

  var material = new THREE.MeshBasicMaterial({
    map: new THREE.TextureLoader().load(MAP.texture)
  });

  mesh = new THREE.Mesh(geometry, material);

  scene.add(mesh);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  document.addEventListener("mousedown", onDocumentMouseDown, false);
  document.addEventListener("mousemove", onDocumentMouseMove, false);
  document.addEventListener("mouseup", onDocumentMouseUp, false);
  document.addEventListener("wheel", onDocumentMouseWheel, false);

  // create color tester
  // see colorTester.js
  //mesh - наша сфера, на которой панорама
  colorTester = new ColorTester(camera, mesh);
  const loader = new THREE.TextureLoader();

  //загружаем карту цветов и скармливаем тестеру
  loader.load(MAP.colors, t => {
    colorTester.setTestTexture(t);
  });
  //

  window.addEventListener("resize", onWindowResize, false);
}

// получаем из цвета - объект, используя неточное сравнение
// так как есть погрешность при сжатии

function mapColorToObject(color, pairs) {
  for (let name in pairs) {
    const c = new THREE.Color(name);
    if (colorTester.colorEq(lastIntersectedColor, c, 3)) {
      return pairs[name];
    }
  }

  return undefined;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

let onPointerDownPointerX,
  onPointerDownPointerY,
  onPointerDownLon,
  onPointerDownLat;

let lastIntersectedColor = undefined;

function onDocumentMouseDown(event) {
  event.preventDefault();

  isUserInteracting = true;

  onPointerDownPointerX = event.clientX;
  onPointerDownPointerY = event.clientY;

  onPointerDownLon = lon;
  onPointerDownLat = lat;

  lastIntersectedColor = colorTester.raycastColor(event);

  // игнорируем черный цвет
  if (lastIntersectedColor.getHex() < 10) {
    lastIntersectedColor = undefined;
    infoElement.style.display = "none";
  }
}

function onDocumentMouseMove(event) {
  if (isUserInteracting === true) {
    lon = (onPointerDownPointerX - event.clientX) * 0.1 + onPointerDownLon;
    lat = (event.clientY - onPointerDownPointerY) * 0.1 + onPointerDownLat;
  }

  const isNotBlack = colorTester.raycastColor(event).getHex() > 10;

  renderer.domElement.style.cursor = isNotBlack ? "pointer" : "";
}

function onDocumentMouseUp(event) {
  isUserInteracting = false;

  const color = colorTester.raycastColor(event);

  if (
    lastIntersectedColor &&
    color.getHex() > 10 &&
    colorTester.colorEq(lastIntersectedColor, color)
  ) {
    const e = mapColorToObject(lastIntersectedColor, MAP.elements);
    if (e) {
      infoElement.style.display = "";
      infoElement.style.top = event.clientY + "px";
      infoElement.style.left = event.clientX + "px";
      infoDesc.innerHTML = e.description;
      infoName.innerHTML = e.name;
    }
  }
}

function onDocumentMouseWheel(event) {
  camera.fov += event.deltaY * 0.05;
  camera.fov = Math.max(30, Math.min(camera.fov, 120));
  camera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);
  update();
}

function update() {
  if (isUserInteracting === false) {
    //lon += 0.1;
  }

  lat = Math.max(-85, Math.min(85, lat));
  phi = THREE.Math.degToRad(90 - lat);
  theta = THREE.Math.degToRad(lon);

  camera.target.x = 500 * Math.sin(phi) * Math.cos(theta);
  camera.target.y = 500 * Math.cos(phi);
  camera.target.z = 500 * Math.sin(phi) * Math.sin(theta);

  camera.lookAt(camera.target);

  renderer.render(scene, camera);
}
