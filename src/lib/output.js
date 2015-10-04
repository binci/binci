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
   * Inserts break before commands are run
   */
  insertBreak: () => {
    output.log(clc.white('---'));
  },
  /**
   * Determine stdio fro process
   */
  setStdio: () => {
    return !process.env.LAM_TEST ? [ 'pipe', process.stdout, process.stdout ] : [ null, null, null ];
  },
  /**
   * Standard log output, no formatting
   * @param {String} m Output message
   */
  log: (m) => {
    if (!process.env.LAM_TEST) process.stdout.write(`${m}\n`);
  }
};

export default output;
