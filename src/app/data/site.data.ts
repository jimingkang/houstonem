export interface Micrograph {
  src: string;
  alt: string;
  mag: string;
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

export interface GalleryItem {
  category: string;
  title: string;
  description: string;
  image: Micrograph;
}

export const CONTACT = {
  company: 'Houston Electron Microscopy, Inc.',
  phone: '+1 281-888-4261',
  phoneHref: 'tel:+12818884261',
  email: 'LAB@houstonem.com',
  address: '12919 Southwest Fwy, Suite 140',
  city: 'Houston, TX 77477',
  tagline: 'Focus to Know and Empower!',
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

const img = (src: string, alt: string, mag: string, extra: Partial<Micrograph> = {}): Micrograph => ({
  src: `/images/${src}.png`,
  alt,
  mag,
  hv: '20.00 kV',
  det: 'CBS',
  wd: '10.1 mm',
  ...extra,
});

export const IMAGES = {
  hero: img('hero-colorsem', 'ColorSEM backscatter image with real-time EDS element map of a corroded steel cross-section', '1 000 x'),
  metals: img('metals', 'SEM image of a ductile metal fracture surface with microvoid dimples', '25 000 x', { det: 'ETD' }),
  polymers: img('polymers', 'SEM image of crossing polymer fibers', '800 x', { det: 'ETD', hv: '5.00 kV' }),
  liquids: img('liquids-oils', 'SEM image of contaminant particles filtered from an oil sample', '1 500 x'),
  powders: img('powders', 'SEM image of fine crystalline powder particles', '3 000 x', { det: 'ETD' }),
  coatings: img('coatings', 'Cross-section of a coating on a metal substrate with oxides at the interface', '650 x', { det: 'ETD', wd: '11.5 mm' }),
  core: img('core-samples', 'SEM image of shale core sample showing clay platelets and microporosity', '5 000 x', { det: 'LVD' }),
  failure: img('failure', 'SEM image of a fatigue crack propagating along a metal component', '200 x', { det: 'ETD' }),
  corrosion: img('corrosion', 'SEM image of a corrosion pit with iron oxide corrosion products', '500 x'),
  particle: img('particle', 'EDS map of an inclusion particle in a polished metal matrix', '2 500 x'),
  ftir: img('ftir', 'Micro FT-IR microscope stage with a polymer sample under the objective', '—', { hv: '—', det: 'FT-IR', wd: '—' }),
  insect: img('insect', 'SEM image of an insect compound eye with hexagonal ommatidia', '350 x', { det: 'ETD', hv: '10.00 kV' }),
  seawater: img('seawater', 'SEM image of diatoms and salt crystals from dried Galveston sea water', '1 200 x', { det: 'ETD' }),
  eggshell: img('eggshell', 'SEM image of a fractured egg shell showing columnar calcite crystals', '600 x', { det: 'ETD' }),
  lab: img('lab', 'Scanning electron microscope workstation in the Houston Electron Microscopy laboratory', '—', { hv: '—', det: '—', wd: '—' }),
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

export const GALLERY_CATEGORIES = [
  'Fracture Surfaces',
  'Non-Metallics',
  'Phase Analysis',
  'Insects',
  'Sea Water',
  'Egg Shell',
] as const;

export const GALLERY: GalleryItem[] = [
  {
    category: 'Fracture Surfaces',
    title: 'Fatigue crack initiation',
    description: 'Crack propagating from a stress concentration along a machined edge.',
    image: IMAGES.failure,
  },
  {
    category: 'Fracture Surfaces',
    title: 'Ductile overload',
    description: 'Microvoid coalescence dimples typical of ductile overload fracture.',
    image: IMAGES.metals,
  },
  {
    category: 'Non-Metallics',
    title: 'Polymer fibers',
    description: 'Synthetic fibers imaged in low vacuum without conductive coating.',
    image: IMAGES.polymers,
  },
  {
    category: 'Non-Metallics',
    title: 'Crystalline powder',
    description: 'Powder morphology and particle size distribution.',
    image: IMAGES.powders,
  },
  {
    category: 'Phase Analysis',
    title: 'Inclusion map',
    description: 'Real-time ColorSEM element map separating aluminum and sulfur phases.',
    image: IMAGES.particle,
  },
  {
    category: 'Phase Analysis',
    title: 'Coating interface',
    description: 'Oxides concentrated at the coating/substrate interface.',
    image: IMAGES.coatings,
  },
  {
    category: 'Insects',
    title: 'Compound eye',
    description: 'Hexagonal ommatidia and interstitial bristles.',
    image: IMAGES.insect,
  },
  {
    category: 'Sea Water',
    title: 'Galveston sea water',
    description: 'Diatoms and salt crystals left after drying a Galveston Bay sample.',
    image: IMAGES.seawater,
  },
  {
    category: 'Egg Shell',
    title: 'Egg shell cross-section',
    description: 'Columnar calcite crystals and membrane fibers.',
    image: IMAGES.eggshell,
  },
];

export const NAV = [
  { label: 'Home', link: '/' },
  { label: 'About', link: '/about' },
  { label: 'SEM/EDX', link: '/sem-edx' },
  { label: 'Micro FT-IR', link: '/micro-ftir' },
  { label: 'Services', link: '/services' },
  { label: 'Galleries', link: '/galleries' },
  { label: 'Shop', link: '/shop' },
  { label: 'Contact', link: '/contact' },
] as const;

export interface Industry {
  title: string;
  summary: string;
  link: string;
}

/** Industries / problem areas, modeled on a "how we could serve you" solutions grid. */
export const INDUSTRIES: Industry[] = [
  { title: 'Oil & gas tools', summary: 'PDC cutters, downhole components and drilling-tool failures.', link: '/services/pdc-analysis' },
  { title: 'Petrochemical & refining', summary: 'Pitting, crevice and under-deposit corrosion in process equipment.', link: '/services/corrosion' },
  { title: 'Heavy equipment & fabrication', summary: 'Fractography, weld evaluation and heat-treat verification.', link: '/services/failure-analysis' },
  { title: 'Coatings & surface finishing', summary: 'Layer thickness, porosity, pinholes and interface oxides.', link: '/services/coatings' },
  { title: 'Plastics & polymers', summary: 'Identify polymers, fillers and organic contaminants.', link: '/micro-ftir' },
  { title: 'Lubricants & fluids', summary: 'Wear debris and particles filtered from oil and liquid samples.', link: '/services/contamination' },
  { title: 'Geology & energy research', summary: 'Shale texture, organic matter and microporosity in core samples.', link: '/services/core-samples' },
  { title: 'Powders & advanced materials', summary: 'Particle size, morphology, phases and inclusions.', link: '/services/particle-analysis' },
];

export interface ProcessStep {
  title: string;
  text: string;
}

export const PROCESS_STEPS: ProcessStep[] = [
  { title: 'Describe your question', text: 'Call or send a short description of the material and what you need to find out.' },
  { title: 'Free expert consultation', text: 'Our Ph.D. scientist recommends the right technique and gives you a quote.' },
  { title: 'Ship or drop off the sample', text: 'We confirm sample size and preparation needs before anything is shipped.' },
  { title: 'Watch the analysis live', text: 'Join the SEM/EDS session remotely over Teams or Zoom, or let us run it for you.' },
  { title: 'Receive a clear report', text: 'Images, spectra, maps and interpretation, delivered through the client portal.' },
  { title: 'Follow-up support', text: 'Talk through the findings with the analyst and plan any next steps.' },
];

export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  {
    q: 'How fast can I get results?',
    a: 'Same day or next day service is available in most cases. Tell us your deadline when you request a quote and we will confirm the timeline before you ship.',
  },
  {
    q: 'Do non-conductive samples need to be gold coated?',
    a: 'Usually not. Our SEM runs in Low Vacuum mode, so most plastics, ceramics and geological samples can be imaged as received. Gold sputtering is available at no extra charge when it helps.',
  },
  {
    q: 'Can I watch the analysis?',
    a: 'Yes. You can join a live remote session over Microsoft Teams or Zoom and direct the analysis as if you were in the lab.',
  },
  {
    q: 'When should I choose SEM/EDS versus micro FT-IR?',
    a: 'SEM/EDS reveals morphology and elemental (inorganic) composition. Micro FT-IR identifies organic compounds such as polymers and residues. If you are unsure, describe the sample and we will recommend one or both.',
  },
  {
    q: 'Can you analyze liquids and oils?',
    a: 'Yes. Liquid samples are filtered and dried, then the retained particles are imaged and analyzed for chemical composition.',
  },
  {
    q: 'Are there operator or engineer fees?',
    a: 'No. Pricing is for the analysis itself, with no separate “operator” or “engineer” fees.',
  },
];

/** Typical sample types and questions per service, used on service detail pages. */
export const SERVICE_EXTRAS: Record<string, { samples: string[]; questions: string[] }> = {
  sem: {
    samples: ['Metals and alloys', 'Polymers and fibers', 'Ceramics and powders', 'Geological samples'],
    questions: ['What does this surface look like at high magnification?', 'How large are these features or particles?'],
  },
  eds: {
    samples: ['Inclusions and particles', 'Deposits and scale', 'Coatings and platings', 'Unknown residues'],
    questions: ['Which elements are present?', 'How are elements distributed across the sample?'],
  },
  'failure-analysis': {
    samples: ['Fractured components', 'Fasteners and shafts', 'Welds', 'Non-metallic parts'],
    questions: ['Was it fatigue, overload or corrosion?', 'Where did the failure initiate?'],
  },
  corrosion: {
    samples: ['Pipe and tubing sections', 'Pitted surfaces', 'Corrosion products', 'Coupons'],
    questions: ['What caused the corrosion?', 'Did corrosion cause the part to fail?'],
  },
  coatings: {
    samples: ['Coatings on metals', 'Coatings on plastics', 'Platings', 'Multi-layer systems'],
    questions: ['How thick is each layer?', 'Why did the coating delaminate?'],
  },
};

export interface SearchEntry {
  label: string;
  hint: string;
  link: string;
  keywords: string;
}

export const SEARCH_INDEX: SearchEntry[] = [
  { label: 'SEM/EDX analysis', hint: 'Technique', link: '/sem-edx', keywords: 'sem eds edx colorsem chemisem electron microscope elemental mapping' },
  { label: 'Micro FT-IR analysis', hint: 'Technique', link: '/micro-ftir', keywords: 'ftir ft-ir infrared organic polymer spectroscopy' },
  ...SERVICES.map((s) => ({
    label: s.title,
    hint: 'Service · ' + s.short,
    link: '/services/' + s.slug,
    keywords: [s.short, s.summary, ...s.highlights].join(' ').toLowerCase(),
  })),
  { label: 'Galleries', hint: 'Page', link: '/galleries', keywords: 'images micrographs fracture insects sea water egg shell' },
  { label: 'Laboratory shop', hint: 'Page', link: '/shop', keywords: 'stubs tabs vials tweezers accessories buy' },
  { label: 'Client portal', hint: 'Page', link: '/portal', keywords: 'login sign in reports account' },
  { label: 'Request a quote', hint: 'Contact', link: '/contact', keywords: 'contact price quote offer phone email address' },
];
