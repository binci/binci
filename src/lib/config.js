import shelljs from 'shelljs';
import min from 'minimist';
import yaml from 'js-yaml';
import fs from 'fs';
import output from './output';
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
      -f   Set FROM (Docker image)
      -c   Set config to load (YAML)\n`,
  /**
   * Checks arguments for specific (immediate action) flags and config
   * @param {Object} args The arguments passed in
   */
  checkArgs: (args) => {
    // Show help
    if (args.h) { output.log(config.helpMsg); process.exit(0); }
    // Show version
    if (args.v) { output.log(pkg.version); process.exit(0); }
    // Load yaml config
    config.manifestPath = args.c ? `${config.cwd}/${args.c}` : `${config.cwd}/laminar.yml`;
    // Override from
    config.from = args.f ? args.f : false;
    // Set task
    config.task = args._ ? args._[1] : false;
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
    // Set volume
    config.manifest.volume = config.cwd;
  },
  /**
   * Runs the config process
   */
  get: () => {
    config.checkArgs(config.args);
    config.loadManifest();
    // Ensure task specified
    if (config.task && config.manifest.tasks.hasOwnProperty(config.task)) {
      // Set run
      config.manifest.run = config.manifest.tasks[config.task];
    } else {
      // Missing task, halt
      output.error('Please specify a task to run.');
      process.exit(1);
    }
    // Check for container override
    if (config.from) {
      config.manifest.from = config.from;
    }
    // Return the compiled config manifest
    return config.manifest;
  }
};

export default config;
