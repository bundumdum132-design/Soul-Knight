export const WIDTH = 480;
export const HEIGHT = 270;
export const RENDER_SCALE = 3;
export const CANVAS_WIDTH = WIDTH * RENDER_SCALE;
export const CANVAS_HEIGHT = HEIGHT * RENDER_SCALE;
export const ROOM = Object.freeze({ left: 24, right: 456, top: 20, bottom: 250, centerX: 240, centerY: 135 });
export const VERSION = '0.1.0';

export const C = Object.freeze({
  ink: '#111b20', deep: '#17272b', wall: '#304143', wallHi: '#496052', stone: '#65745c', moss: '#61845d',
  floor: '#293b37', floor2: '#30433c', floor3: '#35473e', grass: '#536c4d', leaf: '#88a76a', cream: '#eee2bf',
  muted: '#a6b09a', gold: '#efc56d', orange: '#ef925d', red: '#de6d68', pink: '#d68a9e',
  cyan: '#78d5c2', blue: '#83b9d1', purple: '#b493d3', dark: '#182427', white: '#fff2d8',
});

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
export const norm = (x, y) => {
  const l = Math.hypot(x, y) || 1;
  return { x: x / l, y: y / l };
};
export const rectsOverlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
