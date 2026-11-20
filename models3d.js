import * as THREE from 'three';

export const NATION_SPECS = {
  US: {
    limoColor: 0x0f172a,
    accent: 0x2563eb,
    flagA: 0x1d4ed8,
    flagB: 0xdc2626,
    palaceColor: 0xf8fafc, // Casa Blanca
    roofColor: 0xe2e8f0
  },
  RU: {
    limoColor: 0x111827,
    accent: 0xdc2626,
    flagA: 0xffffff,
    flagB: 0x1e40af,
    palaceColor: 0xb91c1c, // Kremlin
    roofColor: 0x15803d
  },
  CN: {
    limoColor: 0x090d16,
    accent: 0xfacc15,
    flagA: 0xdc2626,
    flagB: 0xfacc15,
    palaceColor: 0x991b1b, // Zhongnanhai
    roofColor: 0xeab308
  }
};

/**
 * Personaje humano articulado (Agente del Servicio Secreto, Presidente o Atacante)
 */
export function buildHumanCharacter({ role = 'agent', nation = 'US' } = {}) {
  const char = new THREE.Group();

  const suitColor =
    role === 'agent' ? 0x0f172a :
    role === 'vip' ? 0x1e3a8a :
    0x3f2e21;

  const shirtColor = role === 'enemy' ? 0x7f1d1d : 0xf8fafc;
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xf1c27d, roughness: 0.6 });
  const suitMat = new THREE.MeshStandardMaterial({ color: suitColor, roughness: 0.45, metalness: 0.15 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor });

  // Piernas
  const legGeo = new THREE.BoxGeometry(0.22, 0.78, 0.22);
  const legL = new THREE.Mesh(legGeo, suitMat);
  legL.position.set(-0.15, 0.39, 0);
  const legR = new THREE.Mesh(legGeo, suitMat);
  legR.position.set(0.15, 0.39, 0);

  // Torso y corbata
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.75, 0.28), suitMat);
  torso.position.y = 1.15;
  torso.castShadow = true;

  const tie = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.42, 0.3),
    new THREE.MeshBasicMaterial({ color: role === 'vip' ? 0xdc2626 : 0x0284c7 })
  );
  tie.position.y = 1.22;

  // Cabeza + gafas oscuras del Servicio Secreto
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.21, 14, 14), skinMat);
  head.position.y = 1.74;

  if (role === 'agent') {
    const glasses = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.08, 0.12),
      new THREE.MeshBasicMaterial({ color: 0x020617 })
    );
    glasses.position.set(0, 1.76, 0.16);
    char.add(glasses);
  }

  // Brazos y arma
  const armGeo = new THREE.BoxGeometry(0.17, 0.65, 0.17);
  const armL = new THREE.Mesh(armGeo, suitMat);
  armL.position.set(-0.38, 1.15, 0);

  const armR = new THREE.Mesh(armGeo, suitMat);
  armR.position.set(0.38, 1.15, 0.15);
  armR.rotation.x = -0.6;

  if (role !== 'vip') {
    const gun = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.12, 0.45),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 })
    );
    gun.position.set(0.38, 1.18, 0.45);
    char.add(gun);
  }

  char.add(legL, legR, torso, tie, head, armL, armR);
  char.userData = { legL, legR, armR, role, nation };
  return char;
}

/**
 * Motocicleta Policial de Escolta Presidencial
 */
export function buildEscortMoto() {
  const moto = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.75, 2.1),
    new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.6, roughness: 0.25 })
  );
  body.position.y = 0.65;

  const rider = buildHumanCharacter({ role: 'agent' });
  rider.scale.setScalar(0.85);
  rider.position.set(0, 0.45, -0.15);

  const strobeB = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.16), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
  strobeB.position.set(-0.22, 1.15, 0.85);
  const strobeR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.16), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
  strobeR.position.set(0.22, 1.15, 0.85);

  moto.add(body, rider, strobeB, strobeR);
  moto.userData = { strobes: [strobeB, strobeR] };
  return moto;
}

/**
 * Vehículo Presidencial Detallado (Limusina con cabinas, parrilla cromada, banderas y ruedas)
 */
