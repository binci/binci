import clc from 'cli-color';

const output = {
  /**
   * Colorizes {{...}} delimited vars
   * @param {String} m Raw message
   */
  renderVars: (m) => m.toString().replace(/\{\{([^}]+)\}\}/g, (i, match) => clc.cyan(match)),
  /**
   * Outputs success message
   * @param {String} m Output message
   */
  success: (m) => {
    output.log(clc.green.bold('#> ') + clc.bold(output.renderVars(m)));
  },
  /**
   * Output error message
   * @param {String} m Output message
   */
  error: (m) => {
    output.log(clc.red.bold('!> ') + clc.bold(output.renderVars(m)));
  },
  /**
   * Standard log output, no formatting
   * @param {String} m Output message
   */
  log: (m) => {
    /* eslint no-console: 0 */
    console.log(m);
  }
};

export default output;
