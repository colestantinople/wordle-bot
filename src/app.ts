import { Controller } from './controller.js';

(async () => {
  if (!Controller.runLoop) Controller.init();
  else
    for (let i = 0; i < 40; i++) {
      await Controller.init();
      Controller.reset();
    }
})();
