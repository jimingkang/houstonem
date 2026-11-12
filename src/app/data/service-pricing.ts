export const SERVICE_CATEGORIES = [
  'Imaging & elemental analysis',
  'Chemical identification',
  'Failure & contamination',
  'Metallurgy & testing',
  'Sample preparation',
] as const;

type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
interface ServicePricing {
  category: ServiceCategory;
  /** Proposed USD starting rate; null means included when applicable. */
  startingUsd: number | null;
  unit: 'sample' | 'project';
  sample: string;
  deliverable: string;
}

export const SERVICE_PRICING: Readonly<Record<string, ServicePricing>> = {
  sem: { category: 'Imaging & elemental analysis', startingUsd: 175, unit: 'sample', sample: 'A representative solid or mounted specimen; confirm dimensions and vacuum suitability.', deliverable: 'Annotated SEM images of agreed areas.' },
  eds: { category: 'Imaging & elemental analysis', startingUsd: 250, unit: 'sample', sample: 'A solid or mounted specimen with identified areas of interest.', deliverable: 'SEM images, EDS spectra and an elemental summary for selected locations.' },
  'elemental-mapping': { category: 'Imaging & elemental analysis', startingUsd: 325, unit: 'sample', sample: 'A suitable specimen with a defined area and target elements, if known.', deliverable: 'SEM image, color elemental maps and a description of the mapped area.' },
  'micro-ftir': { category: 'Chemical identification', startingUsd: 225, unit: 'sample', sample: 'A representative polymer, film, residue or organic particle. Confirm handling before shipping.', deliverable: 'Infrared spectrum and an interpretation of likely material or chemical groups.' },
  'combined-characterization': { category: 'Chemical identification', startingUsd: 475, unit: 'sample', sample: 'A representative sample with enough material for both techniques; confirm suitability with the lab.', deliverable: 'SEM/EDS and micro FT-IR findings with a combined interpretation.' },
  xrd: { category: 'Chemical identification', startingUsd: 285, unit: 'sample', sample: 'A representative crystalline solid, powder or deposit; confirm preparation requirements.', deliverable: 'Diffraction pattern and identification of supported crystalline phases.' },
  'failure-analysis': { category: 'Failure & contamination', startingUsd: 750, unit: 'project', sample: 'Preserve fracture surfaces and provide service history and photos when available.', deliverable: 'Annotated findings, likely failure mechanism and limitations.' },
  corrosion: { category: 'Failure & contamination', startingUsd: 525, unit: 'project', sample: 'Affected material or corrosion products, plus exposure and operating history.', deliverable: 'Images and analytical findings on corrosion morphology and products.' },
  'particle-analysis': { category: 'Failure & contamination', startingUsd: 350, unit: 'sample', sample: 'Representative particles, powder or a mounted sample; discuss target size and count.', deliverable: 'Images and agreed particle or phase measurements, with elemental data as scoped.' },
  contamination: { category: 'Failure & contamination', startingUsd: 425, unit: 'project', sample: 'Contaminated material and, if available, an uncontaminated comparison sample.', deliverable: 'Images and identification findings for the selected contaminant.' },
  coatings: { category: 'Metallurgy & testing', startingUsd: 425, unit: 'sample', sample: 'A coated specimen; discuss section orientation and measurement locations.', deliverable: 'Coating images and scoped measurements of thickness or layer structure.' },
  'pdc-analysis': { category: 'Metallurgy & testing', startingUsd: 550, unit: 'sample', sample: 'A representative PDC cutter with the relevant region marked.', deliverable: 'Cross-section images and scoped leach-depth or composition measurements.' },
  'core-samples': { category: 'Metallurgy & testing', startingUsd: 450, unit: 'sample', sample: 'A representative core fragment with the target interval or orientation noted.', deliverable: 'Micrographs and observations of texture, mineral features and porosity.' },
  metallography: { category: 'Metallurgy & testing', startingUsd: 325, unit: 'sample', sample: 'A representative metal specimen; specify alloy, orientation and region of interest.', deliverable: 'Prepared section and annotated microstructure images, as scoped.' },
  'microstructural-analysis': { category: 'Metallurgy & testing', startingUsd: 375, unit: 'sample', sample: 'A representative component or section with the features to investigate identified.', deliverable: 'Annotated micrographs and agreed feature measurements.' },
  microhardness: { category: 'Metallurgy & testing', startingUsd: 275, unit: 'sample', sample: 'A suitable polished section; agree test locations, load and number of indents.', deliverable: 'Vickers hardness results for the agreed locations.' },
  'gold-sputtering': { category: 'Sample preparation', startingUsd: null, unit: 'sample', sample: 'A compatible non-conductive specimen requiring conductive coating.', deliverable: 'Optional conductive gold coating as part of suitable SEM work.' },
};

export const MAX_QUOTE_SAMPLES = 100;
export const formatUsd = (amount: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

export function quoteSampleCount(value: unknown): number {
  const count = typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value)) ? Number(value) : 1;
  return Number.isInteger(count) && count >= 1 && count <= MAX_QUOTE_SAMPLES ? count : 1;
}
