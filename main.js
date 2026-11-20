import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { LANGUAGES, TRANSLATIONS } from './i18n.js';
import { loadModelGLB, buildPresidentialHeli, buildPresidentialJet } from './models3d.js';

// 1. ESCENA Y RENDERER
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070b14);
scene.fog = new THREE.FogExp2(0x070b14, 0.0046);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.5, 480);
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.body.appendChild(renderer.domElement);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.85;

scene.add(new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 1.05));
const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.9);
dirLight.position.set(55, 95, 40);
scene.add(dirLight);

// 2. CIUDAD Y AUTOPISTA
function buildCity() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1400, 1400),
    new THREE.MeshStandardMaterial({ color: 0x0b101b, roughness: 0.88 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(26, 1400),
    new THREE.MeshStandardMaterial({ color: 0x182030, roughness: 0.42, metalness: 0.35 })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.02;
  scene.add(road);

  const lines = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.35, 6),
    new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
    140
  );
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 140; i++) {
    dummy.position.set(0, 0.04, -680 + i * 10);
    dummy.rotation.set(-Math.PI / 2, 0, 0);
    dummy.updateMatrix();
    lines.setMatrixAt(i, dummy.matrix);
  }
  scene.add(lines);

  const buildings = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x162033, metalness: 0.78, roughness: 0.22 }),
    260
  );
  let idx = 0;
  for (let z = -620; z <= 620; z += 19) {
    [-1, 1].forEach((side) => {
      for (let row = 0; row < 2; row++) {
        if (idx >= 260) return;
        const w = 11 + ((idx * 7) % 8);
        const d = 11 + ((idx * 13) % 8);
        const h = 18 + ((idx * 17) % 60);
        dummy.position.set(side * (23 + row * 18), h / 2, z);
        dummy.scale.set(w, h, d);
        dummy.updateMatrix();
        buildings.setMatrixAt(idx++, dummy.matrix);
      }
    });
  }
  scene.add(buildings);
}
buildCity();

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.65, 0.42, 0.75);
composer.addPass(bloomPass);

// 3. ESTADO DEL JUEGO
let currentLang = 'ES';
let currentNation = 'US';
let vehicleMode = 'GROUND'; // GROUND | HELI | JET
let controlScheme = 'JOYSTICK'; // JOYSTICK | ARROWS | TILT
let sirensOn = true;
let camMode = 0;
let isGameOver = false;

let vipHealth = 100;
let agentHealth = 100;
let outOfPerimeterTimer = 0;

function t(key) {
  return TRANSLATIONS[currentLang][key] || TRANSLATIONS.ES[key];
}

function updateBarsUI() {
  document.getElementById('lbl-vip').textContent = `${t('vipLabel')}: ${Math.max(0, Math.round(vipHealth))}%`;
  document.getElementById('lbl-agent').textContent = `${t('agentLabel')}: ${Math.max(0, Math.round(agentHealth))}%`;
  document.getElementById('vip-bar').style.width = `${Math.max(0, vipHealth)}%`;
  document.getElementById('agent-bar').style.width = `${Math.max(0, agentHealth)}%`;
}

function triggerGameOver(reasonKey) {
  if (isGameOver) return;
  isGameOver = true;
  document.getElementById('go-title').textContent = t('goTitle');
  document.getElementById('go-reason').textContent = t(reasonKey);
  document.getElementById('btn-retry').textContent = t('retryBtn');
  document.getElementById('gameover-screen').style.display = 'flex';
}

