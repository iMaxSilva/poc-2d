import './styles.css';
import { BattleScene } from './game/BattleScene';

const canvas = document.querySelector<HTMLCanvasElement>('#game');

if (!canvas) {
  throw new Error('Canvas #game não encontrado.');
}

const scene = new BattleScene(canvas);
scene.start();

window.addEventListener('beforeunload', () => scene.destroy());
