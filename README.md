[![CircleCI branch](https://img.shields.io/circleci/project/TechnologyAdvice/DevLab/master.svg?maxAge=2592000)]()
[![Code Climate](https://img.shields.io/codeclimate/github/TechnologyAdvice/DevLab.svg?maxAge=2592000)]()

# DevLab

DevLab is a utility that allows you to easily containerize your development
workflow using Docker. Simply put; it's like having a cleanroom for all of your
development processes which contains services (like databases) without needing
to setup and maintain these environments manually.

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
before: npm install
after: rm -rf /node_modules
task: node index.js
```

The above can then be executed by running the `lab` command from within the same directory as your project and `devlab.yml`. Execution would do the following:

- Pull and start `mongo` with `DB_ROOT_PASSWORD` environment variable and port `27017` exposed
- Set the primary container environment variable `TMP` to the same as the host machine, expose port `8080` and mount the host machine's `.ssh` directory in the container.
- Run `npm install` inside the container before running the tasj
- Run `node index.js` task inside the container
- After execution run `rm -rf /node_modules` to cleanup

### Multiple Tasks

The example shows a single-command execution configuration, however, Devlab supports named tasks as well. Replace the `task` entry with a (plural, object) `tasks`:

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

The above would start the container using the configuration, call the `before` task, then start the `sh` shell. The container will then remain in the shell until an exit command is sent by the user.

### Container Image (`from <string>`)

The `from` configuration object instructs the image to be used on both the primary instance and any services.

For testing different images easily, the `-f <alternate-image>` argument can be called during execution.

## Environment Variables (`env <array>`)

Setting `env` array items will expose environment variables in the primary instance or services. These entries can be raw strings or use `${VAR}` notation, where `VAR` is an environment variable on the host machine to use. Entries should use the format `<ENV_VAR>=<VALUE>`

## Expose (`expose <array>`)

Setting `expose` array items will expose ports to the host machine from the primary or service containers. Entries should use the format `<CONTAINER_PORT>:<HOST_PORT>`

## Volumes (`volumes <array>`)

Setting `volumes` will mount volumes on the host machine to designated paths on the primary or service containers. Entries should use the format `<HOST_PATH>:<CONTAINER_PATH>`

## License

DevLab is licensed under the MIT license. Please see `LICENSE.txt` for full details.

## Credits

DevLab was designed and created at [TechnologyAdvice](http://www.technologyadvice.com).
