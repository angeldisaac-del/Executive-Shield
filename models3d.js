import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

export const NATIONS = {
  US: { code: 'US', bodyColor: 0x0b0f17, ambuStripe: 0xdc2626, airColor: 0x143624 },
  RU: { code: 'RU', bodyColor: 0x111318, ambuStripe: 0xea580c, airColor: 0x1e3a5f },
  CN: { code: 'CN', bodyColor: 0x090b10, ambuStripe: 0x2563eb, airColor: 0x1f2937 }
};

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://unpkg.com/three@0.164.1/examples/jsm/libs/draco/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

function addStrobes(group, zOffset = 2.2, yOffset = 1.1) {
  const strobeL = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.11, 0.08),
    new THREE.MeshBasicMaterial({ color: 0x3b82f6 })
  );
  strobeL.position.set(-0.42, yOffset, zOffset);

  const strobeR = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.11, 0.08),
    new THREE.MeshBasicMaterial({ color: 0xef4444 })
  );
  strobeR.position.set(0.42, yOffset, zOffset);

  group.add(strobeL, strobeR);
  return [strobeL, strobeR];
}

function buildFallbackVehicle(nationKey, kind = 'limo') {
  const spec = NATIONS[nationKey];
  const group = new THREE.Group();
  const wheels = [];

  const isAmbu = kind === 'ambulance';
  const length = kind === 'limo' ? 6.4 : 5.2;
  const height = isAmbu ? 2.1 : 1.35;

  const mat = new THREE.MeshStandardMaterial({
    color: isAmbu ? 0xf8fafc : spec.bodyColor,
    metalness: isAmbu ? 0.25 : 0.85,
    roughness: isAmbu ? 0.35 : 0.2
  });

  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.1, height, length), mat);
  hull.position.y = height / 2 + 0.38;
  hull.castShadow = true;
  group.add(hull);

  if (isAmbu) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(2.14, 0.3, length),
      new THREE.MeshStandardMaterial({ color: spec.ambuStripe })
    );
    stripe.position.y = 1.25;
    group.add(stripe);
  }

  // Ruedas giratorias
  const tireGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.32, 16);
  tireGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.BoxGeometry(0.35, 0.55, 0.12);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.85 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });

  const wheelCoords = [
    [-1.08, 0.45, length * 0.33],
    [1.08, 0.45, length * 0.33],
    [-1.08, 0.45, -length * 0.33],
    [1.08, 0.45, -length * 0.33]
  ];

  wheelCoords.forEach(([x, y, z]) => {
    const w = new THREE.Group();
    w.add(new THREE.Mesh(tireGeo, tireMat), new THREE.Mesh(rimGeo, rimMat));
    w.position.set(x, y, z);
    group.add(w);
    wheels.push(w);
  });

  const strobes = addStrobes(group, length * 0.46, height + 0.25);
  group.userData = { strobes, wheels, nation: nationKey, kind };
  return group;
}

export function loadModelGLB(filename, nationKey = 'US', kind = 'limo', targetLength = 6.2) {
  const container = new THREE.Group();
  const fallback = buildFallbackVehicle(nationKey, kind);
  container.add(fallback);
  container.userData = {
    strobes: fallback.userData.strobes,
    wheels: fallback.userData.wheels,
    nation: nationKey,
    kind
  };

  gltfLoader.load(
    `./models/${filename}`,
    (gltf) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);

      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      model.scale.setScalar(targetLength / maxDim);

      model.updateMatrixWorld(true);
      const scaledBox = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      scaledBox.getCenter(center);

      model.position.x -= center.x;
      model.position.z -= center.z;
      model.position.y -= scaledBox.min.y;

      const detectedWheels = [];
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          if (/wheel|tire|rim/i.test(child.name)) detectedWheels.push(child);
        }
      });

      container.remove(fallback);
      container.add(model);
      container.userData.wheels = detectedWheels;
      container.userData.loadedGLB = filename;
    },
    undefined,
    () => {}
  );

  return container;
}

/**
 * Helicóptero Presidencial con rotores girando
 */
export function buildPresidentialHeli(nationKey = 'US') {
  const spec = NATIONS[nationKey];
  const heli = new THREE.Group();

  const hullMat = new THREE.MeshStandardMaterial({ color: spec.airColor, metalness: 0.7, roughness: 0.25 });
  const topMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.4, roughness: 0.3 });
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.85, roughness: 0.2 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.75, 5.2), hullMat);
  body.position.y = 1.4;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.42, 4.4), topMat);
  cap.position.set(0, 2.4, -0.2);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.62, 4.2), hullMat);
  tail.position.set(0, 1.7, -4.4);

  const mainRotor = new THREE.Group();
  mainRotor.position.set(0, 2.9, 0.2);
  mainRotor.add(
    new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.06, 0.34), bladeMat),
    new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 9.4), bladeMat)
  );

  const tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.85, 0.22), bladeMat);
  tailRotor.position.set(0.35, 1.9, -6.3);

  heli.add(body, cap, tail, mainRotor, tailRotor);
  heli.userData = { mainRotor, tailRotor, type: 'heli', nation: nationKey };
  return heli;
}

/**
 * Avión Presidencial de Escolta / Air Force One con turbinas activas
 */
export function buildPresidentialJet(nationKey = 'US') {
  const jet = new THREE.Group();
  const fuselageMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.75, roughness: 0.2 });
  const stripeMat = new THREE.MeshStandardMaterial({
    color: nationKey === 'CN' ? 0xdc2626 : nationKey === 'RU' ? 0x1d4ed8 : 0x0284c7,
    metalness: 0.6,
    roughness: 0.3
  });
  const jetGlowMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });

  const fuselage = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 13.5, 16), fuselageMat);
  fuselage.rotation.x = Math.PI / 2;

  const wings = new THREE.Mesh(new THREE.BoxGeometry(14.5, 0.18, 2.6), fuselageMat);
  wings.position.set(0, -0.1, 0.4);

  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.8, 2.2), stripeMat);
  tailFin.position.set(0, 1.5, -5.4);

  const turbines = [];
  [-3.8, 3.8].forEach((x) => {
    const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.42, 2.1, 12), fuselageMat);
    pod.rotation.x = Math.PI / 2;
    pod.position.set(x, -0.55, 0.7);

    const exhaust = new THREE.Mesh(new THREE.SphereGeometry(0.38, 10, 10), jetGlowMat);
    exhaust.position.set(x, -0.55, -0.45);
    jet.add(pod, exhaust);
    turbines.push(exhaust);
  });

  jet.add(fuselage, wings, tailFin);
  jet.userData = { turbines, type: 'jet', nation: nationKey };
  return jet;
}
