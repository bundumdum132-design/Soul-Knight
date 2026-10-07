export function makeRng(seed) {
  let state = (Number(seed) >>> 0) || 0x6d2b79f5;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed() {
  const cryptoSeed = globalThis.crypto?.getRandomValues?.(new Uint32Array(1))?.[0];
  return (cryptoSeed || (Date.now() ^ Math.floor(Math.random() * 0xffffffff))) >>> 0;
}

export const pick = (rng, list) => list[Math.floor(rng() * list.length)];
export const intBetween = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));
