export interface Micrograph {
  src: string;
  alt: string;
  mag?: string;
  hv?: string;
  det?: string;
  wd?: string;
}

export interface Service {
  slug: string;
  title: string;
  short: string;
  summary: string;
  body: string[];
  highlights: string[];
  image: Micrograph;
}

export interface Tile {
  label: string;
  image: Micrograph;
  link: string;
}

export interface Industry {
  slug: string;
  name: string;
  summary: string;
  applications: string[];
  services: string[];
  image: Micrograph;
}

export const CONTACT = {
  company: 'Houston Electron Microscopy, Inc.',
  phone: '+1 281-888-4261',
  phoneHref: 'tel:+12818884261',
  email: 'LAB@houstonem.com',
  address: '12919 Southwest Fwy, Suite 140',
  city: 'Houston, TX 77477',
  tagline: 'Focus. See. Solve.',
  mapQuery: '12919 Southwest Fwy Suite 140, Stafford, TX 77477',
  social: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/2672423' },
    { label: 'Pinterest', href: 'https://www.pinterest.com/houstonelectron/' },
    { label: 'YouTube', href: 'http://www.youtube.com/channel/UCklTSyHev627QDpdFIQ_DGQ' },
  ],
  team: [
    {
      name: 'Shawn Liu, Ph.D.',
      role: 'Executive Director · Ph.D. Chemistry, MBA',
      phone: '+1 201-655-3864',
      phoneHref: 'tel:+12016553864',
      email: 'shawn.liu@houstonem.com',
    },
    {
      name: 'Dennis Manuel',
      role: 'President · Failure Analysis Engineer',
      phone: '+1 281-704-0188',
      phoneHref: 'tel:+12817040188',
      email: 'dennis@houstonem.com',
    },
  ],
} as const;

/**
 * Every image here is Houston Electron Microscopy's own work: from the HEM Marketing
 * "Website" folder on SharePoint/OneDrive, or from houstonem.com (source noted beside
 * each entry). Instrument data is only filled in where the source states it.
 */
const img = (src: string, alt: string, extra: Partial<Micrograph> = {}): Micrograph => ({
  src: `/images/${src}.jpg`,
  alt,
  ...extra,
});

export const IMAGES = {
  // OneDrive: 00 Pictures/COLOR SEM-EDS at Houston EM.jpg
  hero: img('hero-colorsem', 'ColorSEM image with a real-time EDS element map, taken at Houston Electron Microscopy'),
  // OneDrive: Exotic Materials/938205-C Leading Edge 711-microns 20kX.jpg
  metals: img('metals', 'SEM image of an exotic alloy microstructure at 20 000 x', { mag: '20 000 x' }),
  // OneDrive: 00 Pictures/EXAMPLE PTFE Side 20kX - Copy.jpg
  polymers: img('polymers', 'SEM image of a PTFE surface at 20 000 x', { mag: '20 000 x' }),
  // OneDrive: Liquid & Oils/22-589 Liquid Residue 2000X-1.tif
  liquids: img('liquids-oils', 'ColorSEM image of residue filtered from a liquid sample at 2 000 x', { mag: '2 000 x' }),
  // OneDrive: 00 Pictures/24-331 Ni-Zr Powder-2 650X Zr-Co.tif
  powders: img('powders', 'ColorSEM element map of a nickel-zirconium powder at 650 x', { mag: '650 x' }),
  // houstonem.com/images/coatings/coating-layers.jpg
  coatings: img('coatings', 'SEM cross-section of coating layers with thickness measurements'),
  // OneDrive: 00 Pictures/Sample of clay-like material ... 2000x a.tif
  core: img('core-samples', 'ColorSEM element map of a clay-like mineral sample at 2 000 x', { mag: '2 000 x' }),
  // OneDrive: 00 Pictures/NEW CUT C-5, Origin C-5 -IG-500X.jpg
  failure: img('failure', 'SEM image of an intergranular fracture surface at 500 x', { mag: '500 x' }),
  // houstonem.com/images/gallery2/1.jpg
  corrosion: img('corrosion', 'SEM image of a corroded metal surface'),
  // OneDrive: 00 Pictures/165-23-00125-009 100X (23-367).jpg
  particle: img('particle', 'Particle analysis image with particles color-coded by composition at 100 x', { mag: '100 x' }),
  // OneDrive: 00 Pictures/FTIR photo for google business.jpg
  ftir: img('ftir', 'Micro FT-IR chemical map, sample image and spectrum', { det: 'FT-IR' }),
  // houstonem.com/images/gallery6/4.jpg
  insect: img('insect', "SEM image of a mosquito's compound eyes"),
  // houstonem.com/images/gallery7/4.jpg
  seawater: img('seawater', 'SEM image of Skeletonema costatum diatoms from Galveston sea water'),
  // houstonem.com/images/eggShell/Egg-1000XW.jpg
  eggshell: img('eggshell', 'SEM image of a fractured chicken egg shell', { mag: '1 000 x' }),
  // houstonem.com/images/banner/ColorSEM-Remote-2.jpg (cropped)
  lab: img('lab', 'Thermo Scientific SEM workstation in the Houston Electron Microscopy laboratory'),
};

