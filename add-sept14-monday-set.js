#!/usr/bin/env node
/* Integrate the independently verified Monday L042-L046 set. The 26 new OQ4
   items are append-only. The already released C042-1 pair is routed by ID and
   is never copied, so existing attempts remain attached to the original IDs. */
const fs = require("fs");
const htmlPath = "index.html", jsonPath = "bank.json";
const sourcePath = "week4/september14_monday.json";
const marker = "let BANK = ", endMarker = ";\nconst META =";
const reused = ["MQG-SEP12-L039-01", "MQG-SEP12-L040-04"];

const raw = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const srcByTopic = {"Biochemistry":"B", "Hematology & Physiology":"H", "Histology":"T", "Immunology":"I"};
const incoming = raw.map(q => ({...q, source: "sept14-practice", src: srcByTopic[q.topic]}));
if (incoming.length !== 26) throw new Error(`Expected 26, got ${incoming.length}`);
if (new Set(incoming.map(q => q.id)).size !== 26 || incoming.some(q => !/^OQ4-L0(?:42|43|44|45|46)-C\d[AB]$/.test(q.id))) throw new Error("bad or duplicate OQ4 id");
if (incoming.some(q => q.source !== "sept14-practice" || !q.src || q.unit !== "UE2" || q.course !== "OST520" || q.type !== "mcq")) throw new Error("bad release tag");
if (incoming.some(q => q.holdout || q.requiresMedia || q.reasoningOrder < 2)) throw new Error("holdout, media, or reasoning-order failure");
if (incoming.some(q => !Array.isArray(q.options) || q.options.length !== 5 || new Set(q.options).size !== 5)) throw new Error("options");
if (incoming.some(q => !Array.isArray(q.optionExplanations) || q.optionExplanations.length !== 5 || q.optionExplanations.some(t => typeof t !== "string" || t.trim().length < 40))) throw new Error("explanations");
if (incoming.some(q => !q.closestDistractor || q.closestDistractor.index === q.answer || !Number.isInteger(q.answer) || q.answer < 0 || q.answer > 4)) throw new Error("answer or closest distractor");
for (const prefix of new Set(incoming.map(q => q.id.slice(0, -1)))) {
  const pair = incoming.filter(q => q.id.slice(0, -1) === prefix);
  if (pair.length !== 2 || new Set(pair.map(q => q.id.at(-1))).size !== 2 || pair[0].stem === pair[1].stem) throw new Error(`bad A/B pair ${prefix}`);
}

let html = fs.readFileSync(htmlPath, "utf8");
const start = html.indexOf(marker), end = html.indexOf(endMarker, start);
if (start < 0 || end < 0) throw new Error("embedded bank markers missing");
const oldBank = JSON.parse(html.slice(start + marker.length, end));
const oldIds = new Set(oldBank.map(q => q.id));
for (const id of reused) if (!oldIds.has(id)) throw new Error(`reused item missing: ${id}`);
const present = incoming.filter(q => oldIds.has(q.id));
if (present.length !== 0 && present.length !== incoming.length) throw new Error(`partial prior integration: ${present.length}/26`);

let bank = oldBank;
if (present.length === 0) bank = [...oldBank, ...incoming];
else {
  const clean = q => { const copy = {...q}; delete copy.n; return copy; };
  for (const q of incoming) {
    const existing = bank.find(item => item.id === q.id);
    const normalized = {...existing, source:q.source, src:q.src};
    if (JSON.stringify(clean(normalized)) !== JSON.stringify(clean(q))) throw new Error(`integrated item drift: ${q.id}`);
  }
  bank = bank.map(item => incoming.find(q => q.id === item.id) || item);
}
const topicNumbers = {};
for (const q of bank) { q.n = (topicNumbers[q.topic] || 0) + 1; topicNumbers[q.topic] = q.n; }
if (bank.length !== 837 || new Set(bank.map(q => q.id)).size !== 837) throw new Error(`unexpected bank size ${bank.length}`);
html = html.slice(0, start + marker.length) + JSON.stringify(bank) + html.slice(end);

const dayA = [...incoming.filter(q => q.id.endsWith("A")).map(q => q.id), reused[0]];
const dayB = [...incoming.filter(q => q.id.endsWith("B")).map(q => q.id), reused[1]];
const planClose = "\n      ],\n      taught:";
if (!html.includes('date:"2026-09-14"')) {
  const insertion = `,\n       {date:"2026-09-14",blocks:["L042","L043","L044","L045","L046"],questionIds:${JSON.stringify(dayA)},note:"Monday Day A after L042-L046 teaching"},\n       {date:"2026-09-16",blocks:["L042","L043","L044","L045","L046"],questionIds:${JSON.stringify(dayB)},note:"Wednesday Day B delayed retest of Monday material"}`;
  if (!html.includes(planClose)) throw new Error("UE2 plan insertion point missing");
  html = html.replace(planClose, insertion + planClose);
}
if (!html.includes('"L042":"2026-09-14"')) {
  const taughtEnd = '"L040/041":"2026-09-12"}';
  if (!html.includes(taughtEnd)) throw new Error("UE2 taught-map insertion point missing");
  html = html.replace(taughtEnd, '"L040/041":"2026-09-12","L042":"2026-09-14","L043":"2026-09-14","L044":"2026-09-14","L045":"2026-09-14","L046":"2026-09-14"}');
}
html = html.replace(/811-question OST 520 bank/g, "837-question OST 520 bank");
const compatibility = '"fnv1a-26480c6b-771"';
if (!html.includes('"fnv1a-3fdb4259-811"')) html = html.replace(compatibility, `${compatibility},"fnv1a-3fdb4259-811"`);

fs.writeFileSync(htmlPath, html);
fs.writeFileSync(jsonPath, `${JSON.stringify(bank, null, 2)}\n`);
console.log(`bank ${oldBank.length}->${bank.length}; Day A ${dayA.length}; Day B ${dayB.length}; reused ${reused.join(", ")}.`);
