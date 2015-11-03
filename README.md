# DevLab

DevLab is a utility that allows you to easily containerize your development
workflow using Docker. Simply put; it's like having a cleanroom for all of your
development processes which contains services (like databases) without needing
to setup and maintain these environments manually.

## Installation

```
npm install devlab -g
```

**Note: DevLab requires Node v.0.12+ to run.** 

*Obvious Note: You need to have [Docker](https://www.docker.com/) installed as well.*

## Quickstart / Demo

For a hands-on crash course in utilizing DevLab, follow the steps below:

1. Install Devlab: `npm install devlab -g`
2. Clone the demo: `git@github.com:TechnologyAdvice/DevLab-Demo.git`
3. Move into demo: `cd DevLab-Demo`
4. Use DevLab to install dependencies: `lab install`
5. Run tests: `lab test`

For more information please see [this blog post](http://blog.fluidbyte.net/containerize-your-local-dev-in-minutes-with-devlab/) about getting started with DevLab.

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

The above will spin up the `node:0.10` container, link to `mongo:3.0`, expose the environment variables needed, and run `npm run test`, which would look something like this:

![DevLab_Demo](http://zippy.gfycat.com/TheseDefinitiveGarpike.gif)

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

To quickly override a port you can use the `-p` flag, for instance, if the following is set in the config:

```yaml
expose:
  - 8888:9999
```

The `8888` exposed to the host could be overridden to instead expose to `3333` on the host with:

```
lab {some_task} -p 3333
```

**Note: this currently only works with the first exposed port config*

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

##### Running Multiple Tasks

You can specify multiple tasks to be run in one master task via the following:

```yaml
  install: npm install
  test: npm test
  build: npm run build
  all: .install .test .build
```

In the above example, `lab all` would run the `install`, `test` and `build` tasks.

**Note:** The task names are prefixed with `.` and on a single line. Dot-prefixed variables DO NOT work in multi-line commands.

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

DevLab is licensed under the MIT license. Please see `LICENSE.txt` for full details.

## Credits

DevLab was designed and created at [TechnologyAdvice](http://www.technologyadvice.com).
