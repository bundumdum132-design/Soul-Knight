const normalizeKey = (key) => key === ' ' ? 'space' : key.toLowerCase();

import { RENDER_SCALE } from './constants.js';

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.down = new Set();
    this.pressed = new Set();
    this.released = new Set();
    this.pointer = { x: 0, y: 0, down: false, pressed: false, moved: false, active: false };
    this.boundKeyDown = (e) => {
      const key = normalizeKey(e.key);
      if (['space', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) e.preventDefault();
      if (!this.down.has(key)) this.pressed.add(key);
      this.down.add(key);
    };
    this.boundKeyUp = (e) => {
      const key = normalizeKey(e.key);
      if (this.down.delete(key)) this.released.add(key);
    };
    this.boundPointerMove = (e) => this.setPointer(e);
    this.boundPointerDown = (e) => {
      this.canvas.focus({ preventScroll: true });
      this.setPointer(e);
      this.pointer.down = true;
      this.pointer.pressed = true;
      this.pointer.active = true;
      if (e.button === 2) e.preventDefault();
    };
    this.boundPointerUp = (e) => {
      this.pointer.down = false;
      if (e.button === 0) this.released.add('pointer');
    };
    this.boundContext = (e) => e.preventDefault();
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    canvas.addEventListener('pointermove', this.boundPointerMove);
    canvas.addEventListener('pointerdown', this.boundPointerDown);
    window.addEventListener('pointerup', this.boundPointerUp);
    canvas.addEventListener('contextmenu', this.boundContext);
  }
  setPointer(e) {
    const rect = this.canvas.getBoundingClientRect();
    const oldX = this.pointer.x; const oldY = this.pointer.y;
    this.pointer.x = (e.clientX - rect.left) * this.canvas.width / rect.width / RENDER_SCALE;
    this.pointer.y = (e.clientY - rect.top) * this.canvas.height / rect.height / RENDER_SCALE;
    this.pointer.moved = Math.abs(oldX - this.pointer.x) + Math.abs(oldY - this.pointer.y) > 0.4;
    this.pointer.active = true;
  }
  isDown(key) { return this.down.has(String(key).toLowerCase()); }
  wasPressed(key) { return this.pressed.has(String(key).toLowerCase()); }
  wasReleased(key) { return this.released.has(String(key).toLowerCase()); }
  endFrame() { this.pressed.clear(); this.released.clear(); this.pointer.pressed = false; this.pointer.moved = false; }
  destroy() {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    this.canvas.removeEventListener('pointermove', this.boundPointerMove);
    this.canvas.removeEventListener('pointerdown', this.boundPointerDown);
    window.removeEventListener('pointerup', this.boundPointerUp);
    this.canvas.removeEventListener('contextmenu', this.boundContext);
  }
}
