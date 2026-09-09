#!/usr/bin/env node
/* Add the verified, non-media-gated OST 520 Week 3 practice set. */
const fs = require("fs");

const htmlPath = "index.html";
const jsonPath = "bank.json";
const sourcePath = "week3/qbank_practice_ready.json";
const marker = "let BANK = ";
const endMarker = ";\nconst META =";

const incoming = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
if (incoming.length !== 152) throw new Error(`Expected 152 bank-ready Week 3 questions, got ${incoming.length}.`);
if (incoming.some(q => q.holdout || q.requiresMedia || q.unit !== "UE2" || q.course !== "OST520")) {
  throw new Error("Week 3 release contains a holdout, media-gated item, or incorrect course/unit tag.");
}
if (new Set(incoming.map(q => q.id)).size !== incoming.length) throw new Error("Duplicate Week 3 IDs.");

const html = fs.readFileSync(htmlPath, "utf8");
const start = html.indexOf(marker);
const end = html.indexOf(endMarker, start);
if (start < 0 || end < 0) throw new Error("Embedded BANK markers not found.");

const oldBank = JSON.parse(html.slice(start + marker.length, end));
const bank = oldBank.filter(q => !/^W3-/.test(q.id));
const existingIds = new Set(bank.map(q => q.id));
for (const q of incoming) {
  if (existingIds.has(q.id)) throw new Error(`Week 3 ID collides with existing bank: ${q.id}`);
  bank.push(q);
  existingIds.add(q.id);
}

const topicNumbers = {};
for (const q of bank) {
  q.n = (topicNumbers[q.topic] || 0) + 1;
  topicNumbers[q.topic] = q.n;
}

const serialized = JSON.stringify(bank);
fs.writeFileSync(htmlPath, html.slice(0, start + marker.length) + serialized + html.slice(end));
fs.writeFileSync(jsonPath, `${JSON.stringify(bank, null, 2)}\n`);
console.log(`Added ${incoming.length} verified Week 3 questions; bank now has ${bank.length}.`);
