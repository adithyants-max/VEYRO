import * as THREE from 'three';
import { TrackData } from '../types';

export interface BuiltTrack {
  group: THREE.Group;
  colliders: THREE.Box3[];
  startPosition: THREE.Vector3;
  startHeading: number;
  clippingZones: THREE.Vector3[];
}

export function buildTrack(trackData: TrackData): BuiltTrack {
  const group = new THREE.Group();
  const colliders: THREE.Box3[] = [];
  const clippingZones: THREE.Vector3[] = [];

  // Ground base plane
  const groundGeo = new THREE.PlaneGeometry(1000, 1000);
  groundGeo.rotateX(-Math.PI / 2);
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0x07090e,
    roughness: 0.9,
    metalness: 0.1,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.receiveShadow = true;
  group.add(ground);

  if (trackData.theme === 'tokyo') {
    return buildTokyoTrack(group, colliders, clippingZones);
  } else if (trackData.theme === 'mountain') {
    return buildMountainTrack(group, colliders, clippingZones);
  } else {
    return buildDocklandsTrack(group, colliders, clippingZones);
  }
}

// 1. NEO-TOKYO CYBERWAY
function buildTokyoTrack(group: THREE.Group, colliders: THREE.Box3[], clippingZones: THREE.Vector3[]): BuiltTrack {
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x12141c,
    roughness: 0.25, // wet sheen
    metalness: 0.35,
  });

  const curbRedMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.5 });
  const curbWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
  const barrierMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });

  // Track Curve Waypoints for a sweeping drifting circuit
  const curvePoints = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 80),
    new THREE.Vector3(30, 0, 150),
    new THREE.Vector3(90, 0, 190), // High speed sweeper
    new THREE.Vector3(160, 0, 170),
    new THREE.Vector3(200, 0, 110),
    new THREE.Vector3(190, 0, 30),
    new THREE.Vector3(140, 0, -30),
    new THREE.Vector3(120, 0, -90), // Hairpin entry
    new THREE.Vector3(70, 0, -120),
    new THREE.Vector3(0, 0, -100),
    new THREE.Vector3(-60, 0, -70),
    new THREE.Vector3(-110, 0, -30),
    new THREE.Vector3(-130, 0, 30),
    new THREE.Vector3(-100, 0, 100),
    new THREE.Vector3(-50, 0, 80),
    new THREE.Vector3(-20, 0, 30),
  ];

  const trackCurve = new THREE.CatmullRomCurve3(curvePoints, true);
  const roadWidth = 16;
  const numSegments = 160;

  // Extrude road mesh
  const roadPoints = trackCurve.getSpacedPoints(numSegments);
  for (let i = 0; i < roadPoints.length; i++) {
    const current = roadPoints[i];
    const next = roadPoints[(i + 1) % roadPoints.length];
    const tangent = next.clone().sub(current).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    // Road segment plane
    const segLength = current.distanceTo(next);
    const segGeo = new THREE.PlaneGeometry(roadWidth, segLength + 0.4);
    segGeo.rotateX(-Math.PI / 2);
    const segMesh = new THREE.Mesh(segGeo, roadMat);
    segMesh.position.copy(current.clone().add(next).multiplyScalar(0.5));
    segMesh.position.y = 0.05;
    segMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    segMesh.receiveShadow = true;
    group.add(segMesh);

    // Center dash line
    if (i % 2 === 0) {
      const lineGeo = new THREE.PlaneGeometry(0.3, segLength * 0.7);
      lineGeo.rotateX(-Math.PI / 2);
      const lineMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      const lineMesh = new THREE.Mesh(lineGeo, lineMat);
      lineMesh.position.copy(segMesh.position);
      lineMesh.position.y = 0.07;
      lineMesh.quaternion.copy(segMesh.quaternion);
      group.add(lineMesh);
    }

    // Outer & Inner Curbs / Barriers
    const leftCurbPos = segMesh.position.clone().add(normal.clone().multiplyScalar(roadWidth * 0.5 + 0.4));
    const rightCurbPos = segMesh.position.clone().add(normal.clone().multiplyScalar(-roadWidth * 0.5 - 0.4));

    // Curbs
    const curbGeo = new THREE.BoxGeometry(0.8, 0.15, segLength);
    const curbL = new THREE.Mesh(curbGeo, i % 4 < 2 ? curbRedMat : curbWhiteMat);
    curbL.position.copy(leftCurbPos);
    curbL.position.y = 0.08;
    curbL.quaternion.copy(segMesh.quaternion);
    group.add(curbL);

    const curbR = new THREE.Mesh(curbGeo, i % 4 < 2 ? curbRedMat : curbWhiteMat);
    curbR.position.copy(rightCurbPos);
    curbR.position.y = 0.08;
    curbR.quaternion.copy(segMesh.quaternion);
    group.add(curbR);

    // Guard rails & Colliders every 4 segments
    if (i % 3 === 0) {
      const railGeo = new THREE.BoxGeometry(0.35, 1.1, segLength * 3.1);
      const railL = new THREE.Mesh(railGeo, barrierMat);
      railL.position.copy(leftCurbPos).add(normal.clone().multiplyScalar(0.7));
      railL.position.y = 0.55;
      railL.quaternion.copy(segMesh.quaternion);
      group.add(railL);

      const railR = new THREE.Mesh(railGeo, barrierMat);
      railR.position.copy(rightCurbPos).add(normal.clone().multiplyScalar(-0.7));
      railR.position.y = 0.55;
      railR.quaternion.copy(segMesh.quaternion);
      group.add(railR);

      // Collider boxes
      const boxL = new THREE.Box3();
      boxL.setFromObject(railL);
      colliders.push(boxL);

      const boxR = new THREE.Box3();
      boxR.setFromObject(railR);
      colliders.push(boxR);
    }

    // Street lamps and neon banners every 10 segments
    if (i % 8 === 0) {
      const lampPos = leftCurbPos.clone().add(normal.clone().multiplyScalar(2.2));
      createCyberStreetLamp(group, lampPos, i % 2 === 0 ? 0x38bdf8 : 0xf43f5e);
    }
  }

  // Neon Skyscrapers in background
  const buildingColors = [0x0c0f1d, 0x11162b, 0x151b33];
  const neonLightColors = [0xf43f5e, 0x38bdf8, 0xa855f7, 0x06b6d4];

  for (let b = 0; b < 45; b++) {
    const angle = (b / 45) * Math.PI * 2;
    const dist = 180 + Math.random() * 160;
    const bPos = new THREE.Vector3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);

    const bWidth = 25 + Math.random() * 35;
    const bDepth = 25 + Math.random() * 35;
    const bHeight = 70 + Math.random() * 160;

    const bGeo = new THREE.BoxGeometry(bWidth, bHeight, bDepth);
    const bMat = new THREE.MeshStandardMaterial({
      color: buildingColors[b % buildingColors.length],
      roughness: 0.3,
      metalness: 0.8,
    });
    const building = new THREE.Mesh(bGeo, bMat);
    building.position.set(bPos.x, bHeight / 2, bPos.z);
    group.add(building);

    // Glowing roof antenna or billboard
    const neonColor = neonLightColors[b % neonLightColors.length];
    const signGeo = new THREE.PlaneGeometry(bWidth * 0.7, 8);
    const signMat = new THREE.MeshBasicMaterial({ color: neonColor, side: THREE.DoubleSide });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(bPos.x, bHeight - 10, bPos.z + bDepth / 2 + 0.5);
    group.add(sign);
  }

  // Neon arches / overhead checkpoints
  createNeonArch(group, new THREE.Vector3(0, 0, 40), 0xf43f5e, 'DRIFT X START');
  createNeonArch(group, new THREE.Vector3(120, 0, -90), 0x38bdf8, 'APEX DRIFT ZONE');
  createNeonArch(group, new THREE.Vector3(-100, 0, 100), 0xa855f7, 'SPEED TRAP');

  // Clipping point markers
  clippingZones.push(
    new THREE.Vector3(175, 0.5, 150),
    new THREE.Vector3(135, 0.5, -45),
    new THREE.Vector3(-120, 0.5, 20),
    new THREE.Vector3(95, 0.5, 185)
  );

  clippingZones.forEach((pos, idx) => {
    createClippingZone(group, pos, idx + 1);
  });

  return {
    group,
    colliders,
    startPosition: new THREE.Vector3(0, 0.38, 5),
    startHeading: Math.PI,
    clippingZones,
  };
}

