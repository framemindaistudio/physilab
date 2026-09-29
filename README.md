# PHYSILAB

**Design and Development of an Interactive Virtual Physics Laboratory for Engineering Education**

*Physics. Simulated. Understood.*

PHYSILAB is a virtual laboratory in which a student can perform Engineering Physics experiments end to end:
set real experimental parameters on live apparatus, take readings with realistic instrument error, plot a
least-squares graph, calculate the result with its uncertainty, take a viva, and generate a lab report.

## Experiments (Phase 1)

| # | Experiment | Area | What the student determines | Physics model |
|---|---|---|---|---|
| 01 | Simple Pendulum | Mechanics | g from the slope of T² vs L | Non-linear θ̈ = −(g/L) sin θ, RK4; readings timed from zero crossings |
| 02 | Projectile Motion | Mechanics | g from R vs v₀² sin 2θ | RK4 trajectory with optional quadratic drag; landing interpolated |
| 03 | Ohm's Law | Electricity | R from the I–V slope; resistor vs lamp vs diode | Loop equation solved by bisection; heating filament; Shockley diode |
| 04 | Faraday's Law | Electromagnetism | (dΦ/dz)max from ε_peak vs N·v; Φmax from ∫ε dt | Exact dipole flux through a coaxial loop, ε = −N v dΦ/dz |
| 05 | Young's Double Slit | Optics | λ from β vs D/d | Fraunhofer cos² × sinc² intensity; dark fringes located numerically |
| 06 | Photoelectric Effect | Modern Physics | h and φ from V₀ vs ν | Einstein equation; retarding-field photocurrent; V₀ found by stepping the anode voltage |

## The rule: nothing is faked

For every experiment the animation, the readings, the graph and the result all call the **same physics
functions** in `src/physics`. The pendulum is not animated and then given a textbook period — its equation of
motion is integrated and a reading is taken by counting swings, exactly as with a stopwatch. Each experiment
documents its equations, assumptions and numerical method on its *Aim & theory* page
("How this simulation is built").

Every experiment is specified as a chain: **formula → variables → units → physical constraints → simulation model → expected result.**

## Every experiment runs the same way

```
Aim & theory → Lab bench → Analysis → Viva → Report
(objective, theory,   (apparatus, parameters,   (graph, calculations,   (8 questions      (printable record,
 variables, model)     measurements)             result, conclusion)     + explanations)   save as PDF)
```

## Pages

Dashboard · Experiments · Virtual Lab (free-play bench) · Theory (searchable formula sheet) ·
My Lab Notebook (all readings, CSV export) · Viva · Progress · About

## Rule-based assistants (no API key, run in the browser)

- **Lab Assistant** — on the Lab bench and Analysis pages. Explicit rules check the student's readings and
  settings: it suggests the next reading (the value farthest from existing ones, with a one-click *Set* button),
  flags outliers (externally studentised residual above 3.5–4), a poor straight line (R² < 0.98), a non-zero intercept where
  theory predicts none, a large % error with likely causes, and experiment-specific issues (pendulum amplitude
  > 10°, light below the photoelectric threshold, missing the diode knee, …). Rules live in
  `src/assistant/labAssistant.ts` and each experiment's `assistant.ts`.
- **Ask PHYSILAB** — a chat helper (bottom-right). It answers from a knowledge base built automatically from
  every experiment's theory, procedure, precautions, model notes and viva explanations, plus a glossary and app
  help, using BM25 keyword ranking with stemming and synonyms. Calculators work out quick values with the same
  physics code (pendulum period / g, projectile range, fringe width, photon energy and stopping potential,
  Ohm's law). While a viva is in progress it won't show viva answers or run the calculators. See `src/assistant/`.
- **Adaptive viva** — questions answered wrongly last time come first, then new ones, then the rest; a wrong
  answer links to the theory section to revise.

## Page guides

Press **Page guide** in the sidebar (or **?** on a phone) for a short spotlight tour of the current page. Guides
never open on their own. Tours live in `src/guide/tours.ts`; a step points at an element marked
`data-guide="…"`, and steps whose element is not on screen are left out automatically.

## Tech stack

- React 19 + TypeScript + Vite
- Tailwind CSS 4 (design tokens in `src/index.css`, light "graph paper" and dark "darkroom" themes)
- HTML Canvas and SVG for apparatus
- Recharts for graphs, KaTeX for formulae, Lucide icons
- Numerics (RK4, bisection, least squares with standard errors) in plain TypeScript
- Storage: browser `localStorage` (Phase 1). The store shape mirrors the planned Supabase tables.

## Project structure

```
src/
├── components/
│   ├── ui/            Button, Formula (KaTeX), meters, tags
│   ├── layout/        App shell, navigation, theme switch
│   ├── simulation/    Parameter panel, canvas drawing helpers, home-page photoelectric demo
│   ├── experiment/    LabBench, ObservationTable, AnalysisView, VivaQuiz, LabReport, TheoryView
│   └── charts/        FitChart (least-squares graph)
├── experiments/
│   ├── pendulum/  projectile/  ohms-law/  faraday/  double-slit/  photoelectric/
│   ├── registry.ts    ← the list of experiments
│   └── shared.ts
├── physics/
│   ├── mechanics/  optics/  electromagnetism/  modern/
│   ├── constants.ts   CODATA values
│   └── numerics.ts    RK4, AGM, bisection
├── assistant/       Lab Assistant rules, Ask PHYSILAB search + calculators, adaptive viva
├── guide/           Page guides: tours per section and the spotlight overlay
├── pages/  store/  hooks/  data/  utils/  types/
```

## Adding experiment 07

1. Put the physics in `src/physics/<area>/<name>.ts` as pure functions.
2. Create `src/experiments/<id>/` with an `Apparatus.tsx` (canvas or SVG) and an `index.ts` exporting an
   `ExperimentModule` (see `src/types/experiment.ts`): content, parameters, readouts, `measure`, `analyze`, viva.
3. Add it to `EXPERIMENTS` in `src/experiments/registry.ts`.

Routing, the catalogue, notebook, analysis, viva, report, dashboard and progress pick it up automatically.

## Run locally

```bash
npm install
npm run dev
```

Production build: `npm run build` (output in `dist/`).

## Deploy on Vercel

Import the repository in Vercel. The framework preset is detected as **Vite**; build command `npm run build`,
output directory `dist`. `vercel.json` rewrites all routes to `index.html` so deep links such as
`/experiments/faraday/lab` work. No environment variables are needed.

## Credits

Made by: **Prathiksha D** (1st year Engineering Student)

## Roadmap

- **Phase 2** — Supabase: authentication → student profile → experiment attempts → lab notebook → viva scores → progress.
- **More experiments** — 24 planned across all six areas (Newton's rings, diffraction grating, LCR resonance,
  Hall effect, band gap, Planck's constant with LEDs, …), listed in `src/data/categories.ts`.
