const state = {
  lang: "es",
  leaderIdx: 0,
  currentCountry: "",
  mode: "cover", // cover | foot | drive | heli | fly
  xp: 0,
  level: 1,
  vipHealth: 100,
  gyroEnabled: false,
  tiltX: 0,
  tiltY: 0,
  joyX: 0,
  joyY: 0,
  decisionTriggered: false
};

// --- RENDERIZADOR Y ESTÉTICA DIURNA GTA ---
const canvas = document.getElementById("game-canvas");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 420);

const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene();
envScene.background = new THREE.Color(0x93c5fd);
const envGround = new THREE.Mesh(
  new THREE.PlaneGeometry(50, 50),
  new THREE.MeshBasicMaterial({ color: 0x334155 })
);
envGround.rotation.x = -Math.PI / 2;
envGround.position.y = -2;
envScene.add(envGround);
scene.environment = pmrem.fromScene(envScene).texture;

const hemi = new THREE.HemisphereLight(0xe0f2fe, 0x475569, 0.88);
scene.add(hemi);

const sun = new THREE.DirectionalLight(0xfff1d0, 1.75);
sun.position.set(35, 55, 28);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.near = 5;
sun.shadow.camera.far = 160;
const d = 48;
sun.shadow.camera.left = -d;
sun.shadow.camera.right = d;
sun.shadow.camera.top = d;
sun.shadow.camera.bottom = -d;
scene.add(sun);

// --- TEXTURAS PROCEDURALES ---
function makeRoadTexture(country) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");
  ctx.fillStyle = country === "ru" ? "#1e2430" : "#262b34";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1600; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.09)";
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  ctx.fillStyle = country === "ru" ? "#f8fafc" : "#facc15";
  ctx.fillRect(123, 0, 3, 256);
  ctx.fillRect(130, 0, 3, 256);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(10, 0, 4, 256);
  ctx.fillRect(242, 0, 4, 256);
  ctx.fillRect(66, 20, 3, 90);
  ctx.fillRect(187, 20, 3, 90);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 28);
  return tex;
}

function makeFlagTexture(country) {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 80;
  const ctx = c.getContext("2d");
  if (country === "ru") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 128, 27);
    ctx.fillStyle = "#1d4ed8";
    ctx.fillRect(0, 27, 128, 26);
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(0, 53, 128, 27);
  } else if (country === "cn") {
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(0, 0, 128, 80);
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(24, 24, 9, 0, Math.PI * 2);
    ctx.fill();
    [42, 46, 46, 42].forEach((x, i) => {
      ctx.beginPath();
      ctx.arc(x, 12 + i * 9, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    for (let i = 0; i < 13; i++) {
      ctx.fillStyle = i % 2 === 0 ? "#b91c1c" : "#ffffff";
      ctx.fillRect(0, i * (80 / 13), 128, 80 / 13);
    }
    ctx.fillStyle = "#1e3a8a";
    ctx.fillRect(0, 0, 56, 43);
  }
  return new THREE.CanvasTexture(c);
}

// --- CONSTRUCCIÓN DE MONUMENTOS Y PAISAJES POR PAÍS ---
const worldGroup = new THREE.Group();
scene.add(worldGroup);

function buildWhiteHouseLandmark() {
  const g = new THREE.Group();
  const marble = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });
  const trim = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.45 });
  const winMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });

  // Cuerpo principal de La Casa Blanca y alas
  const mainBlock = new THREE.Mesh(new THREE.BoxGeometry(22, 8.5, 10), marble);
  mainBlock.position.y = 4.25;
  mainBlock.castShadow = true;
  g.add(mainBlock);

  const wings = new THREE.Mesh(new THREE.BoxGeometry(38, 4.5, 6), trim);
  wings.position.y = 2.25;
  g.add(wings);

  // Pórtico neoclásico con 6 columnas y frontón triangular
  const porticoRoof = new THREE.Mesh(new THREE.BoxGeometry(8.5, 0.7, 3.2), marble);
  porticoRoof.position.set(0, 7.6, 6.2);
  g.add(porticoRoof);

  const pediment = new THREE.Mesh(new THREE.ConeGeometry(4.6, 2.1, 4), marble);
  pediment.rotation.y = Math.PI / 4;
  pediment.scale.set(1.25, 1, 0.55);
  pediment.position.set(0, 8.9, 6.2);
  g.add(pediment);

  for (let i = -2.5; i <= 2.5; i += 1.0) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 7.3, 12), marble);
    col.position.set(i * 1.35, 3.65, 7.3);
    g.add(col);
  }

  // Ventanas simétricas
  for (let x = -9; x <= 9; x += 2.2) {
    if (Math.abs(x) < 3.6) continue;
    [2.6, 5.6].forEach((y) => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.4, 0.15), winMat);
      w.position.set(x, y, 5.05);
      g.add(w);
    });
  }

  // Mástil y bandera de EE. UU. en la azotea
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 4.2, 8), trim);
  mast.position.set(0, 10.6, 0);
  g.add(mast);

  const flag = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.4),
    new THREE.MeshBasicMaterial({ map: makeFlagTexture("us"), side: THREE.DoubleSide })
  );
  flag.position.set(1.2, 11.8, 0);
  g.add(flag);

  // Fuente del South Lawn
  const fountain = new THREE.Mesh(
    new THREE.CylinderGeometry(3.2, 3.4, 0.45, 20),
    new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.2, metalness: 0.4 })
  );
  fountain.position.set(0, 0.25, 13.5);
  g.add(fountain);

  return g;
}

