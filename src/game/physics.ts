import * as THREE from 'three';
import { ControlState, DriftStats, CarModel } from '../types';

export interface VehicleState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  heading: number; // yaw angle in radians (0 = along -Z or +X)
  angularVelocity: number; // yaw rate (rad/s)
  speedKmh: number;
  slipAngleDeg: number;
  steerAngle: number;
  pitch: number; // front/rear weight transfer
  roll: number; // lateral roll
  isDrifting: boolean;
  driftQuality: 'NONE' | 'DRIFT' | 'GREAT' | 'EXTREME' | 'PERFECT';
  driftScore: number;
  combo: number;
  comboTimer: number;
  nitroAmount: number;
  nitroActive: boolean;
  wheelRotations: [number, number, number, number]; // FL, FR, RL, RR
}

export class DriftPhysicsEngine {
  public state: VehicleState;
  public carConfig: CarModel;

  // Physical constants
  private mass = 1200; // kg
  private maxSteerAngle = 0.65; // ~37 degrees max lock
  private steerSpeed = 4.2; // how fast front wheels turn
  private enginePower = 38.0;
  private brakePower = 52.0;
  private handbrakePower = 85.0;
  private nitroMultiplier = 1.9;
  private rollingResistance = 0.15;
  private airDrag = 0.0018;

  // Drift friction constants
  private maxGrip = 28.0;
  private driftFriction = 14.5;
  private counterSteerAssist = 1.65;

  constructor(carConfig: CarModel, initialPos = new THREE.Vector3(0, 0.4, 0), initialHeading = 0) {
    this.carConfig = carConfig;
    this.state = {
      position: initialPos.clone(),
      velocity: new THREE.Vector3(0, 0, 0),
      heading: initialHeading,
      angularVelocity: 0,
      speedKmh: 0,
      slipAngleDeg: 0,
      steerAngle: 0,
      pitch: 0,
      roll: 0,
      isDrifting: false,
      driftQuality: 'NONE',
      driftScore: 0,
      combo: 1,
      comboTimer: 0,
      nitroAmount: 100,
      nitroActive: false,
      wheelRotations: [0, 0, 0, 0],
    };

    this.applyCarTuning(carConfig);
  }

  public applyCarTuning(car: CarModel) {
    this.carConfig = car;
    this.mass = car.weight;
    this.enginePower = (car.horsepower / 600) * 36;
    this.nitroMultiplier = 1.75 + (car.acceleration / 100) * 0.4;
  }

  public reset(position = new THREE.Vector3(0, 0.4, 0), heading = 0) {
    this.state.position.copy(position);
    this.state.velocity.set(0, 0, 0);
    this.state.heading = heading;
    this.state.angularVelocity = 0;
    this.state.speedKmh = 0;
    this.state.slipAngleDeg = 0;
    this.state.steerAngle = 0;
    this.state.pitch = 0;
    this.state.roll = 0;
    this.state.isDrifting = false;
    this.state.driftQuality = 'NONE';
    this.state.combo = 1;
    this.state.comboTimer = 0;
    this.state.nitroActive = false;
  }

