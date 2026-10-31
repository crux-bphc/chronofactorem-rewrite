# Contributing Guide

## Issues

- Title your issues in a way that describes your problem in one line. e.g. "Editing a user's degrees does not update the degrees on owned timetables", or "NotFoundError on attempting to edit timetable"
- Add a description if needed. In general, we recommend being descriptive with your issue, so we can get started on fixing it quicker.

## Pull Requests

- All pull requests from cruX members should be from this same repo. i.e., You should clone this repo first, make a branch, push changes, and then make a PR
- **Branches:** branches should be named in imperative, present tense with a clear object. e.g. `fix-auth-type-error`, `revert-type-changes`, or `refactor-timetable-structure`
  - All commits in a branch should be **strictly related to the branch name**. Any commits that aren't, must be reverted, or rebased to drop those changes.
- **Commits:** commits should follow the [conventional commits format](https://www.conventionalcommits.org/en/v1.0.0/). Your commits need not follow this spec to a tee, but we expect a [minimum level of compliance](https://www.conventionalcommits.org/en/v1.0.0/#commit-message-with-description-and-breaking-change-footer).
  - You can use [this extension](https://marketplace.visualstudio.com/items?itemName=vivaxy.vscode-conventional-commits) to help you follow this convention.
  - **Every commit must do one thing.** If you are adding something to dependencies, then create a `build:` commit for just that. If you are using this dependency later to fix one error in multiple files, make one `fix:` commit for all the combined changes. A good way of deciding how big a commit should be, is to think about whether you can revert this change without breaking future changes. You should aim for a commit format like that.
    - Note: Obviously, if you add a dependency and then use it later in some fix or feature, the `build:` commit for the dependency being added will cause errors if reverted. But, since adding the fix or feature in the same commit will break the "one thing" rule, the closest you can get to being able to revert the `build:` commit is this format, where the dependency change and the fix/feature are separate commits.
  - Commits that do not follow this convention and format will be asked to be reverted, or rebased to fit the format.
- **Pull Requests:** pull requests should **never** be from `master` or `main`. All pull requests should be from an appropriately named branch, and should be named with a name similar to the human readable form of the branch name. e.g. A PR from a branch `fix-auth-type-error` will be named "Fix TypeError in AuthController".
  - **If the PR has an associated Issue created for it, mention it, else describe it in the PR description.** The description **must** accurately, and exhaustively describe the nature of the changes you have made, and if possible describe the Issue it aimed to fix.
  - **All pull requests must be reviewed.** All means all. Doesn't matter if you are the leader of the third reich, or if you're the only person in the club. Every single PR must be reviewed until the latest changes.

## Screenshots (beta)

A bunch of important pages are defined in `synthetics/synthetics.ts`, against the `starter-pack` seed scenario (`backend/src/seed/scenarios/starter-pack.json`). CI screenshots them on a phone, a tablet and a laptop, in both light and dark mode. Every merge to master makes those screenshots the baseline. Once a PR has the `ready` label, every push gets compared against it, and a bot comment on the PR shows each screen that changed, before, after, and a diff with the changed pixels in red. The comment is edited in place, so there's always just one.

- The bot never commits to your branch, so there's nothing to pull.
- The images live under `refs/synthetics/images` in this repo, not on a branch, so they don't bloat clones. Nothing there is ever deleted, so old reports keep working.
- To add a screen, add an entry to `synthetics/synthetics.ts`, and add any data it needs to the `starter-pack` scenario.
- To take them locally, run `pnpm -C synthetics start` with a Postgres reachable through `DB_HOST`/`PGPORT`/`POSTGRES_USER`/`POSTGRES_PASSWORD`. They end up in in `synthetics/screenshots/`, which is gitignored.

Since this can be a bit flaky and runs in CI we want to be a bit careful with this, it should be considered unstable for now and PR reviewers should verify the screenshots properly.
