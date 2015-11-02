1.4.1 / 2015-10-30
==================

  * Adding instance stamp to name/alias
  * Add missing comma
  * Adding 'files' entry to package
  * Cleanup nodeignore and add prepublish script
  * Gitignoring build

1.4.0 / 2015-10-30
==================

  * 1.4.0
  * Merge pull request [#9](https://github.com/TechnologyAdvice/DevLab/issues/9) from TechnologyAdvice/naming
    Naming
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

1.2.8 / 2015-10-25
==================

  * 1.2.8
  * Pre-1.2.8 build
  * Ignore stop and rm services if NO_RM set

1.2.7 / 2015-10-24
==================

  * 1.2.7
  * Minor edit
  * Pre-1.2.7 build
  * Moving quickstart docs to above usage documentation
  * Adding Quickstart docs to README
  * Fixes NO_RM flag to stop but (only) not remove

1.2.6 / 2015-10-24
==================

  * 1.2.6
  * Block stopServices if NO_RM set

1.2.5 / 2015-10-24
==================

  * 1.2.5
  * Adds DEVLAB_NO_RM env var support

1.2.4 / 2015-10-24
==================

  * 1.2.4
  * Build for 1.2.4
  * Merge pull request [#8](https://github.com/TechnologyAdvice/DevLab/issues/8) from TechnologyAdvice/docker_1.6_compat
    Core: Add alias for all link arguments
  * Core: Add alias for all link arguments

1.2.3 / 2015-10-19
==================

  * 1.2.3
  * Better parsing of dot when not matched to task

1.2.2 / 2015-10-19
==================

  * 1.2.2
  * Better handling of alias matching

1.2.1 / 2015-10-19
==================

  * 1.2.1
  * Check for undefined task

1.2.0 / 2015-10-19
==================

  * 1.2.0
  * Merge pull request [#7](https://github.com/TechnologyAdvice/DevLab/issues/7) from TechnologyAdvice/multi-task
    Multi task
  * Adding barrage of tests + fixtures for task setup
  * Adding some tests + fictures for command parser, builder
  * Cleanup, adding docs
  * Adding note to docs on alias, multi-task
  * Fix extra semi-colon
  * Adds support for multi-task steps
  * Mergin up
  * Adding demo gif to README

1.1.1 / 2015-10-13
==================

  * 1.1.1
  * Stop services (even) on proc fail, misc cleanup

1.1.0 / 2015-10-13
==================

  * 1.1.0
  * Updates install docs for publish
  * Fixing service persistance issue
  * Licensing, cleanup, etc
  * Changing to devlab, lab

0.0.1 / 2015-10-12
==================

  * Fix some minor issues, cleanup
  * Remove laminar.yml
  * Working on dind
  * Misc cleanup, testing
  * Fix header in docs
  * Adds support for 'quiet' runs
  * Push new build of config
  * Fix issue with identification of task
  * Consistent output for service names
  * Merge
  * Exit code-130 (CTRL+C in proc) to 0 (master proc)
  * Manually re-adding contents of README. WTF GitHub?
  * committing again cuz something funky happened
  * Adds support for before-task and after-task scripts
  * Adding 'lam' bin cmd, misc doc, up-version
  * Add note on multi-line tasks
  * Making naming in core file more generic
  * Changing config doc sections to use linkable headers
  * Adds support for mapping volumes
  * Adds support for interactive mode flag '-i', documentation
  * Adds 'set -e' to all tasks to bail on non-zero's
  * Adding custom exec docs
  * Adds ability to execute custom task
  * Adds support for multi-line tasks
  * Updating docs
  * Adding components to make module global, local-install task
  * Adds support for persist boolean on service config
  * Removing exec, not sure how to get this working ATM
  * Adds support for passing env vars and exposing ports on services
  * Fixes 'Starting services NAMEs' output
  * Finish parsers lib, update services tests
  * Separating parsers for reuse
  * Making services setup more manageable
  * WIP: using object for service config
  * Cleanup and formatting
  * All tests passing, build running
  * Supress output during testing, run build
  * More testing and lint cleanup
  * WIP: testing core laminar, working out logging, misc
  * Config lib cleaned up and tested
  * Fixing issue with tasks definitions, misc ref's
  * Modifying config for better testability
  * Adding run test to services
  * Adds tests for 'startSvc' method