export const SERVICES: Service[] = [
  {
    slug: 'sem',
    title: 'Scanning Electron Microscopy',
    short: 'SEM',
    summary:
      'High magnification, high-resolution imaging of the sample surface and near-surface — including Low Vacuum mode and three Backscattered Electron imaging modes.',
    body: [
      'The Scanning Electron Microscope (SEM) provides high magnification images at high resolution of the sample surface and near-surface. Our SEM can operate in Low Vacuum mode, and in three different modes of Backscattered Electron imaging.',
      'Particles and features in the nanometer range can be observed and photographed. The SEM has many applications across many industries; our expertise lies in failure analysis, PDC analysis, phase and particle analysis, geological core samples, corrosion, metallurgy, and coatings.',
    ],
    highlights: ['Low Vacuum mode', 'Secondary & backscattered imaging', 'Nanometer-scale features', 'True remote viewing'],
    image: IMAGES.metals,
  },
  {
    slug: 'eds',
    title: 'Micro Chemical Analysis (EDS)',
    short: 'EDS',
    summary:
      'Elemental analysis and chemical characterization with the latest SDD technology — qualitative, quantitative, and real-time element mapping.',
    body: [
      'Our Scanning Electron Microscope is paired with an Energy Dispersive Spectrometer (EDS) with the latest SDD technology. The EDS is used for the elemental analysis or chemical characterization of a sample.',
      'Qualitative and quantitative analysis, as well as identification of unknown samples or inclusions, is possible. Relative concentrations in weight, oxide, or atomic formula percentages can be obtained from the EDS spectra, and results can be reported as elemental spectrums, quantitative tables, or x-ray maps overlaid onto the SEM image.',
    ],
    highlights: ['Elemental spectrums', 'Atomic & weight percent', 'X-ray mapping', 'Unknown inclusion ID'],
    image: IMAGES.particle,
  },
  {
    slug: 'failure-analysis',
    title: 'Failure Analysis',
    short: 'Failure',
    summary:
      'Over 40 years of experience in metallurgy and failure analysis — determining the mechanism that caused a component to fail.',
    body: [
      'Houston Electron Microscopy has over 40 years of experience in metallurgy, failure analysis, and corrosion analysis. Our metallurgist can determine the mechanism that has caused a component to fail through SEM and EDS analysis.',
      'The most common forms of material failure are fracture due to corrosion, wear, and deformation. Our SEM/EDS system allows for the microscopic study of where failures initiate and helps determine the cause of failure — for both metallic and non-metallic components.',
    ],
    highlights: ['Fractography', 'Fatigue & overload', 'Metals and non-metals', 'Root cause reporting'],
    image: IMAGES.failure,
  },
  {
    slug: 'corrosion',
    title: 'Corrosion Analysis',
    short: 'Corrosion',
    summary:
      'Analyze corrosion products in a pit or crevice to determine the corrosion mechanism and prevent future failures.',
    body: [
      'Corrosion is a big problem for many industries. Finding out the cause of corrosion can prevent future failures.',
      'With our SEM/EDS system, we analyze the corrosion products in a pit or crevice and determine the corrosion problem — answering questions such as what caused this material to corrode, which corrosion elements are present, and whether corrosion caused the material to break or fail.',
    ],
    highlights: ['Pitting & crevice', 'Corrosion product chemistry', 'Under-deposit attack', 'Prevention guidance'],
    image: IMAGES.corrosion,
  },
  {
    slug: 'coatings',
    title: 'Coatings Analysis',
    short: 'Coatings',
    summary:
      'Examine coatings of any type to the finest detail — composition, morphology, thickness, porosity, layers, and pinholes.',
    body: [
      'With the Scanning Electron Microscope, coatings of any type can be examined to the finest detail for composition and morphology, thickness, porosity, layers, pinholes, and more.',
      'Thanks to the great depth of field, high magnification, and high resolution possible with SEM/EDS, we help with the study and analysis of coatings on plastics and metals — including oxides and contaminants at the coating/substrate interface.',
    ],
    highlights: ['Layer thickness', 'Porosity & pinholes', 'Interface oxides', 'Plastics and metals'],
    image: IMAGES.coatings,
  },
  {
    slug: 'pdc-analysis',
    title: 'PDC Measurement & Analysis',
    short: 'PDC',
    summary: 'Physical structure and leach depth measurement of PDC cutters, with EDS elemental maps.',
    body: [
      'SEM/EDS is essential for looking at the physical structure of polycrystalline diamond compact (PDC) cutters. Leach depth dimensions can be measured precisely.',
      'With the EDS x-ray system an elemental map can be produced to show the distribution of binder and catalyst elements through the diamond table.',
    ],
    highlights: ['Leach depth', 'Diamond table structure', 'Binder distribution', 'Elemental maps'],
    image: IMAGES.powders,
  },
  {
    slug: 'particle-analysis',
    title: 'Phase & Particle Analysis',
    short: 'Particles',
    summary: 'Identify phases from chemistry and crystalline structure; measure features down to 50 nm.',
    body: [
      'The SEM is widely used to identify phases based on qualitative chemical analysis and/or crystalline structure.',
      'Precise measurement of very small features and objects down to 50 nm in size can also be accomplished, making it ideal for particle sizing, inclusions, and voids analysis.',
    ],
    highlights: ['Phase identification', 'Down to 50 nm', 'Inclusions & voids', 'Particle sizing'],
    image: IMAGES.particle,
  },
  {
    slug: 'contamination',
    title: 'Contaminants Identification',
    short: 'Contaminants',
    summary: 'Identify contaminants in solids and liquids — even debris filtered from oil.',
    body: [
      'Identifying contaminants is one of the many applications for our Scanning Electron Microscope and Energy Dispersive X-ray system.',
      'Contaminants can be identified in solids and liquids, even oil. Liquid samples are filtered, dried, and analyzed for particle identification and chemical composition.',
    ],
    highlights: ['Oil debris', 'Filtered liquids', 'Process contamination', 'Particle chemistry'],
    image: IMAGES.liquids,
  },
  {
    slug: 'core-samples',
    title: 'Geological Core Sample Analysis',
    short: 'Core samples',
    summary: 'Characterize shale textures, organic particles, and microporosity without conductive coating.',
    body: [
      'Our SEM/EDS system can investigate small-scale textural features of shale and characterize organic particles and the distribution of microporosity.',
      'This is done without having to add a conductive coating, which may obscure the fine details of the sample surface.',
    ],
    highlights: ['Shale texture', 'Microporosity', 'Organic particles', 'No coating required'],
    image: IMAGES.core,
  },
  {
    slug: 'metallography',
    title: 'Metallography',
    short: 'Metallography',
    summary: 'Expert sample preparation for metallograph and SEM — the backbone of most failure analyses.',
    body: [
      'Failure analysis is one of our strong suits. Our SEM/EDX and metallograph are usually the only equipment needed for most failure analyses.',
      'Houston Electron Microscopy is knowledgeable in sample preparation — sectioning, mounting, polishing, and etching — for both the metallograph and the SEM.',
    ],
    highlights: ['Sectioning & mounting', 'Polishing & etching', 'Grain structure', 'Weld evaluation'],
    image: IMAGES.metals,
  },
  {
    slug: 'microstructural-analysis',
    title: 'Microstructural Analysis',
    short: 'Microstructure',
    summary: 'Coating thickness, grain size, porosity, and full characterization of multi-component systems.',
    body: [
      'Microstructural analysis determines parameters such as coating thickness, grain size, porosity, and pore structure.',
      'It extends to full characterization of multi-component systems and evaluation of degradation or failure causes.',
    ],
    highlights: ['Grain size', 'Pore structure', 'Multi-component systems', 'Degradation'],
    image: IMAGES.coatings,
  },
  {
    slug: 'microhardness',
    title: 'Microhardness Testing',
    short: 'Microhardness',
    summary: 'Vickers diamond pyramid testing of individual microstructures and hardness gradients.',
    body: [
      'Microhardness testing with a Diamond Pyramid Hardness Tester (Vickers) provides the necessary data by measuring individual microstructures.',
      'It determines the hardness gradient of a specimen along a cross section — useful for case depth, heat treatment, and weld heat-affected zones.',
    ],
    highlights: ['Vickers (DPH)', 'Hardness gradients', 'Case depth', 'Weld HAZ'],
    image: IMAGES.failure,
  },
  {
    slug: 'xrd',
    title: 'X-Ray Diffraction Analysis',
    short: 'XRD',
    summary: 'Identify and characterize crystalline compounds from their diffraction pattern.',
    body: [
      'X-ray diffraction (XRD) gathers information about the structure of crystalline materials.',
      'It enables the identification and characterization of compounds based on their diffraction pattern, complementing elemental results from EDS.',
    ],
    highlights: ['Crystalline phases', 'Compound identification', 'Complements EDS', 'Scale & deposits'],
    image: IMAGES.powders,
  },
  {
    slug: 'gold-sputtering',
    title: 'Gold Sputtering',
    short: 'Sputtering',
    summary: 'Conductive gold coating, available at no extra charge when a sample benefits from it.',
    body: [
      'Although our scanning electron microscope does not require gold sputtering thanks to Low Vacuum mode, it is available at no extra charge.',
      'Sputter coating can improve imaging of highly non-conductive specimens at high magnification.',
    ],
    highlights: ['No extra charge', 'Non-conductive samples', 'Optional', 'High magnification'],
    image: IMAGES.polymers,
  },
  {
    slug: 'micro-ftir',
    title: 'Micro FT-IR Material Identification',
    short: 'Micro FT-IR',
    summary: 'Characterize small polymer fragments, films and organic residues using infrared spectroscopy.',
    body: ['Micro FT-IR measures infrared absorption in a selected region of a sample. Its spectrum can help distinguish polymers and identify characteristic chemical groups in organic materials.', 'Complex mixtures or weak signals can limit identification. Discuss the sample and target area with the laboratory before shipping.'],
    highlights: ['Polymers and films', 'Organic residues', 'Infrared spectrum'],
    image: IMAGES.ftir,
  },
  {
    slug: 'elemental-mapping',
    title: 'SEM/EDS Elemental Mapping',
    short: 'EDS mapping',
    summary: 'Visualize how elements are distributed across a selected surface or cross-section.',
    body: ['SEM/EDS maps show where detectable elements occur across the selected field. Maps can help locate inclusions, compare phases and inspect the distribution of elements through a coating or interface.', 'The laboratory will confirm the field of view, target elements and preparation needed for your sample.'],
    highlights: ['Color elemental maps', 'Coatings and interfaces', 'Inclusions and phases'],
    image: IMAGES.particle,
  },
  {
    slug: 'combined-characterization',
    title: 'SEM/EDS + Micro FT-IR Characterization',
    short: 'Combined analysis',
    summary: 'Combine morphology, elemental information and infrared spectroscopy for mixed or unknown materials.',
    body: ['SEM/EDS examines morphology and elemental composition. Micro FT-IR adds information about chemical groups in suitable organic components. The techniques can be complementary when a single method leaves the material identity uncertain.', 'The lab will confirm that both techniques are appropriate and agree which areas to investigate before testing.'],
    highlights: ['Two complementary methods', 'Mixed materials', 'Integrated findings'],
    image: IMAGES.ftir,
  },
];

