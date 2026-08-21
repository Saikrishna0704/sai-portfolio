# Interactive Celestial Portfolio

## 1. Product Vision

Build a premium, interactive portfolio where a person's work is represented as a coherent celestial system.

The space theme is functional, not decorative: celestial objects are used only when their astronomical relationship meaningfully represents the content.

The experience should be:

- cinematic, not game-like
- memorable, not confusing
- animated, not distracting
- technically impressive, but still fast and usable
- exploratory, while preserving conventional navigation

> The universe is the information architecture.

## 2. User Experience Goals

A visitor should be able to:

1. understand who the person is within seconds
2. recognize their major areas of work
3. explore projects within those areas
4. discover useful relationships between projects, skills, and experience
5. switch to a conventional Quick View at any time
6. access Resume, Contact, and important external links without depending on the 3D scene

The immersive experience must enhance access to information, never block it.

## 3. Semantic Celestial Model

| Celestial element | Meaning | Why it fits |
|---|---|---|
| **Star** | Person / identity | The center and source of the system |
| **Planets** | Major work domains | Large, substantial, self-contained areas |
| **Moons** | Projects | Belong to and orbit a larger domain |
| **Constellation** | Experience / education journey | Separate milestones form a connected path |
| **Nebula** | Skills / knowledge | Underlying ecosystem from which work emerges |
| **Rings** | Supporting technologies / methods | Closely surround and support a domain |

Rules:

- Do not create bodies merely to fill space.
- Do not randomly map real Solar System planets to portfolio sections.
- The actual domains must come from the person's real content.
- Keep the number of major planets small enough to understand quickly.
- If size, brightness, or distance encodes meaning, use that meaning consistently.

### Optional Metaphors

These are not MVP requirements:

- **Comets** — rare achievements, launches, talks, recognition, or major milestones
- **Asteroids** — smaller prototypes, experiments, or archived work
- **Satellites / spacecraft** — project-specific repositories, demos, or external resources
- **Black hole** — unusually deep technical case studies

Only use an optional metaphor when real content clearly justifies it.

## 4. Interaction Model

Keep primary navigation simple:

**Overview → Domain → Project**

### Overview

Show the central identity, major domain planets, minimal labels, restrained orbit guides, and conventional navigation.

### Domain Focus

When a domain is selected:

- move the camera smoothly toward it
- reduce emphasis on unrelated bodies
- make its projects prominent
- reveal contextual HTML content

### Project Focus

When a project is selected:

- make project information the primary readable content
- reveal related technologies and links
- provide obvious paths back to the domain or overview

Avoid unnecessary navigation states.

## 5. Motion Principles

Motion should communicate life, hierarchy, focus, or navigation.

### Ambient

Use restrained effects such as:

- very slow orbit
- gentle body rotation
- subtle starfield drift
- soft atmospheric glow

### Interaction

Possible responses:

- selected orbit brightens
- focused body gains emphasis
- unrelated objects dim slightly
- labels become clearer
- related objects highlight together

### Camera

Camera travel should be smooth, brief, preserve spatial orientation, and always have an obvious return path.

Avoid motion purely for spectacle.

## 6. Relationship Visualization

A later-stage differentiator is showing meaningful relationships.

Selecting a technology may highlight relevant projects, domains, and experience. Selecting a project may highlight its parent domain, technologies, related experience, and resources.

Relationships must come from structured data.

Do not implement this before core navigation and real content are stable.

## 7. Quick View

The immersive experience must have a conventional HTML alternative.

Quick View may include:

- About
- Experience
- Projects
- Skills
- Resume
- Contact

Only include sections that exist in the supplied content.

Quick View is a first-class part of the product, not a fallback added at the end.

## 8. Visual Direction

Target:

**scientific + cinematic + sophisticated**

Avoid:

- generic purple-neon developer styling
- arcade or game HUDs
- excessive particles
- constant effects
- random astronomical objects
- hard-to-read text embedded in 3D surfaces
- decorative complexity without information value

Prefer:

- deep neutral space tones
- restrained highlights
- subtle atmospheric glow
- strong typography
- clean HTML overlays
- thin orbit/relationship lines
- realistic or stylized-realistic celestial materials
- clear visual hierarchy

## 9. Accessibility and Content

Use 3D for:

- celestial bodies
- spatial storytelling
- camera movement
- visual relationships
- ambient effects

Use normal HTML/DOM for:

