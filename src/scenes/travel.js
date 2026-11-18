// Moving between places (the street and your home) with a quick fade.
//
//   travel(this, 'Home', { returnX: this.player.x })
//
// `data` is handed to the next scene's create(data).
export function travel(scene, key, data = {}) {
  if (scene.leaving) return; // already on the way out (double click)
  scene.leaving = true;
  const cam = scene.cameras.main;
  cam.fadeOut(220, 13, 10, 18);
  cam.once('camerafadeoutcomplete', () => scene.scene.start(key, data));
}

// Call at the end of a scene's create() so it fades in.
export function arrive(scene) {
  scene.leaving = false;
  scene.cameras.main.fadeIn(260, 13, 10, 18);
}