function applyLanguage(langCode) {
  currentLang = langCode;
  const meta = LANGUAGES.find((l) => l.code === langCode) || LANGUAGES[0];
  document.documentElement.lang = langCode.toLowerCase();
  document.documentElement.dir = meta.dir;

  const fBtns = document.querySelectorAll('#fleet-selector button');
  fBtns[0].textContent = t('btnUS');
  fBtns[1].textContent = t('btnRU');
  fBtns[2].textContent = t('btnCN');
  fBtns[3].textContent = t('btnSummit');

  document.getElementById('vmode-ground').textContent = t('modeGround');
  document.getElementById('vmode-heli').textContent = t('modeHeli');
  document.getElementById('vmode-jet').textContent = t('modeJet');

  document.getElementById('ctrl-joy').textContent = t('ctrlJoystick');
  document.getElementById('ctrl-arr').textContent = t('ctrlArrows');
  document.getElementById('ctrl-tilt').textContent = t('ctrlTilt');

  document.getElementById('btn-gas').textContent = t('gasBtn');
  document.getElementById('btn-brake').textContent = t('brakeBtn');
  document.getElementById('btn-mg').textContent = t('mgBtn');
  document.getElementById('btn-cqc').textContent = t('cqcBtn');
  document.getElementById('btn-flare').textContent = t('flareBtn');
  document.getElementById('btn-support').textContent = t('radioSupportBtn');
  document.getElementById('btn-siren').textContent = sirensOn ? t('sirensOn') : t('sirensOff');
  document.getElementById('btn-cam').textContent = `${t('camPrefix')}: ${t('camLabels')[camMode]}`;

  const titleEl = document.getElementById('vip-title');
  if (currentNation === 'US') titleEl.textContent = t('usLeader');
  else if (currentNation === 'RU') titleEl.textContent = t('ruLeader');
  else if (currentNation === 'CN') titleEl.textContent = t('cnLeader');
  else titleEl.textContent = t('btnSummit');

  document.getElementById('director-order').textContent =
    vehicleMode === 'GROUND' ? t('orderDrive') : t('orderAir');
  updateBarsUI();
}

// 4. FLOTA, VEHÍCULO DEL JUGADOR Y EMBOSCADAS ENEMIGAS
const worldGroup = new THREE.Group();
scene.add(worldGroup);

let playerUnit = null;
let vipUnit = null;
let escortUnits = [];
let enemies = [];

function spawnEnemyAmbush() {
  const enemy = loadModelGLB('suv.glb', 'RU', 'suv', 5.0);
  const sideX = (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 4);
  const baseZ = (playerUnit ? playerUnit.position.z : 0) + 75 + Math.random() * 35;
  enemy.position.set(sideX, 0, baseZ);
  enemy.userData.hp = 40;
  worldGroup.add(enemy);
  enemies.push(enemy);
}

function resetMission() {
  isGameOver = false;
  vipHealth = 100;
  agentHealth = 100;
  outOfPerimeterTimer = 0;
  document.getElementById('gameover-screen').style.display = 'none';

  while (worldGroup.children.length > 0) worldGroup.remove(worldGroup.children[0]);
  escortUnits = [];
  enemies = [];

  const prefix = currentNation === 'SUMMIT' ? 'us' : currentNation.toLowerCase();

  if (vehicleMode === 'GROUND') {
    vipUnit = loadModelGLB(`${prefix}_limo.glb`, currentNation === 'SUMMIT' ? 'US' : currentNation, 'limo', 6.5);
    vipUnit.position.set(0, 0, 12);

    playerUnit = loadModelGLB('suv.glb', 'US', 'suv', 5.3);
    playerUnit.position.set(0, 0, 2);

    const ambu = loadModelGLB(`${prefix}_ambu.glb`, 'US', 'ambulance', 5.9);
    ambu.position.set(-4.2, 0, -6);

    worldGroup.add(vipUnit, playerUnit, ambu);
    escortUnits.push(vipUnit, playerUnit, ambu);

    document.getElementById('btn-flare').style.display = 'none';
    document.getElementById('btn-mg').style.display = 'inline-block';
  } else if (vehicleMode === 'HELI') {
    playerUnit = buildPresidentialHeli(currentNation === 'SUMMIT' ? 'US' : currentNation);
    playerUnit.position.set(0, 14, 0);
    vipUnit = playerUnit; // Presidente a bordo del helicóptero
    worldGroup.add(playerUnit);

    document.getElementById('btn-flare').style.display = 'inline-block';
    document.getElementById('btn-mg').style.display = 'none';
  } else {
    playerUnit = buildPresidentialJet(currentNation === 'SUMMIT' ? 'US' : currentNation);
    playerUnit.position.set(0, 26, 0);
    vipUnit = playerUnit; // Presidente a bordo del avión presidencial
    worldGroup.add(playerUnit);

    document.getElementById('btn-flare').style.display = 'inline-block';
    document.getElementById('btn-mg').style.display = 'none';
  }

  for (let i = 0; i < 3; i++) spawnEnemyAmbush();
  applyLanguage(currentLang);
}

