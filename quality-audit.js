/* Content-quality audit for bank.json. Run: node quality-audit.js [path] */
const fs = require("fs");

const path = process.argv[2] || "bank.json";
const dashRe = /[-\u2010-\u2015]/;
const stripHtml = value => String(value).replace(/<[^>]*>/g, " ").replace(/&[a-z]+;|&#\d+;/gi, " ");
const normalize = value => stripHtml(value).normalize("NFKC").toLowerCase()
  .replace(/[\u2010-\u2015]/g, "-").replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
const pct = value => `${(value * 100).toFixed(2)}%`;

let bank;
try { bank = JSON.parse(fs.readFileSync(path, "utf8")); }
catch (error) { console.error(`MALFORMED: ${error.message}`); process.exit(1); }
if (!Array.isArray(bank)) { console.error("MALFORMED: bank root must be an array"); process.exit(1); }

const fatal = [];
const seen = new Set();
for (const [index, q] of bank.entries()) {
  if (!q || typeof q !== "object") { fatal.push(`entry ${index} is not an object`); continue; }
  if (!q.id || seen.has(q.id)) fatal.push(!q.id ? `entry ${index} has no id` : `duplicate id ${q.id}`);
  seen.add(q.id);
  if (q.type === "mcq" && (!Array.isArray(q.options) || !Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length)) fatal.push(`invalid MCQ answer/options: ${q.id}`);
}
if (fatal.length) { fatal.forEach(message => console.error(`MALFORMED: ${message}`)); process.exit(1); }

const mcq = bank.filter(q => q.type === "mcq");
const byCount = Object.fromEntries([...new Set(mcq.map(q => q.options.length))].sort((a,b)=>a-b).map(n => [n, mcq.filter(q => q.options.length === n).length]));
const uniqueDash = mcq.filter(q => q.options.filter(option => dashRe.test(stripHtml(option))).length === 1);
const dashCorrect = uniqueDash.filter(q => dashRe.test(stripHtml(q.options[q.answer]))).length;
const dashRandom = uniqueDash.reduce((sum, q) => sum + 1 / q.options.length, 0) / (uniqueDash.length || 1);
const dashScore = dashCorrect / (uniqueDash.length || 1);

const exactDupes = [], normalizedDupes = [];
for (const q of mcq) {
  const exact = q.options.map(String), norm = q.options.map(normalize);
  if (new Set(exact).size !== exact.length) exactDupes.push(q.id);
  if (new Set(norm).size !== norm.length) normalizedDupes.push(q.id);
}

const uniqueLongest = mcq.filter(q => {
  const lengths = q.options.map(option => normalize(option).length), max = Math.max(...lengths);
  return lengths[q.answer] === max && lengths.filter(length => length === max).length === 1;
});
const longestRandom = mcq.reduce((sum, q) => sum + 1 / q.options.length, 0) / (mcq.length || 1);

const parallel = {mixedTerminalPunctuation:[], mixedInitialCapitalization:[], lengthOutlier:[]};
for (const q of mcq) {
  const clean = q.options.map(option => stripHtml(option).trim());
  const punct = clean.map(option => /[.!?;:]$/.test(option));
  if (punct.some(Boolean) && punct.some(value => !value)) parallel.mixedTerminalPunctuation.push(q.id);
  const caps = clean.map(option => /^\p{Lu}/u.test(option));
  if (caps.some(Boolean) && caps.some(value => !value)) parallel.mixedInitialCapitalization.push(q.id);
  const lengths = clean.map(option => option.length).sort((a,b)=>a-b), median = lengths[Math.floor(lengths.length / 2)] || 1;
  if (Math.max(...lengths) / median >= 2.25) parallel.lengthOutlier.push(q.id);
}

const topicRows = [...new Set(mcq.map(q => q.topic))].map(topic => {
  const questions = uniqueDash.filter(q => q.topic === topic), correct = questions.filter(q => dashRe.test(stripHtml(q.options[q.answer]))).length;
  const random = questions.reduce((sum,q)=>sum+1/q.options.length,0)/(questions.length||1);
  return {topic, count:questions.length, score:correct/(questions.length||1), random};
});

console.log(`Bank: ${bank.length} questions (${mcq.length} MCQs)`);
console.log(`Option counts: ${JSON.stringify(byCount)}`);
console.log(`Unique dash/hyphen: ${uniqueDash.length}; heuristic ${dashCorrect}/${uniqueDash.length} = ${pct(dashScore)}; weighted random = ${pct(dashRandom)}; delta = ${((dashScore-dashRandom)*100).toFixed(2)} pp`);
for (const row of topicRows) console.log(`  ${row.topic}: n=${row.count}, heuristic=${pct(row.score)}, random=${pct(row.random)}, delta=${((row.score-row.random)*100).toFixed(2)} pp`);
console.log(`Unique-longest keyed option: ${uniqueLongest.length}/${mcq.length} = ${pct(uniqueLongest.length/(mcq.length||1))}; weighted random = ${pct(longestRandom)}`);
console.log(`Exact duplicate-choice sets: ${exactDupes.length}${exactDupes.length ? ` (${exactDupes.join(", ")})` : ""}`);
console.log(`Normalized duplicate-choice sets: ${normalizedDupes.length}${normalizedDupes.length ? ` (${normalizedDupes.join(", ")})` : ""}`);
console.log(`Parallel-style flags: terminal punctuation=${parallel.mixedTerminalPunctuation.length}, initial capitalization=${parallel.mixedInitialCapitalization.length}, length outlier=${parallel.lengthOutlier.length}`);
for (const [kind, ids] of Object.entries(parallel)) if (ids.length) console.log(`  ${kind}: ${ids.join(", ")}`);