function buildKremlinLandmark() {
  const g = new THREE.Group();
  const redBrick = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.65 });
  const whiteStone = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
  const greenRoof = new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.4 });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.2 });

  // Muralla roja del Kremlin con almenas
  const wall = new THREE.Mesh(new THREE.BoxGeometry(42, 6.2, 3.5), redBrick);
  wall.position.set(0, 3.1, 0);
  wall.castShadow = true;
  g.add(wall);

  for (let x = -20; x <= 20; x += 2.0) {
    const merlon = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 3.6), redBrick);
    merlon.position.set(x, 6.7, 0);
    g.add(merlon);
  }

  // Torre Spasskaya con reloj dorado y Estrella Rubí
  const baseTower = new THREE.Mesh(new THREE.BoxGeometry(6.2, 12.5, 6.2), redBrick);
  baseTower.position.set(0, 6.25, 1.2);
  g.add(baseTower);

  const whiteTier = new THREE.Mesh(new THREE.BoxGeometry(5.2, 4.2, 5.2), whiteStone);
  whiteTier.position.set(0, 14.5, 1.2);
  g.add(whiteTier);

  const clock = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.3, 20), goldMat);
  clock.rotation.x = Math.PI / 2;
  clock.position.set(0, 11.2, 4.35);
  g.add(clock);

  const spire = new THREE.Mesh(new THREE.ConeGeometry(3.2, 8.5, 8), greenRoof);
  spire.position.set(0, 20.8, 1.2);
  g.add(spire);

  const rubyStar = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.95, 0),
    new THREE.MeshBasicMaterial({ color: 0xef4444 })
  );
  rubyStar.position.set(0, 25.8, 1.2);
  g.add(rubyStar);

  // Cúpulas bulbosas estilo San Basilio al costado
  [
    { x: -13, c: 0x2563eb, h: 11 },
    { x: -16.5, c: 0xfacc15, h: 9.5 },
    { x: 14, c: 0x16a34a, h: 10.5 }
  ].forEach((dInfo) => {
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, dInfo.h, 14), whiteStone);
    drum.position.set(dInfo.x, dInfo.h / 2, -2);
    g.add(drum);
    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(2.1, 16, 16),
      new THREE.MeshStandardMaterial({ color: dInfo.c, roughness: 0.3, metalness: 0.4 })
    );
    dome.scale.set(1, 1.35, 1);
    dome.position.set(dInfo.x, dInfo.h + 1.4, -2);
    g.add(dome);
  });

  return g;
}

function buildTiananmenLandmark() {
  const g = new THREE.Group();
  const crimson = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 });
  const goldRoof = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.45, roughness: 0.25 });
  const marble = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.35 });

  // Plataforma monumental roja con 5 arcos
  const baseWall = new THREE.Mesh(new THREE.BoxGeometry(38, 6.8, 8.5), crimson);
  baseWall.position.set(0, 3.4, 0);
  baseWall.castShadow = true;
  g.add(baseWall);

  [-9, -4.5, 0, 4.5, 9].forEach((x) => {
    const arch = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 3.6, 8.7),
      new THREE.MeshBasicMaterial({ color: 0x0f172a })
    );
    arch.position.set(x, 1.8, 0);
    g.add(arch);
  });

  // Pabellón superior con columnas rojas y doble tejado dorado imperial
  const hall = new THREE.Mesh(new THREE.BoxGeometry(28, 4.5, 6.2), crimson);
  hall.position.set(0, 9.0, 0);
  g.add(hall);

  const lowerRoof = new THREE.Mesh(new THREE.ConeGeometry(22, 2.8, 4), goldRoof);
  lowerRoof.rotation.y = Math.PI / 4;
  lowerRoof.scale.set(1.3, 1, 0.42);
  lowerRoof.position.set(0, 12.1, 0);
  g.add(lowerRoof);

  const upperRoof = new THREE.Mesh(new THREE.ConeGeometry(16, 2.6, 4), goldRoof);
  upperRoof.rotation.y = Math.PI / 4;
  upperRoof.scale.set(1.25, 1, 0.4);
  upperRoof.position.set(0, 14.3, 0);
  g.add(upperRoof);

  // Faroles rojos imperiales colgantes
  for (let x = -11; x <= 11; x += 4.4) {
    const lantern = new THREE.Mesh(
      new THREE.SphereGeometry(0.65, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    lantern.position.set(x, 9.6, 3.6);
    g.add(lantern);
  }

  // Columnas ceremoniales Huabiao de mármol blanco
  [-13, 13].forEach((x) => {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 9.5, 14), marble);
    col.position.set(x, 4.75, 7.5);
    g.add(col);
  });

  return g;
}

const traffic = [];
function createWheel(radius = 0.44, width = 0.3) {
  const wheel = new THREE.Group();
  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, width, 18),
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 })
  );
  tire.rotation.z = Math.PI / 2;
  wheel.add(tire);

  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.62, radius * 0.62, width + 0.02, 14),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 })
  );
  rim.rotation.z = Math.PI / 2;
  wheel.add(rim);
  return wheel;
}

function createTrafficCar(colorHex) {
  const car = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({
    color: colorHex,
    metalness: 0.65,
    roughness: 0.22,
    clearcoat: 1.0
  });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.72, 4.4), paint);
  body.position.y = 0.68;
  body.castShadow = true;
  car.add(body);

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.72, 0.56, 2.2),
    new THREE.MeshPhysicalMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.1, clearcoat: 1 })
  );
  cabin.position.set(0, 1.28, -0.15);
  car.add(cabin);

  const hlMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
  const tlMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  [-0.68, 0.68].forEach((x) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.16, 0.08), hlMat);
    hl.position.set(x, 0.72, 2.21);
    car.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.08), tlMat);
    tl.position.set(x, 0.74, -2.21);
    car.add(tl);
  });

  const wheels = [];
  [[-0.96, 1.35], [0.96, 1.35], [-0.96, -1.35], [0.96, -1.35]].forEach(([x, z]) => {
    const w = createWheel(0.4, 0.26);
    w.position.set(x, 0.4, z);
    car.add(w);
    wheels.push(w);
  });
  car.userData.wheels = wheels;
  return car;
}

