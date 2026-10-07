import './style.css';
import { Game } from './game.js';

const canvas = document.querySelector('#game');
const game = new Game(canvas);
game.start();

if (import.meta.hot) import.meta.hot.dispose(() => game.stop());
