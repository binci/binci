[![CircleCI branch](https://img.shields.io/circleci/project/TechnologyAdvice/DevLab/master.svg?maxAge=2592000)]()
[![Code Climate](https://codeclimate.com/github/TechnologyAdvice/DevLab/badges/gpa.svg)](https://codeclimate.com/github/TechnologyAdvice/DevLab)
[![Test Coverage](https://codeclimate.com/github/TechnologyAdvice/DevLab/badges/coverage.svg)](https://codeclimate.com/github/TechnologyAdvice/DevLab/coverage)

**Updgrading from 2.x to 3.x: Please see [Release Notes](https://github.com/TechnologyAdvice/DevLab/releases/tag/v3.0.0)**

# DevLab

DevLab is a utility that allows you to easily containerize your development
workflow using Docker. Simply put; it's like having a cleanroom for all of your
development processes which contains services (like databases) without needing
to setup and maintain these environments manually.

![example](/demo.gif)

**FAQ: [Why Devlab over Docker-Compose?](#why-devlab-over-docker-compose)**

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
after: echo "done"
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
- Echo `done` after the task has completed

### Multiple Tasks

The example shows a single-command execution configuration, however, Devlab supports named tasks as well. Replace the `task` entry with configuration object `tasks`:

```yaml
tasks:
  env: env | sort
  start: node index.js
  lint: npm run lint
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

### Disabling Services

By default, all services in the configuration will be linked on any run. To disable services for specific tasks, you can define them like this:

```yaml
tasks:
  lint:
    disable:
      - mongo
    cmd: npm run lint
  start: npm start
```

## Container Management

Since container shutdown is a detached, unattended process it is _possible_ for services to fail to shutdown. On each run, before starting services or executing tasks, Devlab will run a check and attempt to identify any orphaned services.

If orphaned services are identified a warning message will appear at the beginning of the process to indicate the orphaned service(s) and commands to remedy/exit these containers.

Additionally, the following commands can be run to cleanup any running containers:

**Stop and Remove Devlab Containers:**

```
devlab --cleanup
```

**Stop and Remove ALL Containers:**

```
devlab --cleanup-all
```

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

## Why Devlab Over Docker Compose?

First off, we like [Docker Compose](https://docs.docker.com/compose/), and definitely think it's a powerful tool. However, Devlab was built because Compose is more about long-running, containerized environment and what we set out to build was a way to run ephemeral, limited-lifespan tasks without having to manage cleanup between each run.

Compose takes the approach of spinning up containers that run, almost like a virtual machine, while you need them. Devlab looks at things from a point of view of abstracting `docker run` command chains to create a single-run instance only for that task, then shutting down and doing cleanup so each run is clean and running off a consistent base.

Some more comparisons:

* With Devlab you don't need a Dockerfile for local development, thus you can use it whether or not your project will be deployed in Docker or to bare metal.
* Devlab doesn't build docker images, ever. It uses the images you specify for both the primary container and any services.
* When you install local dependencies in your project folder, run a build, execute your coverage tool, or write any local files, that just happens on your hard disk, not locked away in some container. They'll be available to every other task you run.
* With Devlab you don't need to run tasks in a containerized shell, you simply define the tasks and run them. You can kick tasks off with any local script, build tool, or IDE run configuration without building a container first.
* Tasks don't need to be defined at runtime via arguments or flags, you just tell Devlab which predefined task to run.

## License

DevLab is licensed under the MIT license. Please see [`LICENSE.txt`](/LICENSE.txt) for full details.

## Credits

DevLab was created and is maintained by  [TechnologyAdvice](http://www.technologyadvice.com).
