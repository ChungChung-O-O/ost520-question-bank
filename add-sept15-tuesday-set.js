#!/usr/bin/env node
/* Integrate the privately reviewed Tuesday L047-L051 set. The 26 items are
   append-only, with A items routed on September 15 and B transfer items on
   September 18. L050/L051 retain their provisional, PDF-only provenance. */
const fs = require("fs");
const htmlPath = "index.html", jsonPath = "bank.json";
const sourcePath = "week4/september15_tuesday.json";
const marker = "let BANK = ", endMarker = ";\nconst META =";

const raw = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const srcByTopic = {"Biochemistry":"B", "Hematology & Physiology":"H"};
const incoming = raw.map(q => ({...q, source:"sept15-practice", src:srcByTopic[q.topic]}));
const blockCounts = incoming.reduce((counts,q)=>(counts[q.sourceBlock]=(counts[q.sourceBlock]||0)+1,counts),{});
if (incoming.length !== 26) throw new Error(`Expected 26, got ${incoming.length}`);
if (JSON.stringify(blockCounts) !== JSON.stringify({L047:6,L048:6,L049:6,L050:2,L051:6})) throw new Error(`unexpected source-block counts: ${JSON.stringify(blockCounts)}`);
if (new Set(incoming.map(q=>q.id)).size !== 26 || incoming.some(q=>!/^OQ4-L0(?:47|48|49|50|51)-C\d[AB]$/.test(q.id))) throw new Error("bad or duplicate Tuesday id");
if (incoming.some(q=>q.source!=="sept15-practice" || !q.src || q.unit!=="UE2" || q.course!=="OST520" || q.type!=="mcq")) throw new Error("bad release tag");
if (incoming.some(q=>q.holdout || q.requiresMedia || q.reasoningOrder<2)) throw new Error("holdout, media, or reasoning-order failure");
if (incoming.some(q=>!Array.isArray(q.options) || q.options.length!==5 || new Set(q.options).size!==5)) throw new Error("options");
if (incoming.some(q=>!Array.isArray(q.optionExplanations) || q.optionExplanations.length!==5 || q.optionExplanations.some(t=>typeof t!=="string" || t.trim().length<40))) throw new Error("explanations");
if (incoming.some(q=>!q.closestDistractor || q.closestDistractor.index===q.answer || !Number.isInteger(q.answer) || q.answer<0 || q.answer>4)) throw new Error("answer or closest distractor");
for (const prefix of new Set(incoming.map(q=>q.id.slice(0,-1)))) {
  const pair = incoming.filter(q=>q.id.slice(0,-1)===prefix);
  if (pair.length!==2 || new Set(pair.map(q=>q.id.at(-1))).size!==2 || pair[0].stem===pair[1].stem) throw new Error(`bad A/B pair ${prefix}`);
}
const provisional = incoming.filter(q=>q.provisional);
if (provisional.length!==8 || provisional.some(q=>!["L050","L051"].includes(q.sourceBlock) || !/faculty PDF only/i.test(q.provisional) || /transcript/i.test(q.sourceRef))) throw new Error("provisional-source guard failed");
if (incoming.some(q=>!["L050","L051"].includes(q.sourceBlock) && q.provisional)) throw new Error("source-final item marked provisional");

let html = fs.readFileSync(htmlPath,"utf8");
const start = html.indexOf(marker), end = html.indexOf(endMarker,start);
if (start<0 || end<0) throw new Error("embedded bank markers missing");
const oldBank = JSON.parse(html.slice(start+marker.length,end));
const oldIds = new Set(oldBank.map(q=>q.id));
const present = incoming.filter(q=>oldIds.has(q.id));
if (present.length!==0 && present.length!==incoming.length) throw new Error(`partial prior integration: ${present.length}/26`);

let bank = oldBank;
if (present.length===0) bank=[...oldBank,...incoming];
else {
  const clean=q=>{const copy={...q};delete copy.n;return copy;};
  for (const q of incoming) {
    const existing=bank.find(item=>item.id===q.id);
    if (JSON.stringify(clean(existing))!==JSON.stringify(clean(q))) throw new Error(`integrated item drift: ${q.id}`);
  }
}
const topicNumbers={};
for (const q of bank) { q.n=(topicNumbers[q.topic]||0)+1;topicNumbers[q.topic]=q.n; }
if (bank.length!==863 || new Set(bank.map(q=>q.id)).size!==863) throw new Error(`unexpected bank size ${bank.length}`);
for (const old of oldBank) {
  const now=bank.find(q=>q.id===old.id), clean=q=>{const copy={...q};delete copy.n;return copy;};
  if (!now || JSON.stringify(clean(now))!==JSON.stringify(clean(old)) || now.answer!==old.answer) throw new Error(`prior item changed: ${old.id}`);
}
html=html.slice(0,start+marker.length)+JSON.stringify(bank)+html.slice(end);

