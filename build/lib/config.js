/*
 * Copyright (c) 2015 TechnologyAdvice
 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _shelljs = require('shelljs');

var _shelljs2 = _interopRequireDefault(_shelljs);

var _minimist = require('minimist');

var _minimist2 = _interopRequireDefault(_minimist);

var _jsYaml = require('js-yaml');

var _jsYaml2 = _interopRequireDefault(_jsYaml);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _output = require('./output');

var _output2 = _interopRequireDefault(_output);

var _parsers = require('./parsers');

var _parsers2 = _interopRequireDefault(_parsers);

var _packageJson = require('./../../package.json');

var _packageJson2 = _interopRequireDefault(_packageJson);

var config = {
  /**
   * Object to contain runtime opts
   */
  manifest: {},
  /**
   * Current working directory
   */
  cwd: _shelljs2['default'].pwd(),
  /**
   * Get arguments
   */
  args: process.argv[0] === 'node' ? (0, _minimist2['default'])(process.argv.slice(1)) : (0, _minimist2['default'])(process.argv.slice(2)),
  /**
   * Help message template
   */
  helpMsg: '\n    ' + _packageJson2['default'].name + ' v.' + _packageJson2['default'].version + '\n\n    Usage: ' + _packageJson2['default'].name + ' task [options]\n\n      -h   Show this help message\n      -v   Show current version\n      -i   Run container with STDIN support\n      -e   Run custom command(s): -e "some command"\n      -f   Set FROM (Docker image): -f "container:tag"\n      -c   Set config to load (YAML): -c "/path/to/config.yml\n      -q   Supresses verbose output"\n',
  /**
   * Checks arguments for specific (immediate action) flags and config
   * @param {Object} args The arguments passed in
   */
  checkArgs: function checkArgs(args) {
    // Show help
    if (args.h) {
      _output2['default'].log(config.helpMsg);process.exit(0);
    }
    // Show version
    if (args.v) {
      _output2['default'].log(_packageJson2['default'].version);process.exit(0);
    }
    // Set quiet flag
    if (args.q) {
      _output2['default'].quiet = true;
    }
    // Get interactive flag
    config.interactive = args.i ? true : false;
    // Set exec
    config.exec = args.e ? args.e : false;
    // Load yaml config
    config.manifestPath = args.c ? config.cwd + '/' + args.c : config.cwd + '/devlab.yml';
    // Override from
    config.from = args.f ? args.f : false;
    // Set task
    config.task = args._ ? args._.pop() : false;
  },
  /**
   * Loads manifest and sets basic props
   */
  loadManifest: function loadManifest() {
    try {
      config.manifest = _jsYaml2['default'].safeLoad(_fs2['default'].readFileSync(config.manifestPath, 'utf8'));
    } catch (e) {
      _output2['default'].error('Could not load config!');
      process.exit(1);
    }
  },
  setupRun: function setupRun() {
    var beforeTask = config.manifest['before-task'] ? _parsers2['default'].parseTask(config.manifest['before-task']) + ';' : '';
    var afterTask = config.manifest['after-task'] ? _parsers2['default'].parseTask(config.manifest['after-task']) : '';
    var task = _parsers2['default'].parseTask(config.manifest.tasks[config.task]);
    task = _parsers2['default'].parseAliases(config.manifest, task);
    return ('set -e; ' + beforeTask + ' ' + task + '; ' + afterTask).replace(/;;/g, ';');
  },
  /**
   * Runs the config process
   */
  get: function get() {
    config.checkArgs(config.args);
    config.loadManifest();
    // Check if set to quiet
    /* istanbul ignore next */
    if (config.manifest.quiet) _output2['default'].quiet = true;
    // Ensure task specified
    if (config.task && config.manifest.tasks.hasOwnProperty(config.task)) {
      // Set run
      config.manifest.run = config.setupRun();
    } else if (config.exec) {
      // Execute arbitrary command
      config.manifest.run = config.exec;
    } else {
      // Missing task, halt
      _output2['default'].error('Please specify a task to run');
      _output2['default'].log(config.helpMsg);
      process.exit(1);
    }
    // Set workdir
    config.manifest.workdir = config.cwd;
    // Check for container override
    if (config.from) config.manifest.from = config.from;
    // Check interactive mode
    if (config.interactive) config.manifest.interactive = true;
    // Return the compiled config manifest
    return config.manifest;
  }
};

exports['default'] = config;
module.exports = exports['default'];