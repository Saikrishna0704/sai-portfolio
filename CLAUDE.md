# CLAUDE.md

## Purpose

Implement the **Interactive Celestial Portfolio** defined in `PROJECT.md`.

Read `PROJECT.md` before architectural or visual work.

> Celestial objects are information architecture, not decoration.

Do not invent portfolio content or arbitrary celestial mappings.

## Phase Workflow

Unless the user explicitly asks for multiple phases, implement only the requested phase.

For each phase:

1. inspect the existing implementation
2. preserve working behavior from earlier phases
3. make the smallest coherent change required
4. run the repository's existing validation commands
5. fix regressions caused by the change
6. report what was completed and any unresolved issue
7. stop

Do not begin the next phase automatically.
Do not perform unrelated refactors.

## Source of Truth

Priority:

1. user's latest explicit instruction
2. `PROJECT.md`
3. this file
4. existing repository conventions

Do not silently invent scope, content, or an important unresolved design decision.

## Scope Discipline

Do not:

- build optional celestial features before requested
- add effects merely because they are possible
- add sections for content not supplied
- invent roles, projects, companies, metrics, technologies, awards, or links
- turn every concept into a celestial body
- rewrite unrelated working components
- add overlapping libraries
- optimize without evidence of a problem
- sacrifice usability/accessibility for 3D effects

Prefer the simplest implementation that preserves the intended experience.

## Architecture

Portfolio meaning belongs in structured data.

Render domains, projects, technologies, and relationships from data rather than one-off scene code.

Do not use 3D coordinates as the only source of semantic relationships.

Keep primary navigation explicit:

`overview → domain → project`

Do not infer application state from camera coordinates.

Use React Three Fiber/WebGL for celestial bodies, spatial relationships, 3D motion, camera transitions, and ambient effects.

Use normal HTML/DOM for meaningful text, navigation, project details, buttons, links, Resume/Contact, and Quick View.

Motion must communicate ambient life, hierarchy, focus, or navigation. Respect `prefers-reduced-motion`.

## Technology

Follow the repository's existing package manager and dependency versions.

When starting from the intended base architecture, prefer:

- Next.js
- React
- TypeScript
- Three.js
- `@react-three/fiber`
- `@react-three/drei`

For 3D motion, first prefer the R3F frame loop with straightforward interpolation/damping.

For DOM transitions, prefer CSS or an animation dependency already present.

Do not add GSAP, Motion, physics engines, shader libraries, or post-processing packages unless the current requirement clearly benefits from them.

## React / TypeScript

- keep TypeScript strict
- avoid `any` unless unavoidable and explained
- keep components focused
- separate portfolio data from rendering logic
- avoid premature abstractions
- avoid duplicated scene logic per project
- minimize React state updates and allocations inside the frame loop
- clean up listeners/resources
- preserve appropriate Next.js Server/Client boundaries

## 3D Interaction

- establish static composition before animation
- use a consistent world scale
- keep selectable objects easy to target
- prevent camera controls and selection from competing
- keep labels readable
- test rapid repeated select/back actions
- avoid excessive shadows, particles, and post-processing
- prioritize stable interaction over polish

## Accessibility

Critical information must remain usable without WebGL interaction.

Maintain conventional navigation/Quick View, readable DOM text, keyboard-accessible important actions, touch-friendly controls, and reduced-motion behavior.

Do not hide critical information only behind hover.

## Validation

Before declaring a phase complete:

- run the repository's lint command
- run typecheck if available
- run relevant tests if present
- run a production build when integration may be affected
- check relevant runtime/browser console errors when possible
- verify the changed flow at representative desktop and mobile sizes
- confirm earlier completed behavior still works

Use scripts already defined by the repository and detect its package manager.

Never claim a check passed unless it was actually run. If a check cannot be run, say so.

## Dependencies and Git

Before adding a dependency, check for an existing solution, require a clear purpose, and avoid overlapping packages.

Do not push unless explicitly asked.
Do not rewrite history, destructively reset, or discard user work.
If asked to commit, keep commits phase-specific and exclude unrelated changes.

## Final Rule

Do not make the portfolio more complicated than the content requires.

A feature belongs only if it improves understanding, navigation, hierarchy, storytelling, visual quality, accessibility, or measured performance.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
