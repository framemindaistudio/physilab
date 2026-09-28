import type { ExperimentModule } from '@/types/experiment'
import { pendulum } from './pendulum'
import { projectile } from './projectile'
import { ohmsLaw } from './ohms-law'
import { faraday } from './faraday'
import { doubleSlit } from './double-slit'
import { photoelectric } from './photoelectric'

/**
 * Every experiment in the lab. To add experiment 07:
 *   1. put its physics in src/physics/<area>/
 *   2. create src/experiments/<id>/ exporting an ExperimentModule
 *   3. add it to this array.
 * Routing, catalogue, notebook, analysis, viva, report and progress pick it up automatically.
 */
export const EXPERIMENTS: ExperimentModule[] = [pendulum, projectile, ohmsLaw, faraday, doubleSlit, photoelectric]

export function getExperiment(id: string | undefined): ExperimentModule | undefined {
  return EXPERIMENTS.find((e) => e.id === id)
}
