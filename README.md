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
│   ├── simulation/    Parameter panel, canvas drawing helpers, hero pendulum wave
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

## Roadmap

- **Phase 2** — Supabase: authentication → student profile → experiment attempts → lab notebook → viva scores → progress.
- **More experiments** — 24 planned across all six areas (Newton's rings, diffraction grating, LCR resonance,
  Hall effect, band gap, Planck's constant with LEDs, …), listed in `src/data/categories.ts`.
