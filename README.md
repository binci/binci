# Laminar

Utility for running containerized local dev tasks (and then some...).

## Usage

Laminar operates as (preferably) as a global module. It should be run in a 
directory which contains a `laminar.yml` config file. The `laminar.yml` file 
sets the configuration and tasks which Laminar will run in Docker.

### Example YAML:

```yaml
from: node:0.10
services:
  - mongodb:mongo
env:
  - LOCAL_HOME=${HOME}
expose:
  - 8080:8080
tasks:
  env: env
  install: npm install
  test: npm run test
  lint: npm run lint
  build: npm run build
```

The above specifies the following:

* `from`: The container will run the `node:0.10` container image
* `services`: The container will link the `mongo` container image with name `mongodb`
* `env`: The `LOCAL_HOME` environment variable will map to (local) `$HOME`'s value
* `expose`: Port `8080` will be exposed
* `tasks`: Specifying the (key) name of any listed tasks will execute that inside the container

### Using the CLI

In it's simplest form, Laminar can be called with just a task name:

```
laminar test
```

The above example would execute the `test` task inside a container running the 
`laminar.yml` config settings.

Additionally the following flags are available:

* `-h`: Display the help (accepts no other flags or tasks)
* `-v`: Display the version of Laminar (accepts no other flags or tasks)
* `-c path/to/config`: Specify the path to config (relative to cwd)
* `-f container:tag`: Specify a different container and version to run (override `from`)