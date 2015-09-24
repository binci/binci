import { spawn } from 'child_process';
import Promise from 'bluebird';

export default (proc, args) => {
  return new Promise((resolve, reject) => {
    const p = spawn(proc, args, {
      env: process.env,
      cwd: process.env.HOME,
      stdio: [ 'pipe', process.stdout, process.stdout ]
    });
    // Handle close
    p.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(code);
      }
    });
  });
};