// 2. MOUNT AKINA PASS (Touge)
function buildMountainTrack(group: THREE.Group, colliders: THREE.Box3[], clippingZones: THREE.Vector3[]): BuiltTrack {
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x1e2026,
    roughness: 0.7,
    metalness: 0.1,
  });

  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x242730,
    roughness: 0.95,
  });

  // Winding serpentine mountain hairpins
  const curvePoints = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(10, 0, 60),
    new THREE.Vector3(45, 0, 110),
    new THREE.Vector3(90, 0, 105), // Hairpin 1
    new THREE.Vector3(60, 0, 50),
    new THREE.Vector3(10, 0, -20),
    new THREE.Vector3(-40, 0, -70),
    new THREE.Vector3(-95, 0, -65), // Hairpin 2
    new THREE.Vector3(-80, 0, 0),
    new THREE.Vector3(-40, 0, 60),
    new THREE.Vector3(20, 0, 160),
    new THREE.Vector3(80, 0, 190),
    new THREE.Vector3(140, 0, 170), // Hairpin 3
    new THREE.Vector3(150, 0, 90),
    new THREE.Vector3(110, 0, 0),
    new THREE.Vector3(50, 0, -70),
    new THREE.Vector3(-20, 0, -110),
    new THREE.Vector3(-90, 0, -120),
    new THREE.Vector3(-140, 0, -80),
    new THREE.Vector3(-130, 0, -20),
    new THREE.Vector3(-70, 0, 0),
  ];

  const trackCurve = new THREE.CatmullRomCurve3(curvePoints, true);
  const roadWidth = 14;
  const numSegments = 140;
  const roadPoints = trackCurve.getSpacedPoints(numSegments);

  for (let i = 0; i < roadPoints.length; i++) {
    const current = roadPoints[i];
    const next = roadPoints[(i + 1) % roadPoints.length];
    const tangent = next.clone().sub(current).normalize();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    const segLength = current.distanceTo(next);
    const segGeo = new THREE.PlaneGeometry(roadWidth, segLength + 0.4);
    segGeo.rotateX(-Math.PI / 2);
    const segMesh = new THREE.Mesh(segGeo, roadMat);
    segMesh.position.copy(current.clone().add(next).multiplyScalar(0.5));
    segMesh.position.y = 0.05;
    segMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    segMesh.receiveShadow = true;
    group.add(segMesh);

    // Mountain guardrail on outer edge
    const railGeo = new THREE.BoxGeometry(0.3, 0.95, segLength * 1.05);
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.3 });

    const railL = new THREE.Mesh(railGeo, railMat);
    railL.position.copy(segMesh.position).add(normal.clone().multiplyScalar(roadWidth * 0.5 + 0.3));
    railL.position.y = 0.5;
    railL.quaternion.copy(segMesh.quaternion);
    group.add(railL);

    const railR = new THREE.Mesh(railGeo, railMat);
    railR.position.copy(segMesh.position).add(normal.clone().multiplyScalar(-roadWidth * 0.5 - 0.3));
    railR.position.y = 0.5;
    railR.quaternion.copy(segMesh.quaternion);
    group.add(railR);

    if (i % 3 === 0) {
      const boxL = new THREE.Box3();
      boxL.setFromObject(railL);
      colliders.push(boxL);

      const boxR = new THREE.Box3();
      boxR.setFromObject(railR);
      colliders.push(boxR);
    }

    // Mountain cliffs and Japanese Maple / Sakura trees
    if (i % 6 === 0) {
      const rockGeo = new THREE.DodecahedronGeometry(8 + Math.random() * 6, 1);
      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.copy(segMesh.position).add(normal.clone().multiplyScalar((roadWidth * 0.5 + 14) * (i % 2 === 0 ? 1 : -1)));
      rock.position.y = 4;
      rock.scale.set(1.4, 2.0, 1.4);
      group.add(rock);

      // Cherry blossom / maple tree
      createTree(group, segMesh.position.clone().add(normal.clone().multiplyScalar((roadWidth * 0.5 + 8) * (i % 2 === 0 ? -1 : 1))));
    }
  }

  createNeonArch(group, new THREE.Vector3(0, 0, 30), 0xa855f7, 'AKINA DOWNHILL');

  return {
    group,
    colliders,
    startPosition: new THREE.Vector3(0, 0.38, 5),
    startHeading: Math.PI,
    clippingZones,
  };
}

