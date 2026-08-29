/* Idempotent content upgrade. Rebuilds bank.json and the embedded static-site bank. */
const fs = require("fs");
const path = require("path");

const root = __dirname;
const bankPath = path.join(root, "bank.json");
const htmlPath = path.join(root, "index.html");
let bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));

const fifth = {
  B1:"Amphibolic, with no consistent redox direction", B2:"Lactate, released by anaerobic tissues", B3:"Glucose 6-phosphate, the intracellular glucose trap", B4:"Insulin rises; glycogen is broken down; PDH is phosphorylated", B5:"CDP-choline", B6:"Gastric lipase competitively inhibits amylase", B7:"β(1→6) linkages", B8:"Transport is coupled to K⁺ leaving the enterocyte", B9:"Ketone and carboxylic acid", B10:"No protons and 2 electrons", B11:"NAD⁺, because both hydrogens transfer intact", B12:"Only in the γ position", B13:"Transferase", B14:"Molecular O₂ incorporated by a TCA-cycle oxidase", B15:"Aldolase (reaction 4), which cleaves the six-carbon sugar", B16:"To reduce NAD⁺ before the payoff phase", B17:"The hepatocyte takes up glucose efficiently because glucokinase has a high affinity", B18:"Glyceraldehyde 3-phosphate dehydrogenase", B19:"Activated by glucagon and citrate; inhibited by insulin", B20:"Oxidize lactate to pyruvate within the same cell", B21:"Higher, because mitochondrial glycerol-3-phosphate dehydrogenase transfers electrons to Complex I", B22:"Pyruvate cannot enter the mitochondrial matrix", B23:"Pyridoxine", B24:"NAD⁺", B25:"Inhibits PDH and has no effect on pyruvate carboxylase", B26:"Aconitase", B27:"Acetyl CoA", B28:"A cataplerotic reaction", B29:"Complex II, because it transfers electrons directly to cytochrome c", B30:"Electron transport slows, oxygen consumption falls, and ATP synthesis rises",
  G3:"Roman numerals; birth order alone", G11:"75%", G12:"all unaffected siblings of the affected child", G17:"leading strand", G18:"From the promoter toward either DNA end without a fixed chemical direction",
  "WK-01":"NADPH is generated while ATP is consumed", "WK-02":"Stage 1: building blocks converge on acetyl CoA", "WK-03":"One electron with no proton", "WK-04":"FAD, because oxygen is inserted into the carbon chain", "WK-05":"Adding a hydroxyl group to the omega carbon", "WK-06":"Hepatic glucokinase remains more active than peripheral hexokinase at 4 mM", "WK-07":"Fructose directly inhibits mitochondrial ATP synthase", "WK-08":"Galactose 1-phosphate from galactokinase deficiency", "WK-09":"Complex II transfers electrons directly to cytochrome c", "WK-10":"Its electrons enter at Complex I through mitochondrial NADH", "WK-11":"Index carrier, because the symbol is unshaded", "WK-12":"The pair shares a placenta but not a zygote", "WK-13":"Two spontaneous abortions", "WK-14":"III-2; the cousin is a second-degree relative", "WK-15":"64%", "WK-16":"The mutant allele undergoes meiotic recombination in one sister", "WK-17":"Affected maternal uncles born to an unaffected grandmother", "WK-18":"Colinearity, then universality", "WK-19":"5′-TAC GGA CTT-3′", "WK-20":"Adenine and thymine", "WK-21":"Two copies of histone H3", "WK-22":"TTAGGG repeats → unique chromosome-specific DNA → shared subtelomeric repeats", "WK-23":"DNA ligase sealing nicks behind the fork", "WK-24":"A maternal extra haploid set caused by failure of polar-body extrusion",
  "TR-01":"Stage 3; acetyl CoA", "TR-02":"Using NADH as the reductant in fatty acid synthesis", "TR-03":"Two electrons with no proton", "TR-04":"NADH plus molecular hydrogen", "TR-05":"Cytochrome c", "TR-06":"Cytochrome c", "TR-07":"3′ to 5′ on the leading half of each transcript", "TR-08":"The H3-H4 tetramer within the core", "TR-09":"DNA polymerase IV", "TR-10":"DNA ligase 3′→5′ exonuclease", "TR-11":"Polyploidy, specifically double trisomy", "TR-12":"Somatic cells progressively convert the balanced exchange into a deletion", "TR-13":"Autosomal recessive and mitochondrial", "TR-14":"Autosomal dominant with male-limited expression", "TR-15":"Autosomal dominant with complete penetrance", "TR-16":"Paternal mitochondrial inheritance", "TR-17":"Only glucose uptake falls; galactose uses a sodium-independent carrier", "TR-18":"Galactokinase deficiency with galactose 1-phosphate accumulation"
};

