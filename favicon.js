import { randomBytes } from "crypto";

function randomColor() {
  return `#${randomBytes(3).toString('hex')}`;
}

export function generate() {
  const color = randomColor();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` + 
    `<circle cx="50" cy="50" r="45" fill="${color}" /></svg>`;
}