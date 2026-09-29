/** Photocurrent of the detector with polariser and analyser aligned, for a given lamp setting. */
export const sourceIntensity = (lampPct: number) => 0.8 * lampPct // µA at 100% = 80 µA

/** Stray unpolarised light reaching the detector (µA). */
export const MALUS_BACKGROUND = 0.4
