import clc from 'cli-color';

const renderVars = (m) => {
  const matcher = (i, match) => {
    return clc.cyan(match);
  }
  return m.toString().replace(/\{\{([^}]+)\}\}/g, matcher);
}

export default {
  success: (m) => {
    console.log(clc.green.bold('#> ') + clc.bold(renderVars(m)));
  },
  error: (m) => {
    console.log(clc.red.bold('!> ') + clc.bold(m));
  }
}