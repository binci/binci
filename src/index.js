import config from './lib/config';
import services from './lib/services';
import proc from './lib/process';
import output from './lib/output';

// Create run-time manifest from config
const manifest = config.get();

// Process timer
const start = new Date().getTime();

// Links placeholder
let links = [];

/**
 * Process environment variables
 */
let envs = [];
if (manifest.env) {
  manifest.env.map((e) => {
    // Matches any ${VAR} format vars
    const matcher = (i, match) =>  process.env.hasOwnProperty(match) ? process.env[match] : null;
    // Check for matches
    const env = e.toString().replace(/\$\{([^}]+)\}/g, matcher);
    // Concat
    envs = envs.concat([ '-e', env ]);
  });
}

/**
 * Process any ports to expose
 */
let ports = [];
if (manifest.expose) {
  manifest.expose.map((e) => {
    ports = ports.concat([ '-p', e ]);
  });
}

/**
 * Builds and executes command to run container with task
 */
const runTask = () => {
  // Spawn arguments
  let args = [
    'run',
    '-t',
    '--rm'
  ];

  // Volume config
  const volume = [
    '-v',
    `${manifest.volume}:${manifest.volume}`
  ];

  // Workdir config
  const workdir = [
    '-w',
    manifest.volume
  ];

  // From (image) config
  const from = [ config.from ];

  // Split command into (space delimited) parts
  const cmd = manifest.run.split(' ');

  // Build full args array
  args = links.length ? args.concat(links) : args;
  args = envs.length ? args.concat(envs) : args;
  args = ports.length ? args.concat(ports) : args;
  args = args.concat(volume);
  args = args.concat(workdir);
  args = args.concat(from);
  args = args.concat(cmd);

  // Start run
  output.success(`Running container {{${manifest.from}}}, task {{${manifest.run}}}`);
  proc('docker', args)
    .then(() => {
      const closed = (new Date().getTime() - start) / 1000;
      output.success(`Completed in {{${closed}}} seconds`);
      process.exit(0);
    })
    .catch((code) => {
      output.error(`Error running {{${manifest.run}}}, exited with code {{${code}}}`);
      process.exit(code);
    });
};

/**
 * Check for (and start) service containers
 */
if (manifest.services) {
  output.success(`Starting services: {{${manifest.services.join(', ')}}}`);
  // Services; run service module
  services.run(manifest.services)
    .then(() => {
      // Create links array for insert into run
      manifest.services.map((l) => {
        links = links.concat([ '--link', l ]);
      });
      runTask();
    })
    .catch((e) => {
      output.error(e);
      process.exit(1);
    });
} else {
  // No services; start
  runTask();
}