  public update(dt: number, controls: ControlState, trackColliders?: THREE.Box3[]): DriftStats {
    // Clamp delta time to avoid physics tunneling
    const delta = Math.min(dt, 0.05);

    // 1. Steering input smoothing
    let targetSteer = 0;
    if (controls.left) targetSteer += this.maxSteerAngle;
    if (controls.right) targetSteer -= this.maxSteerAngle;

    this.state.steerAngle = THREE.MathUtils.damp(
      this.state.steerAngle,
      targetSteer,
      this.steerSpeed,
      delta
    );

    // Current forward and lateral unit vectors
    const forwardVec = new THREE.Vector3(
      Math.sin(this.state.heading),
      0,
      Math.cos(this.state.heading)
    );
    const rightVec = new THREE.Vector3(
      Math.cos(this.state.heading),
      0,
      -Math.sin(this.state.heading)
    );

    // Speed decomposition
    const forwardSpeed = this.state.velocity.dot(forwardVec);
    const lateralSpeed = this.state.velocity.dot(rightVec);
    const totalSpeed = this.state.velocity.length();
    this.state.speedKmh = Math.round(totalSpeed * 3.6 * 2.2);

    // 2. Throttle, Nitro, and Braking forces
    let driveForce = 0;
    let isNitroOn = false;

    if (controls.nitro && controls.forward && this.state.nitroAmount > 0) {
      isNitroOn = true;
      this.state.nitroAmount = Math.max(0, this.state.nitroAmount - 32 * delta);
    } else {
      // Regenerate nitro slowly when drifting or driving
      this.state.nitroAmount = Math.min(100, this.state.nitroAmount + 6 * delta);
    }
    this.state.nitroActive = isNitroOn;

    const nitroBoost = isNitroOn ? this.nitroMultiplier : 1.0;

    if (controls.forward) {
      driveForce += this.enginePower * nitroBoost;
    }
    if (controls.backward) {
      if (forwardSpeed > 1.5) {
        // Braking
        driveForce -= this.brakePower;
      } else {
        // Reverse
        driveForce -= this.enginePower * 0.55;
      }
    }

    // 3. Weight transfer calculation
    const targetPitch = (driveForce / 40) * 0.04 - (controls.backward && forwardSpeed > 1 ? 0.07 : 0);
    this.state.pitch = THREE.MathUtils.damp(this.state.pitch, targetPitch, 8, delta);

    const targetRoll = (-lateralSpeed / 15) * 0.06;
    this.state.roll = THREE.MathUtils.damp(this.state.roll, targetRoll, 8, delta);

    // 4. Slip angle and Drift state
    // Slip angle is difference between vehicle orientation and velocity vector
    let calculatedSlipAngle = 0;
    if (totalSpeed > 2.0) {
      calculatedSlipAngle = Math.atan2(lateralSpeed, Math.abs(forwardSpeed)) * (180 / Math.PI);
    }
    this.state.slipAngleDeg = THREE.MathUtils.damp(this.state.slipAngleDeg, calculatedSlipAngle, 10, delta);

    const absSlip = Math.abs(this.state.slipAngleDeg);
    const isSlideCondition = absSlip > 14 && this.state.speedKmh > 22;
    this.state.isDrifting = isSlideCondition;

    // 5. Lateral Grip & Friction Curve
    let lateralFrictionCoefficient = this.maxGrip;
    if (controls.handbrake) {
      // Handbrake cuts rear lateral grip drastically and introduces rotation
      lateralFrictionCoefficient = this.driftFriction * 0.45;
      driveForce *= 0.2;
    } else if (isSlideCondition) {
      // Transition to sliding dynamic friction
      const slipFactor = Math.min(1.0, (absSlip - 14) / 40);
      lateralFrictionCoefficient = THREE.MathUtils.lerp(this.maxGrip, this.driftFriction, slipFactor);
    }

    // Counter-steer assist: when sliding right, steering left helps catch and maintain the drift
    const isCounterSteering =
      (this.state.slipAngleDeg > 5 && this.state.steerAngle > 0.05) ||
      (this.state.slipAngleDeg < -5 && this.state.steerAngle < -0.05);

    // 6. Yaw / Angular dynamics
    let yawTorque = 0;
    if (totalSpeed > 0.5) {
      // Front wheel steering authority (decreases somewhat at hyper speeds)
      const steerEfficiency = Math.max(0.4, 1.0 - (totalSpeed / 80) * 0.4);
      yawTorque += this.state.steerAngle * forwardSpeed * 1.35 * steerEfficiency;

      // In a drift, RWD throttle pushes the rear out (oversteer)
      if (controls.forward && isSlideCondition) {
        const oversteerDirection = this.state.slipAngleDeg > 0 ? 1 : -1;
        yawTorque += oversteerDirection * 1.8 * (isNitroOn ? 1.5 : 1.0);
      }

      // Handbrake sharp spin initiation
      if (controls.handbrake && totalSpeed > 4.0) {
        const spinDirection = this.state.steerAngle !== 0 ? Math.sign(this.state.steerAngle) : (Math.sign(this.state.slipAngleDeg) || 1);
        yawTorque += spinDirection * 3.4;
      }

      // Counter-steering stabilizer
      if (isCounterSteering) {
        yawTorque += (this.state.steerAngle * 2.2) * this.counterSteerAssist;
      }

      // Self-aligning rotational damping
      yawTorque -= this.state.angularVelocity * 3.2;
    } else {
      yawTorque = -this.state.angularVelocity * 6.0;
    }

    this.state.angularVelocity += yawTorque * delta;
    this.state.angularVelocity = THREE.MathUtils.clamp(this.state.angularVelocity, -3.8, 3.8);
    this.state.heading += this.state.angularVelocity * delta;

    // 7. Acceleration & Total Force Resolution
    const totalForwardForce = driveForce - (forwardSpeed * this.rollingResistance) - (forwardSpeed * Math.abs(forwardSpeed) * this.airDrag);
    const totalLateralForce = -lateralSpeed * lateralFrictionCoefficient;

    const netAcceleration = forwardVec.clone().multiplyScalar(totalForwardForce).add(
      rightVec.clone().multiplyScalar(totalLateralForce)
    );

    this.state.velocity.add(netAcceleration.multiplyScalar(delta));

    // Natural velocity decay when stopped
    if (totalSpeed < 0.1 && !controls.forward && !controls.backward) {
      this.state.velocity.set(0, 0, 0);
    }

    // 8. Update position
    this.state.position.add(this.state.velocity.clone().multiplyScalar(delta));

    // Keep car grounded
    this.state.position.y = 0.38;

    // 9. Simple collision bounding against track walls/props
    this.handleTrackCollisions(trackColliders);

    // 10. Wheel rotations (visual)
    const wheelRoll = (forwardSpeed * delta) / 0.33;
    this.state.wheelRotations[0] += wheelRoll;
    this.state.wheelRotations[1] += wheelRoll;
    this.state.wheelRotations[2] += wheelRoll * (controls.handbrake ? 0.1 : (controls.forward ? 1.4 : 1.0));
    this.state.wheelRotations[3] += wheelRoll * (controls.handbrake ? 0.1 : (controls.forward ? 1.4 : 1.0));

    // 11. Scoring and Combo Evaluation
    this.updateDriftScore(delta);

    return {
      currentScore: Math.floor(this.state.driftScore),
      combo: Math.min(20, Math.floor(this.state.combo * 10) / 10),
      comboTimer: Math.max(0, this.state.comboTimer),
      driftAngle: Math.round(absSlip),
      speed: this.state.speedKmh,
      isDrifting: this.state.isDrifting,
      nitroAmount: Math.round(this.state.nitroAmount),
      driftQuality: this.state.driftQuality,
    };
  }

