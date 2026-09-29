// Seeds a realistic lab notebook for every experiment using the app's own
// measure() functions, with deterministic instrument noise.
export async function seedNotebook(page) {
  return page.evaluate(async () => {
    // Deterministic noise so every screenshot shows the same notebook.
    let seed = 20260929
    Math.random = () => {
      seed = (seed + 0x6d2b79f5) | 0
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    const reg = await import('/src/experiments/registry.ts')
    const rnd = await import('/src/utils/random.ts')
    const son = await import('/src/physics/waves/sonometer.ts')
    const sm = await import('/src/experiments/sonometer/model.ts')
    const def = (m) => Object.fromEntries(m.parameters.map((d) => [d.key, d.default]))
    const resL = (f) => Math.round(son.resonantLength(Number(f), sm.tensionOf(3), sm.muOf('medium')) * 1000) / 10
    const plans = {
      pendulum: { sweeps: [0.4, 0.7, 1.0, 1.3, 1.6, 1.9].map((length) => ({ length })), bench: { length: 1.2, amplitude: 12 } },
      projectile: { sweeps: [10, 15, 20, 25, 30, 35].map((v0) => ({ v0, angle: 40 })), bench: { v0: 22, angle: 40 } },
      'ohms-law': { sweeps: [1, 3, 5, 7, 9, 11].map((supply) => ({ supply })), bench: { supply: 7.5 } },
      faraday: { sweeps: [[200, 0.5], [200, 1], [200, 1.5], [400, 1], [400, 1.5], [400, 2]].map(([turns, velocity]) => ({ turns, velocity })), bench: { velocity: 0.6, turns: 400 } },
      'double-slit': { sweeps: [[0.8, 0.5], [1.2, 0.5], [1.6, 0.5], [2.0, 0.5], [1.5, 0.3]].map(([distance, separation]) => ({ distance, separation })), bench: { wavelength: 589, separation: 0.4, distance: 1.2 } },
      photoelectric: { sweeps: [254, 313, 365, 405, 436].map((wavelength) => ({ wavelength })), bench: { wavelength: 365, voltage: 0.4, intensity: 80 } },
      'newtons-rings': { sweeps: [2, 4, 6, 8, 10, 12, 14, 16].map((ring) => ({ ring })), bench: { ring: 6 } },
      'diffraction-grating': { sweeps: [1, 2, 3].map((order) => ({ order })), bench: { order: 2 } },
      'malus-law': { sweeps: [0, 15, 30, 45, 60, 75, 90].map((angle) => ({ angle })), bench: { angle: 35 } },
      sonometer: { sweeps: sm.FORKS.slice(0, 6).map((fork) => ({ fork, length: resL(fork) })), bench: { fork: '320', length: resL('320') } },
      'rc-circuit': { sweeps: [0, 5, 10, 15, 20, 30, 40, 50].map((time) => ({ time })), bench: { time: 20 } },
      'planck-led': { sweeps: ['infrared', 'red', 'amber', 'green', 'blue', 'violet'].map((led) => ({ led })), bench: { led: 'green', voltage: 2.62 } },
      'band-gap': { sweeps: [25, 35, 45, 55, 65, 75, 85, 95].map((temperature) => ({ temperature })), bench: { temperature: 70 } },
      'hall-effect': { sweeps: [[2, 0.3], [4, 0.3], [6, 0.5], [8, 0.5], [10, 0.8], [5, 1.0]].map(([current, field]) => ({ current, field })), bench: { current: 8, field: 0.8 } },
      'fermi-energy': { sweeps: [30, 40, 50, 60, 70, 80, 90].map((temperature) => ({ temperature })), bench: { temperature: 60 } },
      'laser-wavelength': { sweeps: [[1, 0.5], [2, 0.5], [3, 0.5], [1, 1.0], [2, 1.0]].map(([order, distance]) => ({ order, distance })), bench: { order: 2, distance: 0.8 } },
      'optical-fiber': { sweeps: [10, 25, 40, 55, 70, 85, 100].map((distance) => ({ distance })), bench: { distance: 45 } },
      'four-probe': { sweeps: [30, 50, 70, 90, 110, 130, 150].map((temperature) => ({ temperature })), bench: { temperature: 110 } },
      'lcr-resonance': { sweeps: [200, 400, 550, 600, 650, 700, 720, 750, 800, 850, 900, 1100, 1500, 2000].map((frequency) => ({ frequency })), bench: { frequency: 650 } },
      'black-box': { sweeps: [50, 100, 200, 500, 1000, 2000].map((frequency) => ({ frequency, box: 'A' })), bench: { box: 'A', frequency: 200 } },
      photodiode: { sweeps: [0, 100, 200, 300, 400, 500].map((power) => ({ power })), bench: { power: 300 } },
      'dielectric-constant': { sweeps: [0, 5, 10, 15, 20, 30, 40].map((time) => ({ time })), bench: { time: 12 } },
    }
    const experiments = {}
    const now = Date.now()
    for (const [id, plan] of Object.entries(plans)) {
      const m = reg.getExperiment(id)
      const rows = plan.sweeps
        .map((s, i) => {
          const r = m.observation.measure({ ...def(m), ...s }, { noise: true, gauss: rnd.gauss })
          return r.ok ? { id: rnd.uid(), createdAt: new Date(now - (60 - i) * 60000).toISOString(), values: r.row } : null
        })
        .filter(Boolean)
      experiments[id] = {
        rows,
        params: { ...def(m), ...plan.bench },
        theoryViewed: true,
        analysisViewed: true,
        reportViewed: ['pendulum', 'photoelectric', 'faraday'].includes(id),
        vivaAttempts: ['pendulum', 'photoelectric', 'faraday', 'double-slit', 'planck-led'].includes(id)
          ? [{ score: 6, total: 8, answers: [1, 2, 1, 0, 1, 2, 1, 1], order: [0, 1, 2, 3, 4, 5, 6, 7], completedAt: new Date(now - 3600000).toISOString() }]
          : [],
        timeSpentMs: 900000 + rows.length * 60000,
      }
    }
    localStorage.setItem('physilab:v1', JSON.stringify({ version: 1, studentName: 'Prathiksha D', noise: true, lastExperimentId: 'lcr-resonance', experiments }))
    localStorage.setItem('physilab:theme', 'light')
  })
}
