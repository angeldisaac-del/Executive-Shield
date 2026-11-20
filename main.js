import * as THREE from 'three';
import { LANGUAGES, TRANSLATIONS } from './i18n.js';
import { sfx } from './audio.js';
import {
  NATION_SPECS,
  buildHumanCharacter,
  buildEscortMoto,
  buildDetailedVehicle,
  buildAircraft
} from './models3d.js';

// 1. RENDERER Y ESCENA DIURNA REALISTA (SIN QUEMAR EN BLANCO)
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7dd3fc);
scene.fog = new THREE.Fog(0xbae6fd, 90, 420);

const camera = new THREE.PerspectiveCamera(56, window.innerWidth / window.innerHeight, 0.5, 450);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xf0f9ff, 0x334155, 1.15));
const sun = new THREE.DirectionalLight(0xfffbeb, 1.35);
sun.position.set(60, 110, 40);
sun.castShadow = true;
scene.add(sun);

// 2. MUNDO: RESIDENCIA OFICIAL, CIUDAD, AUTOPISTA, HELIPUERTO Y AEROPUERTO
const world = new THREE.Group();
scene.add(world);

let palaceMesh = null;

function buildWorld(nation = 'US') {
  while (world.children.length > 0) world.remove(world.children[0]);
  const spec = NATION_SPECS[nation];

  // Césped y avenida
  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(1600, 2400),
    new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.9 })
  );
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;
  world.add(grass);

  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 2400),
    new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.82 })
  );
  road.rotation.x = -Math.PI / 2;
  road.position.y = 0.03;
  road.receiveShadow = true;
  world.add(road);

  // Líneas amarillas de carril
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  for (let z = -200; z <= 1400; z += 12) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 5), lineMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(0, 0.05, z);
    world.add(dash);
  }

  // Residencia Oficial (Casa Blanca / Kremlin / Zhongnanhai) en z = -15
  palaceMesh = new THREE.Group();
  const mainHall = new THREE.Mesh(
    new THREE.BoxGeometry(36, 12, 16),
    new THREE.MeshStandardMaterial({ color: spec.palaceColor, roughness: 0.5 })
  );
  mainHall.position.set(0, 6, -18);
  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(38, 1.5, 18),
    new THREE.MeshStandardMaterial({ color: spec.roofColor, roughness: 0.4 })
  );
  roof.position.set(0, 12.7, -18);
  palaceMesh.add(mainHall, roof);
  world.add(palaceMesh);

  // Edificios urbanos a ambos lados de la avenida
  const bColors = [0x334155, 0x475569, 0x1e293b, 0x64748b];
  for (let z = 30; z <= 950; z += 26) {
    [-1, 1].forEach((side, sIdx) => {
      const h = 20 + ((z + sIdx * 13) % 45);
      const b = new THREE.Mesh(
        new THREE.BoxGeometry(14, h, 14),
        new THREE.MeshStandardMaterial({ color: bColors[(z + sIdx) % bColors.length], roughness: 0.55 })
      );
      b.position.set(side * 24, h / 2, z);
      world.add(b);
    });
  }

  // Helipuerto Táctico en z = 520
  const helipad = new THREE.Mesh(
    new THREE.CylinderGeometry(11, 11, 0.2, 24),
    new THREE.MeshStandardMaterial({ color: 0x334155 })
  );
  helipad.position.set(0, 0.12, 520);
  world.add(helipad);

  // Aeropuerto Internacional y Pista en z = 980
  const runway = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 360),
    new THREE.MeshStandardMaterial({ color: 0x0f172a })
  );
  runway.rotation.x = -Math.PI / 2;
  runway.position.set(0, 0.06, 1080);
  world.add(runway);
}

// 3. ESTADO DE CAMPAÑA (8 MISIONES)
let lang = 'ES';
let selectedNation = 'US';
let controlMode = 'JOYSTICK';
let missionStep = 1; // 1 a 8
let playing = false;
let vipHp = 100;
let agentHp = 100;

function t(k) {
  return TRANSLATIONS[lang][k] || TRANSLATIONS.ES[k];
}

function setRadio(key) {
  const msg = t(key);
  document.getElementById('hud-radio').textContent = msg;
  const meta = LANGUAGES.find((l) => l.code === lang);
  sfx.speakRadio(msg, meta ? meta.voice : 'es-ES');
}

function setMission(num) {
  missionStep = num;
  document.getElementById('hud-mission').textContent = t(`m${num}`);
}