const dash = /[-\u2010-\u2015]/;
const preserveNecessaryUniqueDash = new Set(["B13","W9","W10","W23","L007-18","ALT-08","G18","D4"]);
function removeUniqueDashCue(q) {
  if (q.type !== "mcq" || q.source === "faculty-practice" || preserveNecessaryUniqueDash.has(q.id)) return;
  if (q.options.filter(option => dash.test(option.replace(/<[^>]*>/g,""))).length !== 1) return;
  q.options = q.options.map(option => option
    .replace(/(\d)\u2013(\d)/g, "$1 to $2")
    .replace(/\s*[\u2012-\u2015]\s*/g, "; ")
    .replace(/[\u2010\u2011-]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s+([,;:.])/g, "$1"));
}

const polish = [
  [/non disjunction/gi,"nondisjunction"],[/semi conservative/gi,"semiconservative"],[/co dominance/gi,"codominance"],
  [/non syndromic/gi,"nonsyndromic"],[/DERE pressed/g,"derepressed"],[/NON phosphorylated/g,"unphosphorylated"],
  [/\bre enter\b/gi,"reenter"],[/\bre anneal\b/gi,"reanneal"],[/ten fold/gi,"tenfold"],[/FBN 1/g,"FBN1"],
  [/GALT deficient children/g,"children with GALT deficiency"],[/MZ; DZ gap/g,"gap between MZ and DZ"],
  [/10³; 10⁴/g,"10³ to 10⁴"],[/cyclin D; CDK4\/6/g,"cyclin D with CDK4/6"],
  [/collagen containing tissues; blood vessels, connective tissue and bone; are/g,"tissues containing collagen, including blood vessels, connective tissue and bone, are"],
  [/Gs; cAMP; A kinase pathway/g,"Gs to cAMP to protein kinase A pathway"],
  [/protein coding transcripts/g,"transcripts that encode proteins"],[/non template \(coding, sense\) strand/g,"coding (sense) strand"],
  [/poly A signal/g,"poly(A) signal"],[/double strand break/g,"break across both DNA strands"],
  [/X linked recessive/gi,"recessive inheritance linked to the X chromosome"],[/X linked dominant/gi,"dominant inheritance linked to the X chromosome"],
  [/X linked problems/gi,"problems involving X chromosome linkage"],[/X linked risks/gi,"risks involving X chromosome linkage"],
  [/condition is X linked/gi,"condition is linked to the X chromosome"],[/sex influence/gi,"influence by sex"],
  [/at risk/gi,"at increased risk"],[/an at increased risk adult/gi,"an adult at increased risk"],[/post fertilisation/gi,"after fertilization"],[/in utero/gi,"during gestation"],
  [/water soluble/gi,"soluble in water"],[/lipid soluble/gi,"soluble in lipid"],[/ligand receptor binding/gi,"ligand binding to a receptor"],
  [/membrane bound guanylate cyclase/gi,"guanylate cyclase bound to the membrane"],[/Na⁺ dependent/gi,"dependent on Na⁺"],
  [/single strand binding/gi,"binding to single stranded DNA"],[/N terminal/gi,"amino terminal"],
  [/wild type/gi,"normal"],[/first degree relative/gi,"relative in the first degree"],[/The number of new cases per 1,000 person years(?: of observation)*(?: of follow up)?/gi,"The number of new cases during 1,000 person years of observation"],
  [/goodness of fit/gi,"model fit"],[/four D syndrome/gi,"classic syndrome of four Ds"],
  [/glucose 6 phosphate(?: ester)*/gi,"glucose 6 phosphate ester"],[/galactose 1 phosphate(?: ester)*/gi,"galactose 1 phosphate ester"],
  [/^glucose 6 phosphate ester/i,"Glucose 6 phosphate ester"],
  [/fructose 1 phosphate(?: ester)*/gi,"fructose 1 phosphate ester"],[/Na⁺ selective/gi,"selective for Na⁺"],
  [/ligand gated/gi,"gated by a ligand"],[/voltage gated/gi,"gated by voltage"],[/chemically gated/gi,"gated chemically"],
  [/receptor mediated/gi,"mediated by a receptor"],[/mediated by a receptor transport/gi,"transport mediated by receptors"],
  [/; which makes recurrence risk/g,", which makes recurrence risk"],[/growth factor signalling/gi,"signalling by growth factors"]
];
function polishOpenCompounds(q){
  if(q.type!=="mcq"||q.source==="faculty-practice")return;
  q.options=q.options.map(option=>{
    const text=polish.reduce((value,[pattern,replacement])=>value.replace(pattern,replacement),option);
    return /^\p{Lu}/u.test(option)?text.replace(/^\p{Ll}/u,letter=>letter.toUpperCase()):text;
  });
}

