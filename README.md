# Tarun Kishore - Behind the response

A backend engineering portfolio rebuilt from the existing GitHub Pages source. React, Vite, self-hosted Manrope and IBM Plex Mono, and original animated ASCII diagrams. Black/red by default, with a white/red alternate. No external analytics, font CDN, or runtime API dependencies.

## Local development

Requires Node.js 22.12+ (or a later supported Node release).

```sh
npm ci
npm run dev -- --port 4173
```

Open the printed local URL. `npm run build` generates the static site in `dist/`; `npm run preview` serves that output locally.

## Verification

```sh
npm run build
npm test
git diff --check
```

The twelve browser tests use locally installed Microsoft Edge via Playwright. They serve the production build on port 4174 and cover Conductor request tracing, broker outage and recovery, interrupting an active trace, resume delivery, theme and motion preferences, unavailable local storage, ASCII frame advancement and suspension, mobile/tablet navigation, overflow from 280px to 2560px in both themes, keyboard navigation, and automated WCAG A/AA checks. Screenshots are saved in ignored `qa/screenshots/`.

## Theme and motion

The header's moon/sun button switches between black/red and white/red themes. New visits default to black/red; an explicit choice persists in local storage. Reduced motion and the motion toggle pause the ASCII animation clocks, which also stop offscreen or when the tab is hidden.

The hero restores the Conductor request-flow demonstration: trace validation, transactional state and event intent, broker delivery, scheduling, and persisted results. Take the broker offline to see the event intent retained; restore it to continue the same request. This is an explanatory model, not a live backend. Project illustrations remain character-based ASCII animations.

## Content

- Employment, selected outcomes, education, certifications, and email follow `Tarun_Kishore_SDE2_ATS_Resume_Updated.pdf`, supplied by the owner. Its unchanged copy is available at `public/Tarun_Kishore_Resume.pdf`.
- Conductor and ForgeRelay descriptions follow their public READMEs, checked through the owner's authenticated `gh` CLI.
- Project Loom is the resume's named project and is linked explicitly as Conductor's predecessor. The newer project is presented as its evolution.
- The hero is a simplified explanatory model of Conductor, not live backend traffic.
- Metrics are attributed to work at Rocket India and the owner's resume; they are not presented as portfolio traffic or personal-project benchmarks.
- No LinkedIn URL was embedded in the supplied PDF, so no profile link was guessed.

## Design references and review

The visual direction combines black, signal red, monospace character art, and explanatory diagrams. The layout retains grid and explanation principles researched through [IBM technical diagrams](https://www.ibm.com/design/language/infographics/technical-diagrams/design/), [IBM grid](https://www.ibm.com/design/language/2x-grid/), and [Bartosz Ciechanowski's interactive explainers](https://ciechanow.ski/mechanical-watch/). All ASCII artwork is original; reference artwork was not copied.

The initial passes established the layout and durable request model, then improved text sizes, contrast, and recovery behavior. Subsequent review added theme/motion controls and broader responsive coverage. The current owner-directed revision replaces the depth effects with animated ASCII scenes and a black/red palette. See `REVIEW.md` for the handoff.

## Publication

The owner authorized publication on November 8, 2026, and subsequently requested restoring the Conductor demo. Source is retained on `redesign/inside-the-request`; GitHub Pages serves the built output from `gh-pages`.

Deployment retains the original `/home-calculator/` route from `feature/3bhk-home-calculator` unchanged. The calculator source branch remains intact. Rebuild and verify before updating `gh-pages`; source files alone are not the production site.
