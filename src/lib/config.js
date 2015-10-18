/*
 * Copyright (c) 2015 TechnologyAdvice
 */
import shelljs from 'shelljs';
import min from 'minimist';
import yaml from 'js-yaml';
import fs from 'fs';
import output from './output';
import parsers from './parsers';
import pkg from './../../package.json';

const config = {
  /**
   * Object to contain runtime opts
   */
  manifest: {},
  /**
   * Current working directory
   */
  cwd: shelljs.pwd(),
  /**
   * Get arguments
   */
  args: process.argv[0] === 'node' ? min(process.argv.slice(1)) : min(process.argv.slice(2)),
  /**
   * Help message template
   */
  helpMsg: `
    ${pkg.name} v.${pkg.version}\n
    Usage: ${pkg.name} task [options]\n
      -h   Show this help message
      -v   Show current version
      -i   Run container with STDIN support
      -e   Run custom command(s): -e "some command"
      -f   Set FROM (Docker image): -f "container:tag"
      -c   Set config to load (YAML): -c "/path/to/config.yml
      -q   Supresses verbose output"\n`,
  /**
   * Checks arguments for specific (immediate action) flags and config
   * @param {Object} args The arguments passed in
   */
  checkArgs: (args) => {
    // Show help
    if (args.h) { output.log(config.helpMsg); process.exit(0); }
    // Show version
    if (args.v) { output.log(pkg.version); process.exit(0); }
    // Set quiet flag
    if (args.q) { output.quiet = true; }
    // Get interactive flag
    config.interactive = args.i ? true : false;
    // Set exec
    config.exec = args.e ? args.e : false;
    // Load yaml config
    config.manifestPath = args.c ? `${config.cwd}/${args.c}` : `${config.cwd}/devlab.yml`;
    // Override from
    config.from = args.f ? args.f : false;
    // Set task
    config.task = args._ ? args._.pop() : false;
  },
  /**
   * Loads manifest and sets basic props
   */
  loadManifest: () => {
    try {
      config.manifest = yaml.safeLoad(fs.readFileSync(config.manifestPath, 'utf8'));
    } catch (e) {
      output.error('Could not load config!');
      process.exit(1);
    }
  },
  setupRun: () => {
    const beforeTask = config.manifest['before-task'] ? parsers.parseTask(config.manifest['before-task']) + ';' : '';
    const afterTask = config.manifest['after-task'] ? parsers.parseTask(config.manifest['after-task']) : '';
    let task = parsers.parseTask(config.manifest.tasks[config.task]);
    task = parsers.parseAliases(config.manifest, task);
    return `set -e; ${beforeTask} ${task}; ${afterTask}`.replace(/;;/g, ';');
  },
  /**
   * Runs the config process
   */
  get: () => {
    config.checkArgs(config.args);
    config.loadManifest();
    // Check if set to quiet
    /* istanbul ignore next */
    if (config.manifest.quiet) output.quiet = true;
    // Ensure task specified
    if (config.task && config.manifest.tasks.hasOwnProperty(config.task)) {
      // Set run
      config.manifest.run = config.setupRun();
    } else if (config.exec) {
      // Execute arbitrary command
      config.manifest.run = config.exec;
    } else {
      // Missing task, halt
      output.error('Please specify a task to run');
      output.log(config.helpMsg);
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

export default config;