function updateHpUI() {
  document.getElementById('val-vip').textContent = `${Math.max(0, Math.round(vipHp))}%`;
  document.getElementById('val-agent').textContent = `${Math.max(0, Math.round(agentHp))}%`;
  document.getElementById('vip-fill').style.width = `${Math.max(0, vipHp)}%`;
  document.getElementById('agent-fill').style.width = `${Math.max(0, agentHp)}%`;
}

function endGame(win, reasonKey) {
  playing = false;
  document.getElementById('game-hud').style.display = 'none';
  const scr = document.getElementById('end-screen');
  const title = document.getElementById('end-title');
  title.textContent = win ? t('winTitle') : t('goTitle');
  title.style.color = win ? '#22c55e' : '#ef4444';
  document.getElementById('end-desc').textContent = win ? t('winDesc') : t(reasonKey);
  document.getElementById('btn-retry').textContent = t('retry');
  scr.style.display = 'flex';
}

function applyTranslations() {
  const meta = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
  document.documentElement.lang = lang.toLowerCase();
  document.documentElement.dir = meta.dir;

  document.getElementById('txt-rotate').textContent = t('rotateMsg');
  document.getElementById('txt-sub').textContent = t('subtitle');
  document.getElementById('lbl-sec-nation').textContent = t('selectNation');
  document.getElementById('lbl-sec-ctrl').textContent = t('selectCtrl');
  document.getElementById('nat-us').textContent = t('usName');
  document.getElementById('nat-ru').textContent = t('ruName');
  document.getElementById('nat-cn').textContent = t('cnName');
  document.getElementById('c-joy').textContent = t('ctrlJoy');
  document.getElementById('c-arr').textContent = t('ctrlArr');
  document.getElementById('c-tilt').textContent = t('ctrlTilt');
  document.getElementById('btn-start').textContent = t('startBtn');

  document.getElementById('lbl-vip').textContent = t('vipLbl');
  document.getElementById('lbl-agent').textContent = t('agentLbl');
  document.getElementById('btn-gas').textContent = t('gas');
  document.getElementById('btn-brake').textContent = t('brake');
  document.getElementById('btn-shoot').textContent = t('actionShoot');
  document.getElementById('btn-cqc').textContent = t('actionCqc');
  document.getElementById('btn-board').textContent = t('actionBoard');
  document.getElementById('btn-flare').textContent = t('actionFlare');
  document.getElementById('btn-radio').textContent = t('actionRadio');
}

// 4. ACTORES EN ESCENA (AGENTES A PIE + CONVOY REAL CON MOTOS Y 2 LIMUSINAS + AERONAVES)
const actors = new THREE.Group();
scene.add(actors);

let agentChar = null;
let vipChar = null;
let convoyGroup = null;
let aircraft = null;
let hostiles = [];
let projectiles = [];
let flares = [];

function setupOperation() {
  while (actors.children.length > 0) actors.remove(actors.children[0]);
  hostiles = [];
  projectiles = [];
  flares = [];
  vipHp = 100;
  agentHp = 100;
  updateHpUI();

  buildWorld(selectedNation);

  // Fase 1 y 2: Agente del Servicio Secreto y Presidente a pie frente a la residencia
  agentChar = buildHumanCharacter({ role: 'agent', nation: selectedNation });
  agentChar.position.set(0, 0, 2);

  vipChar = buildHumanCharacter({ role: 'vip', nation: selectedNation });
  vipChar.position.set(-1.5, 0, -2);

  // Caravana Presidencial Real estacionada lista para abordar (z = 16)
  convoyGroup = new THREE.Group();
  convoyGroup.position.set(0, 0, 16);

  // 2 Motocicletas escolta al frente
  const motoL = buildEscortMoto();
  motoL.position.set(-2.4, 0, 14);
  const motoR = buildEscortMoto();
  motoR.position.set(2.4, 0, 14);

  // 2 Limusinas Presidenciales idénticas (La Bestia / Señuelo)
  const limo1 = buildDetailedVehicle(selectedNation, 'limo');
  limo1.position.set(0, 0, 6);
  const limo2 = buildDetailedVehicle(selectedNation, 'limo');
  limo2.position.set(0, 0, -2.5);

  // SUVs blindados detrás + Ambulancia
  const suv1 = buildDetailedVehicle(selectedNation, 'suv');
  suv1.position.set(-2.5, 0, -10.5);
  const ambu = buildDetailedVehicle(selectedNation, 'ambulance');
  ambu.position.set(2.5, 0, -11);

  convoyGroup.add(motoL, motoR, limo1, limo2, suv1, ambu);
  convoyGroup.userData = { vehicles: [limo1, limo2, suv1, ambu], motos: [motoL, motoR] };

  actors.add(agentChar, vipChar, convoyGroup);

  // Atacantes de la emboscada inicial (Misión 1)
  for (let i = 0; i < 4; i++) {
    const enemy = buildHumanCharacter({ role: 'enemy' });
    enemy.position.set(-8 + i * 5.2, 0, 10 + (i % 2) * 4);
    enemy.userData.hp = 30;
    actors.add(enemy);
    hostiles.push(enemy);
  }

  document.getElementById('btn-board').style.display = 'inline-block';
  document.getElementById('btn-flare').style.display = 'none';
  setMission(1);
  setRadio('radioStart');
}

