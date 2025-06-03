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

## TODO

- [ ] better skybox
- [ ] proper controls
  - [ ] hover mode
    - [ ] needs to take into account rotation of drone
  - [ ] HUD controls layout
  - [ ] mode 2 controls
- [ ] stuff in environment
  - [ ] outdoor environment
- [ ] temperature
- [ ] battery levels
- [ ] wind (air speed)
- [ ] HUD
- [ ] camera delay
- [x] real fpv cam
- [x] fix skybox rotation
- [x] drone model
- [x] fpv camera
- [x] collisions

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
  - temperature
  - battery levels
  - air speed
  - propeller speed
  - controls
    - mode 2
    - layout
    - how affects specific motors
  - first-person view from front of drone
  - camera delay
