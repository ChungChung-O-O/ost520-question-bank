#!/usr/bin/env node
/* Apply the three verified Day 1 MediaSpace transcript revisions without changing IDs or answer positions. */
const fs = require("fs");

const sourcePath = "week3/qbank_practice_ready.json";
const preExpansionCount = 144;
const expectedCount = 152;
const asciiJson = value => JSON.stringify(value, null, 2).replace(/[\u007f-\uffff]/g, character => `\\u${character.codePointAt(0).toString(16).padStart(4, "0")}`);
const requiredFields = [
  "id", "topic", "src", "stem", "options", "answer", "rationale", "type", "context",
  "unit", "concepts", "covers", "course", "source", "sourceRef", "sourceBlock",
  "applicationLevel", "requiresMedia", "mediaNote", "closestDistractor", "holdout", "n"
];

const revisions = {
  "W3-RR6-08": {
    answer: 4,
    stem: "A healthy toddler misses dinner, accidentally ingests ethanol, and several hours later becomes confused and diaphoretic with hypoglycemia much sooner than an adult would. Which combined mechanism best explains the rapid hypoglycemia?",
    options: [
      "A larger hepatic glycogen reserve together with ethanol-driven conversion of pyruvate to acetyl-CoA",
      "Limited hepatic glycogen reserve together with ethanol-driven conversion of lactate to pyruvate and malate to oxaloacetate",
      "Limited hepatic glycogen reserve together with ethanol-driven conversion of pyruvate to oxaloacetate and lactate to pyruvate",
      "Normal hepatic glycogen reserve together with ethanol-driven conversion of oxaloacetate to phosphoenolpyruvate",
      "Limited glycogen plus high NADH diverting pyruvate to lactate and oxaloacetate to malate"
    ],
    rationale: "Toddlers have limited hepatic glycogen reserve. Ethanol metabolism raises the hepatic NADH/NAD+ ratio, driving pyruvate toward lactate and oxaloacetate toward malate, so gluconeogenesis cannot maintain blood glucose once glycogen is limited. The trap: high NADH drives these reactions in the opposite direction from gluconeogenesis.",
    concepts: ["RR6-O2", "RR6-O3", "RR6-O6"],
    covers: ["O2", "O3", "O6"],
    sourceRef: "Lippincott 9e Ch23 IV.C; MediaSpace L029 transcript 05:31-08:33",
    applicationLevel: "mechanism",
    closestDistractor: {
      index: 2,
      why_wrong: "That option reverses ethanol's high-NADH redox shifts: high NADH favors pyruvate-to-lactate and oxaloacetate-to-malate, not the gluconeogenic directions."
    }
  },
  "W3-L027-01": {
    answer: 4,
    stem: "A patient with diphtheria has toxin-mediated inactivation of eukaryotic elongation factor 2 (EF-2). After peptide-bond formation has occurred, which translation step is directly blocked?",
    options: [
      "Charging the incoming tRNA with its cognate amino acid",
      "Binding of the initiator tRNA to the start codon",
      "Peptide-bond formation at the peptidyl-transferase center",
      "Recognition of a stop codon by a release factor",
      "EF-2-dependent ribosomal translocation along mRNA"
    ],
    rationale: "EF-2 drives ribosomal translocation during eukaryotic elongation. Diphtheria toxin inactivates EF-2, so the ribosome cannot move along the mRNA after peptide-bond formation. The trap: peptide-bond formation precedes translocation and is catalyzed by the ribosome, not EF-2.",
    concepts: ["L027-O4"],
    covers: ["O4"],
    sourceRef: "MediaSpace L027 transcript 30:09-30:44",
    applicationLevel: "mechanism",
    closestDistractor: {
      index: 2,
      why_wrong: "Peptidyl transferase forms the peptide bond; EF-2 acts immediately afterward to translocate the ribosome."
    }
  },
  "W3-L028-03": {
    answer: 2,
    stem: "A rapidly proliferating cell needs both NADPH and ribose-5-phosphate, but severe thiamine deficiency has eliminated transketolase activity. Which pentose-phosphate-pathway strategy can still meet both needs?",
    options: [
      "Run the nonoxidative phase backward to make ribose-5-phosphate from glycolytic intermediates",
      "Make ribose-5-phosphate nonoxidatively, then use transketolase to recycle excess pentoses to glycolysis",
      "Use the oxidative phase to produce NADPH, then isomerize ribulose-5-phosphate to ribose-5-phosphate (Mode 1)",
      "Use the oxidative phase for NADPH, then use transketolase and transaldolase to return all pentoses to glycolysis",
      "Repeatedly recycle pentoses to glucose-6-phosphate so the oxidative phase makes NADPH without retaining ribose-5-phosphate"
    ],
    rationale: "Mode 1 supplies both products without transketolase: the oxidative phase makes NADPH and ribulose-5-phosphate, then phosphopentose isomerase makes ribose-5-phosphate. The trap: Modes 2-4 require nonoxidative rearrangements that rely on transketolase, which requires thiamine pyrophosphate.",
    concepts: ["L028-O4", "L028-O6"],
    covers: ["O4", "O6"],
    sourceRef: "MediaSpace L028 transcript 33:41-36:50",
    applicationLevel: "mechanism",
    closestDistractor: {
      index: 3,
      why_wrong: "That strategy requires transketolase, the thiamine-dependent enzyme unavailable in the stem."
    }
  }
};