function boardPresidentialConvoy() {
  if (missionStep > 2) return;
  vipChar.visible = false;
  agentChar.visible = false;
  document.getElementById('btn-board').style.display = 'none';
  setMission(3);
  setRadio('radioBoarded');

  // Generar bloqueos enemigos en carretera (Misión 4)
  for (let i = 0; i < 4; i++) {
    const eCar = buildDetailedVehicle('RU', 'enemy');
    eCar.position.set((i % 2 === 0 ? -4.5 : 4.5), 0, 220 + i * 65);
    eCar.userData.hp = 40;
    actors.add(eCar);
    hostiles.push(eCar);
  }
}

function transitionToAircraft(kind) {
  if (aircraft) actors.remove(aircraft);
  convoyGroup.visible = false;
  aircraft = buildAircraft(selectedNation, kind);
  aircraft.position.set(0, kind === 'heli' ? 12 : 24, kind === 'heli' ? 530 : 980);
  actors.add(aircraft);
  document.getElementById('btn-flare').style.display = 'inline-block';
}

// 5. ACCIONES DE COMBATE Y BENGALAS REALISTAS
function fireWeapon() {
  sfx.gunshot();
  const origin =
    missionStep <= 2 ? agentChar.position.clone().add(new THREE.Vector3(0, 1.2, 0.5)) :
    missionStep <= 4 ? convoyGroup.position.clone().add(new THREE.Vector3(0, 1.4, 8)) :
    aircraft.position.clone();

  const bullet = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.14, 1.4),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  bullet.position.copy(origin);
  actors.add(bullet);
  projectiles.push({ mesh: bullet, life: 1.1 });
}

function doCqcStrike() {
  sfx.cqcHit();
  if (missionStep <= 2) {
    for (let i = hostiles.length - 1; i >= 0; i--) {
      if (hostiles[i].position.distanceTo(agentChar.position) < 5.5) {
        actors.remove(hostiles[i]);
        hostiles.splice(i, 1);
      }
    }
    if (hostiles.length === 0 && missionStep === 1) setMission(2);
  }
}

function deployRealisticFlares() {
  if (!aircraft) return;
  sfx.flareLaunch();
  setRadio('radioFlare');
  for (let i = 0; i < 10; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xfff7ed })
    );
    core.position.copy(aircraft.position).add(new THREE.Vector3(side * 1.4, -0.4, -1.5));
    actors.add(core);
    flares.push({
      mesh: core,
      vel: new THREE.Vector3(side * (0.24 + Math.random() * 0.2), -0.04, -0.25),
      life: 2.2
    });
  }
}

// 6. CONTROLES (JOYSTICK / FLECHAS / GIROSCOPIO + ACELERAR / FRENAR)
const ctrl = { x: 0, y: 0, gas: false, brake: false };
let speed = 0;

const jBase = document.getElementById('joy-base');
const jKnob = document.getElementById('joy-knob');
jBase.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const r = jBase.getBoundingClientRect();
  const dx = THREE.MathUtils.clamp((touch.clientX - (r.left + r.width / 2)) / 36, -1, 1);
  const dy = THREE.MathUtils.clamp((touch.clientY - (r.top + r.height / 2)) / 36, -1, 1);
  ctrl.x = -dx;
  ctrl.y = -dy;
  jKnob.style.transform = `translate(${dx * 28}px, ${dy * 28}px)`;
});
jBase.addEventListener('touchend', () => {
  ctrl.x = 0;
  ctrl.y = 0;
  jKnob.style.transform = 'translate(0,0)';
});

