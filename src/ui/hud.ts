import type RAPIER from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import type { Controls } from "../common";

export function createHUD() {
  const hudContainer = document.createElement("div");
  hudContainer.id = "hud";
  hudContainer.innerHTML = `
    <div class="hud-item">
      <span class="hud-label">PITCH</span>
      <span class="hud-value" id="pitch">0°</span>
    </div>
    <div class="hud-item">
      <span class="hud-label">ROLL</span>
      <span class="hud-value" id="roll">0°</span>
    </div>
    <div class="hud-item">
      <span class="hud-label">YAW</span>
      <span class="hud-value" id="yaw">0°</span>
    </div>
    <div class="hud-item">
      <span class="hud-label">VELOCITY</span>
      <span class="hud-value" id="velocity">0.0 m/s</span>
    </div>
    <div class="hud-item">
      <span class="hud-label">GROUND SPEED</span>
      <span class="hud-value" id="groundspeed">0.0 m/s</span>
    </div>
    <div class="hud-item">
      <span class="hud-label">BATTERY</span>
      <span class="hud-value" id="battery">100%</span>
    </div>
  `;
  document.body.appendChild(hudContainer);

  // Add HUD styles
  const style = document.createElement("style");
  style.textContent = `
    #hud {
      position: fixed;
      top: 20px;
      left: 20px;
      z-index: 100;
      color: #00ff00;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      background: rgba(0, 0, 0, 0.7);
      padding: 15px;
      border-radius: 5px;
      border: 1px solid rgba(0, 255, 0, 0.3);
    }
    .hud-item {
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      min-width: 200px;
    }
    .hud-label {
      opacity: 0.7;
      margin-right: 20px;
    }
    .hud-value {
      font-weight: bold;
      text-align: right;
    }
  `;
  document.head.appendChild(style);
}

export function updateHUD(info: {
  controls: Controls;
  droneBody: RAPIER.RigidBody;
  droneMesh: THREE.Group;
  batteryLevel: number;
}) {
  const vel = info.droneBody.linvel();
  const totalVelocity = Math.sqrt(
    vel.x * vel.x + vel.y * vel.y + vel.z * vel.z,
  );
  const groundSpeed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);

  // battery
  document.getElementById("battery")!.textContent =
    `${Math.floor(info.batteryLevel)}%`;

  // Battery color based on level
  const batteryElement = document.getElementById("battery")!;
  if (info.batteryLevel > 30) {
    batteryElement.style.color = "#00ff00";
  } else if (info.batteryLevel > 15) {
    batteryElement.style.color = "#ffaa00";
  } else {
    batteryElement.style.color = "#ff0000";
  }

  // Convert quaternion to euler angles
  const euler = new THREE.Euler();
  euler.setFromQuaternion(info.droneMesh.quaternion);
  const pitch = THREE.MathUtils.radToDeg(euler.x);
  const yaw = THREE.MathUtils.radToDeg(euler.y);
  const roll = THREE.MathUtils.radToDeg(euler.z);

  document.getElementById("pitch")!.textContent = `${pitch.toFixed(1)}°`;
  document.getElementById("roll")!.textContent = `${roll.toFixed(1)}°`;
  document.getElementById("yaw")!.textContent = `${yaw.toFixed(1)}°`;
  document.getElementById("velocity")!.textContent =
    `${totalVelocity.toFixed(1)} m/s`;
  document.getElementById("groundspeed")!.textContent =
    `${groundSpeed.toFixed(1)} m/s`;
}