// 3. DOCKLANDS DRIFT ARENA
function buildDocklandsTrack(group: THREE.Group, colliders: THREE.Box3[], clippingZones: THREE.Vector3[]): BuiltTrack {
  const asphaltMat = new THREE.MeshStandardMaterial({
    color: 0x161822,
    roughness: 0.5,
    metalness: 0.2,
  });

  // Giant arena slab
  const arenaGeo = new THREE.PlaneGeometry(350, 350);
  arenaGeo.rotateX(-Math.PI / 2);
  const arenaMesh = new THREE.Mesh(arenaGeo, asphaltMat);
  arenaMesh.position.y = 0.02;
  arenaMesh.receiveShadow = true;
  group.add(arenaMesh);

  // Outer boundary wall
  createPerimeterWall(group, colliders, 160);

  // Stacked colorful shipping containers forming an 8-drift / gymkhana layout
  const containerColors = [0x0284c7, 0xef4444, 0xf59e0b, 0x10b981, 0x6366f1];

  function placeContainer(x: number, z: number, rotY: number, stackHeight: number, colIndex: number) {
    for (let h = 0; h < stackHeight; h++) {
      const cGeo = new THREE.BoxGeometry(5.8, 2.6, 12.2);
      const cMat = new THREE.MeshStandardMaterial({
        color: containerColors[(colIndex + h) % containerColors.length],
        metalness: 0.6,
        roughness: 0.4,
      });
      const cMesh = new THREE.Mesh(cGeo, cMat);
      cMesh.position.set(x, 1.3 + h * 2.6, z);
      cMesh.rotation.y = rotY;
      cMesh.castShadow = true;
      group.add(cMesh);

      if (h === 0) {
        const box = new THREE.Box3();
        box.setFromObject(cMesh);
        colliders.push(box);
      }
    }
  }

  // Central slalom and hairpin container corridors
  placeContainer(-35, 20, 0, 2, 0);
  placeContainer(-35, 40, 0, 3, 1);
  placeContainer(35, 20, 0, 2, 2);
  placeContainer(35, 40, 0, 3, 3);

  placeContainer(0, 75, Math.PI / 2, 2, 4);
  placeContainer(20, 75, Math.PI / 2, 3, 0);
  placeContainer(-20, 75, Math.PI / 2, 2, 1);

  placeContainer(0, -60, Math.PI / 2, 2, 2);
  placeContainer(25, -60, Math.PI / 2, 3, 3);
  placeContainer(-25, -60, Math.PI / 2, 2, 4);

  // Donut pylons in the center with tire rings
  createDonutPylon(group, colliders, new THREE.Vector3(-45, 0, -25));
  createDonutPylon(group, colliders, new THREE.Vector3(45, 0, -25));
  createDonutPylon(group, colliders, new THREE.Vector3(0, 0, 30));

  // Harbor crane in corner
  createHarborCrane(group, new THREE.Vector3(120, 0, 110));
  createHarborCrane(group, new THREE.Vector3(-120, 0, 110));

  createNeonArch(group, new THREE.Vector3(0, 0, -10), 0x06b6d4, 'DOCKLANDS GYMKHANA');

  clippingZones.push(
    new THREE.Vector3(-45, 0.5, -25),
    new THREE.Vector3(45, 0.5, -25),
    new THREE.Vector3(0, 0.5, 30),
    new THREE.Vector3(60, 0.5, 60),
    new THREE.Vector3(-60, 0.5, 60)
  );

  clippingZones.forEach((pos, idx) => {
    createClippingZone(group, pos, idx + 1);
  });

  return {
    group,
    colliders,
    startPosition: new THREE.Vector3(0, 0.38, -25),
    startHeading: 0,
    clippingZones,
  };
}