// 5. PARTÍCULAS (METRALLETAS DE LA BESTIA, BENGALAS AÉREAS, TURBINAS)
const particles = [];
const pGeo = new THREE.SphereGeometry(0.18, 6, 6);

function spawnParticle({ pos, vel, color, scale = 1, life = 1, gravity = 0 }) {
  const mesh = new THREE.Mesh(pGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 }));
  mesh.position.copy(pos);
  mesh.scale.setScalar(scale);
  scene.add(mesh);
  particles.push({ mesh, vel, life, maxLife: life, gravity });
}

function fireArmoredMiniguns() {
  if (!playerUnit || vehicleMode !== 'GROUND') return;
  const origin = playerUnit.position.clone();

  // Ráfaga doble desde las metralletas ocultas del blindado
  [-0.75, 0.75].forEach((offsetX) => {
    spawnParticle({
      pos: origin.clone().add(new THREE.Vector3(offsetX, 1.35, 2.8)),
      vel: new THREE.Vector3(0, 0, 3.2),
      color: 0xfef08a,
      scale: 0.9,
      life: 0.85
    });
    spawnParticle({
      pos: origin.clone().add(new THREE.Vector3(offsetX, 1.35, 2.6)),
      vel: new THREE.Vector3(0, 0.04, 0.2),
      color: 0xf97316,
      scale: 2.0,
      life: 0.14
    });
  });

  // Dañar enemigos delante del blindado
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (Math.abs(e.position.x - origin.x) < 3.5 && e.position.z > origin.z && e.position.z - origin.z < 65) {
      e.userData.hp -= 20;
      if (e.userData.hp <= 0) {
        worldGroup.remove(e);
        enemies.splice(i, 1);
        spawnEnemyAmbush();
      }
    }
  }
}

function triggerCQC() {
  if (!playerUnit) return;
  document.getElementById('radio-feed').textContent = t('radioCqc');
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.position.distanceTo(playerUnit.position) < 12) {
      worldGroup.remove(e);
      enemies.splice(i, 1);
      spawnEnemyAmbush();
    }
  }
}

function releaseAirFlares() {
  if (!playerUnit || vehicleMode === 'GROUND') return;
  document.getElementById('radio-feed').textContent = t('radioFlares');
  const origin = playerUnit.position.clone();

  for (let i = 0; i < 8; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    spawnParticle({
      pos: origin.clone().add(new THREE.Vector3(side * 1.2, -0.4, -1.5)),
      vel: new THREE.Vector3(side * (0.25 + Math.random() * 0.2), -0.06, -0.22),
      color: i % 2 === 0 ? 0xffedd5 : 0xf97316,
      scale: 2.3,
      life: 1.9,
      gravity: -0.008
    });
  }
}

// 6. CONTROLES: JOYSTICK / FLECHAS / GIROSCOPIO + ACELERAR Y FRENAR
const steerInput = { x: 0, y: 0, gas: false, brake: false };
let speed = 0.45;
let pitch = 0;

// Joystick táctil
const joyBase = document.getElementById('joystick-base');
const joyKnob = document.getElementById('joystick-knob');
joyBase.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = joyBase.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = THREE.MathUtils.clamp((touch.clientX - cx) / 42, -1, 1);
  const dy = THREE.MathUtils.clamp((touch.clientY - cy) / 42, -1, 1);
  steerInput.x = -dx;
  steerInput.y = -dy;
  joyKnob.style.transform = `translate(${dx * 32}px, ${dy * 32}px)`;
});
joyBase.addEventListener('touchend', () => {
  steerInput.x = 0;
  steerInput.y = 0;
  joyKnob.style.transform = 'translate(0px, 0px)';
});

