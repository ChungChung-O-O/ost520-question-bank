#!/usr/bin/env node
/* Add the verified, public OST 520 Week 3 and remediation release. */
const fs = require("fs");

const htmlPath = "index.html";
const jsonPath = "bank.json";
const sourcePath = "week3/qbank_practice_ready.json";
const marker = "let BANK = ";
const endMarker = ";\nconst META =";

const incoming = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
if (incoming.length < 178) throw new Error(`Expected at least the 178-question public UE2 release, got ${incoming.length}.`);
if (incoming.some(q => q.holdout || q.requiresMedia || q.unit !== "UE2" || q.course !== "OST520")) {
  throw new Error("Week 3 release contains a holdout, media-gated item, or incorrect course/unit tag.");
}
if (new Set(incoming.map(q => q.id)).size !== incoming.length) throw new Error("Duplicate Week 3 IDs.");
const sept11 = incoming.filter(q => q.source === "sept11-practice");
if (sept11.length !== 20 || sept11.some(q => !/^MQG-SEP11-/.test(q.id))) {
  throw new Error("Expected exactly 20 reviewed September 11 application questions.");
}
const reasoningOrders = Object.fromEntries([1, 2, 3].map(order => [order, sept11.filter(q => q.reasoningOrder === order).length]));
if (reasoningOrders[1] !== 4 || reasoningOrders[2] !== 15 || reasoningOrders[3] !== 1) {
  throw new Error("September 11 reasoning-order distribution changed.");
}
if (sept11.some(q => q.applicationLevel === "calculation" || (q.reasoningOrder === 1 && q.applicationLevel !== "recall"))) {
  throw new Error("September 11 application-level metadata changed.");
}
for (const q of incoming) {
  if (!Array.isArray(q.options) || !Array.isArray(q.optionExplanations) || q.optionExplanations.length !== q.options.length) {
    throw new Error(`Week 3 per-option explanations are missing or misaligned: ${q.id}`);
  }
  if (q.optionExplanations.some(text => typeof text !== "string" || text.trim().length < 40)) {
    throw new Error(`Week 3 per-option explanation is too short or invalid: ${q.id}`);
  }
}

const html = fs.readFileSync(htmlPath, "utf8");
const start = html.indexOf(marker);
const end = html.indexOf(endMarker, start);
if (start < 0 || end < 0) throw new Error("Embedded BANK markers not found.");

const oldBank = JSON.parse(html.slice(start + marker.length, end));
const incomingIds = new Set(incoming.map(q => q.id));
const missingReleasedIds = oldBank
  .filter(q => /^(?:W3-|MQG-)/.test(q.id) && !incomingIds.has(q.id))
  .map(q => q.id);
if (missingReleasedIds.length) {
  throw new Error(`Incoming Week 3 source would remove released questions: ${missingReleasedIds.join(", ")}`);
}
const bank = oldBank.filter(q => !/^(?:W3-|MQG-)/.test(q.id));
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
console.log(`Added ${incoming.length} verified UE2 questions; bank now has ${bank.length}.`);