export const MATERIALS: Tile[] = [
  { label: 'Metals & Exotic Materials', image: IMAGES.metals, link: '/services/metallography' },
  { label: 'Polymers & Plastics', image: IMAGES.polymers, link: '/micro-ftir' },
  { label: 'Liquids & Oils', image: IMAGES.liquids, link: '/services/contamination' },
  { label: 'Powders', image: IMAGES.powders, link: '/services/particle-analysis' },
  { label: 'Coatings', image: IMAGES.coatings, link: '/services/coatings' },
  { label: 'Core Samples', image: IMAGES.core, link: '/services/core-samples' },
];

export const ANALYSES: Tile[] = [
  { label: 'Failure Analysis', image: IMAGES.failure, link: '/services/failure-analysis' },
  { label: 'Corrosion Analysis', image: IMAGES.corrosion, link: '/services/corrosion' },
  { label: 'Particle Analysis', image: IMAGES.particle, link: '/services/particle-analysis' },
  { label: 'EDS Composition', image: IMAGES.hero, link: '/services/eds' },
  { label: 'Morphology', image: IMAGES.core, link: '/services/microstructural-analysis' },
  { label: 'Micro FT-IR', image: IMAGES.ftir, link: '/micro-ftir' },
];

export const INDUSTRIES: Industry[] = [
  {
    slug: 'oil-gas',
    name: 'Oil, Gas & Energy',
    summary: 'Drilling tools, downhole parts and reservoir rock see heat, pressure and abrasive fluids. We show what wore, cracked or corroded, and what the formation is made of.',
    applications: [
      'PDC cutter wear, leaching depth and diamond table quality',
      'Pipeline, valve and tubing corrosion and scale deposits',
      'Core and cuttings mineralogy, porosity and clay content',
      'Failure analysis of downhole tools and fasteners',
    ],
    services: ['pdc-analysis', 'core-samples', 'corrosion', 'failure-analysis'],
    image: IMAGES.core,
  },
  {
    slug: 'aerospace',
    name: 'Aerospace & Defense',
    summary: 'Exotic alloys and coated parts must meet tight specifications. We check microstructure, coatings and fracture surfaces against what the part should be.',
    applications: [
      'Fracture origin and mode: fatigue, overload, intergranular',
      'Coating thickness and thermal barrier coating integrity',
      'Alloy composition and phase verification',
      'Grain size and microhardness after heat treatment',
    ],
    services: ['failure-analysis', 'coatings', 'metallography', 'microhardness'],
    image: IMAGES.metals,
  },
  {
    slug: 'medical-devices',
    name: 'Medical Devices',
    summary: 'Implants, instruments and packaging need clean, defect-free surfaces. We find and identify particles, residues and surface defects.',
    applications: [
      'Particulate contamination on implants and components',
      'Residue and foreign material identification',
      'Surface finish and coating inspection',
      'Polymer identification for device parts',
    ],
    services: ['contamination', 'particle-analysis', 'micro-ftir', 'sem'],
    image: IMAGES.polymers,
  },
  {
    slug: 'manufacturing',
    name: 'Manufacturing & Metals',
    summary: 'When a part cracks or a batch goes wrong, we look at the material itself to find the root cause and help stop it happening again.',
    applications: [
      'Root cause analysis of broken or cracked parts',
      'Weld, braze and heat treatment evaluation',
      'Inclusions and impurities in metals',
      'Corrosion and wear on production parts',
    ],
    services: ['failure-analysis', 'microstructural-analysis', 'metallography', 'eds'],
    image: IMAGES.failure,
  },
  {
    slug: 'chemicals-plastics',
    name: 'Chemicals, Plastics & Polymers',
    summary: 'Unknown films, fibres and inclusions in plastics often need both chemistry and imaging. We combine Micro FT-IR with SEM/EDS to identify them.',
    applications: [
      'Identification of unknown polymers, fibres and films',
      'Contaminants and gels in plastic parts',
      'Filler and additive distribution',
      'Comparison of good and failed material',
    ],
    services: ['micro-ftir', 'contamination', 'combined-characterization', 'eds'],
    image: IMAGES.ftir,
  },
  {
    slug: 'powders',
    name: 'Powders & Additive Manufacturing',
    summary: 'Particle size, shape and chemistry decide how a powder flows, sinters and performs. We measure all three.',
    applications: [
      'Particle size and shape distribution',
      'Composition and phase mapping of powders',
      'Contaminant and oversize particle detection',
      'Crystalline phase identification',
    ],
    services: ['particle-analysis', 'elemental-mapping', 'xrd', 'sem'],
    image: IMAGES.powders,
  },
  {
    slug: 'lubricants-fluids',
    name: 'Lubricants, Oils & Fluids',
    summary: 'Debris and residue in a fluid tell the story of the machine it came from. We filter, image and analyze what is in it.',
    applications: [
      'Wear debris in lubricating oils',
      'Filter and strainer deposits',
      'Residue left by fluids and cleaning processes',
      'Source tracing of particles by composition',
    ],
    services: ['particle-analysis', 'contamination', 'eds'],
    image: IMAGES.liquids,
  },
  {
    slug: 'research-environmental',
    name: 'Research & Environmental',
    summary: 'Universities, labs and environmental teams use our instruments for imaging and composition of natural and engineered samples.',
    applications: [
      'Imaging of biological and natural samples',
      'Water, sediment and mineral samples',
      'Material characterization for research projects',
      'Sample preparation with gold sputter coating',
    ],
    services: ['sem', 'eds', 'xrd', 'gold-sputtering'],
    image: IMAGES.seawater,
  },
];

export const NAV = [
  { label: 'Home', link: '/' },
  { label: 'About', link: '/about' },
  { label: 'SEM/EDX', link: '/sem-edx' },
  { label: 'Micro FT-IR', link: '/micro-ftir' },
  { label: 'Services', link: '/services' },
  { label: 'Industries', link: '/industries' },
  { label: 'Contact', link: '/contact' },
] as const;