function rebuildWorld(country) {
  while (worldGroup.children.length) worldGroup.remove(worldGroup.children[0]);
  traffic.length = 0;

  // Atmósfera y cielo según país
  if (country === "ru") {
    scene.background = new THREE.Color(0x93c5fd);
    scene.fog = new THREE.FogExp2(0xcbd5e1, 0.006);
  } else if (country === "cn") {
    scene.background = new THREE.Color(0xfcd34d);
    scene.fog = new THREE.FogExp2(0xfef08a, 0.0055);
  } else {
    scene.background = new THREE.Color(0x7dd3fc);
    scene.fog = new THREE.FogExp2(0xbae6fd, 0.006);
  }

  // Terreno base (césped Washington, nieve Moscú, plaza Pekín)
  const groundColor = country === "ru" ? 0xe2e8f0 : country === "cn" ? 0xd6d3d1 : 0x3f6212;
  const terrain = new THREE.Mesh(
    new THREE.PlaneGeometry(380, 380),
    new THREE.MeshStandardMaterial({ color: groundColor, roughness: 0.88 })
  );
  terrain.rotation.x = -Math.PI / 2;
  terrain.receiveShadow = true;
  worldGroup.add(terrain);

  // Acera y avenida principal
  const sidewalk = new THREE.Mesh(
    new THREE.BoxGeometry(28, 0.25, 380),
    new THREE.MeshStandardMaterial({ color: country === "cn" ? 0xe7e5e4 : 0x94a3b8, roughness: 0.82 })
  );
  sidewalk.position.y = 0.12;
  worldGroup.add(sidewalk);

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 380),
    new THREE.MeshStandardMaterial({ map: makeRoadTexture(country), roughness: 0.55, metalness: 0.12 })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.26;
  road.receiveShadow = true;
  worldGroup.add(road);

  // Monumento oficial al costado de la avenida
  let landmark;
  if (country === "ru") landmark = buildKremlinLandmark();
  else if (country === "cn") landmark = buildTiananmenLandmark();
  else landmark = buildWhiteHouseLandmark();

  landmark.position.set(-28, 0.25, -14);
  landmark.rotation.y = Math.PI / 2;
  worldGroup.add(landmark);

  // Edificios de la capital al otro lado
  const bColor = country === "ru" ? 0x94a3b8 : country === "cn" ? 0xb45309 : 0xcbd5e1;
  const bMat = new THREE.MeshStandardMaterial({ color: bColor, roughness: 0.45, metalness: 0.25 });
  for (let i = 0; i < 24; i++) {
    const h = 14 + (i % 5) * 6;
    const b = new THREE.Mesh(new THREE.BoxGeometry(10, h, 10), bMat);
    b.position.set(26 + (i % 2) * 12, h / 2, -130 + i * 12);
    b.castShadow = true;
    worldGroup.add(b);
  }

  // Tráfico GTA
  const gtaColors = [0x0284c7, 0xdc2626, 0xf59e0b, 0x10b981, 0xf8fafc, 0x6366f1];
  for (let i = 0; i < 8; i++) {
    const c = createTrafficCar(gtaColors[i % gtaColors.length]);
    const laneX = i % 2 === 0 ? -5.8 : 5.8;
    c.position.set(laneX, 0.26, -110 + i * 28);
    if (i % 2 !== 0) c.rotation.y = Math.PI;
    worldGroup.add(c);
    traffic.push({ mesh: c, speed: i % 2 === 0 ? 0.34 : -0.34 });
  }
}

// --- FLOTA PRESIDENCIAL DIFERENCIADA POR PAÍS ---
function createPresidentialLimo(leader) {
  const limo = new THREE.Group();
  const armorPaint = new THREE.MeshPhysicalMaterial({
    color: 0x090d16,
    metalness: 0.85,
    roughness: 0.14,
    clearcoat: 1.0
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x020617,
    metalness: 0.9,
    roughness: 0.08,
    clearcoat: 1.0
  });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.95, roughness: 0.12 });

  const length = leader.country === "cn" ? 7.3 : 6.8;
  const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.8, length), armorPaint);
  lowerBody.position.y = 0.8;
  lowerBody.castShadow = true;
  limo.add(lowerBody);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.06, 0.64, length * 0.62), glassMat);
  cabin.position.set(0, 1.46, -0.35);
  limo.add(cabin);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.1, length * 0.6), armorPaint);
  roof.position.set(0, 1.78, -0.35);
  limo.add(roof);

  // Parrilla frontal distintiva por marca (Cadillac vs Aurus vs Hongqi)
  const frontZ = length / 2 + 0.01;
  if (leader.country === "ru") {
    // Aurus Senat: parrilla vertical alta tipo cascada cromada
    const aurusGrille = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.68, 0.14), chromeMat);
    aurusGrille.position.set(0, 0.86, frontZ);
    limo.add(aurusGrille);
  } else if (leader.country === "cn") {
    // Hongqi N701: parrilla vertical + insignia roja central en el capó
    const hongqiGrille = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.64, 0.14), chromeMat);
    hongqiGrille.position.set(0, 0.84, frontZ);
    limo.add(hongqiGrille);

    const redCrest = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.24, 0.75),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    redCrest.position.set(0, 1.26, frontZ - 0.85);
    limo.add(redCrest);
  } else {
    // Cadillac One (La Bestia): parrilla ancha horizontal
    const cadillacGrille = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.44, 0.12), chromeMat);
    cadillacGrille.position.set(0, 0.78, frontZ);
    limo.add(cadillacGrille);
  }

  // Faros y luces traseras
  [-0.86, 0.86].forEach((x) => {
    const hl = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.18, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xe0f2fe })
    );
    hl.position.set(x, 0.88, frontZ);
    limo.add(hl);

    const tl = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.2, 0.1),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    tl.position.set(x, 0.88, -frontZ);
    limo.add(tl);
  });

  // Banderas nacionales en guardabarros delanteros
  const flagMat = new THREE.MeshBasicMaterial({ map: makeFlagTexture(leader.country), side: THREE.DoubleSide });
  [-1.08, 1.08].forEach((x) => {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.65, 8), chromeMat);
    pole.position.set(x, 1.38, frontZ - 0.75);
    limo.add(pole);

    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.28), flagMat);
    flag.position.set(x, 1.56, frontZ - 0.96);
    flag.rotation.y = Math.PI / 2;
    limo.add(flag);
  });

  const wheels = [];
  const wheelZ = length * 0.32;
  [[-1.12, wheelZ], [1.12, wheelZ], [-1.12, -wheelZ], [1.12, -wheelZ]].forEach(([x, z]) => {
    const w = createWheel(0.48, 0.34);
    w.position.set(x, 0.48, z);
    limo.add(w);
    wheels.push(w);
  });
  limo.userData.wheels = wheels;
  return limo;
}

