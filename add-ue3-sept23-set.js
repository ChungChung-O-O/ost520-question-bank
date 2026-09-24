#!/usr/bin/env node
/* Integrate the reviewed UE3 September 23 block (L060-L063) plus the calibrated
   L064 A/B pair and 19 rapid-recall prompts. Append-only: every prior item, id,
   answer index and saved-progress fingerprint is preserved. Idempotent. */
const fs = require("fs");
const htmlPath = "index.html", jsonPath = "bank.json";
const sourcePath = "ue3/september23_block.json";
const marker = "let BANK = ", endMarker = ";\nconst META =";
const PRIOR_SIZE = 863, ADD = 49, NEW_SIZE = PRIOR_SIZE + ADD;

const incoming = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const mcq = incoming.filter(q => q.type === "mcq"), recall = incoming.filter(q => q.type === "worked");
if (incoming.length !== ADD || mcq.length !== 30 || recall.length !== 19) throw new Error(`unexpected counts ${incoming.length}/${mcq.length}/${recall.length}`);
if (new Set(incoming.map(q => q.id)).size !== ADD) throw new Error("duplicate incoming id");
if (mcq.some(q => !/^OQ5-L06[0-4]-C\d[AB]$/.test(q.id))) throw new Error("bad MCQ id");
if (recall.some(q => !/^RQ5-L06[0-8]-(?:F\d\d|\d\d)$/.test(q.id))) throw new Error("bad recall id");
if (incoming.some(q => q.unit !== "UE3" || q.course !== "OST520" || q.holdout || q.requiresMedia)) throw new Error("unit, holdout or media guard");
if (mcq.some(q => !/^sept2[34]-practice$/.test(q.source) || q.reasoningOrder < 2)) throw new Error("mcq source/reasoning-order guard");
if (recall.some(q => !/^sept2[34]-recall$/.test(q.source) || q.options.length !== 0 || q.answer !== null || !/<strong>Answer:<\/strong>/.test(q.rationale))) throw new Error("recall guard");
if (mcq.some(q => q.options.length !== 5 || new Set(q.options).size !== 5)) throw new Error("options");
if (mcq.some(q => !Array.isArray(q.optionExplanations) || q.optionExplanations.length !== 5 || q.optionExplanations.some(t => typeof t !== "string" || t.trim().length < 40))) throw new Error("explanations");
if (mcq.some(q => !Number.isInteger(q.answer) || q.answer < 0 || q.answer > 4 || !q.closestDistractor || q.closestDistractor.index === q.answer || !/The trap/.test(q.rationale))) throw new Error("answer, closest distractor or trap guard");
if (JSON.stringify(incoming).includes("—")) throw new Error("em dash in content");
for (const prefix of new Set(mcq.map(q => q.id.slice(0, -1)))) {
  const pair = mcq.filter(q => q.id.slice(0, -1) === prefix);
  if (pair.length !== 2 || pair[0].stem === pair[1].stem || pair[0].concepts[0] !== pair[1].concepts[0]) throw new Error(`bad A/B pair ${prefix}`);
}

let html = fs.readFileSync(htmlPath, "utf8");
const start = html.indexOf(marker), end = html.indexOf(endMarker, start);
if (start < 0 || end < 0) throw new Error("embedded bank markers missing");
const oldBank = JSON.parse(html.slice(start + marker.length, end));
const clean = q => { const c = { ...q }; delete c.n; return c; };
const oldIds = new Set(oldBank.map(q => q.id));
const present = incoming.filter(q => oldIds.has(q.id));
if (present.length !== 0 && present.length !== ADD) throw new Error(`partial prior integration ${present.length}/${ADD}`);
let bank = oldBank;
if (present.length === 0) {
  if (oldBank.length !== PRIOR_SIZE) throw new Error(`expected prior bank ${PRIOR_SIZE}, got ${oldBank.length}`);
  bank = [...oldBank, ...incoming.map(q => ({ ...q }))];
} else {
  for (const q of incoming) if (JSON.stringify(clean(bank.find(x => x.id === q.id))) !== JSON.stringify(clean(q))) throw new Error(`integrated item drift ${q.id}`);
}
const topicNumbers = {};
for (const q of bank) { q.n = (topicNumbers[q.topic] || 0) + 1; topicNumbers[q.topic] = q.n; }
if (bank.length !== NEW_SIZE || new Set(bank.map(q => q.id)).size !== NEW_SIZE) throw new Error(`unexpected bank size ${bank.length}`);
for (const old of oldBank.slice(0, PRIOR_SIZE)) {
  const now = bank.find(q => q.id === old.id);
  if (!now || JSON.stringify(clean(now)) !== JSON.stringify(clean(old)) || now.answer !== old.answer || now.n !== old.n) throw new Error(`prior item changed ${old.id}`);
}
html = html.slice(0, start + marker.length) + JSON.stringify(bank) + html.slice(end);