  private updateDriftScore(delta: number) {
    const absSlip = Math.abs(this.state.slipAngleDeg);

    if (this.state.isDrifting && this.state.speedKmh > 20) {
      // Rate drift quality based on angle & speed
      let quality: 'DRIFT' | 'GREAT' | 'EXTREME' | 'PERFECT' = 'DRIFT';
      let angleScoreWeight = 1.0;

      if (absSlip > 55) {
        quality = 'PERFECT';
        angleScoreWeight = 3.5;
      } else if (absSlip > 40) {
        quality = 'EXTREME';
        angleScoreWeight = 2.4;
      } else if (absSlip > 28) {
        quality = 'GREAT';
        angleScoreWeight = 1.6;
      }

      this.state.driftQuality = quality;

      // Combo builds up while sustaining drift
      this.state.combo = Math.min(20, this.state.combo + delta * 0.85);
      this.state.comboTimer = 2.2; // 2.2 seconds buffer to chain next drift!

      // Base points = speed * angle multiplier * car multiplier
      const addedPoints = (this.state.speedKmh * 1.8 * angleScoreWeight * this.carConfig.driftScoreMultiplier * this.state.combo) * delta;
      this.state.driftScore += addedPoints;
    } else {
      this.state.driftQuality = 'NONE';
      if (this.state.comboTimer > 0) {
        this.state.comboTimer -= delta;
        if (this.state.comboTimer <= 0) {
          // Combo reset
          this.state.combo = 1.0;
        }
      }
    }
  }

  private handleTrackCollisions(trackColliders?: THREE.Box3[]) {
    if (!trackColliders || trackColliders.length === 0) return;

    const carRadius = 1.8;
    const carBox = new THREE.Box3(
      new THREE.Vector3(this.state.position.x - carRadius, 0, this.state.position.z - carRadius),
      new THREE.Vector3(this.state.position.x + carRadius, 2, this.state.position.z + carRadius)
    );

    for (const collider of trackColliders) {
      if (carBox.intersectsBox(collider)) {
        // Simple bounce back
        const center = new THREE.Vector3();
        collider.getCenter(center);
        const pushDir = this.state.position.clone().sub(center);
        pushDir.y = 0;
        pushDir.normalize();

        // Push away from obstacle
        this.state.position.add(pushDir.multiplyScalar(0.4));
        // Damp velocity
        this.state.velocity.multiplyScalar(0.4);
        // Break combo on crash
        this.state.combo = 1.0;
        this.state.comboTimer = 0;
        break;
      }
    }
  }
}
