import type { ExperimentModule } from '@/types/experiment'
import { pendulum } from './pendulum'
import { projectile } from './projectile'
import { ohmsLaw } from './ohms-law'
import { faraday } from './faraday'
import { doubleSlit } from './double-slit'
import { photoelectric } from './photoelectric'
import { newtonsRings } from './newtons-rings'
import { diffractionGrating } from './diffraction-grating'
import { malusLaw } from './malus-law'
import { sonometer } from './sonometer'
import { rcCircuit } from './rc-circuit'
import { planckLed } from './planck-led'
import { bandGap } from './band-gap'
import { hallEffect } from './hall-effect'
import { fermiEnergy } from './fermi-energy'
import { laserWavelength } from './laser-wavelength'
import { opticalFiber } from './optical-fiber'
import { fourProbe } from './four-probe'
import { lcrResonance } from './lcr-resonance'
import { blackBox } from './black-box'
import { photodiode } from './photodiode'
import { dielectricConstant } from './dielectric-constant'

/**
 * Every experiment in the lab. To add another:
 *   1. put its physics in src/physics/<area>/
 *   2. create src/experiments/<id>/ exporting an ExperimentModule
 *   3. add it to this array.
 * Routing, catalogue, notebook, analysis, viva, report, assistant and progress pick it up automatically.
 */
export const EXPERIMENTS: ExperimentModule[] = [
  pendulum,
  projectile,
  ohmsLaw,
  faraday,
  doubleSlit,
  photoelectric,
  newtonsRings,
  diffractionGrating,
  malusLaw,
  sonometer,
  rcCircuit,
  planckLed,
  bandGap,
  hallEffect,
  fermiEnergy,
  laserWavelength,
  opticalFiber,
  fourProbe,
  lcrResonance,
  blackBox,
  photodiode,
  dielectricConstant,
]

export function getExperiment(id: string | undefined): ExperimentModule | undefined {
  return EXPERIMENTS.find((e) => e.id === id)
}