function createEscortSUV() {
  const suv = new THREE.Group();
  const blackMat = new THREE.MeshPhysicalMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.18, clearcoat: 1.0 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.25, 0.95, 5.2), blackMat);
  body.position.y = 0.88;
  suv.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.72, 3.6), blackMat);
  cabin.position.set(0, 1.68, -0.45);
  suv.add(cabin);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.12, 0.22), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
  bar.position.set(0, 2.1, 0.3);
  suv.add(bar);
  const wheels = [];
  [[-1.06, 1.65], [1.06, 1.65], [-1.06, -1.65], [1.06, -1.65]].forEach(([x, z]) => {
    const w = createWheel(0.48, 0.32);
    w.position.set(x, 0.48, z);
    suv.add(w);
    wheels.push(w);
  });
  suv.userData.wheels = wheels;
  return suv;
}

function createPresidentialHeli(leader) {
  const heli = new THREE.Group();
  const c = leader.country;
  // EE.UU.: Marine One White Top | Rusia: Mi-8 Blanco/Gris Tricolor | China: Z-8G Verde Oliva/Oro
  const hullColor = c === "us" ? 0x143625 : c === "ru" ? 0xe2e8f0 : 0x1a2e1a;
  const topColor = c === "us" ? 0xf8fafc : c === "ru" ? 0x1d4ed8 : 0x263d26;
  const stripeColor = c === "ru" ? 0xdc2626 : 0xfacc15;

  const hullMat = new THREE.MeshPhysicalMaterial({ color: hullColor, metalness: 0.45, roughness: 0.25, clearcoat: 0.8 });
  const topMat = new THREE.MeshPhysicalMaterial({ color: topColor, metalness: 0.35, roughness: 0.25, clearcoat: 0.9 });
  const stripeMat = new THREE.MeshStandardMaterial({ color: stripeColor, metalness: 0.8, roughness: 0.2 });

  const lowerHull = new THREE.Mesh(new THREE.BoxGeometry(2.35, 1.2, 5.8), hullMat);
  lowerHull.position.y = 1.25;
  lowerHull.castShadow = true;
  heli.add(lowerHull);

  const upperHull = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.72, 5.0), topMat);
  upperHull.position.set(0, 2.12, -0.2);
  heli.add(upperHull);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.14, 5.84), stripeMat);
  stripe.position.y = 1.8;
  heli.add(stripe);

  // Cabina panorámica (Mi-8 más redondeada)
  const cockpit = new THREE.Mesh(
    new THREE.SphereGeometry(1.16, 16, 16),
    new THREE.MeshPhysicalMaterial({ color: 0x020617, metalness: 0.9, roughness: 0.08, clearcoat: 1 })
  );
  cockpit.scale.set(0.98, 0.86, c === "ru" ? 1.3 : 1.12);
  cockpit.position.set(0, 1.48, 2.55);
  heli.add(cockpit);

  // Turbinas superiores y tanques laterales / sponsons
  [-0.55, 0.55].forEach((x) => {
    const turbine = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 2.3, 12), topMat);
    turbine.rotation.x = Math.PI / 2;
    turbine.position.set(x, 2.58, 0.2);
    heli.add(turbine);

    const sidePod = c === "ru"
      ? new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 2.6, 12), hullMat)
      : new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.42, 2.2), hullMat);
    if (c === "ru") sidePod.rotation.x = Math.PI / 2;
    sidePod.position.set(x * 2.45, 0.92, -0.2);
    heli.add(sidePod);
  });

  // Cola y rotor principal (6 palas en China Z-8G, 5 en EE.UU./Rusia)
  const tailBoom = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.72, 4.8), hullMat);
  tailBoom.position.set(0, 1.65, -4.9);
  heli.add(tailBoom);

  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.1, 1.1), topMat);
  tailFin.position.set(0, 2.35, -7.0);
  tailFin.rotation.x = -0.25;
  heli.add(tailFin);

  const tailRotor = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 2.1, 0.2),
    new THREE.MeshStandardMaterial({ color: 0xfef08a })
  );
  tailRotor.position.set(0.22, 2.75, -7.1);
  heli.add(tailRotor);

  const mainRotorGroup = new THREE.Group();
  mainRotorGroup.position.set(0, 2.95, 0.1);
  const bladesCount = c === "cn" ? 6 : 5;
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
  for (let i = 0; i < bladesCount; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.05, 5.2), bladeMat);
    blade.rotation.y = (i * Math.PI * 2) / bladesCount;
    blade.translateZ(2.5);
    mainRotorGroup.add(blade);
  }
  heli.add(mainRotorGroup);

  heli.userData.rotor = mainRotorGroup;
  heli.userData.tailRotor = tailRotor;
  return heli;
}

