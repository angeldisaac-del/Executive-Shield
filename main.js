const GS = { mode: "COVER", lang: "es", country: "usa", leaderIdx: 0, division: "convoy", missionIdx: 0, xp: 0, vip: 100, dist: 0, targetDist: 500, lane: 0, targetX: 0, boost: false, siren: true, nextMission: null, radioTimer: 0 };
let selectedMission = null;

const canvas = document.getElementById("bg-canvas");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f1b38);
scene.fog = new THREE.FogExp2(0x0f1b38, 0.014);

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 200);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

scene.add(new THREE.HemisphereLight(0xbae6fd, 0x334155, 2.2));
const dirLight = new THREE.DirectionalLight(0xffedd5, 2.2);
dirLight.position.set(8, 16, 12);
scene.add(dirLight);

const sirenRed = new THREE.PointLight(0xff1e42, 8, 28);
const sirenBlue = new THREE.PointLight(0x0088ff, 8, 28);
scene.add(sirenRed, sirenBlue);

const road = new THREE.Mesh(new THREE.PlaneGeometry(20, 220), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3, metalness: 0.5 }));
road.rotation.x = -Math.PI / 2;
scene.add(road);

[-2.6, 2.6].forEach((lx) => {
  const line = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 220), new THREE.MeshBasicMaterial({ color: 0xffb703 }));
  line.rotation.x = -Math.PI / 2; line.position.set(lx, 0.01, 0); scene.add(line);
});

const cityGroup = new THREE.Group();
const bMat = new THREE.MeshStandardMaterial({ color: 0x16223d, roughness: 0.4, metalness: 0.4 });
for (let i = -90; i <= 90; i += 14) {
  [-14, 14].forEach((sx) => {
    const h = 15 + Math.abs(Math.sin(i + sx)) * 20;
    const b = new THREE.Mesh(new THREE.BoxGeometry(7, h, 7), bMat);
    b.position.set(sx + (sx > 0 ? 1.5 : -1.5), h / 2, i);
    const neon = new THREE.Mesh(new THREE.BoxGeometry(7.1, 0.35, 7.1), new THREE.MeshBasicMaterial({ color: sx > 0 ? 0x38bdf8 : 0xfbbf24 }));
    neon.position.set(b.position.x, h * 0.72, i);
    cityGroup.add(b, neon);
  });
}
scene.add(cityGroup);

const presCar = new THREE.Group();
scene.add(presCar);
function buildCar(country) {
  while (presCar.children.length > 0) presCar.remove(presCar.children);
  const f = FACTIONS[country];
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.85, 5.8), new THREE.MeshStandardMaterial({ color: f.carColor, roughness: 0.15, metalness: 0.85 }));
  body.position.y = 0.72;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.65, 3.3), new THREE.MeshStandardMaterial({ color: 0x050811, roughness: 0.05, metalness: 0.95 }));
  cabin.position.set(0, 1.42, -0.2);
  const grille = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.55, 0.14), new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.95 }));
  grille.position.set(0, 0.74, -2.91);
  const headL = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 0.1), new THREE.MeshBasicMaterial({ color: 0xffffff })); headL.position.set(-0.82, 0.78, -2.91);
  const headR = headL.clone(); headR.position.x = 0.82;
  presCar.add(body, cabin, grille, headL, headR);
}

const agentsGroup = new THREE.Group();
[[-1.85, -1.2, 0.5], [1.85, -1.2, -0.5], [-1.85, 1.4, 2.5], [1.85, 1.4, -2.5]].forEach(([x, z, ry]) => {
  const a = new THREE.Group();
  const suit = new THREE.MeshStandardMaterial({ color: 0x090d16 });
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.88, 0.3), suit); torso.position.y = 1.15;
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.76, 0.26), suit); legs.position.y = 0.38;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 12), new THREE.MeshStandardMaterial({ color: 0xe0ac69 })); head.position.y = 1.78;
  const glasses = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.14), new THREE.MeshBasicMaterial({ color: 0x000000 })); glasses.position.set(0, 1.8, -0.14);
  a.add(torso, legs, head, glasses); a.position.set(x, 0, z); a.rotation.y = ry;
  agentsGroup.add(a);
});
scene.add(agentsGroup);

const marineOne = new THREE.Group();
const heliBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.25, 4.5), new THREE.MeshStandardMaterial({ color: 0x1b4332 }));
const heliTop = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.38, 3.7), new THREE.MeshStandardMaterial({ color: 0xffffff }));
heliTop.position.y = 0.74;
const rotor = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.06, 0.24), new THREE.MeshBasicMaterial({ color: 0xe2e8f0 }));
rotor.position.y = 1.02;
marineOne.add(heliBody, heliTop, rotor);
marineOne.position.set(-2.4, 4.4, -3.8);
scene.add(marineOne);

const obstacles = [];
function spawnObstacle() {
  const m = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.1, 1.4), new THREE.MeshStandardMaterial({ color: 0xe63946, emissive: 0x7f1d1d }));
  m.position.set([-4.5, 0, 4.5][Math.floor(Math.random() * 3)], 0.55, -110);
  scene.add(m); obstacles.push(m);
}

