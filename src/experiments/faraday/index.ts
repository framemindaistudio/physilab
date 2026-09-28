import { lazy } from 'react'
import type { ExperimentModule } from '@/types/experiment'
import { axialField, maxFlux, maxFluxGradient, PASS_HALF_LENGTH, simulatePass } from '@/physics/electromagnetism/faraday'
import { linearFit, mean, percentError } from '@/utils/stats'
import { fixed, sig } from '@/utils/format'
import { num, p, withNoise } from '../shared'
import { viva } from './viva'

export const faraday: ExperimentModule = {
  id: 'faraday',
  number: '04',
  title: "Faraday's Law of Induction",
  category: 'electromagnetism',
  tagline: 'Push a magnet through a coil and measure the EMF it induces.',
  summary:
    'Drop a bar magnet through a coil at different speeds and turn counts. Show that the peak EMF is proportional to N·v and recover the flux gradient of the magnet.',
  difficulty: 'Intermediate',
  durationMin: 30,

  aim: 'To study electromagnetic induction and verify Faraday’s law, ε = −N dΦ/dt, by measuring the EMF induced in a coil by a moving magnet.',
  objectives: [
    'Observe the induced EMF as a magnet approaches, passes through and leaves a coil.',
    'Show that the peak EMF is directly proportional to the number of turns N and to the magnet’s speed v.',
    'Determine the maximum flux gradient (dΦ/dz)max from the slope of ε_peak against N·v.',
    'Use Lenz’s law to predict the direction of the induced current, and measure the flux linkage from ∫ε dt.',
  ],
  apparatusList: [
    'Bar magnet on a low-friction track (adjustable speed)',
    'Search coil, 50–1000 turns, radius 1–5 cm',
    'Centre-zero galvanometer / data-logging voltmeter',
    'Speed gate',
  ],
  theory: [
    {
      heading: 'Magnetic flux',
      body: [
        'The magnetic flux through a surface measures how much magnetic field passes through it. For a coil of N turns the relevant quantity is the flux linkage NΦ.',
        'A bar magnet far from the coil behaves as a magnetic dipole of moment m. For a dipole on the axis of a circular loop of radius a, at axial distance z, the flux through the loop can be calculated exactly.',
      ],
      formulas: [
        { tex: '\\Phi = \\int \\vec B\\cdot d\\vec A', caption: 'Magnetic flux (Wb = T m²)' },
        { tex: '\\Phi(z) = \\frac{\\mu_0\\, m\\, a^2}{2\\,(a^2+z^2)^{3/2}}', caption: 'Flux of a dipole through a coaxial loop' },
      ],
    },
    {
      heading: 'Faraday’s and Lenz’s laws',
      body: [
        'Whenever the flux linked with a coil changes, an EMF is induced equal to the rate of change of flux linkage. The minus sign (Lenz’s law) says the induced current flows so as to oppose the change that produced it: an approaching north pole makes the near face of the coil a north pole, repelling it.',
        'For a magnet moving at constant speed v, dΦ/dt = (dΦ/dz)(dz/dt) = v·dΦ/dz. So the EMF is proportional to N, to v, and to the flux gradient — which peaks at z = ±a/2 on either side of the coil.',
      ],
      formulas: [
        { tex: '\\varepsilon = -N\\,\\frac{d\\Phi}{dt}', caption: 'Faraday’s law' },
        { tex: '\\varepsilon = -N\\,v\\,\\frac{d\\Phi}{dz} = \\frac{3\\mu_0\\, m\\, a^2\\, N v\\, z}{2\\,(a^2+z^2)^{5/2}}', caption: 'EMF for a dipole moving along the axis' },
        { tex: '\\varepsilon_{\\text{peak}} = N v \\left(\\frac{d\\Phi}{dz}\\right)_{\\max}, \\quad \\left(\\frac{d\\Phi}{dz}\\right)_{\\max} = \\frac{3\\mu_0 m}{4\\,(5/4)^{5/2}\\, a^2}', caption: 'Peak EMF — the quantity measured' },
      ],
    },
    {
      heading: 'Flux linkage from the EMF pulse',
      body: [
        'Integrating the EMF over time gives the total change in flux linkage. As the magnet travels from far away to the centre of the coil, the linkage changes from ≈ 0 to NΦ_max, so the area of the first EMF lobe equals NΦ_max. The two lobes have equal area and opposite sign, so over a complete pass ∫ε dt = 0.',
      ],
      formulas: [{ tex: '\\int \\varepsilon\\, dt = -N\\,\\Delta\\Phi, \\qquad \\Phi_{\\max} = \\frac{\\mu_0 m}{2a}', caption: 'Area under one lobe' }],
    },
  ],
  variables: [
    { symbol: 'N', name: 'Number of turns', unit: '—', role: 'independent' },
    { symbol: 'v', name: 'Speed of magnet', unit: 'm s⁻¹', role: 'independent' },
    { symbol: '\\varepsilon_{\\text{peak}}', name: 'Peak induced EMF', unit: 'mV', role: 'dependent' },
    { symbol: 'm', name: 'Magnetic dipole moment', unit: 'A m²', role: 'controlled' },
    { symbol: 'a', name: 'Coil radius', unit: 'cm', role: 'controlled' },
  ],
  procedure: [
    'Keep the magnet strength and coil radius fixed throughout.',
    'Set N = 200 turns and v = 0.5 m/s. Press Start to watch the pass: note the two opposite EMF pulses and the current direction.',
    'Press “Record pass” to log the peak EMF and the area of the first pulse.',
    'Change v (0.5 → 3 m/s) and N (100 → 800) between passes. Take at least six readings with different values of N·v.',
    'In Analysis, plot ε_peak against N·v. The straight line verifies Faraday’s law and its slope is (dΦ/dz)max.',
    'Reverse the magnet (south pole leading) and confirm that the EMF reverses sign.',
  ],
  precautions: [
    'Move the magnet along the axis of the coil at a steady speed.',
    'Keep other magnets and steel objects away from the coil.',
    'Use a centre-zero galvanometer so both directions of current can be seen.',
  ],
  model: {
    equations: [
      { tex: '\\Phi(z) = \\frac{\\mu_0 m a^2}{2(a^2+z^2)^{3/2}}', caption: 'Exact flux for a point dipole on the axis' },
      { tex: 'z(t) = -0.25\\,\\mathrm{m} + v t', caption: 'Constant-speed pass through the coil' },
    ],
    assumptions: [
      'Magnet treated as a point dipole at its centre; coil turns are coplanar (thin coil).',
      'Galvanometer draws negligible current, so there is no back-EMF braking the magnet.',
      'Instrument error (when enabled): 1% gain uncertainty and ±0.05 mV noise on the logger.',
    ],
    method:
      'Each pass is sampled at 4000 points. The EMF at every sample is −N·v·dΦ/dz from the same flux function the animation draws. A reading takes the largest |ε| from the sampled pulse and integrates the first lobe numerically (trapezium rule).',
  },

  parameters: [
    { kind: 'range', key: 'moment', label: 'Magnet strength m', unit: 'A m²', min: 0.5, max: 5, step: 0.1, default: 2, hint: 'Dipole moment of the bar magnet.' },
    { kind: 'range', key: 'turns', label: 'Coil turns N', unit: '', min: 50, max: 1000, step: 50, default: 200 },
    { kind: 'range', key: 'radius', label: 'Coil radius a', unit: 'cm', min: 1, max: 5, step: 0.5, default: 3 },
    { kind: 'range', key: 'velocity', label: 'Magnet speed v', unit: 'm/s', min: 0.2, max: 5, step: 0.1, default: 1 },
    {
      kind: 'select',
      key: 'pole',
      label: 'Leading pole',
      default: 'north',
      options: [
        { value: 'north', label: 'North pole enters first' },
        { value: 'south', label: 'South pole enters first' },
      ],
    },
  ],
  Apparatus: lazy(() => import('./Apparatus')),
  readouts: (prm) => {
    const m = p(prm, 'moment')
    const a = p(prm, 'radius') / 100
    const N = p(prm, 'turns')
    const v = p(prm, 'velocity')
    return [
      { label: 'Coil area πa²', value: fixed(Math.PI * a * a * 1e4, 2), unit: 'cm²', tone: 'theory' },
      { label: 'Peak flux Φmax', value: fixed(maxFlux(m, a) * 1e6, 2), unit: 'µWb', tone: 'theory' },
      { label: 'Expected peak EMF', value: fixed(N * v * maxFluxGradient(m, a) * 1000, 1), unit: 'mV', tone: 'theory' },
      { label: 'B at 5 cm from magnet', value: fixed(axialField(0.05, m) * 1000, 2), unit: 'mT', tone: 'theory' },
    ]
  },

  observation: {
    columns: [
      { key: 'N', label: 'N', unit: 'turns', decimals: 0 },
      { key: 'v', label: 'v', unit: 'm/s', decimals: 1 },
      { key: 'Nv', label: 'N·v', unit: 'm/s', decimals: 0 },
      { key: 'epeak', label: 'ε peak', unit: 'mV', decimals: 1 },
      { key: 'linkage', label: '∫ε dt (1st pulse)', unit: 'mWb', decimals: 3 },
    ],
    measureLabel: 'Record pass',
    hint: 'Vary N and v. Keep the magnet strength, coil radius and leading pole the same for one graph.',
    minTrials: 6,
    controlKeys: ['moment', 'radius', 'pole'],
    measure: (prm, ctx) => {
      const m = p(prm, 'moment')
      const a = p(prm, 'radius') / 100
      const N = p(prm, 'turns')
      const v = p(prm, 'velocity')
      const pol = prm.pole === 'south' ? -1 : 1
      const pass = simulatePass(v, N, m, a, pol, 4000)
      let peak = 0
      for (const e of pass.emf) if (Math.abs(e) > Math.abs(peak)) peak = e
      // Area of the first lobe: integrate while the magnet approaches (z < 0).
      let area = 0
      for (let i = 1; i < pass.t.length && pass.z[i] <= 0; i++) {
        area += 0.5 * (pass.emf[i] + pass.emf[i - 1]) * (pass.t[i] - pass.t[i - 1])
      }
      const gain = ctx.noise ? 1 + 0.01 * ctx.gauss() : 1
      const epeak = withNoise(Math.abs(peak) * 1000 * gain, 0.05, ctx.noise, ctx.gauss)
      const linkage = Math.abs(area) * 1000 * gain
      return {
        ok: true,
        row: { N, v, Nv: N * v, epeak, linkage, moment: m, radius: p(prm, 'radius'), pole: String(prm.pole) },
      }
    },
  },

  analyze: (rows) => {
    const points = rows.map((r) => ({ x: num(r, 'Nv'), y: num(r, 'epeak') }))
    const fit = linearFit(points)
    if (!fit) return null
    const last = rows[rows.length - 1]
    const m = num(last, 'moment')
    const a = num(last, 'radius') / 100
    const gradExp = fit.slope // mV per (turn·m/s) = mWb/m
    const gradErr = fit.slopeSE
    const gradTh = maxFluxGradient(m, a) * 1000
    const phiExp = mean(rows.map((r) => num(r, 'linkage') / num(r, 'N'))) * 1000 // µWb
    const phiEnd = (maxFlux(m, a) - maxFlux(m, a) * Math.pow(a / Math.hypot(a, PASS_HALF_LENGTH), 3)) * 1e6
    const err = percentError(gradExp, gradTh)
    return {
      x: { label: 'N·v', unit: 'turn m s⁻¹' },
      y: { label: 'Peak EMF ε', unit: 'mV' },
      points,
      fit,
      results: [
        { label: 'Maximum flux gradient (slope)', symbol: '(d\\Phi/dz)_{\\max}', value: gradExp, uncertainty: gradErr, unit: 'mWb m⁻¹', accepted: gradTh, acceptedLabel: 'Dipole theory', decimals: 4 },
        { label: 'Peak flux through one turn, from ∫ε dt ÷ N', symbol: '\\Phi_{\\max}', value: phiExp, unit: 'µWb', accepted: phiEnd, acceptedLabel: 'Dipole theory', decimals: 2 },
      ],
      calculations: [
        { label: 'Slope of ε_peak vs N·v', tex: `\\text{slope} = \\frac{\\Delta\\varepsilon_{\\text{peak}}}{\\Delta(Nv)} = ${sig(gradExp, 4)}\\ \\mathrm{mV\\,/\\,(m\\,s^{-1})} = ${sig(gradExp, 4)}\\ \\mathrm{mWb\\,m^{-1}}` },
        { label: 'Theoretical flux gradient', tex: `\\frac{3\\mu_0 m}{4(1.25)^{2.5}a^2} = \\frac{3(4\\pi\\times10^{-7})(${m})}{4(1.747)(${fixed(a, 3)})^2} = ${sig(gradTh, 4)}\\ \\mathrm{mWb\\,m^{-1}}` },
        { label: 'Flux linkage per turn', tex: `\\Phi_{\\max} = \\frac{1}{N}\\int_{\\text{1st pulse}}\\!\\varepsilon\\,dt = ${fixed(phiExp, 2)}\\ \\mu\\mathrm{Wb}` },
        { label: 'Linearity', tex: `R^2 = ${fixed(fit.r2, 5)}, \\quad c = ${fixed(fit.intercept, 2)}\\ \\mathrm{mV}` },
        { label: 'Percentage difference (gradient)', tex: `${fixed(err, 2)}\\%` },
      ],
      warnings: [],
      conclusion: `The peak induced EMF is directly proportional to N·v (R² = ${fixed(fit.r2, 4)}), verifying that ε = −N dΦ/dt depends on both the number of turns and the rate of change of flux. The slope gives (dΦ/dz)max = ${sig(gradExp, 3)} mWb m⁻¹, ${fixed(err, 1)}% from the dipole prediction of ${sig(gradTh, 3)} mWb m⁻¹. The area of one EMF pulse gives Φmax = ${fixed(phiExp, 1)} µWb.`,
    }
  },
  viva,
}