// Flechas
function bindArrow(id, axis, val) {
  const el = document.getElementById(id);
  el.addEventListener('touchstart', (e) => { e.preventDefault(); steerInput[axis] = val; });
  el.addEventListener('touchend', (e) => { e.preventDefault(); steerInput[axis] = 0; });
  el.addEventListener('mousedown', () => { steerInput[axis] = val; });
  el.addEventListener('mouseup', () => { steerInput[axis] = 0; });
}
bindArrow('arr-left', 'x', 1);
bindArrow('arr-right', 'x', -1);
bindArrow('arr-up', 'y', 1);
bindArrow('arr-down', 'y', -1);

// Giroscopio del teléfono
window.addEventListener('deviceorientation', (e) => {
  if (controlScheme !== 'TILT' || e.gamma === null) return;
  steerInput.x = THREE.MathUtils.clamp(-e.gamma / 28, -1, 1);
  if (e.beta !== null) {
    steerInput.y = THREE.MathUtils.clamp((45 - e.beta) / 30, -1, 1);
  }
});

function setControlScheme(scheme) {
  controlScheme = scheme;
  steerInput.x = 0;
  steerInput.y = 0;
  document.getElementById('joystick-base').style.display = scheme === 'JOYSTICK' ? 'block' : 'none';
  document.getElementById('arrows-pad').style.display = scheme === 'ARROWS' ? 'grid' : 'none';
  document.getElementById('tilt-indicator').style.display = scheme === 'TILT' ? 'block' : 'none';

  if (scheme === 'TILT' && typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission().catch(() => {});
  }
}

// Pedales Acelerar y Frenar
const gasBtn = document.getElementById('btn-gas');
const brakeBtn = document.getElementById('btn-brake');
gasBtn.addEventListener('touchstart', (e) => { e.preventDefault(); steerInput.gas = true; });
gasBtn.addEventListener('touchend', (e) => { e.preventDefault(); steerInput.gas = false; });
gasBtn.addEventListener('mousedown', () => { steerInput.gas = true; });
gasBtn.addEventListener('mouseup', () => { steerInput.gas = false; });

brakeBtn.addEventListener('touchstart', (e) => { e.preventDefault(); steerInput.brake = true; });
brakeBtn.addEventListener('touchend', (e) => { e.preventDefault(); steerInput.brake = false; });
brakeBtn.addEventListener('mousedown', () => { steerInput.brake = true; });
brakeBtn.addEventListener('mouseup', () => { steerInput.brake = false; });

// Botones UI
document.getElementById('btn-mg').addEventListener('click', fireArmoredMiniguns);
document.getElementById('btn-cqc').addEventListener('click', triggerCQC);
document.getElementById('btn-flare').addEventListener('click', releaseAirFlares);
document.getElementById('btn-support').addEventListener('click', () => {
  agentHealth = Math.min(100, agentHealth + 35);
  vipHealth = Math.min(100, vipHealth + 25);
  updateBarsUI();
  document.getElementById('radio-feed').textContent = t('radioSupportSent');
});

document.querySelectorAll('#fleet-selector button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#fleet-selector button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentNation = btn.dataset.mode;
    resetMission();
  });
});

document.querySelectorAll('#vehicle-mode-selector button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#vehicle-mode-selector button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    vehicleMode = btn.dataset.vmode;
    resetMission();
  });
});

document.querySelectorAll('#ctrl-selector button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#ctrl-selector button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    setControlScheme(btn.dataset.ctrl);
  });
});

document.querySelectorAll('#lang-selector button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#lang-selector button').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    applyLanguage(btn.dataset.lang);
  });
});

document.getElementById('btn-siren').addEventListener('click', (e) => {
  sirensOn = !sirensOn;
  e.target.textContent = sirensOn ? t('sirensOn') : t('sirensOff');
});

document.getElementById('btn-cam').addEventListener('click', (e) => {
  camMode = (camMode + 1) % 3;
  e.target.textContent = `${t('camPrefix')}: ${t('camLabels')[camMode]}`;
});

document.getElementById('btn-retry').addEventListener('click', resetMission);

resetMission();