// Helper: Cyber Street Lamp
function createCyberStreetLamp(group: THREE.Group, pos: THREE.Vector3, neonHex: number) {
  const poleGeo = new THREE.CylinderGeometry(0.12, 0.16, 7.5, 8);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.copy(pos);
  pole.position.y = 3.75;
  group.add(pole);

  const armGeo = new THREE.BoxGeometry(2.2, 0.1, 0.1);
  const arm = new THREE.Mesh(armGeo, poleMat);
  arm.position.set(pos.x, 7.4, pos.z);
  group.add(arm);

  const lightGeo = new THREE.BoxGeometry(1.6, 0.15, 0.3);
  const lightMat = new THREE.MeshBasicMaterial({ color: neonHex });
  const lightMesh = new THREE.Mesh(lightGeo, lightMat);
  lightMesh.position.set(pos.x, 7.3, pos.z);
  group.add(lightMesh);

  const light = new THREE.PointLight(neonHex, 3.5, 35, 1.8);
  light.position.set(pos.x, 7.0, pos.z);
  group.add(light);
}

// Helper: Neon Overhead Arch
function createNeonArch(group: THREE.Group, pos: THREE.Vector3, neonHex: number, _title: string) {
  const archGroup = new THREE.Group();
  archGroup.position.copy(pos);

  const postGeo = new THREE.BoxGeometry(0.8, 8, 0.8);
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.9 });
  const postL = new THREE.Mesh(postGeo, frameMat);
  postL.position.set(10.5, 4, 0);
  const postR = new THREE.Mesh(postGeo, frameMat);
  postR.position.set(-10.5, 4, 0);
  archGroup.add(postL, postR);

  const crossbarGeo = new THREE.BoxGeometry(22, 1.2, 1.2);
  const crossbar = new THREE.Mesh(crossbarGeo, frameMat);
  crossbar.position.set(0, 7.8, 0);
  archGroup.add(crossbar);

  // Glowing neon tubes
  const tubeGeo = new THREE.BoxGeometry(20, 0.3, 0.1);
  const neonMat = new THREE.MeshBasicMaterial({ color: neonHex });
  const tubeFront = new THREE.Mesh(tubeGeo, neonMat);
  tubeFront.position.set(0, 7.8, 0.7);
  const tubeBack = new THREE.Mesh(tubeGeo, neonMat);
  tubeBack.position.set(0, 7.8, -0.7);
  archGroup.add(tubeFront, tubeBack);

  const archLight = new THREE.PointLight(neonHex, 4, 25);
  archLight.position.set(0, 7.2, 0);
  archGroup.add(archLight);

  group.add(archGroup);
}

