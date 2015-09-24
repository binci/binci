/* eslint no-console: 0 */
import clc from 'cli-color';

const renderVars = (m) => m.toString().replace(/\{\{([^}]+)\}\}/g, (i, match) => clc.cyan(match));

export default {
  success: (m) => {
    console.log(clc.green.bold('#> ') + clc.bold(renderVars(m)));
  },
  error: (m) => {
    console.log(clc.red.bold('!> ') + clc.bold(renderVars(m)));
  },
  log: (m) => {
    console.log(m);
  }
};
