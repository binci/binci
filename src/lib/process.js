import { spawn } from 'child_process';
import Promise from 'bluebird';

// Test output supression
let stdio;
if (!process.env.LAM_TEST) {
  stdio = [ 'pipe', process.stdout, process.stdout ];
} else {
  stdio = [ null, null, null ];
}

/**
 * Spawns a process and returns a promise for handling results
 * @param {String} proc The command/process to run
 * @param {Array} args The arguments of the proc command
 */
export default (proc, args) => {
  return new Promise((resolve, reject) => {
    const p = spawn(proc, args, {
      env: process.env,
      cwd: process.env.HOME,
      stdio
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