function createPresidentialPlane(leader) {
  const plane = new THREE.Group();
  const c = leader.country;
  const whiteMat = new THREE.MeshPhysicalMaterial({ color: 0xf8fafc, metalness: 0.35, roughness: 0.18, clearcoat: 1.0 });
  const stripeMat = new THREE.MeshPhysicalMaterial({
    color: c === "us" ? 0x2563eb : c === "ru" ? 0x1d4ed8 : 0xdc2626,
    metalness: 0.5,
    roughness: 0.2,
    clearcoat: 1.0
  });
  const darkGlass = new THREE.MeshBasicMaterial({ color: 0x0f172a });

  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(1.32, 1.32, 14.5, 24), whiteMat);
  fuselage.rotation.x = Math.PI / 2;
  fuselage.castShadow = true;
  plane.add(fuselage);

  const cheatline = new THREE.Mesh(new THREE.CylinderGeometry(1.34, 1.34, 14.2, 24), stripeMat);
  cheatline.rotation.x = Math.PI / 2;
  cheatline.scale.set(1.01, 1.0, 0.32);
  plane.add(cheatline);

  // Joroba superior SOLO en Boeing 747 (EE.UU. y China); Rusia usa Ilyushin Il-96 de un solo piso
  if (c !== "ru") {
    const humpLen = c === "cn" ? 7.2 : 6.0;
    const upperDeck = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.95, humpLen), whiteMat);
    upperDeck.position.set(0, 1.15, 2.5);
    plane.add(upperDeck);

    const upperDeckFront = new THREE.Mesh(new THREE.SphereGeometry(0.88, 16, 16), whiteMat);
    upperDeckFront.position.set(0, 1.05, 2.5 + humpLen / 2);
    plane.add(upperDeckFront);
  }

  const nose = new THREE.Mesh(new THREE.ConeGeometry(1.32, 3.2, 24), whiteMat);
  nose.rotation.x = Math.PI / 2;
  nose.position.z = 8.85;
  plane.add(nose);

  const cockpitWin = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.32, 0.6), darkGlass);
  cockpitWin.position.set(0, c === "ru" ? 0.85 : 1.25, 6.45);
  plane.add(cockpitWin);

  // Alas en flecha + 4 motores
  [-1, 1].forEach((side) => {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.18, 2.7), whiteMat);
    wing.position.set(side * 4.8, -0.25, -0.4);
    wing.rotation.y = side * -0.32;
    plane.add(wing);

    const winglet = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.15, 0.7), stripeMat);
    winglet.position.set(side * 8.9, 0.32, -1.75);
    winglet.rotation.z = side * -0.22;
    plane.add(winglet);
  });

  [[-3.4, -0.95, 0.8], [-6.2, -0.85, -0.4], [3.4, -0.95, 0.8], [6.2, -0.85, -0.4]].forEach(([x, y, z]) => {
    const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.42, 2.2, 16), whiteMat);
    nacelle.rotation.x = Math.PI / 2;
    nacelle.position.set(x, y, z);
    plane.add(nacelle);
  });

  // Cola con bandera del país
  const tailCone = new THREE.Mesh(new THREE.ConeGeometry(1.32, 3.6, 24), whiteMat);
  tailCone.rotation.x = -Math.PI / 2;
  tailCone.position.z = -9.05;
  plane.add(tailCone);

  const vStab = new THREE.Mesh(new THREE.BoxGeometry(0.22, 3.8, 2.4), whiteMat);
  vStab.position.set(0, 2.35, -7.9);
  vStab.rotation.x = -0.35;
  plane.add(vStab);

  const tailFlag = new THREE.Mesh(
    new THREE.PlaneGeometry(1.45, 0.9),
    new THREE.MeshBasicMaterial({ map: makeFlagTexture(c), side: THREE.DoubleSide })
  );
  tailFlag.position.set(0.13, 2.7, -8.0);
  tailFlag.rotation.y = Math.PI / 2;
  plane.add(tailFlag);

  const tailFlagL = tailFlag.clone();
  tailFlagL.position.x = -0.13;
  plane.add(tailFlagL);

  const hStab = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.14, 1.3), whiteMat);
  hStab.position.set(0, 0.45, -8.6);
  plane.add(hStab);

  return plane;
}