function applyLang() {
  const t = I18N[GS.lang];
  document.getElementById("txt-rotate").textContent = t.rotate;
  document.getElementById("state-badge").textContent = t.live;
  document.getElementById("btn-switch-menu").textContent = t.menuBtn;
  document.getElementById("cover-title").textContent = t.coverTitle;
  document.getElementById("cover-sub").textContent = t.coverSub;
  document.getElementById("btn-enter-hub").textContent = t.enterBtn;
  document.getElementById("txt-select-agency").textContent = t.agencyTag;
  document.getElementById("txt-select-mode").textContent = t.opsTag;
  document.getElementById("lbl-limo").textContent = t.limo;
  document.getElementById("lbl-heli").textContent = t.heli;
  document.getElementById("lbl-plane").textContent = t.plane;
  document.getElementById("lbl-meta").textContent = t.meta;
  document.getElementById("tab-convoy").textContent = t.tabConvoy;
  document.getElementById("tab-foot").textContent = t.tabFoot;
  document.getElementById("tab-air").textContent = t.tabAir;
  document.getElementById("tab-infinite").textContent = t.tabInf;
  document.getElementById("btn-back-cover").textContent = t.backBtn;
  document.getElementById("btn-deploy").textContent = t.deployBtn;
  document.getElementById("btn-accept-next").textContent = t.acceptNext;
  renderFaction();
}

function setScreen(s) {
  GS.mode = s;
  document.getElementById("cover-screen").classList.toggle("hidden", s !== "COVER");
  document.getElementById("hub-ui").classList.toggle("hidden", s !== "HUB_MENU");
  document.getElementById("gameplay-hud").classList.toggle("hidden", s !== "MISSION_ACTIVE" && s !== "FREE_ROAM");
  document.getElementById("btn-switch-menu").classList.toggle("hidden", s === "COVER" || s === "HUB_MENU");
  agentsGroup.visible = (s === "COVER" || s === "HUB_MENU");
}

function renderFaction() {
  const f = FACTIONS[GS.country], t = I18N[GS.lang];
  const ldr = f.leaders[GS.leaderIdx] || f.leaders;
  const lc = document.getElementById("leader-selector"); lc.innerHTML = "";
  f.leaders.forEach((l, i) => {
    const b = document.createElement("button");
    b.className = "leader-chip" + (i === GS.leaderIdx ? " active" : "");
    b.textContent = l.label;
    b.onclick = () => { GS.leaderIdx = i; renderFaction(); };
    lc.appendChild(b);
  });
  document.getElementById("leader-codename").textContent = ldr.codename;
  document.getElementById("leader-name").textContent = ldr.name;
  document.getElementById("country-stamp").textContent = f.stamp;
  document.getElementById("fleet-car").textContent = f.car;
  document.getElementById("fleet-heli").textContent = f.heli;
  document.getElementById("fleet-plane").textContent = f.plane;
  buildCar(GS.country);
  heliTop.material.color.setHex(f.heliTop); heliBody.material.color.setHex(f.heliBody);
  const list = document.getElementById("mission-list"); list.innerHTML = "";
  const arr = GS.division === "infinite" ? [{ title: "⚡ ALERTA MUNDIAL", desc: "Convoy de emergencia", risk: "hollywood", dist: 750 }] : f.missions[GS.division];
  arr.forEach((m, i) => {
    const d = document.createElement("div");
    d.className = "mission-item" + (i === GS.missionIdx ? " selected" : "");
    d.innerHTML = `<div class="mission-info"><h4>${m.title}</h4><p>${m.desc}</p></div><span class="mission-tag ${m.risk === "hollywood" ? "tag-hollywood" : ""}">${m.risk === "hollywood" ? t.hollywood : t.routine}</span>`;
    d.onclick = () => { GS.missionIdx = i; selectedMission = m; renderFaction(); };
    list.appendChild(d);
  });
  selectedMission = arr[GS.missionIdx] || arr;
}

function startMission(m) {
  selectedMission = m; GS.dist = 0; GS.targetDist = m.dist || 500; GS.vip = 100;
  document.getElementById("vip-integrity").style.width = "100%";
  const ldr = FACTIONS[GS.country].leaders[GS.leaderIdx] || FACTIONS[GS.country].leaders;
  document.getElementById("hud-vip-name").textContent = "VIP: " + ldr.name;
  document.getElementById("hud-mode-tag").textContent = m.title.toUpperCase();
  document.getElementById("hud-objective-text").textContent = m.desc;
  document.getElementById("gta-toast").classList.add("hidden");
  setScreen("MISSION_ACTIVE");
}

document.getElementById("lang-select").onchange = (e) => { GS.lang = e.target.value; applyLang(); };
document.getElementById("btn-enter-hub").onclick = () => setScreen("HUB_MENU");
document.getElementById("btn-back-cover").onclick = () => setScreen("COVER");
document.getElementById("btn-switch-menu").onclick = () => setScreen("HUB_MENU");
document.getElementById("btn-deploy").onclick = () => { if (selectedMission) startMission(selectedMission); };
document.getElementById("btn-accept-next").onclick = () => { if (GS.nextMission) startMission(GS.nextMission); };
document.querySelectorAll(".country-btn").forEach((b) => (b.onclick = () => { document.querySelectorAll(".country-btn").forEach((x) => x.classList.remove("active")); b.classList.add("active"); GS.country = b.dataset.country; GS.leaderIdx = 0; renderFaction(); }));