// 7. BUCLE PRINCIPAL
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const tNow = clock.getElapsedTime();

  if (!isGameOver && playerUnit) {
    // Acelerar y frenar
    const maxSpd = vehicleMode === 'JET' ? 1.85 : vehicleMode === 'HELI' ? 1.15 : 1.1;
    if (steerInput.gas) speed = Math.min(speed + 0.025, maxSpd);
    else if (steerInput.brake) speed = Math.max(speed - 0.035, 0.05);
    else speed = THREE.MathUtils.lerp(speed, 0.45, 0.02);

    // Movimiento horizontal y vertical (en aire)
    playerUnit.position.z += speed;
    playerUnit.position.x = THREE.MathUtils.clamp(playerUnit.position.x + steerInput.x * 0.35, -9.5, 9.5);
    playerUnit.rotation.y = steerInput.x * 0.25;

    if (vehicleMode !== 'GROUND') {
      pitch = steerInput.y * 0.25;
      playerUnit.rotation.x = -pitch;
      playerUnit.position.y += steerInput.y * 0.28;

      // Aterrizaje suave vs impacto fuerte
      if (playerUnit.position.y <= 1.2) {
        if (speed > 0.75 || steerInput.y < -0.65) {
          triggerGameOver('goCrash');
        } else {
          playerUnit.position.y = 1.2;
        }
      }
      if (playerUnit.userData.mainRotor) playerUnit.userData.mainRotor.rotation.y += 0.45;
      if (playerUnit.userData.tailRotor) playerUnit.userData.tailRotor.rotation.x += 0.5;
    } else {
      // Avance autónomo del VIP en carretera y verificación de perímetro
      vipUnit.position.z += 0.46;
      const distToVip = playerUnit.position.distanceTo(vipUnit.position);
      if (distToVip > 26) {
        outOfPerimeterTimer += dt;
        if (outOfPerimeterTimer > 6) triggerGameOver('goPerimeter');
      } else {
        outOfPerimeterTimer = Math.max(0, outOfPerimeterTimer - dt);
      }
    }

    // Emboscadas enemigas disparando
    enemies.forEach((e) => {
      e.position.z += 0.28;
      if (e.position.z < playerUnit.position.z - 25) {
        e.position.z = playerUnit.position.z + 90;
      }
      if (Math.abs(e.position.z - playerUnit.position.z) < 28 && Math.random() < 0.03) {
        // Fuego enemigo contra el agente o el VIP
        if (vehicleMode === 'GROUND' && playerUnit.position.distanceTo(e.position) < vipUnit.position.distanceTo(e.position)) {
          agentHealth -= 2.2;
        } else {
          vipHealth -= 1.8;
        }
        updateBarsUI();
        if (vipHealth <= 0) triggerGameOver('goVipKilled');
        if (agentHealth <= 0) triggerGameOver('goAgentKia');
      }
    });

    // Ruedas y sirenas
    const flash = Math.sin(tNow * 18) > 0;
    escortUnits.forEach((u) => {
      (u.userData.wheels || []).forEach((w) => { w.rotation.x += speed * 0.45; });
      const strobes = u.userData.strobes || [];
      if (strobes.length >= 2) {
        strobes[0].visible = sirensOn ? flash : false;
        strobes[1].visible = sirensOn ? !flash : false;
      }
    });

    // Partículas
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        scene.remove(p.mesh);
        particles.splice(i, 1);
        continue;
      }
      p.vel.y += p.gravity;
      p.mesh.position.add(p.vel);
      p.mesh.material.opacity = Math.max(p.life / p.maxLife, 0);
    }

    // Cámara
    const target = playerUnit.position;
    if (camMode === 0) {
      camera.position.lerp(new THREE.Vector3(target.x, target.y + 7.5, target.z - 19), 0.12);
      camera.lookAt(target.x, target.y + 1.8, target.z + 12);
    } else if (camMode === 1) {
      camera.position.lerp(new THREE.Vector3(target.x + 14, target.y + 4.5, target.z + 4), 0.12);
      camera.lookAt(target.x, target.y + 1.5, target.z + 2);
    } else {
      camera.position.lerp(new THREE.Vector3(target.x, target.y + 26, target.z - 24), 0.12);
      camera.lookAt(target.x, target.y + 1, target.z + 6);
    }
  }

  composer.render();
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  bloomPass.setSize(window.innerWidth, window.innerHeight);
});

animate();