- meaningful text
- navigation
- project descriptions
- buttons and links
- Resume / Contact
- Quick View

Critical information must never exist only in hover interactions.

Respect `prefers-reduced-motion`.

The portfolio must remain understandable and navigable on smaller or lower-powered devices and when motion is reduced.

## 10. Technical Direction

Preferred base stack when starting from scratch:

- Next.js
- React
- TypeScript
- Three.js
- React Three Fiber
- Drei

For 3D animation, prefer the React Three Fiber render loop with straightforward interpolation/damping.

For DOM transitions, use CSS or an animation dependency already present in the project.

Do not add multiple animation frameworks without a demonstrated need.

> 3D for storytelling; HTML for information.

## 11. Data Architecture

The scene must be driven by structured portfolio data rather than project-specific hard-coded 3D components.

Conceptually:

```text
Person
└── Domains
    ├── Projects
    │   ├── Technologies
    │   └── External resources
    └── Related skills

Experience
└── Related projects / technologies
```

Semantic relationships belong in data. Coordinates, scale, material, and orbit parameters are presentation configuration.

Do not use 3D position as the only source of meaning.

## 12. Performance and Mobile

Prefer simple geometry, appropriately sized textures, restrained particles, limited post-processing, limited dynamic shadows, lazy loading for heavy assets, and reduced visual complexity on lower-powered devices.

Do not optimize prematurely; measure before major performance changes.

Mobile priorities:

1. readable content
2. reliable navigation
3. touch-friendly selection
4. good performance
5. visual continuity with desktop

Mobile may show fewer bodies, simpler effects, shorter camera movement, and more prominent conventional navigation.

## 13. Implementation Phases

Complete one phase before moving to the next.

### Phase 0 — Foundation

Build the application shell, TypeScript setup, base layout/theme, basic navigation, and empty 3D scene.

**Done when:** the app runs cleanly, validation passes, and representative desktop/mobile shells render correctly.

### Phase 1 — Static Universe

Build the starfield/background, central star, domain planets, project moons, and optional orbit guides. Do not add orbital animation yet.

**Done when:** scale, spacing, hierarchy, labels, and representative layouts are sound.

### Phase 2 — Data-Driven Scene

Move domain/project definitions into structured data.

**Done when:** adding a domain or project does not require duplicating scene logic, and semantic relationships are not encoded only in coordinates.

### Phase 3 — Ambient Motion

Add slow orbit, body rotation, and subtle environmental motion.

**Done when:** motion is stable, has no visible jumping/drift, and reduced-motion behavior is defined.

### Phase 4 — Hover / Selection

Add reliable hover, focus, selection, labels, pointer behavior, and touch equivalents.

**Done when:** every selectable object can be targeted reliably and interaction does not fight camera controls.

### Phase 5 — Camera Navigation

Implement **Overview → Domain → Project** and reliable return paths.

**Done when:** transitions are smooth, repeated interaction cannot corrupt state, and visible UI matches navigation state.

### Phase 6 — Real Content

Integrate the person's actual identity, domains, projects, experience, links, Resume, and Contact actions.

**Done when:** primary placeholders are gone, mappings are justified by real content, and Quick View exposes all critical information.

### Phase 7 — Relationships

Add useful data-driven connections between projects, technologies, domains, and experience.

**Done when:** highlighting is correct and improves understanding without clutter.

### Phase 8 — Optional Celestial Features

Only if justified by real content, consider constellation, nebula, rings, comets, asteroids, satellites, or a deep-dive metaphor.

### Phase 9 — Mobile / Accessibility

Finish touch behavior, responsive scene decisions, keyboard-accessible conventional UI, reduced-motion behavior, and necessary fallbacks.

### Phase 10 — Performance

Measure and optimize actual bottlenecks such as re-renders, frame-loop work, draw calls, geometry, textures, shadows, post-processing, particles, or mobile GPU load.

### Phase 11 — Final Polish

After functionality is stable, refine lighting, materials, transition timing, spacing, micro-interactions, and visual consistency.

Avoid major architectural changes solely for polish.

## 14. Definition of Success

The celestial structure itself should help a visitor understand:

- who the person is
- their major areas of work
- which projects belong to each area
- how work connects to skills and experience
- what deserves the most attention

The objective is not to build the most complicated 3D portfolio possible.

The objective is to build the clearest and most memorable visual model of a person's professional identity.