const additions = {
  "W3-L026-CONNECTIVE-TISSUE-11": {
    id: "W3-L026-CONNECTIVE-TISSUE-11",
    topic: "Histology",
    src: "T",
    stem: "A tall adolescent has lens dislocation and a pathogenic fibrillin-1 variant. Which additional finding is the highest-priority concern?",
    options: [
      "Aortic dilation from elastic-fiber failure",
      "Cartilage collapse from loss of proteoglycan aggregates",
      "Lymph-node failure from loss of reticular-fiber stroma",
      "Scurvy from absent vitamin C dependent collagen hydroxylation",
      "Mast-cell loss from defective IgE receptor signaling"
    ],
    answer: 0,
    rationale: "Fibrillin-1 is a glycoprotein in elastic-fiber microfibrils. Its disruption in Marfan syndrome compromises vessel-supporting connective tissue, making aortic disease the time-critical clue. The trap: proteoglycan, reticular-fiber, collagen-hydroxylation, and mast-cell defects describe different matrix or cell mechanisms.",
    type: "mcq",
    context: "",
    unit: "UE2",
    concepts: ["CT4"],
    covers: ["CT4"],
    course: "OST520",
    source: "week3-bank",
    sourceRef: "L026 slides 25-26; MediaSpace L026 transcript 25:17-27:12",
    sourceBlock: "L026",
    applicationLevel: "mechanism",
    requiresMedia: false,
    mediaNote: "",
    closestDistractor: {
      index: 1,
      why_wrong: "Proteoglycan aggregates resist compression in cartilage; the stem instead identifies fibrillin-associated elastic-fiber disease and its aortic risk."
    },
    holdout: false,
    n: 9
  },
  "W3-L026-CONNECTIVE-TISSUE-12": {
    id: "W3-L026-CONNECTIVE-TISSUE-12",
    topic: "Histology",
    src: "T",
    stem: "A healing wound contains a spindle-shaped connective-tissue cell with abundant rough ER and a prominent Golgi apparatus. Which function most directly accounts for this appearance?",
    options: [
      "Mast-cell degranulation that releases inflammatory mediators",
      "Macrophage phagocytosis of cellular debris",
      "Collagen and ground-substance secretion",
      "Adipocyte storage of triacylglycerol in a lipid droplet",
      "Plasma-cell secretion of immunoglobulin"
    ],
    answer: 2,
    rationale: "An active fibroblast is spindle shaped and uses abundant rough ER and Golgi to synthesize and secrete collagen plus ground-substance components during repair. The trap: plasma cells also have abundant protein-synthesis machinery, but they make immunoglobulin and have a characteristic eccentric nucleus rather than the spindle-shaped fibroblast profile.",
    type: "mcq",
    context: "",
    unit: "UE2",
    concepts: ["CT5"],
    covers: ["CT5"],
    course: "OST520",
    source: "week3-bank",
    sourceRef: "OST520 (026) L - Connective Tissue - Liang.pdf, cell-types section",
    sourceBlock: "L026",
    applicationLevel: "mechanism",
    requiresMedia: false,
    mediaNote: "",
    closestDistractor: {
      index: 4,
      why_wrong: "Plasma cells secrete immunoglobulin, whereas the spindle-shaped wound-repair cell described is an active fibroblast that produces extracellular-matrix components."
    },
    holdout: false,
    n: 10
  },
  "W3-L027-11": {
    id: "W3-L027-11",
    topic: "Molecular Biology",
    src: "N",
    stem: "A missense mutation replaces a normally buried hydrophobic residue with a charged residue in a soluble cytosolic protein. The protein is synthesized but rapidly misfolds. Which consequence most directly explains the defect?",
    options: [
      "Defective aminoacyl-tRNA charging during translation",
      "Tertiary-fold destabilization in the hydrophobic core",
      "Failure of signal-peptide-mediated entry into rough ER",
      "Loss of N-linked glycan addition in the ER lumen",
      "Premature stop-codon recognition by a release factor"
    ],
    answer: 1,
    rationale: "A charged side chain is unfavorable when buried in a protein's hydrophobic core, so this substitution destabilizes tertiary folding and promotes misfolding. The trap: aminoacyl-tRNA charging affects which amino acid is incorporated during translation; it does not explain why the already encoded charged residue is unstable specifically in the folded core.",
    type: "mcq",
    context: "",
    unit: "UE2",
    concepts: ["L027-O5"],
    covers: ["O5"],
    course: "OST520",
    source: "week3-bank",
    sourceRef: "OST520 (027) L - Protein Translation and Post-Translation - Ritchie.pdf, protein folding section",
    sourceBlock: "L027",
    applicationLevel: "mechanism",
    requiresMedia: false,
    mediaNote: "",
    closestDistractor: {
      index: 0,
      why_wrong: "Aminoacyl-tRNA charging acts during translation, whereas the stem identifies a defined missense substitution and asks why that encoded protein misfolds after synthesis."
    },
    holdout: false,
    n: 9
  },
  "W3-L027-12": {
    id: "W3-L027-12",
    topic: "Molecular Biology",
    src: "N",
    stem: "A mucin-producing epithelial cell has defective Golgi glycosyltransferase activity. Sugar addition to serine and threonine residues of mucin is reduced. Which process is directly impaired?",
    options: [
      "Signal peptide cleavage in the ER",
      "Peptide-bond formation on ribosomes",
      "Disulfide-bond formation in the ER",
      "O-linked glycosylation in the Golgi",
      "GPI-anchor attachment at the ER membrane"
    ],
    answer: 3,
    rationale: "O-linked glycosylation adds sugars stepwise to serine or threonine residues in the Golgi, a major feature of mucin processing. The trap: signal-peptide cleavage, peptide-bond formation, disulfide-bond formation, and GPI-anchor attachment are distinct protein-processing events.",
    type: "mcq",
    context: "",
    unit: "UE2",
    concepts: ["L027-O7"],
    covers: ["O7"],
    course: "OST520",
    source: "week3-bank",
    sourceRef: "OST520 (027) L - Protein Translation and Post-Translation - Ritchie.pdf, glycosylation section",
    sourceBlock: "L027",
    applicationLevel: "mechanism",
    requiresMedia: false,
    mediaNote: "",
    closestDistractor: {
      index: 2,
      why_wrong: "Disulfide-bond formation supports protein folding in the ER but does not add sugars to mucin serine or threonine residues."
    },
    holdout: false,
    n: 10
  },
  "W3-L028-11": {
    id: "W3-L028-11",
    topic: "Biochemistry",
    src: "B",
    stem: "An endothelial cell has impaired pentose phosphate pathway flux but intact glycolysis. Which NADPH-dependent process is most directly reduced?",
    options: [
      "Substrate-level ATP formation at phosphoglycerate kinase",
      "Conversion of glucose-6-P to glucose-1-P",
      "Attachment of glucose to glycogen by glycogen synthase",
      "Transfer of amino acids onto their cognate tRNAs",
      "Nitric oxide synthesis by nitric oxide synthase"
    ],
    answer: 4,
    rationale: "The PPP supplies NADPH for several reductive processes, including nitric oxide synthesis. This is distinct from the RBC hemolysis mechanism in G6PD deficiency: the stem asks for a different NADPH-dependent tissue function. The trap: glycolytic ATP production, glycogen metabolism, and tRNA charging do not directly use PPP-derived NADPH in this way.",
    type: "mcq",
    context: "",
    unit: "UE2",
    concepts: ["L028-O2"],
    covers: ["O2"],
    course: "OST520",
    source: "week3-bank",
    sourceRef: "OST520 (028) L - Pentose Phosphate Pathway - Wilkins.pdf, NADPH functions section",
    sourceBlock: "L028",
    applicationLevel: "mechanism",
    requiresMedia: false,
    mediaNote: "",
    closestDistractor: {
      index: 0,
      why_wrong: "Phosphoglycerate kinase generates ATP from a glycolytic phosphate transfer; it does not require NADPH."
    },
    holdout: false,
    n: 168
  },
  "W3-L028-12": {
    id: "W3-L028-12",
    topic: "Biochemistry",
    src: "B",
    stem: "A cell sends one glucose-6-phosphate through the oxidative phase of the pentose phosphate pathway before any nonoxidative rearrangement. Which immediate product set results?",
    options: [
      "Two NADH, carbon dioxide, and ribulose-5-P",
      "One NADPH, no carbon dioxide, and fructose-6-P",
      "Two NADPH, carbon dioxide, and ribulose-5-P",
      "Two FADH2, carbon dioxide, and ribose-5-P",
      "One NADPH, two ATP, and glyceraldehyde-3-P"
    ],
    answer: 2,
    rationale: "The oxidative PPP has two NADPH-producing dehydrogenase reactions and releases carbon dioxide, leaving ribulose-5-P before the reversible nonoxidative reactions. The trap: NADH, FADH2, ATP, and glycolytic intermediates are not the immediate products of this oxidative PPP pass.",
    type: "mcq",
    context: "",
    unit: "UE2",
    concepts: ["L028-O1", "L028-O4"],
    covers: ["O1", "O4"],
    course: "OST520",
    source: "week3-bank",
    sourceRef: "OST520 (028) L - Pentose Phosphate Pathway - Wilkins.pdf, oxidative PPP reactions",
    sourceBlock: "L028",
    applicationLevel: "mechanism",
    requiresMedia: false,
    mediaNote: "",
    closestDistractor: {
      index: 0,
      why_wrong: "The oxidative PPP generates NADPH, not NADH; its two dehydrogenase reactions are the source of the two NADPH molecules."
    },
    holdout: false,
    n: 169
  },
  "W3-L029-11": {
    id: "W3-L029-11",
    topic: "Biochemistry",
    src: "B",
    stem: "Isolated muscle glycogen granules are incubated with inorganic phosphate. Glucose-1-P is not released from nonreducing alpha-1,4-linked ends, although branch architecture is intact. Which enzyme is absent?",
    options: [
      "Glycogen phosphorylase",
      "Glycogen synthase for chain elongation",
      "Branching enzyme for alpha-1,6 branches",
      "Debranching enzyme at branch points",
      "Phosphoglucomutase for glucose-1-P conversion"
    ],
    answer: 0,
    rationale: "Glycogen phosphorylase uses inorganic phosphate to release glucose-1-P from nonreducing alpha-1,4-linked ends during glycogenolysis. The trap: synthase and branching enzyme build glycogen, debranching enzyme acts at branch obstacles, and phosphoglucomutase converts the released glucose-1-P to glucose-6-P rather than cleaving glycogen.",
    type: "mcq",
    context: "",
    unit: "UE2",
    concepts: ["L029-O4", "L029-O5"],
    covers: ["O4", "O5"],
    course: "OST520",
    source: "week3-bank",
    sourceRef: "OST520 (029) L - Glycogen Metabolism - Wilkins.pdf, glycogenolysis section",
    sourceBlock: "L029",
    applicationLevel: "mechanism",
    requiresMedia: false,
    mediaNote: "",
    closestDistractor: {
      index: 3,
      why_wrong: "Debranching enzyme addresses branch-point limit structures but does not carry out the general phosphorolytic release of glucose-1-P from nonreducing alpha-1,4 ends."
    },
    holdout: false,
    n: 170
  },
  "W3-L029-12": {
    id: "W3-L029-12",
    topic: "Biochemistry",
    src: "B",
    stem: "A hepatocyte has normal glycogen synthase and branching enzyme but lacks glycogenin. Which defect is most direct?",
    options: [
      "Failure to remove glucose-6-P phosphate for blood export",
      "Failure of phosphorylase to cleave alpha-1,4 linkages",
      "Failure of branching enzyme to make alpha-1,6 linkages",
      "Failure to prime a new glycogen particle",
      "Failure to convert glucose-1-P into UDP-glucose"
    ],
    answer: 3,
    rationale: "Glycogenin supplies the primer required to initiate a glycogen particle; glycogen synthase then extends that primer with glucose from UDP-glucose. The trap: branching, phosphorylase cleavage, UDP-glucose formation, and glucose export are separate glycogen or hepatic processes.",
    type: "mcq",
    context: "",
    unit: "UE2",
    concepts: ["L029-O4"],
    covers: ["O4"],
    course: "OST520",
    source: "week3-bank",
    sourceRef: "OST520 (029) L - Glycogen Metabolism - Wilkins.pdf, glycogenesis section",
    sourceBlock: "L029",
    applicationLevel: "mechanism",
    requiresMedia: false,
    mediaNote: "",
    closestDistractor: {
      index: 2,
      why_wrong: "Branching enzyme can make alpha-1,6 linkages once a chain exists, but it cannot replace glycogenin's initiating primer."
    },
    holdout: false,
    n: 171
  }
};

