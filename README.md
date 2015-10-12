# DevLab

DevLab is a utility that allows you to easily containerize your development
workflow using Docker. Simply put; it's like having a cleanroom for all of your
development processes which contains services (like databases) without needing
to setup and maintain these environments manually.

## Installation

```
git clone git@github.com:TechnologyAdvice/DevLab.git && cd DevLab && npm run local-install
```

## Usage

DevLab operates as a command on your system (via global install). It reads the
configuration for your project from a `devlab.yml` file which contains all the
instructions and tasks you need.

From there, DevLab is a CLI tool. Both `devlab` and `lab` are registered for the bin so either command will work when running tasks.

### Configuration

To configure a project to use DevLab, simply add a `devlab.yml` to the root of
your project. An example of this file looks like:

```yaml
from: node:0.10
services:
  - mongo:3.0:
      name: mongodb
      env:
        - DB_ROOT_PASSWORD=foo
      expose:
        - 27017:27017
      persist: false
env:
  - LOCAL_HOME=${HOME}
expose:
  - 8080:8080
volumes:
  - ${HOME}/.ssh:/root/.ssh
quiet: false
before-task: |
  echo starting.
after-task: |
  echo completed.
tasks:
  env: env
  clean: rm -rf node_modules
  install: npm install
  test: npm run test
  lint: npm run lint
  build: npm run build
```

Once the above is configured the tasks can be called simply by their names, for example:

```
lab test
```

The above will spin up the `node:0.10` container, link to `mongo:3.0`, expose the environment variables needed, and run `npm run test`.

To further explain the configuration:

#### `from`

Specifies the image in which to run the project. In the example the `from` will
pull from [Docker Hub's](https://hub.docker.com) `node:0.10` image. This can also be overridden at runtime. If you wanted to try testing your project with Node v.0.12 you could run with the `-f` flag:

```
lab test -f node:0.12
```

#### `services`

This section specifies any containers (services) that will be linked in at runtime.

The "key" is the image, in the above example the service running will be version
3.0 of Mongo. The other paramaters specified are:

* `name`: Set an arbitrary name for the service
* `env`: Array of environment variables to pass to the service
* `expose`: Expose any ports. This is useful if you would like to persist the service and access it directly after running tasks.
* `persist`: Defaults to `true`; will keep the service running. A service (such as a database) not persisted will not retain data between runs.

#### `env`

Sets any environment variables needed in the container. In the above example the `LOCAL_HOME` will be set using your host machines `HOME` environment variable.

Variables specified with `${NAME}` will pull from the host machine, or strings can be set by not encapsulating between `${` and `}`.

#### `expose`

Sets ports to expose to host machine. This is useful for long-running tasks. For example if you're testing a service and have a task that runs the service this will allow you to access the ports needed to make requests against the service.

#### `volumes`

Maps local directories to paths on the container. This supports the use of environment variables (as shown in the example).

#### `before-task`

Injects a script to run **before** every task.

#### `after-task`

Injects a script to run **after** every task.

#### `quiet`

If set to `true` will supress DevLab output and only show process results.

This can also be set with the `-q` flag during execution.

#### `tasks`

This is the list of tasks which can be executed with the `devlab` command.

DevLab supports multi-line tasks as well, for example:

```yaml
  echo: |
    echo foo
    echo bar
```

## Custom Execution Tasks

DevLab uses the `-e` flag to allow for execution of tasks not in the `devlab.yml` file:

```
lab -e "echo hello world"
```

## Interactive Mode

By default, DevLab attempts to use Docker's `-it` flag when running, however, some configurations may require manually instructing interactive (`STDIN`) support.

For debugging or running custom commands inside the container the `-i` (interactive) flag is available:

```
lab -i -e "/bin/bash"
```

The above will run the container with `STDIN` support at bash shell for working inside the container. **Executing the `exit` command will stop the service.**

The interactive command can be used with the `-e` flag as in the example above or with any tasks configured in the `devlab.yml`

## License

This software is currently under proprietary licensure to TechnologyAdvice.
