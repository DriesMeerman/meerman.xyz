---
name: pr-visual-review
description: Prepare visual pull request reviews for meerman.xyz with easy-to-scan before/after screenshot tables and concise explanations, while keeping review artifacts out of Git.
---

# Visual pull request reviews

Use this workflow for visual changes in meerman.xyz when preparing or updating a pull request. For a local-only review, prepare the same comparisons locally and do not create or push a PR.

## Store artifacts outside Git

- Capture images, comparison reports, PR body drafts, and one-off capture scripts under ignored `.cache/pr-reviews/<branch>/` or temporary storage.
- Never stage or commit review artifacts, including under `docs/reviews/`. The small project skill and maintained project documentation can be tracked.
- Check the staged diff before committing. Remove any accidentally staged review artifacts while preserving local copies.
- Do not create a screenshot branch, release, gist, or repository assets solely to host review images. Do not rewrite merged repository history to remove old screenshots.

## Make the comparison clear

- Capture Before from the PR's base revision and After from the final implementation. Use matching routes, viewport dimensions, themes, scroll positions, and loaded fonts/images.
- Include the desktop/mobile and light/dark views needed to assess the change. Keep screenshot-only particle or animation suppression consistent; test actual interactions with animations enabled separately.
- Prefer focused viewport captures for the quick overview. Include full-page captures only when they help review content order or behavior farther down the page.
- Label every view by page, viewport, and theme. Keep filenames recognizable, such as `skills-mobile-dark-before.png` and `skills-mobile-dark-after.png`.
- Prefer GitHub CLI native attachments: `gh pr create --body-file <draft> --attach <before.png> --attach <after.png>`, or `gh pr edit <number> --body-file <draft> --attach <before.png> --attach <after.png>` for an existing PR. Put local Markdown image paths in the draft table; gh replaces them with durable GitHub attachment URLs. Repeat `--attach` for each image, up to 50 per command.
- Check `gh pr edit --help` for `--attach`. If the installed version lacks it, use a current official release, in temporary storage if a global upgrade is unnecessary. Verify its published checksum. Native attachments are documented at https://docs.github.com/en/github-cli/github-cli/attaching-files-with-github-cli.
- If native uploading still fails, preserve ignored local files and the paste-ready table and explain the actual failure. Never substitute screenshot commits or claim an upload succeeded without evidence. Uploads can partially succeed, so inspect the resulting PR before retrying to avoid duplicate attachments.

## Write the PR for quick review

Lead with the concrete problem and resulting behavior. Follow with a short before/after table:

| View | Before | After |
|------|--------|-------|
| Skills / mobile / dark / 390px | Uploaded Before image | Uploaded After image |

Use the returned image URLs in Markdown images or `<img width="360" ...>` cells, with useful alt text. Briefly explain what each comparison demonstrates. Keep the screenshots in the PR description or an authorized PR comment; the PR is the review history, so do not add a tracked screenshot gallery or review README.

Include relevant validation and any actual unresolved failures. Respect requested commit boundaries and branch scope. Write plain, concise copy without em dashes. Preserve existing review content when updating a PR and verify its final image links.
