import * as THREE from 'three';

interface SmokeParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  scale: number;
  maxScale: number;
  opacity: number;
  rotation: number;
  rotSpeed: number;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private smokeParticles: SmokeParticle[] = [];
  private smokeInstancedMesh: THREE.InstancedMesh;
  private maxParticles = 300;
  private dummy = new THREE.Object3D();

  // Exhaust flame meshes
  private flameLeft: THREE.Mesh;
  private flameRight: THREE.Mesh;
  private flameMat: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Soft smoke puff geometry
    const smokeGeo = new THREE.DodecahedronGeometry(0.5, 1);
    const smokeMat = new THREE.MeshBasicMaterial({
      color: 0xd1d5db,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });

    this.smokeInstancedMesh = new THREE.InstancedMesh(smokeGeo, smokeMat, this.maxParticles);
    this.smokeInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.smokeInstancedMesh.count = 0;
    this.scene.add(this.smokeInstancedMesh);

    // Exhaust flames
    const flameGeo = new THREE.ConeGeometry(0.12, 0.7, 8);
    flameGeo.rotateX(-Math.PI / 2);
    this.flameMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
    });

    this.flameLeft = new THREE.Mesh(flameGeo, this.flameMat);
    this.flameRight = new THREE.Mesh(flameGeo, this.flameMat);
    this.flameLeft.visible = false;
    this.flameRight.visible = false;
    this.scene.add(this.flameLeft);
    this.scene.add(this.flameRight);
  }

  public emitSmoke(leftTirePos: THREE.Vector3, rightTirePos: THREE.Vector3, density = 2) {
    for (let i = 0; i < density; i++) {
      if (this.smokeParticles.length >= this.maxParticles) break;

      const pos = Math.random() > 0.5 ? leftTirePos : rightTirePos;
      this.smokeParticles.push({
        position: pos.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.4,
          0.15 + Math.random() * 0.1,
          (Math.random() - 0.5) * 0.4
        )),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          0.8 + Math.random() * 1.4, // rising
          (Math.random() - 0.5) * 1.5
        ),
        scale: 0.4 + Math.random() * 0.3,
        maxScale: 2.2 + Math.random() * 1.4,
        opacity: 0.55,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 2.0,
        life: 0,
        maxLife: 1.2 + Math.random() * 0.8,
      });
    }
  }

  public updateFlames(
    posL: THREE.Vector3,
    posR: THREE.Vector3,
    heading: number,
    nitroActive: boolean,
    highRpm: boolean
  ) {
    if (nitroActive) {
      this.flameMat.color.setHex(0x38bdf8); // Cyan nitro jet
      this.flameLeft.visible = true;
      this.flameRight.visible = true;
      const flicker = 0.8 + Math.random() * 0.5;
      this.flameLeft.scale.set(flicker, flicker, flicker * 1.6);
      this.flameRight.scale.set(flicker, flicker, flicker * 1.6);
    } else if (highRpm && Math.random() > 0.85) {
      // Pop and bang anti-lag flames
      this.flameMat.color.setHex(0xf97316); // Orange fire
      this.flameLeft.visible = true;
      this.flameRight.visible = true;
      this.flameLeft.scale.set(0.8, 0.8, 0.9);
      this.flameRight.scale.set(0.8, 0.8, 0.9);
    } else {
      this.flameLeft.visible = false;
      this.flameRight.visible = false;
    }

    if (this.flameLeft.visible) {
      this.flameLeft.position.copy(posL);
      this.flameLeft.rotation.y = heading + Math.PI;
      this.flameRight.position.copy(posR);
      this.flameRight.rotation.y = heading + Math.PI;
    }
  }

  public update(dt: number) {
    const alive: SmokeParticle[] = [];

    for (let i = 0; i < this.smokeParticles.length; i++) {
      const p = this.smokeParticles[i];
      p.life += dt;

      if (p.life < p.maxLife) {
        p.position.addScaledVector(p.velocity, dt);
        const progress = p.life / p.maxLife;
        p.scale = THREE.MathUtils.lerp(0.5, p.maxScale, progress);
        p.opacity = THREE.MathUtils.lerp(0.55, 0.0, progress * progress);
        p.rotation += p.rotSpeed * dt;
        alive.push(p);
      }
    }

    this.smokeParticles = alive;
    this.smokeInstancedMesh.count = this.smokeParticles.length;

    for (let i = 0; i < this.smokeParticles.length; i++) {
      const p = this.smokeParticles[i];
      this.dummy.position.copy(p.position);
      this.dummy.scale.set(p.scale, p.scale, p.scale);
      this.dummy.rotation.set(p.rotation, p.rotation * 0.5, p.rotation * 0.8);
      this.dummy.updateMatrix();
      this.smokeInstancedMesh.setMatrixAt(i, this.dummy.matrix);
    }

    this.smokeInstancedMesh.instanceMatrix.needsUpdate = true;
  }

  public cleanup() {
    this.scene.remove(this.smokeInstancedMesh);
    this.scene.remove(this.flameLeft);
    this.scene.remove(this.flameRight);
  }
}

// Skidmark ribbon generator
export class SkidmarkManager {
  private scene: THREE.Scene;
  private markMeshes: THREE.Mesh[] = [];
  private maxMarks = 160;
  private markMaterial: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.markMaterial = new THREE.MeshBasicMaterial({
      color: 0x050608,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
  }

  public addMark(pos1: THREE.Vector3, pos2: THREE.Vector3, width = 0.3) {
    const dir = pos2.clone().sub(pos1);
    const dist = dir.length();
    if (dist < 0.2 || dist > 4.0) return;

    const geo = new THREE.PlaneGeometry(width, dist);
    geo.rotateX(-Math.PI / 2);

    const mesh = new THREE.Mesh(geo, this.markMaterial);
    mesh.position.copy(pos1.clone().add(pos2).multiplyScalar(0.5));
    mesh.position.y = 0.06;
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.normalize());

    this.scene.add(mesh);
    this.markMeshes.push(mesh);

    if (this.markMeshes.length > this.maxMarks) {
      const oldest = this.markMeshes.shift();
      if (oldest) {
        this.scene.remove(oldest);
        oldest.geometry.dispose();
      }
    }
  }

  public cleanup() {
    for (const m of this.markMeshes) {
      this.scene.remove(m);
      m.geometry.dispose();
    }
    this.markMeshes = [];
  }
}