const terminologyRepairs = [
  [/beforeentering/g,"before entering"],[/Phosphofructokinase 1/g,"Phosphofructokinase-1"],
  [/Glyceraldehyde 3 phosphate/g,"Glyceraldehyde 3-phosphate"],[/substrate level/gi,"substrate-level"],
  [/Acetyl CoA/g,"acetyl-CoA"],[/X inactivation/g,"X-inactivation"],[/lead time/gi,"lead-time"],
  [/glucose 6 phosphate ester/gi,"glucose-6-phosphate"],[/galactose 1 phosphate ester/gi,"galactose-1-phosphate"],
  [/fructose 1 phosphate ester/gi,"fructose-1-phosphate"],[/3′ OH/g,"3′-OH"],[/aminoacyl tRNA/g,"aminoacyl-tRNA"],
  [/5′ to 5′/g,"5′-to-5′"],[/p53 dependent/gi,"p53-dependent"],[/chi square/gi,"chi-square"],
  [/p value/gi,"p-value"],[/Wolf Hirschhorn/g,"Wolf-Hirschhorn"],[/beta adrenergic/gi,"beta-adrenergic"],
  [/CRISPR Cas9/g,"CRISPR-Cas9"],[/excitability related/gi,"excitability-related"]
];
function repairReviewedContent(q){
  if(q.type==="mcq"&&q.source!=="faculty-practice") q.options=q.options.map(option=>terminologyRepairs.reduce((value,[pattern,replacement])=>value.replace(pattern,replacement),option));
  if(q.id==="B21"){
    q.options[1]="Lower, because electrons enter the ubiquinone pool downstream of Complex I";
    q.options[4]=fifth.B21;
    q.rationale="The glycerol phosphate shuttle transfers cytosolic reducing equivalents to mitochondrial glycerol-3-phosphate dehydrogenase, whose FAD passes electrons to <strong>ubiquinone downstream of Complex I</strong>. Those electrons therefore drive proton pumping only at Complexes III and IV, yielding about <strong>1.5 ATP</strong> rather than the roughly <strong>2.5 ATP</strong> from matrix NADH entering at Complex I.";
  }
  if(q.id==="R10"){
    q.options[0]="Galactokinase deficiency needs the stricter lifelong diet";
    q.options[1]="GALT deficiency needs lifelong galactose restriction because toxic galactose-1-phosphate and related metabolites accumulate";
    q.rationale="<strong>Classic galactosemia from GALT deficiency requires sustained dietary restriction of galactose and lactose.</strong> Without GALT, galactose-1-phosphate and related metabolites accumulate and can cause liver failure, cataracts, infection risk, and long-term complications. Galactokinase deficiency is usually milder and is dominated by galactitol-related cataracts. <strong>The trap:</strong> do not infer long-term dietary strictness from the fact that both defects involve the same sugar.";
  }
  if(q.id==="WK-09") q.options[4]="Complex II transfers electrons directly to cytochrome c";
  if(q.id==="TR-09") q.options[4]="DNA polymerase IV";
  if(q.id==="L023-03") q.options[1]="Gates controlled by either membrane voltage (voltage-gated Na⁺, K⁺, and Ca²⁺ channels) or ligand binding (ligand-gated channels such as the acetylcholine-gated Na⁺ channel)";
  if(q.id==="L023-09") q.options[0]="Axon AP → voltage-gated Ca²⁺ channels open → vesicles release ACh → ACh binds N1 → N1 forms a Na⁺-selective pore; N1 is a ligand-gated, cation-selective channel";
  if(q.id==="A2-32") q.options[1]="SGLT1, the Na⁺-dependent glucose cotransporter; a symporter performing secondary active transport using the Na⁺ gradient built by the Na⁺/K⁺-ATPase";
  if(q.id==="RT-48") q.options[2]="A single-strand-binding protein; parental strands reanneal behind the fork";
  if(q.id==="ALT-09") q.options[0]="Niacin; it causes the classic four-D syndrome of dermatitis, diarrhea, dementia, and death";

  /* When a keyed choice must retain a standard hyphenated scientific term,
     keep at least one distractor in the same typographic register. These are
     meaningful compound modifiers, not decorative punctuation. */
  if(q.id==="G14") q.options[2]="a second X-linked mutation";
  if(q.id==="T2") q.options[2]="X-linked genomic imprinting";
  if(q.id==="D15") q.options[0]="A genuine treatment-related benefit";
  if(q.id==="L010-10") q.options[0]="Mutant p53 repairs radiation-induced damage more efficiently";
  if(q.id==="L014-07") q.options[3]="A de novo X-linked mutation on her second X";
  if(q.id==="L023-03") q.options[2]="ATP-dependent gating turns each pore into a primary active pump";
  if(q.id==="L023-09") q.options[1]="ACh binds ligand-gated N1 → Ca²⁺ channels open → axon AP → vesicle fusion → Na⁺ entry";
  if(q.id==="A2-03") q.options[0]="siRNA-mediated mRNA degradation, because it permanently alters the genomic locus";
  if(q.id==="A2-31") q.options[0]="A carrier-mediated transport defect with chronic static manifestations";
  if(q.id==="A2-32") q.options[2]="The ATP-dependent Na⁺/K⁺ pump directly cotransports glucose with sodium";
  if(q.id==="RT-39") q.options[1]="It is the first ATP-consuming step of the pathway";
  if(q.id==="WK-16") q.options[4]="The X-linked mutant allele undergoes meiotic recombination in one sister";
}