// --- PERSONAJES ARTICULADOS ---
function createArticulatedPerson(opts) {
  const g = new THREE.Group();
  const suitMat = new THREE.MeshStandardMaterial({ color: opts.suit, roughness: 0.45 });
  const skinMat = new THREE.MeshStandardMaterial({ color: opts.skin, roughness: 0.55 });

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.78, 0.32), suitMat);
  torso.position.y = 1.18;
  torso.castShadow = true;
  g.add(torso);

  if (opts.tie) {
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.62, 0.04), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
    shirt.position.set(0, 1.24, 0.16);
    g.add(shirt);
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.52, 0.06), new THREE.MeshStandardMaterial({ color: opts.tie }));
    tie.position.set(0, 1.22, 0.17);
    g.add(tie);
  }

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 16, 16), skinMat);
  head.position.y = 1.82;
  g.add(head);

  if (opts.isAgent) {
    const glasses = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.08, 0.12),
      new THREE.MeshPhysicalMaterial({ color: 0x020617, metalness: 0.95, roughness: 0.05, clearcoat: 1 })
    );
    glasses.position.set(0, 1.84, 0.2);
    g.add(glasses);
  } else {
    const hair = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, opts.hairStyle === "pompadour" ? 0.2 : 0.13, 0.48),
      new THREE.MeshStandardMaterial({ color: opts.hairColor, roughness: 0.7 })
    );
    hair.position.set(0, 2.0, opts.hairStyle === "pompadour" ? 0.04 : -0.02);
    g.add(hair);
  }

  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.72, 0.18), suitMat);
  leftArm.position.set(-0.38, 1.16, 0);
  g.add(leftArm);
  const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.72, 0.18), suitMat);
  rightArm.position.set(0.38, 1.16, 0);
  g.add(rightArm);
  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.78, 0.22), suitMat);
  leftLeg.position.set(-0.15, 0.42, 0);
  g.add(leftLeg);
  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.78, 0.22), suitMat);
  rightLeg.position.set(0.15, 0.42, 0);
  g.add(rightLeg);

  g.userData.limbs = { leftArm, rightArm, leftLeg, rightLeg };
  return g;
}

// --- ACTORES EN ESCENA ---
const actorGroup = new THREE.Group();
scene.add(actorGroup);

let vipMesh, agents = [], limoMesh, suvMesh, heliMesh, planeMesh;

function rebuildEntities() {
  const L = LEADERS[state.leaderIdx];
  if (state.currentCountry !== L.country) {
    state.currentCountry = L.country;
    rebuildWorld(L.country);
  }

  while (actorGroup.children.length) actorGroup.remove(actorGroup.children[0]);
  agents = [];

  vipMesh = createArticulatedPerson(L);
  vipMesh.position.set(0, 0.26, 2.6);
  actorGroup.add(vipMesh);

  const offsets = [[-1.35, 1.7], [1.35, 1.7], [-1.35, 3.6], [1.35, 3.6]];
  offsets.forEach(([x, z]) => {
    const ag = createArticulatedPerson({ suit: 0x090d16, skin: 0xe2b49a, isAgent: true });
    ag.position.set(x, 0.26, z);
    actorGroup.add(ag);
    agents.push(ag);
  });

  limoMesh = createPresidentialLimo(L);
  limoMesh.position.set(-3.1, 0.26, -2.5);
  limoMesh.rotation.y = 0.18;
  actorGroup.add(limoMesh);

  suvMesh = createEscortSUV();
  suvMesh.position.set(-3.8, 0.26, -10.8);
  suvMesh.rotation.y = 0.15;
  actorGroup.add(suvMesh);

  heliMesh = createPresidentialHeli(L);
  heliMesh.position.set(4.6, 0.26, -5.8);
  heliMesh.rotation.y = -0.35;
  actorGroup.add(heliMesh);

  planeMesh = createPresidentialPlane(L);
  planeMesh.position.set(0, 14.5, -24);
  planeMesh.rotation.y = 0.28;
  actorGroup.add(planeMesh);
}

// --- UI Y MODOS ---
const leaderButtonsDiv = document.getElementById("leader-buttons");
function renderLeaderButtons() {
  leaderButtonsDiv.innerHTML = "";
  LEADERS.forEach((l, idx) => {
    const btn = document.createElement("button");
    btn.className = "leader-btn" + (idx === state.leaderIdx ? " active" : "");
    btn.textContent = `${l.flag} ${l.name}`;
    btn.onclick = () => {
      state.leaderIdx = idx;
      renderLeaderButtons();
      setMode(state.mode);
    };
    leaderButtonsDiv.appendChild(btn);
  });
}

function updateTexts() {
  const t = I18N[state.lang];
  const L = LEADERS[state.leaderIdx];
  document.getElementById("badge-status").textContent = state.mode === "cover" ? t.live : t.active;
  document.getElementById("agency-label").textContent = `${L.agency} • ${L.limo}`;
  document.getElementById("btn-foot").textContent = t.footBtn;
  document.getElementById("btn-drive").textContent = t.driveBtn;
  document.getElementById("btn-heli").textContent = t.heliBtn;
  document.getElementById("btn-fly").textContent = t.flyBtn;
  document.getElementById("btn-switch-gta").textContent = t.switchGta;
  document.getElementById("btn-exit").textContent = t.exit;
  document.getElementById("btn-gyro").textContent = state.gyroEnabled ? t.gyroOn : t.gyroOff;
  document.getElementById("xp-display").textContent = `LVL ${state.level} • ${state.xp} XP`;
  document.getElementById("vip-health").textContent = `VIP: ${state.vipHealth}%`;

  const tag = document.getElementById("mission-type-tag");
  if (state.mode === "foot") {
    tag.textContent = t.hollywood;
    tag.className = "tag hollywood";
    document.getElementById("mission-title").textContent = `${L.name}: ${t.mFootTitle}`;
    document.getElementById("mission-desc").textContent = t.mFootDesc;
  } else if (state.mode === "drive") {
    tag.textContent = t.routine;
    tag.className = "tag";
    document.getElementById("mission-title").textContent = `${L.limo}: ${t.mDriveTitle}`;
    document.getElementById("mission-desc").textContent = t.mDriveDesc;
  } else if (state.mode === "heli") {
    tag.textContent = t.routine;
    tag.className = "tag";
    document.getElementById("mission-title").textContent = `${L.heli}: ${t.mHeliTitle}`;
    document.getElementById("mission-desc").textContent = t.mHeliDesc;
  } else if (state.mode === "fly") {
    tag.textContent = t.routine;
    tag.className = "tag";
    document.getElementById("mission-title").textContent = `${L.plane}: ${t.mFlyTitle}`;
    document.getElementById("mission-desc").textContent = t.mFlyDesc;
  }
}

