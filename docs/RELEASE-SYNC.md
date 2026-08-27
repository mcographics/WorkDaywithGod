# Release-to-website synchronization

The Majestic Creations portfolio reads the current Work Day with God Windows, Linux, and Android releases from the GitHub Releases API during its Pages build. The generated metadata is stored at `app/projects/work-day-with-god/releases.json` in the portfolio repository.

For immediate updates after a release is published, configure a fine-grained GitHub token as the `PORTFOLIO_REPO_DISPATCH_TOKEN` Actions secret in this repository. The token needs Actions access to dispatch events to `mcographics/mcographics.github.io` (and no access to application source code is required). The `Notify portfolio of Work Day with God release` workflow then requests a sync; the portfolio sync workflow commits changed metadata, which automatically starts the Pages deployment.

The portfolio also runs the release sync as part of its scheduled Pages build, providing a fallback if the dispatch secret is missing or a notification is delayed.
