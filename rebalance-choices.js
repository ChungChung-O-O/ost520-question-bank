#!/usr/bin/env node
/* Apply reviewed distractor rewrites without changing IDs, keys, or rationales. */
const fs = require("fs");

const rewrites = {
  "A2-25": [
    "Angelman syndrome — loss of the maternally expressed 15q11-q13 contribution",
    "Prader-Willi syndrome — loss of the paternally expressed 15q11-q13 contribution",
    "Prader-Willi syndrome — loss of the maternally expressed 15q11-q13 contribution",
    "Angelman syndrome — loss of the paternally expressed 15q11-q13 contribution",
    "Prader-Willi syndrome — biallelic expression of 15q11-q13"
  ],
  "A2-27": [
    "MZ twins share all their alleles whereas DZ twins share about half, so the comparison itself is invalid",
    "MZ twins may receive more similar treatment than DZ twins, violating the equal-environments assumption",
    "Heritability cannot be estimated unless MZ concordance is exactly 100%",
    "DZ twins raised together do not share meaningful environmental exposures",
    "Equal MZ and DZ concordance necessarily proves that the phenotype is not familial"
  ],
  "A2-14": [
    "Low cholesterol retains SREBP in the ER, reducing LDL-receptor transcription",
    "Low cholesterol permits Golgi cleavage of SREBP, whose released domain increases LDL-receptor transcription",
    "Low cholesterol sends SREBP to lysosomes, increasing LDL-receptor recycling without transcription",
    "High cholesterol permits Golgi cleavage of SREBP, increasing LDL-receptor transcription",
    "Low cholesterol lets intact membrane-bound SREBP enter the nucleus without proteolysis"
  ],
  "L022-03": [
    "MZ 100% / DZ 25%; fingerprints, because high MZ concordance proves environmental causation",
    "MZ 25% / DZ 25%; measles, because similar concordance can coexist with low heritability",
    "MZ 65% / DZ 27%; schizophrenia, because any MZ–DZ gap proves purely environmental causation",
    "MZ 100% / DZ 100%; multiple sclerosis, because equal concordance proves high heritability",
    "MZ 0% / DZ 0%; cleft lip, because absent concordance proves a shared exposure"
  ],
  "L021-09": [
    "Fragile X is coding and produces polyglutamine; Huntington is non-coding",
    "Fragile X is non-coding; Huntington is coding and produces a polyglutamine tract",
    "Both expansions are coding and therefore produce polyglutamine tracts",
    "Both expansions are non-coding and silence their genes by methylation",
    "Both occur in promoters, but only Huntington alters transcript abundance"
  ],
  "L021-08": [
    "Genomic imprinting caused by progressive promoter methylation",
    "Genetic anticipation caused by expansion of an unstable trinucleotide repeat",
    "Variable expressivity caused by random X-inactivation",
    "Locus heterogeneity caused by new genes contributing each generation",
    "Reduced penetrance caused by age-dependent loss of the mutant allele"
  ],
  "A2-02": [
    "Each tissue-specific isoform must be encoded by a separate gene",
    "One gene can produce tissue-specific protein isoforms through alternative splicing",
    "Alternative splicing changes genomic DNA differently in each tissue",
    "Alternative splicing occurs only when the original transcript is defective",
    "One transcript can be translated in several reading frames without RNA processing"
  ],
  "L014-11": [
    "Sex-influenced traits are X-linked; sex-limited traits are Y-linked",
    "Sex-influenced traits occur in both sexes at different frequencies; sex-limited traits are expressed in only one sex",
    "Sex-influenced traits occur in one sex only; sex-limited traits occur in both at different frequencies",
    "Sex-influenced traits require hormones; sex-limited traits require mitochondrial inheritance",
    "Sex-influenced and sex-limited are equivalent terms for autosomal traits"
  ],
  "A2-08": [
    "The G2 checkpoint tests spindle attachment; metaphase tests whether replication is complete",
    "The metaphase spindle checkpoint tests attachment; G2 tests completion of DNA replication",
    "The G1 checkpoint tests spindle attachment; G2 tests chromosome separation",
    "The S-phase checkpoint tests chromosome separation; metaphase tests DNA damage repair",
    "The chromosome-segregation checkpoint acts before spindle attachment is assessed"
  ],
  "L012-08": [
    "The zygote preserves both methylation and imprints; primordial germ cells later erase only non-imprinted methylation",
    "The zygote erases most methylation but protects imprints; primordial germ cells later erase and reset imprints",
    "Both events erase genomic imprints, but only the zygote restores totipotency",
    "Both events preserve genomic imprints while removing histone acetylation",
    "Only somatic cells undergo the second event, allowing tissue-specific imprinting"
  ],
  "A2-29": [
    "0.4 mg beginning at the first prenatal visit; approximately 10% prevention",
    "4 mg beginning one month before conception through the first two gestational months; approximately 50–70% prevention",
    "4 mg beginning after neural-tube closure; approximately 50–70% prevention",
    "0.4 mg beginning one month before conception; approximately 90–100% prevention",
    "1 mg beginning in the second trimester; approximately 30% prevention"
  ],
  "L011-05": [
    "Binding the TATA box in place of the basal transcription machinery",
    "Directly unwinding the entire gene so RNA polymerase II no longer needs a promoter",
    "Adding the 5′ cap and poly-A tail before transcription begins",
    "Recruiting co-activators and general transcription factors that make the promoter accessible to RNA polymerase II",
    "Covalently modifying the DNA sequence to create a new promoter"
  ],
  "D10": [
    "Selection bias caused by differential enrollment",
    "Recall bias, a form of information bias",
    "Confounding caused by unequal exposure prevalence",
    "Lead-time bias caused by earlier diagnosis",
    "Observer bias caused by unequal outcome assessment"
  ],
  "A2-11": [
    "ATP, linking methylation directly to cellular energy charge",
    "S-adenosylmethionine, linking methylation to one-carbon metabolism",
    "NADPH, linking methylation to the pentose-phosphate pathway",
    "Acetyl-CoA, linking DNA methylation to histone acetylation",
    "Tetrahydrobiopterin, linking methylation to aromatic amino-acid synthesis"
  ],
  "ALT-02": [
    "Related parents generate new recessive mutations more frequently during gametogenesis",
    "Related parents are more likely to carry the same rare allele inherited from a shared ancestor",
    "Related parents carry more recessive alleles overall than unrelated parents",
    "Dominant alleles become recessive when inherited from two related parents",
    "Consanguinity selectively increases meiotic nondisjunction of autosomes"
  ],
  "L010-04": [
    "CDK levels fluctuate while cyclin abundance is constant; CDK synthesis controls phase transitions",
    "Cyclin levels fluctuate while CDK abundance is relatively constant; cyclin binding controls CDK activity",
    "Cyclins phosphorylate their partner CDKs and are therefore the catalytic subunits",
    "Each cyclin binds only one unique CDK, and neither partner is reused in another phase",
    "Cyclins inhibit CDKs until both proteins are degraded at the same checkpoint"
  ],
  "L023-01": [
    "A hypertonic solution; water leaves the cell down its water-concentration gradient",
    "A hypotonic solution; water leaves the cell down its osmotic gradient",
    "An isotonic solution; water leaves while impermeant solute enters",
    "A hypertonic solution; impermeant solute leaves and pulls water with it",
    "A hypotonic solution; extracellular osmotic pressure compresses the cell"
  ],
  "L009-05": [
    "Sigma supplies the catalytic activity required to polymerize RNA",
    "Sigma recognizes promoter sequences and directs the core polymerase to transcription start sites",
    "Sigma proofreads the RNA transcript through 3′→5′ exonuclease activity",
    "Sigma terminates transcription by recognizing the polyadenylation signal",
    "Sigma adds the 5′ cap before the core polymerase begins elongation"
  ]
};

const htmlPath = "index.html", jsonPath = "bank.json";
const html = fs.readFileSync(htmlPath, "utf8");
const marker = "const BANK = ", endMarker = ";\nconst META =";
const start = html.indexOf(marker), end = html.indexOf(endMarker, start);
if (start < 0 || end < 0) throw new Error("Embedded BANK markers not found.");
const bank = JSON.parse(html.slice(start + marker.length, end));
for (const [id, options] of Object.entries(rewrites)) {
  const question = bank.find(item => item.id === id);
  if (!question) throw new Error(`Unknown question: ${id}`);
  if (question.type !== "mcq" || options.length !== question.options.length) throw new Error(`Option-count mismatch: ${id}`);
  question.options = options;
}
const serialized = JSON.stringify(bank);
fs.writeFileSync(htmlPath, html.slice(0, start + marker.length) + serialized + html.slice(end));
fs.writeFileSync(jsonPath, `${JSON.stringify(bank, null, 2)}\n`);
console.log(`Rebalanced ${Object.keys(rewrites).length} high-leakage questions.`);
