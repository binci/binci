[![CircleCI branch](https://img.shields.io/circleci/project/TechnologyAdvice/DevLab/master.svg?maxAge=2592000)]()
[![Code Climate](https://img.shields.io/codeclimate/github/TechnologyAdvice/DevLab.svg?maxAge=2592000)]()

# DevLab

DevLab is a utility that allows you to easily containerize your development
workflow using Docker. Simply put; it's like having a cleanroom for all of your
development processes which contains services (like databases) without needing
to setup and maintain these environments manually.

![example](/demo.gif)

## Installation

```
npm install devlab -g
```

**Note: DevLab requires Node v.4+ to run.**

*Obvious Note: You need to have [Docker](https://www.docker.com/) installed as well.*

## Usage

Devlab is controlled by a `devlab.yml` file in the root of your project. A basic example is shown below:

```yaml
from: node:0.10
services:
  - mongo:
      from: mongo:3.0
      env:
        - DB_ROOT_PASSWORD=foo
      expose:
        - 27017:27017
env:
  - TMP=${TMP}
expose:
  - 8080:8080
volumes:
  - ${HOME}/.ssh:/root/.ssh
hosts:
  - google.com:127.0.0.1
before: npm install
after: rm -rf /node_modules
tasks:
  run: node index.js
```

The above can then be executed via the `devlab run` (or `lab run`) command from within the same directory as your project and `devlab.yml`. Execution would do the following:

- Pull and start `mongo` with `DB_ROOT_PASSWORD` environment variable and port `27017` exposed
- Sets the following on the container:
  - Set the primary container environment variable `TMP` to the same as the host machine
  - Expose port `8080` to the host system
  - Mount the host machine's `.ssh` directory in the container
  - Set a host entry for `google.com` to `127.0.0.1`
- Run `npm install` inside the container before running the task
- Run `node index.js` task inside the container
- Run `rm -rf /node_modules` to cleanup after the task has completed

### Multiple Tasks

The example shows a single-command execution configuration, however, Devlab supports named tasks as well. Replace the `task` entry with configuration object `tasks`:

```yaml
tasks:
  env: env | sort
  start: node index.js
  test: npm test
```

The above would allow you to run `lab <task>` to execute any of the tasks defined.

### Custom Execution

Devlab also allows for executing tasks not predefined in the configuration file using the `-e` flag. For example:

```
lab -e "/bin/sh"
```

The above would start the container using the configuration, call the `before` task, then start the `sh` shell. The container will then remain in the shell until an `exit` command is sent by the user.

## Container Image (`from <string>`)

The `from` configuration property instructs the image to be used on the primary instance and services.

For testing different images easily, the `-f <alternate-image>` argument can be called during execution.

## Services

Services add links into the primary container, exposing the services for utilitzation. For the most part, services utilize the same format for definition as the primary container.

### Container Naming

During execution, service containers are named in 2 ways:

1. Ephemeral (non-persisted): `dl_<NAME>_<INSTANCE-ID>`
2. Persisted: `<NAME>`

The above naming convention allows for persisted services to be shared with other Devlab instances, or manually run docker containers, via the `--link` argument.

At startup Devlab will ensure any persisted or already running containers are not started again.

After completion, Devlab will run a detached process which will execute `docker stop` and `docker rm` on any non-persisted, ephemeral services.

### Persisting Services

Services which need to persist between runs can be set by providing `persist: true` in their configurations.

Persisted services will not stop after the primary container finishes its task and can be used by the same project, other projects, or independently.

## Environment Variables (`env <array>`)

Setting `env` array items will expose environment variables in the primary instance or services. These entries can be raw strings or use `${VAR}` notation, where `VAR` is an environment variable on the host machine to use. Entries should use the format `<ENV_VAR>=<VALUE>`

## Expose (`expose <array>`)

Setting `expose` array items will expose ports to the host machine from the primary or service containers. Entries should use the format `<CONTAINER_PORT>:<HOST_PORT>`

## Volumes (`volumes <array>`)

Setting `volumes` will mount volumes on the host machine to designated paths on the primary or service containers. Entries should use the format `<HOST_PATH>:<CONTAINER_PATH>`

## Hosts (`hosts <array>`)

Setting `hosts` will update the hosts configuration for the container. Entries should use the format `<HOST_NAME>:<ADDRESS>`

## Development

To run tests, fork & clone the repository then run `npm install && npm test`.

To run end-to-end tests run `npm run e2e`. This works by fully emulating a run inside the `/test/project` directory and executing `/test/system/run.js` with the `/test/system/tests.json` definitions file.

## License

DevLab is licensed under the MIT license. Please see [`LICENSE.txt`](/license.txt) for full details.

## Credits

DevLab was created and is maintained by  [TechnologyAdvice](http://www.technologyadvice.com).