const ids = f => incoming.filter(f).map(q => q.id);
const sept23 = ["L060", "L061", "L062", "L063"];
const dayA = [...ids(q => q.type === "mcq" && sept23.includes(q.sourceBlock) && q.id.endsWith("A")), ...ids(q => q.source === "sept23-recall")];
const fri = [...ids(q => q.source === "sept24-recall"), "OQ5-L064-C1A"];
const dayB = ids(q => q.type === "mcq" && sept23.includes(q.sourceBlock) && q.id.endsWith("B"));
const sun = ["OQ5-L064-C1B"];
if (dayA.length !== 29 || dayB.length !== 14 || fri.length !== 5) throw new Error(`route sizes ${dayA.length}/${fri.length}/${dayB.length}`);

const oldUnit = '{id:"UE3", name:"Unit 3", exam:"2026-10-09", dailyCap:22, blurb:"Not yet built"}';
if (html.includes(oldUnit)) {
  const unit = `{id:"UE3", name:"Unit 3", exam:"2026-10-09", dailyCap:36, blurb:"Humoral immunity, B-cell development, host-pathogen interactions, molecular diagnostic techniques; application questions plus rapid recall",
      plan:[
       {date:"2026-09-24",blocks:${JSON.stringify(sept23)},questionIds:${JSON.stringify(dayA)},note:"Thursday morning: Sept 23 block Day A (14 application questions) plus 15 rapid-recall prompts"},
       {date:"2026-09-25",blocks:["L064","L065","L068"],questionIds:${JSON.stringify(fri)},note:"Friday: rapid recall from Sept 24 videos plus the calibrated L064 A item"},
       {date:"2026-09-26",blocks:${JSON.stringify(sept23)},questionIds:${JSON.stringify(dayB)},note:"Saturday Session B delayed transfer retest of the Sept 23 block"},
       {date:"2026-09-27",blocks:["L064"],questionIds:${JSON.stringify(sun)},note:"Sunday delayed transfer retest of the L064 pair"}
      ],
      taught:{"L060":"2026-09-23","L061":"2026-09-23","L062":"2026-09-23","L063":"2026-09-23","L064":"2026-09-24","L065":"2026-09-24","L068":"2026-09-24"}}`;
  html = html.replace(oldUnit, unit);
} else if (!html.includes('date:"2026-09-24",blocks:["L060"')) throw new Error("UE3 unit anchor missing");

const tabUE2 = '<button type="button" role="tab" data-unit-tab="UE2" aria-selected="false">Unit 2</button>';
if (!html.includes('data-unit-tab="UE3"')) {
  if (!html.includes(tabUE2)) throw new Error("unit tab anchor missing");
  html = html.replace(tabUE2, tabUE2 + '\n      <button type="button" role="tab" data-unit-tab="UE3" aria-selected="false">Unit 3</button>');
}
const cardAnchor = '$("releasecard").innerHTML = SCOPE.unit==="UE2"';
if (!html.includes('SCOPE.unit==="UE3"')) {
  if (!html.includes(cardAnchor)) throw new Error("release card anchor missing");
  html = html.replace(cardAnchor, `$("releasecard").innerHTML = SCOPE.unit==="UE3"
    ? \`<p class="label" style="margin:0">Unit 3 · Sept 23 block</p><p style="margin:10px 0 0;font-family:'Source Serif 4',Georgia,serif;font-size:15.5px"><strong>49 questions are ready now.</strong> 30 application questions (15 A/B concept pairs) and 19 rapid-recall prompts cover L060-L063, with the calibrated L064 pair and Sept 24 recall prompts routed after those videos. Thursday serves 14 application questions plus 15 recall prompts; Saturday serves the 14 B transfer items.</p><p class="note">Recall prompts are self-marked: say the answer, reveal, then mark it. Answer every recall prompt before revealing. Live L066 and L067 are pending their recordings.</p>\`
    : SCOPE.unit==="UE2"`);
}
html = html.replace(/863-question OST 520 bank for Unit Exams 1 and 2/g, "912-question OST 520 bank for Unit Exams 1, 2 and 3");
const priorFingerprint = '"fnv1a-89e3dcab-863"';
if (!html.includes(priorFingerprint)) {
  const compat = '"fnv1a-7055f0cd-837"';
  if (!html.includes(compat)) throw new Error("compatibility fingerprint anchor missing");
  html = html.replace(compat, compat + ',' + priorFingerprint);
}
fs.writeFileSync(htmlPath, html);
fs.writeFileSync(jsonPath, `${JSON.stringify(bank, null, 2)}\n`);
console.log(`bank ${oldBank.length}->${bank.length}; Thu ${dayA.length}; Fri ${fri.length}; Sat ${dayB.length}; Sun ${sun.length}.`);
