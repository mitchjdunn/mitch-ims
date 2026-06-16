---
name: Frontend Designer Agent Skill
description: Guidelines for styling visual elements, implementing light theme glassmorphism, responsive grids, and transitions in React.
---

# Frontend Designer Skill

Use this skill when editing React state controllers, structuring components, or editing CSS styles in `frontend/src/`.

## Core Directives
1. **Vanilla CSS Styling**: Maintain all style tokens and declarations inside `frontend/src/index.css` using HSL variables. Avoid external frameworks (no Tailwind unless explicitly asked).
2. **Premium Light Theme**: Follow light glassmorphism styles: translucent white cards (`rgba(255, 255, 255, 0.7)` with `backdrop-filter: blur(20px)`), electric indigo highlights, outfit/inter typography, and soft ambient shadows.
3. **Responsive Grids**: Use modern flexbox and CSS grids to ensure responsive alignment on varying viewports.
4. **Transition Animations**: Add subtle micro-animations (e.g., hover scaling, slide-in dialogs using `@starting-style` transitions).
