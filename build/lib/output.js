'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _cliColor = require('cli-color');

var _cliColor2 = _interopRequireDefault(_cliColor);

var output = {
  /**
   * Colorizes {{...}} delimited vars
   * @param {String} m Raw message
   */
  renderVars: function renderVars(m) {
    return m.toString().replace(/\{\{([^}]+)\}\}/g, function (i, match) {
      return _cliColor2['default'].cyan(match);
    }).replace('set -e;', '');
  },
  /**
   * Output success message
   * @param {String} m Output message
   */
  success: function success(m) {
    output.log(_cliColor2['default'].green.bold('#> ') + _cliColor2['default'].bold(output.renderVars(m)));
  },
  /**
   * Output warning message
   * @param {String} m Output message
   */
  warn: function warn(m) {
    output.log(_cliColor2['default'].yellow.bold('!> ') + _cliColor2['default'].bold(output.renderVars(m)));
  },
  /**
   * Output error message
   * @param {String} m Output message
   */
  error: function error(m) {
    output.log(_cliColor2['default'].red.bold('!> ') + _cliColor2['default'].bold(output.renderVars(m)));
  },
  /**
   * Inserts break before commands are run
   */
  insertBreak: function insertBreak() {
    output.log(_cliColor2['default'].white('---'));
  },
  /**
   * Determine stdio fro process
   */
  setStdio: function setStdio() {
    return !process.env.LAM_TEST ? ['inherit', process.stdout, process.stdout] : [null, null, null];
  },
  /**
   * Standard log output, no formatting
   * @param {String} m Output message
   */
  log: function log(m) {
    if (!process.env.LAM_TEST) process.stdout.write(m + '\n');
  }
};

exports['default'] = output;
module.exports = exports['default'];