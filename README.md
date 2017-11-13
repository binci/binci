[![Travis](https://img.shields.io/travis/binci/binci/master.svg)](https://travis-ci.org/Binci/binci)
[![Codecov](https://codecov.io/gh/binci/binci/branch/master/graph/badge.svg)](https://codecov.io/gh/Binci/binci)
[![NSP Status](https://nodesecurity.io/orgs/binci/projects/cbac1faf-7c38-41f1-b648-1b4c8dfd8f02/badge)](https://nodesecurity.io/orgs/binci/projects/cbac1faf-7c38-41f1-b648-1b4c8dfd8f02)

<img src="./binci.png" align="right">

# Binci

Binci is a utility that allows you to easily containerize your development
workflow using Docker. Simply put, it's like having a cleanroom for all of your
development processes which contain services (like databases) without needing
to setup and maintain these environments manually.

---

<img width="100%" src="http://i.imgur.com/4NOBeYU.gif">

**FAQ: [Why Binci over Docker-Compose?](#why-binci-over-docker-compose)**

## Installation

### YARN/NPM

`yarn global add binci` or `npm install binci -g`

**Note: Binci requires Node v.6+ to run.**

### Binaries

**Linux [(download)](http://binci.technologyadvice.com/linux/binci)**

```
curl -o /usr/local/bin/binci http://binci.technologyadvice.com/linux/binci && \
chmod +x /usr/local/bin/binci
```

**Mac OSX [(download)](http://binci.technologyadvice.com/mac/binci)**

```
sudo mkdir -p /usr/local/bin && \
sudo curl -o /usr/local/bin/binci http://binci.technologyadvice.com/mac/binci && \
sudo chmod +x /usr/local/bin/binci
```

**Windows [(download)](http://binci.technologyadvice.com/windows/binci.exe)**

Download the above file and run from the path where it is saved or add to a directory in your `PATH`.

---

*Obvious Note: You need to have [Docker](https://www.docker.com/) installed as well.*

**Important Note**: In order to run the tasks, Binci creates a temp file (`binci.sh`). The tool will do its best to determine the best location (usually `/tmp`), but this can be explicitly set by specifying the environment variable `BINCI_TMP`.

## Quick Start

After you have Binci installed you can initialize a project by moving to the project directory and running the following:

```
binci init
```

The above will prompt you to enter a base image; this should be a valid Docker image.

Once the configuration is generated you can run tasks. The default template includes several, for example:

```
binci env
```

The above will load your project via Binci & Docker, then echo the environment variables available.

## Usage

Binci is controlled by a `binci.yml` file in the root of your project. A basic example is shown below:

```yaml
from: node:6
services:
  - mongo:
      from: mongo:3.0
      env:
        - DB_ROOT_PASSWORD=foo
      expose:
        - 27017:27017
env:
  - TMP=${TMP}
  - HOST=${HOST:-localhost}
expose:
  - 8080:8080
volumes:
  - ${HOME}/.ssh:/root/.ssh
hosts:
  - google.com:127.0.0.1
before: npm install
after: echo "done"
tasks:
  env: env | sort
  start: node index.js
  lint: npm run lint
  test: npm test
  run: node index.js
```

The above can then be executed via the `binci <task>` command from within the same directory as your project and `binci.yml`. For example, `binci run` would perform the following:

- Pull and start `mongo` with `DB_ROOT_PASSWORD` environment variable and port `27017` exposed
- Sets the following on the container:
  - Set the primary container environment variable `TMP` to the same as the host machine
  - Expose port `8080` to the host system
  - Mount the host machine's `.ssh` directory in the container
  - Set a host entry for `google.com` to `127.0.0.1`
- Run `npm install` inside the container before running the task
- Run `node index.js` task inside the container
- Echo `done` after the task has completed

### Custom Execution

Binci also allows for executing tasks not predefined in the configuration file using the `-e` flag. For example:

```
binci -e "/bin/sh"
```

The above would start the container using the configuration, call the `before` task, then start the `sh` shell. The container will then remain in the shell until an `exit` command is sent by the user.

## Container Image (`dockerfile <string>` or `from <string>`)

The `dockerfile` configuration property can be specified to point to this project's Dockerfile, which will be auto-built for task execution. This image will be rebuilt any time the Dockerfile is edited. Defaults to `./Dockerfile`.

The `from` configuration property causes Binci to use the specified image to run tasks, rather than building a new image from a local Dockerfile.

For testing different images easily, the either the `-b <build-dockerfile>` or `-f <from-alternate-image>` arguments can be passed on execution.

## Services

Services add links into the primary container, exposing the services for utilization. For the most part, services utilize the same format for definition as the primary container.

### Container Naming

During execution, service containers are named in 2 ways:

1. Ephemeral (non-persisted): `bc_<NAME>_<INSTANCE-ID>`
2. Persisted: `<NAME>`

The above naming convention allows for persisted services to be shared with other Binci instances, or manually run docker containers, via the `--link` argument.

At startup Binci will ensure any persisted or already running containers are not started again.

After completion, Binci will run a detached process which will execute `docker stop` and `docker rm` on any non-persisted, ephemeral services.

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
Alternatively, you can disable all services for a task with `'*'`:

```yaml
tasks:
  lint:
    disable: '*'
    cmd: npm run lint
  start: npm start
```

For one-off cases, individual services can also be disabled via the command line:

```
binci lint -d mongo
```

or all services:

```
binci lint -d '*'
binci lint --disable-all
```

## Container Management

Binci will automatically `stop` services after any run (success or fail). However, if this fails or some other fringe-case causes this process to stop responding the system can leave orphaned containers running.

In order to mitigate this issue Binci will run a check for any `bc_` prefixed containers on each run. If orphaned services are identified a warning message will appear at the beginning of the process to indicate the orphaned service(s) and commands to remedy/exit these containers.

The following commands can be run to cleanup any running containers:

**Stop and Remove Binci Containers:**

```
binci --cleanup
```

**Stop and Remove ALL Containers:**

```
binci --cleanup-all
```

## Environment Variables (`env <array>`)

Setting `env` array items will expose environment variables in the primary instance or services. These entries can be raw strings or use `${VAR}` notation, where `VAR` is an environment variable on the host machine to use. Entries should use the format `<ENV_VAR>=<VALUE>`.

You can provide default values for environment variables by using the standard bash syntax. For example, `VAR=${FOO:-foobar}` will first look for the `FOO` environment variable, and if it is not defined `VAR` will be set to the string `foobar` (i.e. `VAR=foobar`).

## Expose (`expose <array>`)

Setting `expose` array items will expose ports to the host machine from the primary or service containers. Entries should use the format `<CONTAINER_PORT>:<HOST_PORT>`

## Volumes (`volumes <array>`)

Setting `volumes` will mount volumes on the host machine to designated paths on the primary or service containers. Entries should use the format `<HOST_PATH>:<CONTAINER_PATH>`

## Hosts (`hosts <array>`)

Setting `hosts` will update the hosts configuration for the container. Entries should use the format `<HOST_NAME>:<ADDRESS>`

## Service Stop Time (`stopTimeSecs <integer>`)

The standard procedure for stopping a Docker container is the `stop` command which sends `SIGTERM` and allows a grace period (default: `10`) for the container to exit on its own.

Some containers may not exit via `SIGTERM` (or may hang). In this case, the service container can utilize the `stopTimeSecs` property:

```yaml
services:
  - mongo:
      from: mongo:3.0
      stopTimeSecs: 3
```

The `stopTimeSecs` above would forcibly stop the container after 3 seconds using [Docker's `stop` command's `-t` option](https://docs.docker.com/engine/reference/commandline/stop/).

**Global Setting:**

In addition to setting the `stopTimeSecs` per service, this property can be set in the root of the `binci.yml` configuration and will be applied to any services that don't have an explicit `stopTimeSecs` property.

## Development

### Tests

Binci can be run via `yarn`/`npm` scripts, but is also setup to run development tasks using Binci.

Ensure you have the latest version installed then run:

`binci install test` or `yarn install && yarn test`.

### End-to-End Tests

To run end-to-end tests run `yarn run e2e`. This works by fully emulating a run inside the `/test/project` directory and executing `/test/system/run.js` with the `/test/system/tests.json` definitions file.

### Testing Builds

To test binary builds:

**1. Build Binary:**

```
yarn run build:linux
```

**2. Run (Ubuntu) Docker in Docker:**

```
docker run -it --rm -v /var/run/docker.sock:/var/run/docker.sock -v $PWD:/app -w /app ubuntu sh -c "apt-get update && apt-get install docker.io -y && bash"
```

**3. Create Binci Alias:**

```
alias binci=$PWD/bin/linux/binci
```

Once the above steps are completed the `binci` executable will be available.

## Why Binci Over Docker Compose?

First off, we like [Docker Compose](https://docs.docker.com/compose/), and definitely think it's a powerful tool. However, Binci was built because Compose is more about long-running, containerized environment and what we set out to build was a way to run ephemeral, limited-lifespan tasks without having to manage cleanup between each run.

Compose takes the approach of spinning up containers that run, almost like a virtual machine, while you need them. Binci looks at things from a point of view of abstracting `docker run` command chains to create a single-run instance only for that task, then shutting down and doing cleanup so each run is clean and running off a consistent base.

Some more comparisons:

* With Binci you don't need a Dockerfile for local development, thus you can use it whether or not your project will be deployed in Docker or to bare metal.
* Binci only builds Docker images if you want it to. Specifying an image in the config will run all tasks off of that image without ever building a local one first.
* When you install local dependencies in your project folder, run a build, execute your coverage tool, or write any local files, that just happens on your hard disk, not locked away in some container. They'll be available to every other task you run.
* With Binci you don't need to run tasks in a containerized shell, you simply define the tasks and run them. You can kick tasks off with any local script, build tool, or IDE run configuration without building a container first.
* Tasks don't need to be defined at runtime via arguments or flags, you just tell Binci which predefined task to run.

## License

Binci is licensed under the MIT license. Please see [`LICENSE.txt`](/LICENSE.txt) for full details.

## Credits

Binci was originally created at [TechnologyAdvice](http://www.technologyadvice.com) in Nashville, TN.