function bindBtn(id, fnDown, fnUp) {
  const el = document.getElementById(id);
  el.addEventListener('touchstart', (e) => { e.preventDefault(); fnDown(); });
  el.addEventListener('touchend', (e) => { e.preventDefault(); if (fnUp) fnUp(); });
  el.addEventListener('mousedown', fnDown);
  el.addEventListener('mouseup', () => { if (fnUp) fnUp(); });
}
bindBtn('a-left', () => (ctrl.x = 1), () => (ctrl.x = 0));
bindBtn('a-right', () => (ctrl.x = -1), () => (ctrl.x = 0));
bindBtn('a-up', () => (ctrl.y = 1), () => (ctrl.y = 0));
bindBtn('a-down', () => (ctrl.y = -1), () => (ctrl.y = 0));
bindBtn('btn-gas', () => (ctrl.gas = true), () => (ctrl.gas = false));
bindBtn('btn-brake', () => (ctrl.brake = true), () => (ctrl.brake = false));

window.addEventListener('deviceorientation', (e) => {
  if (controlMode !== 'TILT' || e.gamma === null) return;
  ctrl.x = THREE.MathUtils.clamp(-e.gamma / 28, -1, 1);
  if (e.beta !== null) ctrl.y = THREE.MathUtils.clamp((45 - e.beta) / 30, -1, 1);
});

// Eventos de Portada
document.querySelectorAll('#lang-bar button').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('#lang-bar button').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    lang = b.dataset.lang;
    applyTranslations();
  });
});

document.querySelectorAll('#nation-bar button').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('#nation-bar button').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    selectedNation = b.dataset.nat;
  });
});

document.querySelectorAll('#ctrl-bar button').forEach((b) => {
  b.addEventListener('click', () => {
    document.querySelectorAll('#ctrl-bar button').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    controlMode = b.dataset.ctrl;
  });
});

document.getElementById('btn-start').addEventListener('click', () => {
  sfx.init();
  document.getElementById('cover-screen').style.display = 'none';
  document.getElementById('game-hud').style.display = 'block';

  document.getElementById('joy-base').style.display = controlMode === 'JOYSTICK' ? 'block' : 'none';
  document.getElementById('arr-pad').style.display = controlMode === 'ARROWS' ? 'grid' : 'none';
  document.getElementById('tilt-box').style.display = controlMode === 'TILT' ? 'block' : 'none';

  if (controlMode === 'TILT' && typeof DeviceOrientationEvent?.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission().catch(() => {});
  }

  setupOperation();
  playing = true;
});

document.getElementById('btn-shoot').addEventListener('click', fireWeapon);
document.getElementById('btn-cqc').addEventListener('click', doCqcStrike);
document.getElementById('btn-board').addEventListener('click', boardPresidentialConvoy);
document.getElementById('btn-flare').addEventListener('click', deployRealisticFlares);
document.getElementById('btn-radio').addEventListener('click', () => {
  agentHp = Math.min(100, agentHp + 30);
  vipHp = Math.min(100, vipHp + 20);
  updateHpUI();
  setRadio('radioSupport');
});

document.getElementById('btn-retry').addEventListener('click', () => {
  document.getElementById('end-screen').style.display = 'none';
  document.getElementById('cover-screen').style.display = 'flex';
});

applyTranslations();

