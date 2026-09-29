/** The university lab syllabus this project follows, in the order of the lab manual. */
export const SYLLABUS = {
  code: '1BPHS102C',
  title: 'Quantum Physics and Quantum Computing — List of Experiments',
  ids: [
    'planck-led',
    'fermi-energy',
    'laser-wavelength',
    'optical-fiber',
    'four-probe',
    'lcr-resonance',
    'black-box',
    'photodiode',
    'dielectric-constant',
    'band-gap',
  ],
}

export const inSyllabus = (id: string) => SYLLABUS.ids.includes(id)