export function buildDetailedVehicle(nation = 'US', type = 'limo') {
  const spec = NATION_SPECS[nation] || NATION_SPECS.US;
  const car = new THREE.Group();
  const wheels = [];

  const isLimo = type === 'limo';
  const isAmbu = type === 'ambulance';
  const length = isLimo ? 6.8 : isAmbu ? 6.0 : 5.2;
  const width = 2.15;

  const paintMat = new THREE.MeshStandardMaterial({
    color: isAmbu ? 0xf8fafc : type === 'enemy' ? 0x27272a : spec.limoColor,
    metalness: 0.78,
    roughness: 0.22
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.92,
    roughness: 0.1
  });
  const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 });

  // Chasis inferior
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(width, 0.85, length), paintMat);
  chassis.position.y = 0.78;
  chassis.castShadow = true;
  car.add(chassis);

  // Cabina superior con cristales blindados
  const cabinLen = isLimo ? length * 0.62 : isAmbu ? length * 0.78 : length * 0.66;
  const cabinH = isAmbu ? 1.25 : 0.72;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.88, cabinH, cabinLen), glassMat);
  cabin.position.set(0, 1.18 + cabinH / 2, isAmbu ? -0.35 : -0.25);
  car.add(cabin);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(width * 0.86, 0.1, cabinLen * 0.98), paintMat);
  roof.position.set(0, 1.2 + cabinH, isAmbu ? -0.35 : -0.25);
  car.add(roof);

  // Parrilla delantera y faros LED
  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.45, 0.1), chromeMat);
  grille.position.set(0, 0.78, length / 2 + 0.02);
  car.add(grille);

  [-0.78, 0.78].forEach((hx) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 0.08), new THREE.MeshBasicMaterial({ color: 0xfef9c3 }));
    hl.position.set(hx, 0.82, length / 2 + 0.03);
    car.add(hl);
  });

  // Banderas oficiales en el capó si es limusina
  if (isLimo) {
    [-0.95, 0.95].forEach((fx, idx) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.65), chromeMat);
      pole.position.set(fx, 1.35, length * 0.36);
      const flag = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.24, 0.38),
        new THREE.MeshBasicMaterial({ color: idx === 0 ? spec.flagA : spec.flagB })
      );
      flag.position.set(fx, 1.52, length * 0.36 - 0.18);
      car.add(pole, flag);
    });
  }

  // Franja de ambulancia
  if (isAmbu) {
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.04, 0.28, length + 0.02),
      new THREE.MeshBasicMaterial({ color: 0xdc2626 })
    );
    stripe.position.y = 0.95;
    car.add(stripe);
  }

  // Ruedas con rines cromados
  const tireGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.32, 16);
  tireGeo.rotateZ(Math.PI / 2);
  const rimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.34, 12);
  rimGeo.rotateZ(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.85 });

  [
    [-1.08, 0.45, length * 0.33],
    [1.08, 0.45, length * 0.33],
    [-1.08, 0.45, -length * 0.33],
    [1.08, 0.45, -length * 0.33]
  ].forEach(([x, y, z]) => {
    const w = new THREE.Group();
    w.add(new THREE.Mesh(tireGeo, tireMat), new THREE.Mesh(rimGeo, chromeMat));
    w.position.set(x, y, z);
    car.add(w);
    wheels.push(w);
  });

  // Estrobos
  const sB = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.08), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
  sB.position.set(-0.4, 1.25, length * 0.28);
  const sR = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.08), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
  sR.position.set(0.4, 1.25, length * 0.28);
  car.add(sB, sR);

  car.userData = { wheels, strobes: [sB, sR], type };
  return car;
}

/**
 * Helicóptero y Avión Presidencial
 */
export function buildAircraft(nation = 'US', kind = 'heli') {
  const craft = new THREE.Group();
  const isJet = kind === 'jet';
  const bodyColor = isJet ? 0xf8fafc : nation === 'US' ? 0x143624 : nation === 'RU' ? 0x1e3a5f : 0x1f2937;
  const mat = new THREE.MeshStandardMaterial({ color: bodyColor, metalness: 0.65, roughness: 0.25 });
  const stripeMat = new THREE.MeshBasicMaterial({
    color: nation === 'CN' ? 0xdc2626 : nation === 'RU' ? 0x2563eb : 0x0284c7
  });

  if (!isJet) {
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.9, 5.8), mat);
    body.position.y = 1.4;
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 4.6), mat);
    tail.position.set(0, 1.7, -4.6);

    const rotor = new THREE.Group();
    rotor.position.set(0, 2.6, 0.2);
    const bladeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    rotor.add(
      new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.06, 0.35), bladeMat),
      new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.06, 10.5), bladeMat)
    );
    craft.add(body, tail, rotor);
    craft.userData = { rotor, kind: 'heli' };
  } else {
    const fuse = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 15, 18), mat);
    fuse.rotation.x = Math.PI / 2;
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(1.27, 1.27, 13, 18), stripeMat);
    stripe.rotation.x = Math.PI / 2;
    const wings = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.2, 2.8), mat);
    wings.position.set(0, -0.1, 0.5);
    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.2, 2.4), stripeMat);
    tailFin.position.set(0, 1.7, -6.2);
    craft.add(fuse, stripe, wings, tailFin);
    craft.userData = { kind: 'jet' };
  }
  return craft;
}