// 7. BUCLE PRINCIPAL DE JUEGO Y PROGRESIÓN DE LAS 8 MISIONES
const clock = new THREE.Clock();
let sirenTimer = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.getElapsedTime();

  if (playing) {
    // Misiones 1 y 2: Combate a pie del Servicio Secreto y escolta al blindado
    if (missionStep <= 2) {
      const moveZ = (ctrl.gas ? 0.16 : 0) + ctrl.y * 0.14;
      const moveX = ctrl.x * 0.14;
      agentChar.position.z += moveZ;
      agentChar.position.x = THREE.MathUtils.clamp(agentChar.position.x + moveX, -11, 11);

      // Animación de piernas al caminar
      if (Math.abs(moveZ) + Math.abs(moveX) > 0.01) {
        agentChar.userData.legL.rotation.x = Math.sin(elapsed * 12) * 0.5;
        agentChar.userData.legR.rotation.x = -Math.sin(elapsed * 12) * 0.5;
      }

      // El Presidente sigue de cerca al agente
      const targetVip = agentChar.position.clone().add(new THREE.Vector3(-1.3, 0, -1.2));
      vipChar.position.lerp(targetVip, 0.06);

      if (hostiles.length === 0 && missionStep === 1) setMission(2);

      camera.position.lerp(new THREE.Vector3(agentChar.position.x, 4.8, agentChar.position.z - 8.5), 0.12);
      camera.lookAt(agentChar.position.x, 1.3, agentChar.position.z + 4);
    }

    // Misiones 3, 4 y 5: Conducción de Caravana Presidencial (Motos + 2 Limusinas + SUVs)
    else if (missionStep >= 3 && missionStep <= 5) {
      if (ctrl.gas) speed = Math.min(speed + 0.025, 1.15);
      else if (ctrl.brake) speed = Math.max(speed - 0.035, 0);
      else speed = THREE.MathUtils.lerp(speed, 0.55, 0.02);

      convoyGroup.position.z += speed;
      convoyGroup.position.x = THREE.MathUtils.clamp(convoyGroup.position.x + ctrl.x * 0.28, -8.5, 8.5);

      sirenTimer += dt;
      if (sirenTimer > 0.45) {
        sirenTimer = 0;
        sfx.sirenPulse(Math.sin(elapsed * 8) > 0);
      }

      // Girar ruedas y parpadear sirenas
      const flash = Math.sin(elapsed * 16) > 0;
      convoyGroup.userData.vehicles.forEach((v) => {
        v.userData.wheels.forEach((w) => (w.rotation.x += speed * 0.45));
        v.userData.strobes[0].visible = flash;
        v.userData.strobes[1].visible = !flash;
      });

      if (convoyGroup.position.z > 200 && missionStep === 3) setMission(4);
      if (convoyGroup.position.z > 490 && missionStep === 4) setMission(5);
      if (convoyGroup.position.z >= 525) {
        setMission(6);
        setRadio('radioHeli');
        transitionToAircraft('heli');
      }

      camera.position.lerp(new THREE.Vector3(convoyGroup.position.x, 7.5, convoyGroup.position.z - 22), 0.1);
      camera.lookAt(convoyGroup.position.x, 1.8, convoyGroup.position.z + 10);
    }

    // Misiones 6, 7 y 8: Vuelo en Helicóptero y Avión Presidencial hacia Cumbre ONU
    else if (missionStep >= 6) {
      const maxAir = missionStep === 6 ? 1.2 : 1.75;
      if (ctrl.gas) speed = Math.min(speed + 0.03, maxAir);
      else if (ctrl.brake) speed = Math.max(speed - 0.03, 0.25);
      else speed = THREE.MathUtils.lerp(speed, 0.85, 0.02);

      aircraft.position.z += speed;
      aircraft.position.x = THREE.MathUtils.clamp(aircraft.position.x + ctrl.x * 0.35, -14, 14);
      aircraft.position.y = Math.max(1.4, aircraft.position.y + ctrl.y * 0.25);

      if (aircraft.userData.rotor) aircraft.userData.rotor.rotation.y += 0.45;

      if (missionStep === 6 && aircraft.position.z >= 960) {
        setMission(7);
        setRadio('radioJet');
        transitionToAircraft('jet');
      }
      if (missionStep === 7 && aircraft.position.z >= 1040) {
        setMission(8);
      }
      if (missionStep === 8 && aircraft.position.z >= 1150) {
        if (aircraft.position.y <= 3.5 && speed < 0.95) {
          endGame(true);
        } else if (aircraft.position.y <= 2.0) {
          endGame(false, 'goCrash');
        }
      }

      camera.position.lerp(new THREE.Vector3(aircraft.position.x, aircraft.position.y + 6.5, aircraft.position.z - 22), 0.1);
      camera.lookAt(aircraft.position.x, aircraft.position.y, aircraft.position.z + 12);
    }

    // Proyectiles e impacto contra enemigos
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      p.life -= dt;
      p.mesh.position.z += 2.6;
      for (let j = hostiles.length - 1; j >= 0; j--) {
        if (p.mesh.position.distanceTo(hostiles[j].position) < 3.2) {
          actors.remove(hostiles[j]);
          hostiles.splice(j, 1);
          p.life = 0;
        }
      }
      if (p.life <= 0) {
        actors.remove(p.mesh);
        projectiles.splice(i, 1);
      }
    }

    // Bengalas térmicas cayendo con humo
    for (let i = flares.length - 1; i >= 0; i--) {
      const f = flares[i];
      f.life -= dt;
      f.vel.y -= 0.005;
      f.mesh.position.add(f.vel);
      if (f.life <= 0) {
        actors.remove(f.mesh);
        flares.splice(i, 1);
      }
    }

    // Fuego enemigo si quedan hostiles cerca
    if (hostiles.length > 0 && Math.random() < 0.025) {
      agentHp -= 1.5;
      if (Math.random() < 0.4) vipHp -= 1.2;
      updateHpUI();
      if (vipHp <= 0) endGame(false, 'goVip');
      if (agentHp <= 0) endGame(false, 'goAgent');
    }
  }

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
