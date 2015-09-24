import shelljs from 'shelljs';
import min from 'minimist';
import yaml from 'js-yaml';
import fs from 'fs';
import output from './output';
import pkg from './../../package.json';

// Set noTask bool
let noTask = false;

// Get working dir
const pwd = shelljs.pwd();

// Get args
const args = process.argv[0] === 'node' ? min(process.argv.slice(1)) : process.argv.slice(2);

// Help
const help = `
  ${pkg.name} v.${pkg.version}
  
  Usage: ${pkg.name} task [options]

    -h   Show this help message
    -v   Show current version
    -f   Set FROM (Docker image)
    -c   Set config to load (YAML)
`;

// Show help
if (args.h) { console.log(help); process.exit(0); }

// Show version
if (args.v) { console.log(pkg.version); process.exit(0); }

// Load yaml config
const configPath = (args.c) ? `${pwd}/${args.c}` : `${pwd}/laminar.yml`;
let config = {};
try {
  config = yaml.safeLoad(fs.readFileSync(configPath), 'utf8');
} catch (e) {
  output.error('Could not load config!');
  process.exit(1);
}

// Set volume
config.volume = pwd;

// Get task
const task = (args._[1]) ? args._[1] : false;

if (config.tasks.hasOwnProperty(task)) {
  // Task exists, add to `run` config
  config.run = config.tasks[task]
} else {
  // Missing task, halt
  output.error('Please specify a task to run.')
  process.exit(1);
}

// Override from
if (args.f) config.from = args.f;

// Export config
export default config;
