/*
 * Copyright (c) 2015 TechnologyAdvice
 */
import clc from 'cli-color';

const output = {
  // Holds quiet boolean
  quiet: false,
  /**
   * Colorizes {{...}} delimited vars
   * @param {String} m Raw message
   */
  renderVars: m => m.toString()
    .replace(/\{\{([^}]+)\}\}/g, (i, match) => clc.cyan(match))
    .replace('set -e;', ''),
  /**
   * Output success message
   * @param {String} m Output message
   */
  success: m => {
    if (!output.quiet) output.log(clc.green.bold('#> ') + clc.bold(output.renderVars(m)));
  },
  /**
   * Output warning message
   * @param {String} m Output message
   */
  warn: m => {
    if (!output.quiet)output.log(clc.yellow.bold('!> ') + clc.bold(output.renderVars(m)));
  },
  /**
   * Output error message
   * @param {String} m Output message
   */
  error: m => {
    if (!output.quiet) output.log(clc.red.bold('!> ') + clc.bold(output.renderVars(m)));
  },
  /**
   * Inserts break before commands are run
   */
  insertBreak: () => {
    if (!output.quiet) output.log(clc.white('---'));
  },
  /**
   * Determine stdio fro process
   */
  setStdio: () => {
    return !process.env.LAM_TEST ? [ 'inherit', process.stdout, process.stdout ] : [ null, null, null ];
  },
  /**
   * Standard log output, no formatting
   * @param {String} m Output message
   */
  log: m => {
    if (!process.env.LAM_TEST) process.stdout.write(`${m}\n`);
  }
};

export default output;