// Helper: Clipping Zone (Drift score multiplier ring)
function createClippingZone(group: THREE.Group, pos: THREE.Vector3, zoneNumber: number) {
  const ringGeo = new THREE.TorusGeometry(3.5, 0.12, 12, 32);
  ringGeo.rotateX(Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xfacc15, transparent: true, opacity: 0.85 });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.copy(pos);
  ring.position.y = 0.15;
  group.add(ring);

  // Center beacon
  const pylonGeo = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 12);
  const pylonMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
  const pylon = new THREE.Mesh(pylonGeo, pylonMat);
  pylon.position.copy(pos);
  pylon.position.y = 0.75;
  group.add(pylon);

  const pylonLight = new THREE.PointLight(0xfacc15, 2, 10);
  pylonLight.position.copy(pos);
  pylonLight.position.y = 1.8;
  group.add(pylonLight);
}

// Helper: Perimeter Wall
function createPerimeterWall(group: THREE.Group, colliders: THREE.Box3[], halfSize: number) {
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 });
  const wallHeight = 2.4;
  const wallThickness = 1.5;

  const configs = [
    { size: [halfSize * 2, wallHeight, wallThickness], pos: [0, wallHeight / 2, halfSize] },
    { size: [halfSize * 2, wallHeight, wallThickness], pos: [0, wallHeight / 2, -halfSize] },
    { size: [wallThickness, wallHeight, halfSize * 2], pos: [halfSize, wallHeight / 2, 0] },
    { size: [wallThickness, wallHeight, halfSize * 2], pos: [-halfSize, wallHeight / 2, 0] },
  ];

  for (const c of configs) {
    const geo = new THREE.BoxGeometry(c.size[0], c.size[1], c.size[2]);
    const mesh = new THREE.Mesh(geo, wallMat);
    mesh.position.set(c.pos[0], c.pos[1], c.pos[2]);
    group.add(mesh);

    const box = new THREE.Box3();
    box.setFromObject(mesh);
    colliders.push(box);
  }
}

