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

export const config = {
  /**
   * Generate random instance string
   */
  instance: Date.now(),
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
  args: min(process.argv.slice(process.argv[0] === 'node' ? 1 : 2)),
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
      -p   Override the config exposed port: -p 8888
      -q   Supresses verbose output"\n`,
  /**
   * Checks arguments for specific (immediate action) flags and config
   * @param {Object} args The arguments passed in
   */
  checkArgs: args => {
    // Show help
    if (args.h) { output.log(config.helpMsg); process.exit(0); }
    // Show version
    if (args.v) { output.log(pkg.version); process.exit(0); }
    // Set quiet flag
    if (args.q) output.quiet = true;
    // Get interactive flag
    config.interactive = args.i ? true : false;
    // Set exec
    config.exec = args.e ? args.e : false;
    // Port override
    config.port = args.p ? args.p : false;
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
  /**
   * Sets up run of preset task
   * @param {Object} manifest The config manifest
   * @param {String} task The task to execute
   * @returns {String}
   */
  setupRun: (manifest, task) => {
    const beforeTask = manifest['before-task'] ? parsers.parseTask(manifest['before-task']) + ';' : '';
    const afterTask = manifest['after-task'] ? parsers.parseTask(manifest['after-task']) : '';
    let tmp = parsers.parseTask(manifest.tasks[task]);
    tmp = parsers.parseAliases(manifest, tmp);
    if (tmp.slice(-1) !== ';') tmp += ';';
    return `set -e; ${beforeTask} ${tmp} ${afterTask}`
      // Some cleanup...
      .replace(/;;/g, ';')
      .replace(/; ;/g, ';')
      .replace(/\s\s+/g, ' ')
      .trim();
  },
  /**
   * Runs the config process
   */
  get: () => {
    config.checkArgs(config.args);
    config.loadManifest();
    // Check for port override
    if (config.port) config.manifest.expose[0] = config.manifest.expose[0].replace(/^.+:/, `${config.port}:`);
    // Check if set to quiet
    /* istanbul ignore next */
    if (config.manifest.quiet) output.quiet = true;
    // Ensure task specified
    if (config.task && config.manifest.tasks.hasOwnProperty(config.task)) {
      // Set run
      config.manifest.run = config.setupRun(config.manifest, config.task);
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

module.exports = config;
