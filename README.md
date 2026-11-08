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

The twelve browser tests use locally installed Microsoft Edge via Playwright. They serve the production build on port 4174 and cover request tracing, broker outage and recovery, interrupting an active trace, resume delivery, theme and motion preferences, unavailable local storage, ASCII frame advancement and suspension, mobile/tablet navigation, overflow from 280px to 2560px in both themes, keyboard navigation, and automated WCAG A/AA checks. Screenshots are saved in ignored `qa/screenshots/`.

## Theme and motion

The header's moon/sun button switches between black/red and white/red themes. New visits default to black/red; an explicit choice persists in local storage. A small head script sets the initial appearance before React loads. Controls continue working for the current visit if storage is blocked.

The motion button pauses/resumes presentation effects. Device reduced-motion preferences start with motion paused; resuming is unavailable while the device requests reduced motion, with an accessible explanation on the control. CSS also honors that setting. Three character-based illustrations update at eight frames per second: a request-routing fabric, a branching workflow, and a draft/verify/apply pipeline. Animation clocks stop when paused, offscreen, or the tab is hidden. The diagrams retain a static frame under reduced motion; request-state changes still work. ASCII is actual text in 44-column preformatted blocks, hidden from screen readers, with a descriptive label and textual state explanations for the interactive model. There is no 3D effect or WebGL dependency.

## Content

- Employment, selected outcomes, education, certifications, and email follow `Tarun_Kishore_SDE2_ATS_Resume_Updated.pdf`, supplied by the owner. Its unchanged copy is available at `public/Tarun_Kishore_Resume.pdf`.
- Conductor and ForgeRelay descriptions follow their public READMEs, checked through the owner's authenticated `gh` CLI.
- Project Loom is the resume's named project and is linked explicitly as Conductor's predecessor. The newer project is presented as its evolution.
- The request diagram is a simplified interactive explanation of Conductor, not a running backend or production telemetry. It pauses at an unavailable broker and resumes the same pending request when the broker is restored.
- Metrics are attributed to work at Rocket India and the owner's resume; they are not presented as portfolio traffic or personal-project benchmarks.
- No LinkedIn URL was embedded in the supplied PDF, so no profile link was guessed.

## Design references and review

The visual direction combines black, signal red, monospace character art, and explanatory diagrams. The layout retains grid and explanation principles researched through [IBM technical diagrams](https://www.ibm.com/design/language/infographics/technical-diagrams/design/), [IBM grid](https://www.ibm.com/design/language/2x-grid/), and [Bartosz Ciechanowski's interactive explainers](https://ciechanow.ski/mechanical-watch/). All ASCII artwork is original; reference artwork was not copied.

The initial passes established the layout and durable request model, then improved text sizes, contrast, and recovery behavior. Subsequent review added theme/motion controls and broader responsive coverage. The current owner-directed revision replaces the depth effects with animated ASCII scenes and a black/red palette. See `REVIEW.md` for the handoff.

## Publication gate

**Local review only until the owner explicitly approves publication.** No deployment script or automatic deployment workflow is included. This branch has not been pushed.

At inspection, GitHub Pages was configured for `feature/3bhk-home-calculator`, repository root. Preserve the calculator route when eventually publishing; it is on a different branch and has not been modified. Publishing the new portfolio requires a deliberate deployment configuration change after approval. Never assume that pushing source to `main` will publish this build.
