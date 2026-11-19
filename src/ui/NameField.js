import { GAME_WIDTH, FONT } from '../config.js';

// A real HTML text box floating over the game canvas, for typing a name.
// Phaser can't do text boxes on its own, and a real <input> gives you
// typing, pasting and phone keyboards for free (like the login screen).
//
// It's placed in GAME pixels (like everything else in a scene) and moves
// and grows with the canvas when the browser window is resized.
//
//   const field = addNameField(scene, { x, y, width, height, value, maxLength, onInput });
//   field.value  -> what's typed
//   onInput(text) is called on every key you type
// It removes itself when the scene ends.

export function addNameField(scene, { x, y, width, height, value = '', maxLength = 16, onInput }) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = value;
  input.maxLength = maxLength;
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.setAttribute('aria-label', 'Name');
  Object.assign(input.style, {
    position: 'fixed',
    zIndex: 5,
    boxSizing: 'border-box',
    margin: 0,
    padding: '0 0.4em',
    fontFamily: FONT,
    color: '#3a2a26',
    background: '#f4ecd8',
    border: '2px solid #2a1f1c',
    borderRadius: 0,
    outline: 'none',
  });
  input.addEventListener('focus', () => (input.style.borderColor = '#ffe3a0'));
  input.addEventListener('blur', () => (input.style.borderColor = '#2a1f1c'));
  // While you type, keys go only to the box (not to the game), so typing
  // A, D or arrow keys doesn't also do game things. Enter or Esc stop typing.
  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter' || e.key === 'Escape') input.blur();
  });
  input.addEventListener('input', () => onInput?.(input.value.trim()));
  document.body.appendChild(input);

  // Line the box up with the canvas, however big the canvas is drawn.
  function place() {
    const rect = scene.game.canvas.getBoundingClientRect();
    const scale = rect.width / GAME_WIDTH;
    input.style.left = `${rect.left + x * scale}px`;
    input.style.top = `${rect.top + y * scale}px`;
    input.style.width = `${width * scale}px`;
    input.style.height = `${height * scale}px`;
    input.style.fontSize = `${Math.round(height * scale * 0.6)}px`;
  }
  place();

  // Clicking anywhere in the game stops typing. (Phaser keeps clicks on
  // the canvas to itself, so the browser wouldn't do this on its own.)
  const stopTyping = () => input.blur();
  scene.input.on('pointerdown', stopTyping);
  scene.scale.on('resize', place);
  window.addEventListener('resize', place);

  scene.events.once('shutdown', () => {
    scene.scale.off('resize', place);
    window.removeEventListener('resize', place);
    input.remove();
  });

  return {
    get value() {
      return input.value.trim();
    },
    hide() {
      input.style.display = 'none';
    },
  };
}
