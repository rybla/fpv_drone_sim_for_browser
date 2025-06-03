export const maxFlightTime = 510; // 8.5 minutes in seconds

// Physics constants
export const droneMass = 0.065;
export const maxThrust = 1.28; // N (2x hover thrust)
export const hoverThrottle = (droneMass * 9.81) / maxThrust;
export const maxPitchTorque = 0.015;
export const maxRollTorque = 0.015;
export const maxYawTorque = 0.008;

export const autoLevelPitchGain = 0.03;
export const autoLevelRollGain = 0.03;