for (const q of bank) {
  removeUniqueDashCue(q);
  if (q.type === "mcq" && q.source !== "faculty-practice" && q.options.length === 4) {
    if (!fifth[q.id]) throw new Error(`No reviewed fifth distractor for ${q.id}`);
    q.options.push(fifth[q.id]);
  }
  removeUniqueDashCue(q);
  polishOpenCompounds(q);
  repairReviewedContent(q);
}
const missed = Object.keys(fifth).filter(id => !bank.some(q => q.id === id));
if (missed.length) throw new Error(`Fifth-option map contains missing ids: ${missed.join(", ")}`);

const base = {topic:"Genetics",src:"DL",type:"mcq",context:"Look-Alike Concepts",unit:"UE1",course:"OST520",source:"confusion-lab"};
const contrastDefinitions={
  "allelic-heterogeneity":["Allelic heterogeneity","Different pathogenic variants in one gene cause the same disorder."],
  anticipation:["Anticipation","A disorder appears earlier or more severely in successive generations."],
  codominance:["Codominance","Both allelic products are distinctly expressed in a heterozygote."],
  "de-novo-mutation":["De novo mutation","A new variant arises in a gamete or early embryo rather than being inherited."],
  "delayed-onset":["Delayed onset","A disease genotype is present before its phenotype appears later in life."],
  "epigenetic-mosaicism":["Epigenetic mosaicism","Genetically similar cells maintain different regulatory states."],
  "genomic-imprinting":["Genomic imprinting","Autosomal expression depends on the allele's parent of origin."],
  imprinting:["Imprinting","Expression depends on a parent-of-origin epigenetic mark."],
  "germline-mosaicism":["Germline mosaicism","A variant is present in some gametes but may be absent from sampled somatic tissue."],
  "gonosomal-mosaicism":["Gonosomal mosaicism","A postzygotic variant spans both somatic and germline lineages."],
  heteroplasmy:["Heteroplasmy","More than one mitochondrial DNA genotype exists within a cell or person."],
  homoplasmy:["Homoplasmy","The mitochondrial DNA copies sampled at a locus share one genotype."],
  "incomplete-dominance":["Incomplete dominance","A heterozygote has an intermediate phenotype."],
  "locus-heterogeneity":["Locus heterogeneity","Variants in different genes cause a similar phenotype."],
  "maternal-effect":["Maternal effect","The mother's genotype determines an offspring phenotype through the egg environment."],
  "mitochondrial-inheritance":["Mitochondrial inheritance","Mitochondrial DNA is transmitted through the maternal lineage."],
  nonpaternity:["Nonpaternity","The recorded father is not the biological father used for inheritance inference."],
  phenocopy:["Phenocopy","An environmental cause produces a phenotype resembling a genetic disorder."],
  pleiotropy:["Pleiotropy","One gene affects multiple traits or organ systems."],
  "reduced-penetrance":["Reduced penetrance","Some people with a disease genotype never express the phenotype."],
  "sex-influenced":["Sex influenced","A trait can occur in both sexes but its expression or dominance differs by sex."],
  "sex-limited":["Sex limited","A genotype present in both sexes is expressed in only one sex."],
  "somatic-mosaicism":["Somatic mosaicism","A postzygotic variant is confined to a subset of body cells."],
  "somatic-mutation-mosaicism":["Somatic mutation mosaicism","A DNA sequence variant is present in only a subset of somatic cells."],
  "variable-expressivity":["Variable expressivity","People who express the same disease genotype differ in severity or features."],
  "x-inactivation":["X inactivation","One X chromosome is epigenetically silenced in each somatic cell."],
  "x-linked-dominant":["X linked dominant","One pathogenic allele on the X chromosome can produce the phenotype."],
  "x-linked-recessive":["X linked recessive","The phenotype usually appears when no normal allele on another X offsets the variant."]
};
const canonicalOptionConcept = option => {
  const text=option.toLowerCase();
  const labels=["genomic imprinting","imprinting","x inactivation","epigenetic mosaicism","gonosomal mosaicism","germline mosaicism","somatic mutation mosaicism","somatic mosaicism","variable expressivity","reduced penetrance","delayed onset","locus heterogeneity","allelic heterogeneity","pleiotropy","de novo mutation","nonpaternity","phenocopy","heteroplasmy","homoplasmy","incomplete dominance","codominance","sex influenced","sex limited","x linked recessive","x linked dominant","mitochondrial inheritance","anticipation","maternal effect"];
  const label=labels.find(candidate=>text.includes(candidate));
  return (label||option.split(":")[0]).trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
};
const make = (id, stem, options, answer, rationale, concepts, confusionSet, covers=["L014"]) => {
  const number=Number(id.slice(3)), target=(number-1)%5, keyed=options[answer], ordered=options.filter((_,index)=>index!==answer);
  ordered.splice(target,0,keyed);
  const optionConcepts=ordered.map(canonicalOptionConcept);
  const contrast=optionConcepts.map((concept,index)=>{const [term,meaning]=contrastDefinitions[concept]||[ordered[index],"A distinct alternative concept in this question."];return {concept,term,meaning,why:index===target?`Fits: the stem shows ${meaning.charAt(0).toLowerCase()+meaning.slice(1)}`:`Does not fit: ${meaning.charAt(0).toLowerCase()+meaning.slice(1)}`};});
  return {id,n:365+number,...base,stem,options:ordered,answer:target,rationale,concepts,covers,confusionSet,
    optionConcepts,contrast,sourceRef:`${covers.join(" + ")} concept discrimination`};
};
const dl = [
make("DL-01","A woman carries a pathogenic LDLR variant but has repeatedly normal LDL levels. Several relatives with the same variant have hypercholesterolemia. Which concept best explains her status?",["Variable expressivity","Reduced penetrance","Delayed onset","Locus heterogeneity","Phenocopy"],1,"<strong>Reduced penetrance</strong> means a person has the genotype but no phenotype. Variable expressivity changes severity among people who express it; delayed onset requires evidence that the phenotype appears later.",["reduced-penetrance","variable-expressivity","delayed-onset"],"penetrance-vs-expressivity-vs-delayed-onset"),
make("DL-02","Three relatives with the same pathogenic allele have mild, moderate, and severe manifestations, but each is clinically affected. Which concept is illustrated?",["Reduced penetrance","Delayed onset","Variable expressivity","Phenocopy","Anticipation"],2,"<strong>Variable expressivity</strong> is variation in severity among affected carriers. Reduced penetrance would include a carrier with no phenotype; delayed onset concerns age at first manifestation.",["variable-expressivity","reduced-penetrance","delayed-onset"],"penetrance-vs-expressivity-vs-delayed-onset"),
make("DL-03","Every carrier in a family eventually develops disease, but affected status is uncommon before age 40. What best explains the apparently unaffected young carriers?",["Delayed onset","Reduced penetrance","Variable expressivity","Locus heterogeneity","Pleiotropy"],0,"<strong>Delayed onset</strong> explains carriers who have not yet reached the typical age of manifestation. Reduced penetrance means some carriers never express disease; variable expressivity changes the phenotype's degree.",["delayed-onset","reduced-penetrance","variable-expressivity"],"penetrance-vs-expressivity-vs-delayed-onset"),
make("DL-04","Pathogenic variants in LDLR, APOB, or PCSK9 can each cause a familial hypercholesterolemia phenotype. Which term applies?",["Allelic heterogeneity","Pleiotropy","Locus heterogeneity","Variable expressivity","Phenocopy"],2,"<strong>Locus heterogeneity</strong> means variants in different genes cause a similar phenotype. Allelic heterogeneity uses different variants within one gene; pleiotropy is one gene affecting multiple traits.",["locus-heterogeneity","allelic-heterogeneity","pleiotropy"],"allelic-vs-locus-heterogeneity-vs-pleiotropy"),
make("DL-05","Many distinct pathogenic variants within the CFTR gene can cause cystic fibrosis. Which term applies?",["Locus heterogeneity","Allelic heterogeneity","Pleiotropy","Reduced penetrance","Anticipation"],1,"<strong>Allelic heterogeneity</strong> means different variants in the same gene cause a disorder. Locus heterogeneity involves different genes; pleiotropy describes multiple effects from one gene.",["allelic-heterogeneity","locus-heterogeneity","pleiotropy"],"allelic-vs-locus-heterogeneity-vs-pleiotropy"),
make("DL-06","A single pathogenic FBN1 variant affects the skeleton, eyes, and cardiovascular system. Which term best describes this?",["Locus heterogeneity","Allelic heterogeneity","Pleiotropy","Phenocopy","Codominance"],2,"<strong>Pleiotropy</strong> is one gene influencing multiple organ systems. Allelic heterogeneity concerns multiple variants in one gene; locus heterogeneity concerns multiple genes producing a similar disorder.",["pleiotropy","allelic-heterogeneity","locus-heterogeneity"],"allelic-vs-locus-heterogeneity-vs-pleiotropy"),
make("DL-07","An only child has a classic autosomal dominant disorder. The pathogenic variant is absent from blood and buccal-cell testing in both confirmed biological parents. Which explanation is most likely?",["Phenocopy","Nonpaternity","De novo mutation","Reduced penetrance","Germline mosaicism"],2,"A <strong>de novo mutation</strong> in a parental gamete or early embryo is most likely for one isolated case. Parental germline mosaicism cannot be excluded completely, but becomes more likely with recurrence; nonpaternity is excluded by confirmed biological parentage.",["de-novo-mutation","nonpaternity","phenocopy"],"phenocopy-vs-nonpaternity-vs-de-novo-mutation"),
make("DL-08","A toxin produces limb defects that resemble a known genetic syndrome, but the patient lacks the syndrome's pathogenic genotype. What is this?",["De novo mutation","Phenocopy","Nonpaternity","Variable expressivity","Somatic mosaicism"],1,"A <strong>phenocopy</strong> is an environmentally caused phenotype that resembles a genetic disorder. A de novo mutation would create the causal genotype; nonpaternity is a pedigree relationship issue.",["phenocopy","de-novo-mutation","nonpaternity"],"phenocopy-vs-nonpaternity-vs-de-novo-mutation"),
make("DL-09","Apparent father-to-son transmission conflicts with a confirmed X linked condition. Testing shows the listed father is not the biological father. Which explanation resolves the pedigree?",["Phenocopy","De novo mutation","Nonpaternity","Reduced penetrance","Locus heterogeneity"],2,"<strong>Nonpaternity</strong> changes the biological relationship used to infer transmission. A phenocopy concerns phenotype without genotype; a de novo mutation does not by itself make the listed father biological.",["nonpaternity","phenocopy","de-novo-mutation"],"phenocopy-vs-nonpaternity-vs-de-novo-mutation"),
make("DL-10","Two unaffected parents have two children with the same dominant disorder. Blood testing is negative in both parents, but one parent's gametes include the variant. What is the best explanation?",["Somatic mosaicism","Germline mosaicism","Reduced penetrance","Phenocopy","Nonpaternity"],1,"<strong>Germline mosaicism</strong> places the variant in a subset of gametes, allowing recurrence without a blood finding. Somatic mosaicism affects body tissues and does not necessarily create recurrence risk.",["germline-mosaicism","somatic-mosaicism","reduced-penetrance"],"germline-vs-somatic-mosaicism"),
make("DL-11","A patient has a segmental skin disorder because a pathogenic variant arose after fertilization in a skin precursor. Gametes are not involved. Which concept fits?",["Germline mosaicism","Somatic mosaicism","Heteroplasmy","Reduced penetrance","Variable expressivity"],1,"<strong>Somatic mosaicism</strong> results from a postzygotic variant in a subset of body cells. Germline mosaicism is confined to or includes gametes; heteroplasmy specifically concerns mitochondrial DNA populations.",["somatic-mosaicism","germline-mosaicism","heteroplasmy"],"germline-vs-somatic-mosaicism"),
make("DL-12","A postzygotic variant is present in some blood cells and some sperm cells. Which statement is most accurate?",["This is only somatic mosaicism","This is only germline mosaicism","This is gonosomal mosaicism involving somatic and germline lineages","This is reduced penetrance","This is homoplasmy"],2,"<strong>Gonosomal mosaicism</strong> spans somatic and germline lineages. Calling it only somatic ignores sperm involvement; calling it only germline ignores blood involvement.",["gonosomal-mosaicism","somatic-mosaicism","germline-mosaicism"],"germline-vs-somatic-mosaicism"),
make("DL-13","All mitochondrial DNA copies sampled from a patient's cells carry the same pathogenic variant. Which term describes the DNA population?",["Heteroplasmy","Homoplasmy","Reduced penetrance","Germline mosaicism","Variable expressivity"],1,"<strong>Homoplasmy</strong> means the mitochondrial DNA copies are uniform at the locus. Heteroplasmy is a mixture of genotypes; reduced penetrance describes phenotype absence despite a genotype.",["homoplasmy","heteroplasmy","reduced-penetrance"],"homoplasmy-vs-heteroplasmy-vs-reduced-penetrance",["L006"]),
make("DL-14","A muscle biopsy contains both normal and mutant mitochondrial genomes, and symptom severity tracks with the mutant fraction. Which term applies?",["Homoplasmy","Reduced penetrance","Heteroplasmy","Locus heterogeneity","Somatic mosaicism"],2,"<strong>Heteroplasmy</strong> is coexistence of different mitochondrial genomes, often with threshold-dependent severity. Homoplasmy is uniform mtDNA; reduced penetrance is a phenotype probability concept.",["heteroplasmy","homoplasmy","reduced-penetrance"],"homoplasmy-vs-heteroplasmy-vs-reduced-penetrance",["L006"]),
make("DL-15","A person has the same pathogenic nuclear genotype in essentially every cell but never develops the expected phenotype. Which term applies?",["Heteroplasmy","Homoplasmy","Reduced penetrance","Somatic mosaicism","Variable expressivity"],2,"<strong>Reduced penetrance</strong> describes nonexpression of a disease genotype. Heteroplasmy and homoplasmy describe mitochondrial genotype mixtures, not whether a nuclear genotype manifests.",["reduced-penetrance","heteroplasmy","homoplasmy"],"homoplasmy-vs-heteroplasmy-vs-reduced-penetrance"),
make("DL-16","A heterozygote displays both A and B red cell antigens distinctly. What inheritance pattern is shown?",["Incomplete dominance","Codominance","Variable expressivity","Sex influenced inheritance","Pleiotropy"],1,"<strong>Codominance</strong> means both allelic products are distinctly expressed. Incomplete dominance produces an intermediate phenotype rather than simultaneous separate products.",["codominance","incomplete-dominance"],"codominance-vs-incomplete-dominance"),
make("DL-17","Red-flowered and white-flowered homozygotes produce pink heterozygotes. Which pattern is shown?",["Codominance","Incomplete dominance","Reduced penetrance","Pleiotropy","Allelic heterogeneity"],1,"<strong>Incomplete dominance</strong> gives the heterozygote an intermediate phenotype. Codominance would display both parental products distinctly rather than blending them.",["incomplete-dominance","codominance"],"codominance-vs-incomplete-dominance"),
make("DL-18","At one locus, a heterozygote makes two electrophoretically distinguishable enzyme products. Which term is most precise?",["Incomplete dominance","Codominance","Locus heterogeneity","Variable expressivity","Imprinting"],1,"<strong>Codominance</strong> is separate detectable expression of both alleles. Incomplete dominance refers to an intermediate phenotype, not two distinct products.",["codominance","incomplete-dominance"],"codominance-vs-incomplete-dominance"),
make("DL-19","A pathogenic genotype causes precocious puberty in males but has no corresponding manifestation in females. Which pattern best fits?",["Sex influenced","Sex limited","X linked recessive","Reduced penetrance","Genomic imprinting"],1,"A <strong>sex limited</strong> trait is expressed in only one sex despite genes being present in both. Sex influenced traits can occur in both sexes but differ in dominance or frequency.",["sex-limited","sex-influenced"],"sex-limited-vs-sex-influenced"),
make("DL-20","A trait occurs in both sexes, but the same heterozygous genotype is phenotypically dominant in males and recessive in females. Which pattern fits?",["Sex limited","Sex influenced","X linked dominant","Variable expressivity","Mitochondrial inheritance"],1,"A <strong>sex influenced</strong> trait is expressed differently depending on sex and may show sex-dependent dominance. Sex limited traits are expressed in only one sex.",["sex-influenced","sex-limited"],"sex-limited-vs-sex-influenced"),
make("DL-21","A milk-production trait is governed by autosomal genes present in males and females but is phenotypically expressed only in females. Which term is most precise?",["Sex influenced","Sex limited","X inactivation","Maternal effect","Reduced penetrance"],1,"<strong>Sex limited</strong> describes an autosomal genotype expressed in only one sex. Sex influenced traits may appear in both sexes with different frequency or dominance.",["sex-limited","sex-influenced"],"sex-limited-vs-sex-influenced"),
make("DL-22","Expression of an autosomal allele depends on whether it was inherited from the mother or father. Which mechanism best fits?",["X inactivation","Genomic imprinting","Epigenetic mosaicism","Codominance","Anticipation"],1,"<strong>Genomic imprinting</strong> is parent-of-origin dependent autosomal expression. X inactivation silences one X chromosome; epigenetic mosaicism describes cell-to-cell regulatory differences.",["genomic-imprinting","x-inactivation","epigenetic-mosaicism"],"imprinting-vs-x-inactivation-vs-epigenetic-mosaicism",["L012"]),
make("DL-23","A heterozygous female has patches of cells expressing different X linked alleles because one X was randomly silenced early in development. Which mechanism is responsible?",["Genomic imprinting","X inactivation","Epigenetic mosaicism without chromosome-wide silencing","Allelic heterogeneity","Reduced penetrance"],1,"<strong>X inactivation</strong> creates clonal patches through chromosome-wide X silencing. Imprinting depends on parental origin; generic epigenetic mosaicism does not specify X-wide dosage compensation.",["x-inactivation","genomic-imprinting","epigenetic-mosaicism"],"imprinting-vs-x-inactivation-vs-epigenetic-mosaicism",["L012"]),
make("DL-24","Genetically identical somatic cells maintain different stable methylation states at an autosomal locus, producing patches of expression. Parent of origin is irrelevant. What is this?",["Genomic imprinting","X inactivation","Epigenetic mosaicism","Somatic mutation mosaicism","Codominance"],2,"<strong>Epigenetic mosaicism</strong> is stable cell-to-cell regulatory variation without a DNA sequence difference. Imprinting requires parent-of-origin marking; X inactivation is chromosome-wide dosage compensation.",["epigenetic-mosaicism","genomic-imprinting","x-inactivation"],"imprinting-vs-x-inactivation-vs-epigenetic-mosaicism",["L012"])
];

const existingDl = bank.filter(q => /^DL-\d\d$/.test(q.id));
if (existingDl.length) bank = bank.filter(q => !/^DL-\d\d$/.test(q.id));
bank.push(...dl);

fs.writeFileSync(bankPath, `${JSON.stringify(bank, null, 2)}\n`);
let html = fs.readFileSync(htmlPath, "utf8");
const start = html.indexOf("let BANK = ") + "let BANK = ".length;
const end = html.indexOf(";\nconst META =", start);
if (start < "let BANK = ".length || end < 0) throw new Error("Could not locate embedded BANK");
html = `${html.slice(0,start)}${JSON.stringify(bank)}${html.slice(end)}`;
fs.writeFileSync(htmlPath, html);
console.log(`Upgraded ${bank.length} questions; added ${dl.length} confusion-lab items.`);
