# PHYSILAB

**Design and Development of an Interactive Virtual Physics Laboratory for Engineering Education**

*Physics. Simulated. Understood.*

PHYSILAB is a virtual laboratory in which a student can perform Engineering Physics experiments end to end:
set real experimental parameters on live apparatus, take readings with realistic instrument error, plot a
least-squares graph, calculate the result with its uncertainty, take a viva, and generate a lab report.

## Experiments (22)

All ten experiments of the **1BPHS102C** first-year lab syllabus are included (marked ●).

| # | Experiment | Area | What the student determines | Physics model |
|---|---|---|---|---|
| 01 | Simple Pendulum | Mechanics | g from the slope of T² vs L | Non-linear θ̈ = −(g/L) sin θ, RK4; readings timed from zero crossings |
| 02 | Projectile Motion | Mechanics | g from R vs v₀² sin 2θ | RK4 trajectory with optional quadratic drag; landing interpolated |
| 03 | Ohm's Law | Electricity | R from the I–V slope; resistor vs lamp vs diode | Loop equation solved by bisection; heating filament; Shockley diode |
| 04 | Faraday's Law | Electromagnetism | (dΦ/dz)max from ε_peak vs N·v; Φmax from ∫ε dt | Exact dipole flux through a coaxial loop, ε = −N v dΦ/dz |
| 05 | Young's Double Slit | Optics | λ from β vs D/d | Fraunhofer cos² × sinc² intensity; dark fringes located numerically |
| 06 | Photoelectric Effect | Modern Physics | h and φ from V₀ vs ν | Einstein equation; retarding-field photocurrent; V₀ found by stepping the anode voltage |
| 07 | Newton's Rings | Optics | λ from D² vs n | Reflected intensity sin²(πr²/λR) per pixel; rings found as intensity minima |
| 08 | Diffraction Grating | Optics | λ of mercury lines from sin θ vs n | Grating equation; spectrometer readings on both sides with a 1′ least count |
| 09 | Malus' Law | Optics | I₀ from I vs cos²θ | I = I₀ cos²θ plus a stray-light background |
| 10 | Sonometer | Waves & Acoustics | v and μ from L vs 1/f | Driven-oscillator response of the wire (Q = 30); resonance at the response peak |
| 11 | RC Circuit | Electricity | τ and C from ln V vs t | V = V₀ e^(−t/RC) with timing and voltmeter error |
| 12 ● | Planck's Constant using LEDs | Modern Physics | h from V_th vs 1/λ | Smoothed LED I–V; threshold extrapolated from the steep part, as on graph paper |
| 13 ● | Energy Gap of a Semiconductor Diode | Semiconductors | E_g from ln(I_s/T³) vs 1/T | I_s = C T³ e^(−E_g/kT); shows the bias from ignoring T³ |
| 14 | Hall Effect | Semiconductors | R_H, carrier type and n from V_H vs I·B | V_H = IB/(nqt); carriers drift under the same Lorentz force |
| 15 ● | Fermi Energy of a Conductor | Modern Physics | E_F and v_F from R vs T | Free-electron resistivity of a copper coil |
| 16 ● | Wavelength of a Laser | Optics | λ from sin θ vs n | Grating spots on a screen: x_n = D tan(sin⁻¹(nλ/d)) |
| 17 ● | Numerical Aperture of an Optical Fibre | Optics | NA and acceptance angle from W vs L | Spot size from √(n₁² − n₂²) and the core diameter |
| 18 ● | Energy Gap by Four-Probe Method | Semiconductors | E_g from ln ρ vs 1/T | Intrinsic ρ(T) with the G₇ thin-slab correction |
| 19 ● | Series LCR Frequency Response | Electromagnetism | f₀, bandwidth and Q from I vs f | Series impedance; peak and half-power points found from the readings only |
| 20 ● | Passive Components in a Black Box | Electricity | Which of R, L, C, and its value, from Z vs f | Z = R, √(r² + (2πfL)²) or 1/(2πfC); best of three models chosen |
| 21 ● | Photodiode I–V and Responsivity | Semiconductors | ℛ and quantum efficiency from I vs P | Photodiode equation with η(λ) and 2 nA dark current |
| 22 ● | Dielectric Constant by Charging and Discharging | Electromagnetism | κ from ln V vs t | C = κε₀A/d film capacitor through a known resistor |

With simulated instrument error switched on, every experiment's own analysis lands within **2 %** of the accepted
value (median 0.16 %).

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
│   ├── pendulum/  projectile/  …  dielectric-constant/   (one folder per experiment)
│   ├── registry.ts    ← the list of experiments
│   └── shared.ts
├── physics/
│   ├── mechanics/  optics/  electromagnetism/  modern/  waves/  semiconductor/
│   ├── constants.ts   CODATA values
│   └── numerics.ts    RK4, AGM, bisection
├── assistant/       Lab Assistant rules, Ask PHYSILAB search + calculators, adaptive viva
├── guide/           Page guides: tours per section and the spotlight overlay
├── pages/  store/  hooks/  data/  utils/  types/
tools/print/          Posters, slide deck and screenshots (see below)
```

## Adding experiment 23

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

## Posters and slides

`tools/print` builds the print material from the running app (start `npm run dev` first):

```bash
cd tools/print && npm install
node screens.mjs     # screenshots of every page and apparatus → deliverables/screens
node results.mjs     # each experiment's own analysis → deliverables/screens/results.json
node posters.mjs     # two A3 posters → deliverables/*.pdf and *.png
node deck.mjs        # slide deck → deliverables/PHYSILAB-Presentation.pptx (+ PNG preview)
```

It needs Google Chrome installed. `deliverables/` is not committed.

## Credits

Made by: **Prathiksha D** (1st year Engineering Student)

## Roadmap

- **Phase 2** — Supabase: authentication → student profile → experiment attempts → lab notebook → viva scores → progress.
- **More experiments** — 15 more planned across all six areas, listed in `src/data/categories.ts`.
