# FDL Tools — Claude Rules

## Project overview
A suite of standalone tools for managing an iRacing league. Each tool is independent but shares a common visual theme.

## Tech stack
- Vanilla JS only — no frameworks, no build tools, no npm
- Plain HTML, CSS, JS files that open directly in a browser
- No TypeScript, no bundlers, no external libraries unless explicitly approved

## Structure
```
fdl-tools/
├── theme.css          — shared base styles, imported by every tool
├── assets/
│   └── logos/         — shared images/logos referenced as ../../assets/logos/file.png
├── src/
│   └── <tool-name>/
│       ├── index.html — links to ../../theme.css then ./style.css
│       ├── index.js
│       └── style.css  — tool-specific overrides only
```

## CSS rules
- `theme.css` owns: CSS variables, typography, colors, buttons, form elements, layout primitives
- `style.css` in each tool only overrides or extends — never redefines base variables
- Use CSS custom properties (variables) for all colors and spacing, defined in `:root` in `theme.css`
- Dark theme by default

## JS rules
- No classes unless state genuinely requires it — prefer plain functions and data objects
- No global variables — wrap each tool in an IIFE or use ES modules if the browser supports it
- DOM manipulation only via `querySelector` / `querySelectorAll` — no jQuery
- Data lives in plain JS objects/arrays; persist with `localStorage` where needed
- Keep each tool's JS self-contained in its own `index.js`

## HTML rules
- Semantic HTML elements (`<main>`, `<section>`, `<nav>`, `<table>`, etc.)
- Always link `theme.css` before `style.css`
- Scripts at bottom of `<body>`, no `defer` needed for simple tools

## Naming conventions
- Tool folders: kebab-case (e.g. `penalty-log`, `standings`)
- CSS classes: BEM-lite — block__element--modifier
- JS variables/functions: camelCase

## What NOT to do
- Do not add a framework or library without being asked
- Do not create a build step or package.json
- Do not split logic across multiple JS files unless the tool is genuinely complex
- Do not add comments explaining what code does — only add comments for non-obvious WHY
