# Local review

Branch: `redesign/inside-the-request`

The existing public portfolio repository is `tarunkishore2303/tarunkishore2303.github.io`. The separate private `portfolio` repository was inspected only to disambiguate the older source. This rebuild uses the public site's source repository.

## What to review

1. The opening visual direction: paper, technical plate, oversized typography, and a request visitors can trace.
2. Try a normal request. Then enable **Broker offline**, trace again, and restore the broker. The same pending request continues.
3. Experience and outcomes match the supplied resume, including the April 2026 promotion to SDE II.
4. Conductor is explicitly tied to the resume's Project Loom. ForgeRelay adds a separate developer-tooling project.
5. The supplied resume is downloadable unchanged. Its contact details are present in the PDF; the page uses the verified email and GitHub profile.
6. Review desktop and phone layouts, navigation, project links, and contact links.
7. Use the moon/sun button to switch themes, then reload. Use the adjacent motion button to pause the floating geometry and traces. Both controls remain available on phones and tablets.
8. On a mouse device, move over the request plate or project artwork to see the perspective tilt. On touch screens the static 3D composition stays intact without depending on hover.

## Publication

Nothing has been pushed or deployed. The existing website and Pages configuration remain unchanged. The original branch's home calculator must be retained when a deployment is eventually prepared. Publication requires the owner's explicit approval of this result.

## Verification scope

Verified locally on November 8, 2026: production build passed; all twelve Playwright tests passed; automated WCAG A/AA scans reported zero violations in both themes at desktop and mobile widths. Both themes passed overflow checks at 280, 320, 360, 390, 480, 620, 768, 820, 1024, 1280, 1440, 1920, and 2560 pixels, including landscape dimensions. The downloadable PDF's SHA-256 hash matches the original supplied resume. Desktop/mobile theme screenshots and the 3D project illustrations were inspected. Theme/motion persistence, unavailable storage, reduced motion, pointer tilt, and tablet navigation were also verified.

Build and browser verification are run locally on Windows with Microsoft Edge. Automated accessibility checks complement manual screenshot review; they do not establish conformance in every browser or assistive technology. Real email delivery and external GitHub browsing are outside the local interaction tests.