const questions = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
if (!Array.isArray(questions) || ![preExpansionCount, expectedCount].includes(questions.length)) {
  throw new Error(`Expected exactly ${preExpansionCount} or ${expectedCount} practice-ready questions.`);
}
const expanding = questions.length === preExpansionCount;
if (new Set(questions.map(question => question.id)).size !== questions.length) {
  throw new Error("Practice-ready question IDs must be unique.");
}

for (const question of questions) {
  for (const field of requiredFields) {
    if (!(field in question)) throw new Error(`Question ${question.id || "<unknown>"} is missing schema field ${field}.`);
  }
  if (question.type !== "mcq" || !Array.isArray(question.options) || question.options.length !== 5) {
    throw new Error(`Question ${question.id} must be a five-option MCQ.`);
  }
  if (!Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.options.length) {
    throw new Error(`Question ${question.id} has an invalid zero-based answer index.`);
  }
}

for (const [id, revision] of Object.entries(revisions)) {
  const matches = questions.filter(question => question.id === id);
  if (matches.length !== 1) throw new Error(`Expected exactly one ${id}; found ${matches.length}.`);
  const question = matches[0];
  if (question.answer !== revision.answer) {
    throw new Error(`${id} answer index changed before this transcript update; expected ${revision.answer}, got ${question.answer}.`);
  }
  Object.assign(question, revision);
  if (question.answer !== revision.answer || question.options.length !== 5 || question.closestDistractor.index === question.answer) {
    throw new Error(`Revision validation failed for ${id}.`);
  }
}

for (const [id, addition] of Object.entries(additions)) {
  const matches = questions.filter(question => question.id === id);
  if (matches.length > 1) throw new Error(`Expected at most one ${id}; found ${matches.length}.`);
  if (matches.length === 0) {
    if (!expanding) throw new Error(`${id} is missing from an already expanded release.`);
    questions.push(addition);
  } else {
    Object.assign(matches[0], addition);
  }
}

if (questions.length !== expectedCount || new Set(questions.map(question => question.id)).size !== expectedCount) {
  throw new Error(`Day 1 expansion must produce exactly ${expectedCount} unique practice-ready questions.`);
}

fs.writeFileSync(sourcePath, `${asciiJson(questions)}\n`);
console.log(`Applied ${Object.keys(revisions).length} transcript revisions and ensured ${Object.keys(additions).length} Day 1 additions; practice-ready set now has ${questions.length}.`);
