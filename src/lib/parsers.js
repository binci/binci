const parsers = {
  /**
   * Process environment variables
   * @param {Array} env Array of environment variables
   * @returns {Array} env var flags and args
   */
  parseEnvVars: (env) => {
    let envs = [];
    env.map((e) => {
      // Matches any ${VAR} format vars
      const matcher = (i, match) =>  process.env.hasOwnProperty(match) ? process.env[match] : null;
      // Replace matches on ${VAR}
      const envVar = e.toString().replace(/\$\{([^}]+)\}/g, matcher);
      // Concat
      envs = envs.concat([ '-e', envVar ]);
    });
    return envs;
  },

  /**
   * Process any ports to expose
   * @param {Array} expose Array of ports to expose
   * @returns {Array} port expose flags and args
   */
  parseExpose: (expose) => {
    let ports = [];
    expose.map((p) => { ports = ports.concat([ '-p', p ]); });
    return ports;
  }
};

export default parsers;