function setMode(newMode) {
  state.mode = newMode;
  state.decisionTriggered = false;
  document.getElementById("cover-panel").classList.toggle("hidden", newMode !== "cover");
  document.getElementById("mission-hud").classList.toggle("hidden", newMode === "cover");
  document.getElementById("btn-gyro").classList.toggle("hidden", newMode !== "fly" && newMode !== "heli");

  rebuildEntities();
  if (newMode === "drive") {
    limoMesh.position.set(0, 0.26, 0);
    limoMesh.rotation.y = Math.PI;
    suvMesh.position.set(0, 0.26, 8.6);
    suvMesh.rotation.y = Math.PI;
    vipMesh.visible = false;
    agents.forEach(a => (a.visible = false));
  } else if (newMode === "heli") {
    heliMesh.position.set(0, 9.5, 0);
    heliMesh.rotation.y = Math.PI;
    vipMesh.visible = false;
    agents.forEach(a => (a.visible = false));
    limoMesh.visible = false;
    suvMesh.visible = false;
    planeMesh.visible = false;
  } else if (newMode === "fly") {
    planeMesh.position.set(0, 19, 0);
    planeMesh.rotation.y = Math.PI;
    vipMesh.visible = false;
    agents.forEach(a => (a.visible = false));
    limoMesh.visible = false;
    suvMesh.visible = false;
    heliMesh.visible = false;
  }
  updateTexts();
}

// --- GIROSCOPIO IPHONE + JOYSTICK ---
document.getElementById("btn-gyro").onclick = async () => {
  if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
    try {
      const perm = await DeviceOrientationEvent.requestPermission();
      if (perm === "granted") state.gyroEnabled = !state.gyroEnabled;
    } catch (e) {
      console.warn(e);
    }
  } else {
    state.gyroEnabled = !state.gyroEnabled;
  }
  updateTexts();
};

window.addEventListener("deviceorientation", (e) => {
  if (!state.gyroEnabled || e.beta === null || e.gamma === null) return;
  const angle = (window.screen.orientation && window.screen.orientation.angle) || window.orientation || 0;
  if (angle === 90) {
    state.tiltX = THREE.MathUtils.clamp(e.beta / 35, -1, 1);
    state.tiltY = THREE.MathUtils.clamp((-e.gamma - 35) / 35, -1, 1);
  } else if (angle === -90 || angle === 270) {
    state.tiltX = THREE.MathUtils.clamp(-e.beta / 35, -1, 1);
    state.tiltY = THREE.MathUtils.clamp((e.gamma - 35) / 35, -1, 1);
  } else {
    state.tiltX = THREE.MathUtils.clamp(e.gamma / 35, -1, 1);
    state.tiltY = THREE.MathUtils.clamp((e.beta - 35) / 35, -1, 1);
  }
});

