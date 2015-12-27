1.7.1 / 2015-12-27
==================

  * Merge pull request [#20](https://github.com/TechnologyAdvice/DevLab/issues/20) from TechnologyAdvice/chalk
    Chalk
  * Switching to chalk for output, cleanup

1.7.0 / 2015-12-16
==================

  * 1.7.0
  * Adds ability to link services
  * No more semicolons!

1.6.0 / 2015-12-16
==================

  * 1.6.0
  * Adds ability to exec scripts on services
  * Adding badges
  * Add caching to circle config
  * Trying to get circle to install deps...
  * Merge pull request [#19](https://github.com/TechnologyAdvice/DevLab/issues/19) from jordandenison/tests
    Tests
  * Fix: No longer set DEVLAB_NO_RM env var in circle.yml and make default arguments test robuster
  * Fix: No longer crash tests when failing to remove docker mongotest container in services spec
  * Fix: Set DEVLAB_NO_RM=true in circle.yml
  * Fix: Pull latest mongo image in circle.yml
  * Core: Add test project deps to repo
  * Fix: Add commonjs support to all libs to support Babel 6
  * Core: Remove setup from tests and stub process.exit in config spec
  * Core: Update to babel 6
  * Core: Add test case for service run rejecting in index.spec.js and remove instanbul test coverage
  * Core: Implement unit tests for index.js
  * Core: Add proxyquire to test setup
  * Core: Add istanbul to package.json and gitignore
  * Merge pull request [#18](https://github.com/TechnologyAdvice/DevLab/issues/18) from jordandenison/refactor
    Refactor
  * Fixed: Restore required brackets in config.js
  * Refactor: services.spec.js
  * Refactor: process.spec.js
  * Refactor: parsers.spec.js
  * Refactor: output.spec.js
  * Refactor: forwarders.spec.js
  * Refactor: config.spec.js
  * Refactor: index.spec.js
  * Refactor: project/test/index.spec.js
  * Refactor: project/src/index.js
  * Refactor: services.js
  * Refactor: process.js
  * Refactor: parsers.js
  * Refactor: output.js
  * Refactor: forwarders.js
  * Refactor: config.js
  * Refactor: index.js
  * Add: .eslintrc for tests
  * Fix link to tutorial blog post

1.5.3 / 2015-11-30
==================

  * Fix lint error, gratuitous parens
  * Gitignore c9
  * Merge branch 'master' of github.com:TechnologyAdvice/DevLab
  * Merge pull request [#17](https://github.com/TechnologyAdvice/DevLab/issues/17) from TechnologyAdvice/hosts
    Core: Add host map feature
  * Core: Add host map feature

1.5.2 / 2015-11-17
==================

  * 1.5.2
  * Merge pull request [#16](https://github.com/TechnologyAdvice/DevLab/issues/16) from TechnologyAdvice/service-naming
    Service naming
  * Misc cleanup
  * Merge branch 'master' into service-naming
  * Merge in master
  * Do not use unique instance on persisted service names
  * Changelog - 1.5.1

1.5.1 / 2015-11-03
==================

  * 1.5.1
  * Adding lodash dep
  * Changelog - 1.5.0

1.5.0 / 2015-11-03
==================

  * 1.5.0
  * Merge pull request [#11](https://github.com/TechnologyAdvice/DevLab/issues/11) from TechnologyAdvice/portforward
    Portforward
  * Removes 'only' to allow full test run
  * Updating readme in response to issue [#13](https://github.com/TechnologyAdvice/DevLab/issues/13)
  * Forwarders: Add UDP forwarding
  * Forwarders: Add tests
  * Merge pull request [#12](https://github.com/TechnologyAdvice/DevLab/issues/12) from TechnologyAdvice/changelog
    Adds changelog task and generated changelog
  * Adds changelog task and generated changelog
  * Forwarders: Return Promises for start methods
  * Forwarding: Handle it internally
  * Merge branch 'master' into sshtunnel
  * README: Add port forwarding docs
  * Tunnels: Add appropriate user output
  * Tunnels: Make parser test less fragile
  * Tunnels: Add env var config tests
  * Test: Add tests for tunnel public API
  * Tunnels: Add test for forwarded port parser

1.4.1 / 2015-10-30
==================

  * 1.4.1
  * Adding instance stamp to name/alias
  * Tunnels: Add JSDoc
  * Tunnels: Make forwarding the default
  * Tunnels: Remove unused imports
  * Add missing comma
  * Merging latest package.json and rm build dir
  * Adding 'files' entry to package
  * Fixing merge conflicts with latest master
  * Cleanup nodeignore and add prepublish script
  * Gitignoring build

1.4.0 / 2015-10-30
==================

  * 1.4.0
  * Merge pull request [#9](https://github.com/TechnologyAdvice/DevLab/issues/9) from TechnologyAdvice/naming
    Naming
  * Tunnels: Working prototype
  * Merge branch 'master' into sshtunnel
  * Remove unused getManifest
  * Names services with devlab_{service}_{username} convention and supplies alias
  * Names container with devlab_{directory}_{username} convention

1.3.0 / 2015-10-28
==================

  * 1.3.0
  * Adds support for overriding host exposed port

1.2.10 / 2015-10-26
===================

  * 1.2.10
  * Rename old service container on NO_RM

1.2.9 / 2015-10-26
==================

  * 1.2.9
  * Stop but do not remove services on NO_RM
