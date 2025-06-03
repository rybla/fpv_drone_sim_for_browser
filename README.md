# README

This project uses TypeScript, [Three JS](https://threejs.org/) for graphics, and [Rapier](https://rapier.rs/) (via the NPM package [@dimforge/rapier3d
](https://www.npmjs.com/package/@dimforge/rapier3d]) for physics.

## Setup

To install dependencies:

```sh
npm install
```

To run the development server:

```sh
npm dev
```

All merge requests should build without ANY type errors.

## Initial Notes

- requiremnts:
  - use three-js for 3D rendering
  - import environments and 3D models
  - physics:
    - gravity
    - wind
    - propulsion
    - collisions
      - this will be hard, definitely need a physics engine to handle this

- stuff to simulate:
  - [x] temperature
    - [x] affects battery drain
    - [x] affects air density, makes the drone faster or slower
  - [x] battery levels
  - [x] air speed affects propellers
  - [x] propeller speed for individual propellers
  - [x] controls: mode 2 layout
      - VETO: just keyboard controls
  - [x] first-person view from front of drone
  - [x] camera delay
      - VETO: just ping

## Environment Specification

- basic environment (3D model of environment and its landmarks)
- one/two-way mission
- high/low light
- start point
- target point