const joyZone = document.getElementById("joystick-zone");
const joyStick = document.getElementById("joystick-stick");
function handleJoy(clientX, clientY) {
  const rect = joyZone.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = THREE.MathUtils.clamp((clientX - cx) / 32, -1, 1);
  const dy = THREE.MathUtils.clamp((clientY - cy) / 32, -1, 1);
  state.joyX = dx;
  state.joyY = dy;
  joyStick.style.transform = `translate(${dx * 24}px, ${dy * 24}px)`;
}
joyZone.addEventListener("touchmove", (e) => {
  e.preventDefault();
  handleJoy(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: false });
joyZone.addEventListener("touchend", () => {
  state.joyX = 0;
  state.joyY = 0;
  joyStick.style.transform = "translate(0px, 0px)";
});

// --- DECISIÓN TÁCTICA ---
function openDecisionEvent() {
  if (state.decisionTriggered) return;
  state.decisionTriggered = true;
  const t = I18N[state.lang];
  const modal = document.getElementById("decision-modal");
  document.getElementById("alert-title").textContent = t.alert;
  document.getElementById("alert-text").textContent = t.threatScenario;
  const optsDiv = document.getElementById("decision-options");
  optsDiv.innerHTML = "";

  [
    { label: t.opt1, good: true },
    { label: t.opt2, good: true },
    { label: t.opt3, good: false }
  ].forEach((op) => {
    const b = document.createElement("button");
    b.className = "btn";
    b.textContent = op.label;
    b.onclick = () => {
      modal.classList.add("hidden");
      if (op.good) {
        state.xp += 150;
        state.level = 1 + Math.floor(state.xp / 300);
        document.getElementById("mission-desc").textContent = t.resGood;
      } else {
        state.vipHealth = Math.max(20, state.vipHealth - 35);
        document.getElementById("mission-desc").textContent = t.resBad;
      }
      updateTexts();
    };
    optsDiv.appendChild(b);
  });
  modal.classList.remove("hidden");
}

// --- BOTONES ---
document.getElementById("lang-select").onchange = (e) => {
  state.lang = e.target.value;
  updateTexts();
};
document.getElementById("btn-foot").onclick = () => setMode("foot");
document.getElementById("btn-drive").onclick = () => setMode("drive");
document.getElementById("btn-heli").onclick = () => setMode("heli");
document.getElementById("btn-fly").onclick = () => setMode("fly");
document.getElementById("btn-exit").onclick = () => setMode("cover");
document.getElementById("btn-switch-gta").onclick = () => {
  state.leaderIdx = (state.leaderIdx + 1) % LEADERS.length;
  renderLeaderButtons();
  setMode(state.mode);
};

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- ANIMACIÓN ---
function animateWalk(person, time, moving) {
  const { leftArm, rightArm, leftLeg, rightLeg } = person.userData.limbs;
  const swing = moving ? Math.sin(time * 9) * 0.45 : Math.sin(time * 1.5) * 0.04;
  leftLeg.rotation.x = swing;
  rightLeg.rotation.x = -swing;
  leftArm.rotation.x = -swing * 0.7;
  rightArm.rotation.x = swing * 0.7;
}

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  traffic.forEach((c) => {
    c.mesh.position.z += c.speed;
    if (c.mesh.position.z > 140) c.mesh.position.z = -140;
    if (c.mesh.position.z < -140) c.mesh.position.z = 140;
    c.mesh.userData.wheels.forEach((w) => (w.rotation.x += 0.18));
  });

  if (heliMesh && heliMesh.visible) {
    heliMesh.userData.rotor.rotation.y += 0.44;
    heliMesh.userData.tailRotor.rotation.x += 0.55;
    if (state.mode === "cover") heliMesh.position.y = 0.28 + Math.sin(t * 2.2) * 0.06;
  }

  const inputX = state.gyroEnabled ? state.tiltX : state.joyX;
  const inputY = state.gyroEnabled ? state.tiltY : state.joyY;

  if (state.mode === "cover") {
    animateWalk(vipMesh, t, false);
    agents.forEach((ag) => animateWalk(ag, t, false));
    camera.position.set(11.5 + Math.sin(t * 0.28) * 3.5, 4.8, 10.5 + Math.cos(t * 0.28) * 3.5);
    camera.lookAt(-6, 2.2, -4);
  } else if (state.mode === "foot") {
    const moving = Math.abs(state.joyX) > 0.08 || Math.abs(state.joyY) > 0.08;
    vipMesh.position.x = THREE.MathUtils.clamp(vipMesh.position.x + state.joyX * 0.09, -6.5, 6.5);
    vipMesh.position.z -= Math.max(0, -state.joyY) * 0.09;
    animateWalk(vipMesh, t, moving);

    agents.forEach((ag, i) => {
      const ox = i % 2 === 0 ? -1.35 : 1.35;
      const oz = i < 2 ? -0.95 : 0.95;
      ag.position.x += (vipMesh.position.x + ox - ag.position.x) * 0.16;
      ag.position.z += (vipMesh.position.z + oz - ag.position.z) * 0.16;
      animateWalk(ag, t + i * 0.4, moving);
    });

    camera.position.set(vipMesh.position.x + 3.5, 4.2, vipMesh.position.z + 6.8);
    camera.lookAt(vipMesh.position.x - 3, 1.8, vipMesh.position.z - 2);
    if (vipMesh.position.z < -8) openDecisionEvent();
  } else if (state.mode === "drive") {
    const speed = 0.35 + Math.max(0, -state.joyY) * 0.28;
    limoMesh.position.x = THREE.MathUtils.clamp(limoMesh.position.x + state.joyX * 0.15, -6.2, 6.2);
    limoMesh.position.z -= speed;
    if (limoMesh.position.z < -120) limoMesh.position.z = 120;

    suvMesh.position.x += (limoMesh.position.x - suvMesh.position.x) * 0.12;
    suvMesh.position.z = limoMesh.position.z + 8.6;

    limoMesh.userData.wheels.forEach((w) => (w.rotation.x -= speed * 0.8));
    suvMesh.userData.wheels.forEach((w) => (w.rotation.x -= speed * 0.8));

    camera.position.set(limoMesh.position.x * 0.7, 4.1, limoMesh.position.z + 13.5);
    camera.lookAt(limoMesh.position.x, 1.3, limoMesh.position.z - 5);
  } else if (state.mode === "heli") {
    heliMesh.position.x = THREE.MathUtils.clamp(heliMesh.position.x + inputX * 0.22, -16, 16);
    heliMesh.position.y = THREE.MathUtils.clamp(heliMesh.position.y - inputY * 0.16, 4.5, 22);
    heliMesh.position.z -= 0.32;
    if (heliMesh.position.z < -120) heliMesh.position.z = 110;
    heliMesh.rotation.z = inputX * 0.32;
    heliMesh.rotation.x = -0.14 + inputY * 0.22;

    camera.position.set(heliMesh.position.x, heliMesh.position.y + 3.4, heliMesh.position.z + 12.5);
    camera.lookAt(heliMesh.position.x, heliMesh.position.y, heliMesh.position.z - 8);
  } else if (state.mode === "fly") {
    planeMesh.position.x = THREE.MathUtils.clamp(planeMesh.position.x + inputX * 0.25, -24, 24);
    planeMesh.position.y = THREE.MathUtils.clamp(planeMesh.position.y - inputY * 0.2, 10, 36);
    planeMesh.position.z -= 0.42;
    if (planeMesh.position.z < -130) planeMesh.position.z = 120;
    planeMesh.rotation.z = inputX * 0.42;
    planeMesh.rotation.x = inputY * 0.28;

    camera.position.set(planeMesh.position.x, planeMesh.position.y + 4.2, planeMesh.position.z + 18);
    camera.lookAt(planeMesh.position.x, planeMesh.position.y, planeMesh.position.z - 12);
  }

  renderer.render(scene, camera);
}

renderLeaderButtons();
rebuildEntities();
updateTexts();
animate();