const dayA=incoming.filter(q=>q.id.endsWith("A")).map(q=>q.id);
const dayB=incoming.filter(q=>q.id.endsWith("B")).map(q=>q.id);
if (dayA.length!==13 || dayB.length!==13) throw new Error("Tuesday route size");
const planA=`{date:"2026-09-15",blocks:["L047","L048","L049","L050","L051"],questionIds:${JSON.stringify(dayA)},note:"Tuesday Session A after L047-L051 teaching"}`;
const planB=`{date:"2026-09-18",blocks:["L047","L048","L049","L050","L051"],questionIds:${JSON.stringify(dayB)},note:"Friday Session B delayed transfer retest of Tuesday material"}`;
const hasA=html.includes('date:"2026-09-15"'),hasB=html.includes('date:"2026-09-18"');
if (hasA!==hasB) throw new Error("partial prior Tuesday routing integration");
if (!hasA) {
  const anchorA='{date:"2026-09-16",blocks:';
  if (!html.includes(anchorA)) throw new Error("September 16 plan anchor missing");
  html=html.replace(anchorA,planA+',\n       '+anchorA);
  const anchorB='note:"Wednesday Day B delayed retest of Monday material"}';
  if (!html.includes(anchorB)) throw new Error("September 18 plan anchor missing");
  html=html.replace(anchorB,anchorB+',\n       '+planB);
}
if (!html.includes('"L047":"2026-09-15"')) {
  const taughtEnd='"L046":"2026-09-14"}';
  if (!html.includes(taughtEnd)) throw new Error("UE2 taught-map insertion point missing");
  html=html.replace(taughtEnd,'"L046":"2026-09-14","L047":"2026-09-15","L048":"2026-09-15","L049":"2026-09-15","L050":"2026-09-15","L051":"2026-09-15"}');
}
html=html.replace(/837-question OST 520 bank/g,"863-question OST 520 bank");
const priorFingerprint='"fnv1a-7055f0cd-837"';
if (!html.includes(priorFingerprint)) {
  const compatibility='"fnv1a-3fdb4259-811"';
  if (!html.includes(compatibility)) throw new Error("compatibility fingerprint anchor missing");
  html=html.replace(compatibility,compatibility+','+priorFingerprint);
}
html=html.replace(
  /<p class="label" style="margin:0">Unit 2 · Monday release<\/p><p style="margin:10px 0 0;font-family:'Source Serif 4',Georgia,serif;font-size:15\.5px"><strong>224 questions are ready now\.<\/strong> The newest 26 cover L042-L046 as 13 distinct A\/B concept pairs\. Monday Day A and Wednesday Day B each serve 13 new questions plus one approved C042-1 question under its existing ID\. After you check an answer, every choice explains why it is correct or incorrect\.<\/p><p class="note">Use 13–22 questions total per day\. Existing IDs and saved progress remain compatible; the reused pair keeps its prior attempt history\.<\/p>/,
  `<p class="label" style="margin:0">Unit 2 · Tuesday release candidate</p><p style="margin:10px 0 0;font-family:'Source Serif 4',Georgia,serif;font-size:15.5px"><strong>250 questions are ready in this private candidate.</strong> The newest 26 cover L047-L051 as 13 distinct A/B concept pairs. Tuesday Session A and Friday Session B each serve 13 new questions. After you check an answer, every choice explains why it is correct or incorrect.</p><p class="note">Eight L050/L051 items retain provisional PDF-only provenance pending transcript reconciliation. Existing IDs, answers, and saved progress remain compatible.</p>`
);
if (!html.includes("250 questions are ready in this private candidate")) throw new Error("release-card update failed");

fs.writeFileSync(htmlPath,html);
fs.writeFileSync(jsonPath,`${JSON.stringify(bank,null,2)}\n`);
console.log(`bank ${oldBank.length}->${bank.length}; Session A ${dayA.length}; Session B ${dayB.length}; provisional ${provisional.length}.`);
