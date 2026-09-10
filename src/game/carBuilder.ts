import * as THREE from 'three';
import { CarModel } from '../types';

export interface Car3DInstance {
  group: THREE.Group;
  bodyMesh: THREE.Mesh;
  accentMeshes: THREE.Mesh[];
  wheelMeshes: THREE.Group[]; // FL, FR, RL, RR
  frontLeftPivot: THREE.Group;
  frontRightPivot: THREE.Group;
  headlights: THREE.SpotLight[];
  headlightLenses: THREE.Mesh[];
  taillights: THREE.Mesh[];
  underglowLight: THREE.PointLight;
  exhaustLeft: THREE.Vector3;
  exhaustRight: THREE.Vector3;
}

export function buildCar3D(car: CarModel): Car3DInstance {
  const group = new THREE.Group();

  // Materials
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(car.bodyColor),
    metalness: 0.85,
    roughness: 0.18,
    envMapIntensity: 1.5,
  });

  const carbonMaterial = new THREE.MeshStandardMaterial({
    color: 0x111317,
    roughness: 0.45,
    metalness: 0.5,
  });

  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0x050811,
    metalness: 0.95,
    roughness: 0.05,
    transparent: true,
    opacity: 0.88,
  });

  const tireMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1e,
    roughness: 0.85,
    metalness: 0.1,
  });

  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0xdddddd,
    metalness: 0.9,
    roughness: 0.15,
  });

  const caliperMaterial = new THREE.MeshStandardMaterial({
    color: 0xff0044,
    metalness: 0.8,
    roughness: 0.3,
  });

  const neonGlowMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(car.neonColor),
    transparent: true,
    opacity: 0.85,
  });

  const accentMeshes: THREE.Mesh[] = [];

  // --- CAR CHASSIS / BODY ---
  const bodyGroup = new THREE.Group();

  // Lower chassis
  const chassisGeo = new THREE.BoxGeometry(1.85, 0.42, 4.3);
  const chassisMesh = new THREE.Mesh(chassisGeo, bodyMaterial);
  chassisMesh.position.y = 0.35;
  chassisMesh.castShadow = true;
  chassisMesh.receiveShadow = true;
  bodyGroup.add(chassisMesh);

  // Cabin / Roof
  let cabinGeo: THREE.BufferGeometry;
  let cabinPos = new THREE.Vector3(0, 0.76, -0.2);

  if (car.modelType === 'ae86') {
    // Classic hatchback boxy shape
    cabinGeo = new THREE.BoxGeometry(1.55, 0.48, 2.2);
    cabinPos.set(0, 0.74, -0.3);
  } else if (car.modelType === 'rx7') {
    // Curvature coupe
    cabinGeo = new THREE.CylinderGeometry(0.72, 0.82, 2.3, 12);
    cabinGeo.rotateX(Math.PI / 2);
    cabinGeo.scale(1.0, 0.42, 1.0);
    cabinPos.set(0, 0.72, -0.25);
  } else {
    // Aggressive fastback coupe (GTR/Supra)
    cabinGeo = new THREE.BoxGeometry(1.6, 0.46, 2.4);
    cabinPos.set(0, 0.75, -0.25);
  }

  const cabinMesh = new THREE.Mesh(cabinGeo, bodyMaterial);
  cabinMesh.position.copy(cabinPos);
  cabinMesh.castShadow = true;
  bodyGroup.add(cabinMesh);

  // Windshield & Windows
  const windshieldGeo = new THREE.BoxGeometry(1.52, 0.4, 1.0);
  const windshieldMesh = new THREE.Mesh(windshieldGeo, glassMaterial);
  windshieldMesh.position.set(0, 0.74, 0.4);
  windshieldMesh.rotation.x = -0.35;
  bodyGroup.add(windshieldMesh);

  const rearWindowGeo = new THREE.BoxGeometry(1.52, 0.38, 1.1);
  const rearWindowMesh = new THREE.Mesh(rearWindowGeo, glassMaterial);
  rearWindowMesh.position.set(0, 0.74, -0.85);
  rearWindowMesh.rotation.x = 0.38;
  bodyGroup.add(rearWindowMesh);

  // Front bumper & Carbon Splitter
  const splitterGeo = new THREE.BoxGeometry(1.95, 0.08, 0.6);
  const splitterMesh = new THREE.Mesh(splitterGeo, carbonMaterial);
  splitterMesh.position.set(0, 0.16, 2.25);
  splitterMesh.castShadow = true;
  bodyGroup.add(splitterMesh);
  accentMeshes.push(splitterMesh);

  // Hood scoop / vents
  const scoopGeo = new THREE.BoxGeometry(0.7, 0.08, 0.9);
  const scoopMesh = new THREE.Mesh(scoopGeo, carbonMaterial);
  scoopMesh.position.set(0, 0.58, 1.2);
  bodyGroup.add(scoopMesh);
  accentMeshes.push(scoopMesh);

  // Rear Aggressive Diffuser
  const diffuserGeo = new THREE.BoxGeometry(1.9, 0.18, 0.5);
  const diffuserMesh = new THREE.Mesh(diffuserGeo, carbonMaterial);
  diffuserMesh.position.set(0, 0.22, -2.18);
  diffuserMesh.castShadow = true;
  bodyGroup.add(diffuserMesh);
  accentMeshes.push(diffuserMesh);

  // GT Wing (Big Drift Wing / Spoiler)
  const wingStandsGeo = new THREE.BoxGeometry(0.06, 0.45, 0.08);
  const standL = new THREE.Mesh(wingStandsGeo, carbonMaterial);
  standL.position.set(0.55, 0.75, -2.05);
  const standR = new THREE.Mesh(wingStandsGeo, carbonMaterial);
  standR.position.set(-0.55, 0.75, -2.05);
  bodyGroup.add(standL);
  bodyGroup.add(standR);

  const wingBladeGeo = new THREE.BoxGeometry(2.05, 0.05, 0.42);
  const wingBlade = new THREE.Mesh(wingBladeGeo, carbonMaterial);
  wingBlade.position.set(0, 0.98, -2.08);
  wingBlade.rotation.x = 0.08;
  wingBlade.castShadow = true;
  bodyGroup.add(wingBlade);
  accentMeshes.push(wingBlade);

  // Endplates on wing
  const endplateGeo = new THREE.BoxGeometry(0.04, 0.22, 0.48);
  const endplateL = new THREE.Mesh(endplateGeo, carbonMaterial);
  endplateL.position.set(1.04, 0.98, -2.08);
  const endplateR = new THREE.Mesh(endplateGeo, carbonMaterial);
  endplateR.position.set(-1.04, 0.98, -2.08);
  bodyGroup.add(endplateL);
  bodyGroup.add(endplateR);

  // Widebody Fender Flares
  const fenderGeo = new THREE.BoxGeometry(0.18, 0.38, 0.85);
  const fenderFL = new THREE.Mesh(fenderGeo, bodyMaterial);
  fenderFL.position.set(0.96, 0.38, 1.35);
  const fenderFR = new THREE.Mesh(fenderGeo, bodyMaterial);
  fenderFR.position.set(-0.96, 0.38, 1.35);
  const fenderRL = new THREE.Mesh(fenderGeo, bodyMaterial);
  fenderRL.position.set(0.98, 0.38, -1.35);
  const fenderRR = new THREE.Mesh(fenderGeo, bodyMaterial);
  fenderRR.position.set(-0.98, 0.38, -1.35);
  bodyGroup.add(fenderFL, fenderFR, fenderRL, fenderRR);

  // Side Skirts
  const skirtGeo = new THREE.BoxGeometry(0.1, 0.12, 1.9);
  const skirtL = new THREE.Mesh(skirtGeo, carbonMaterial);
  skirtL.position.set(0.96, 0.18, 0);
  const skirtR = new THREE.Mesh(skirtGeo, carbonMaterial);
  skirtR.position.set(-0.96, 0.18, 0);
  bodyGroup.add(skirtL, skirtR);
  accentMeshes.push(skirtL, skirtR);

  group.add(bodyGroup);

  // --- LIGHTS ---
  const headlights: THREE.SpotLight[] = [];
  const headlightLenses: THREE.Mesh[] = [];
  const taillights: THREE.Mesh[] = [];

  // Front LED projector lenses
  const lensGeo = new THREE.BoxGeometry(0.35, 0.12, 0.08);
  const lensMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe }); // Ice xenon blue-white

  const lensL = new THREE.Mesh(lensGeo, lensMat);
  lensL.position.set(0.68, 0.44, 2.14);
  const lensR = new THREE.Mesh(lensGeo, lensMat);
  lensR.position.set(-0.68, 0.44, 2.14);
  bodyGroup.add(lensL, lensR);
  headlightLenses.push(lensL, lensR);

  // Spotlights projecting forward
  const spotL = new THREE.SpotLight(0xffffff, 4, 38, Math.PI / 6, 0.45);
  spotL.position.set(0.68, 0.44, 2.1);
  spotL.target.position.set(0.68, 0, 15);
  bodyGroup.add(spotL);
  bodyGroup.add(spotL.target);
  headlights.push(spotL);

  const spotR = new THREE.SpotLight(0xffffff, 4, 38, Math.PI / 6, 0.45);
  spotR.position.set(-0.68, 0.44, 2.1);
  spotR.target.position.set(-0.68, 0, 15);
  bodyGroup.add(spotR);
  bodyGroup.add(spotR.target);
  headlights.push(spotR);

  // Taillights
  const tailGeo = new THREE.BoxGeometry(0.45, 0.12, 0.06);
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xff1e38 });
  const tailL = new THREE.Mesh(tailGeo, tailMat);
  tailL.position.set(0.65, 0.46, -2.14);
  const tailR = new THREE.Mesh(tailGeo, tailMat);
  tailR.position.set(-0.65, 0.46, -2.14);
  bodyGroup.add(tailL, tailR);
  taillights.push(tailL, tailR);

  // Underglow neon tubes & point light
  const underglowTubeGeo = new THREE.BoxGeometry(1.6, 0.04, 2.6);
  const underglowMesh = new THREE.Mesh(underglowTubeGeo, neonGlowMat);
  underglowMesh.position.set(0, 0.08, 0);
  bodyGroup.add(underglowMesh);

  const underglowLight = new THREE.PointLight(new THREE.Color(car.neonColor), 2.5, 5.5);
  underglowLight.position.set(0, 0.12, 0);
  bodyGroup.add(underglowLight);

  // --- WHEELS ---
  const wheelMeshes: THREE.Group[] = [];

  function createWheel(isLeft: boolean): THREE.Group {
    const wheelGroup = new THREE.Group();

    // Tire
    const tireGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.28, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tireMesh = new THREE.Mesh(tireGeo, tireMaterial);
    tireMesh.castShadow = true;
    wheelGroup.add(tireMesh);

    // Rim
    const rimGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.285, 12);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMesh = new THREE.Mesh(rimGeo, rimMaterial);
    wheelGroup.add(rimMesh);

    // Spokes
    const spokeGeo = new THREE.BoxGeometry(0.29, 0.48, 0.05);
    const spoke1 = new THREE.Mesh(spokeGeo, rimMaterial);
    const spoke2 = new THREE.Mesh(spokeGeo, rimMaterial);
    spoke2.rotation.x = Math.PI / 3;
    const spoke3 = new THREE.Mesh(spokeGeo, rimMaterial);
    spoke3.rotation.x = -Math.PI / 3;
    wheelGroup.add(spoke1, spoke2, spoke3);

    // Caliper
    const caliperGeo = new THREE.BoxGeometry(0.12, 0.14, 0.12);
    const caliper = new THREE.Mesh(caliperGeo, caliperMaterial);
    caliper.position.set(isLeft ? 0.06 : -0.06, 0.14, 0);
    wheelGroup.add(caliper);

    return wheelGroup;
  }

  // Front steering pivots
  const frontLeftPivot = new THREE.Group();
  frontLeftPivot.position.set(0.94, 0.35, 1.35);
  const wheelFL = createWheel(true);
  frontLeftPivot.add(wheelFL);
  group.add(frontLeftPivot);

  const frontRightPivot = new THREE.Group();
  frontRightPivot.position.set(-0.94, 0.35, 1.35);
  const wheelFR = createWheel(false);
  frontRightPivot.add(wheelFR);
  group.add(frontRightPivot);

  // Rear wheels (direct to group)
  const rearLeftPivot = new THREE.Group();
  rearLeftPivot.position.set(0.96, 0.35, -1.35);
  const wheelRL = createWheel(true);
  rearLeftPivot.add(wheelRL);
  group.add(rearLeftPivot);

  const rearRightPivot = new THREE.Group();
  rearRightPivot.position.set(-0.96, 0.35, -1.35);
  const wheelRR = createWheel(false);
  rearRightPivot.add(wheelRR);
  group.add(rearRightPivot);

  wheelMeshes.push(wheelFL, wheelFR, wheelRL, wheelRR);

  // Exhaust positions (relative to vehicle center)
  const exhaustLeft = new THREE.Vector3(0.55, 0.22, -2.2);
  const exhaustRight = new THREE.Vector3(0.35, 0.22, -2.2);

  // Dual Exhaust tips
  const tipGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.3, 16);
  tipGeo.rotateX(Math.PI / 2);
  const tipMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.95, roughness: 0.2 });
  const tipL = new THREE.Mesh(tipGeo, tipMat);
  tipL.position.copy(exhaustLeft);
  const tipR = new THREE.Mesh(tipGeo, tipMat);
  tipR.position.copy(exhaustRight);
  bodyGroup.add(tipL, tipR);

  return {
    group,
    bodyMesh: chassisMesh,
    accentMeshes,
    wheelMeshes,
    frontLeftPivot,
    frontRightPivot,
    headlights,
    headlightLenses,
    taillights,
    underglowLight,
    exhaustLeft,
    exhaustRight,
  };
}