// Helper: Donut Pylon
function createDonutPylon(group: THREE.Group, colliders: THREE.Box3[], pos: THREE.Vector3) {
  const pylonGeo = new THREE.CylinderGeometry(1.4, 1.6, 2.5, 16);
  const pylonMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
  const pylon = new THREE.Mesh(pylonGeo, pylonMat);
  pylon.position.copy(pos);
  pylon.position.y = 1.25;
  group.add(pylon);

  // Tire stack base
  const tireTorusGeo = new THREE.TorusGeometry(1.8, 0.4, 8, 16);
  tireTorusGeo.rotateX(Math.PI / 2);
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
  const tires = new THREE.Mesh(tireTorusGeo, tireMat);
  tires.position.copy(pos);
  tires.position.y = 0.4;
  group.add(tires);

  const box = new THREE.Box3();
  box.setFromObject(pylon);
  colliders.push(box);
}

// Helper: Tree for mountain pass
function createTree(group: THREE.Group, pos: THREE.Vector3) {
  const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 4.5, 8);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.copy(pos);
  trunk.position.y = 2.25;
  group.add(trunk);

  const foliageGeo = new THREE.DodecahedronGeometry(2.8 + Math.random(), 1);
  const foliageMat = new THREE.MeshStandardMaterial({
    color: Math.random() > 0.4 ? 0xf43f5e : 0xf97316, // Sakura pink & autumn orange
    roughness: 0.8,
  });
  const foliage = new THREE.Mesh(foliageGeo, foliageMat);
  foliage.position.copy(pos);
  foliage.position.y = 5.2;
  group.add(foliage);
}

// Helper: Harbor Crane
function createHarborCrane(group: THREE.Group, pos: THREE.Vector3) {
  const craneGroup = new THREE.Group();
  craneGroup.position.copy(pos);

  const mastGeo = new THREE.BoxGeometry(4, 38, 4);
  const craneMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6 });
  const mast = new THREE.Mesh(mastGeo, craneMat);
  mast.position.y = 19;
  craneGroup.add(mast);

  const boomGeo = new THREE.BoxGeometry(45, 3, 3);
  const boom = new THREE.Mesh(boomGeo, craneMat);
  boom.position.set(12, 37, 0);
  craneGroup.add(boom);

  const beacon = new THREE.PointLight(0xff0000, 2, 20);
  beacon.position.set(0, 39, 0);
  craneGroup.add(beacon);

  group.add(craneGroup);
}
