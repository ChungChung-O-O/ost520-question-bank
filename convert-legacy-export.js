#!/usr/bin/env node
/* Convert the former Claude artifact's text export into an importable backup. */
const fs = require("fs");

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.error("Usage: node convert-legacy-export.js <legacy-results.txt> <backup.json>");
  process.exit(2);
}

const bank = JSON.parse(fs.readFileSync("bank.json", "utf8"));
const byId = new Map(bank.map(question => [question.id, question]));
const lines = fs.readFileSync(inputPath, "utf8").split(/\r?\n/).map(line => line.trim()).filter(Boolean);
const header = lines.findIndex(line => line === "id,topic,docs,attempts,correct,lastOk,lastSeen,reasons");
if (header < 0) throw new Error("Legacy results header not found.");

const history = {};
for (const line of lines.slice(header + 1)) {
  const fields = line.split(",");
  if (fields.length !== 8) throw new Error(`Malformed legacy row: ${line}`);
  const [id, topic, docs, attemptsText, correctText, lastOkText, lastSeen, reasons] = fields;
  const question = byId.get(id);
  if (!question) throw new Error(`Unknown question ID: ${id}`);
  const attempts = Number(attemptsText), correct = Number(correctText);
  if (!Number.isInteger(attempts) || attempts < 0 || !Number.isInteger(correct) || correct < 0 || correct > attempts) {
    throw new Error(`Invalid result counts for ${id}.`);
  }
  if (lastOkText !== "0" && lastOkText !== "1") throw new Error(`Invalid latest outcome for ${id}.`);
  if (question.topic !== topic || (question.covers || []).join("+") !== docs) throw new Error(`Metadata mismatch for ${id}.`);
  const record = {attempts, correct, lastOk: lastOkText === "1", reasons: reasons ? reasons.split("+").filter(Boolean) : []};
  if (/^\d{4}-\d{2}-\d{2}$/.test(lastSeen)) record.at = new Date(`${lastSeen}T12:00:00`).getTime();
  history[id] = record;
}

let fingerprint = 2166136261;
const serialized = JSON.stringify(bank);
for (let i = 0; i < serialized.length; i++) {
  fingerprint ^= serialized.charCodeAt(i);
  fingerprint = Math.imul(fingerprint, 16777619);
}

const backup = {
  schemaVersion: 3,
  createdAt: new Date().toISOString(),
  bankFingerprint: `fnv1a-${(fingerprint >>> 0).toString(16).padStart(8, "0")}-${bank.length}`,
  history,
  activeSession: null,
  theme: null,
  examMetadata: {exam: "2026-09-04", artifactVersion: "legacy-text"},
  artifactVersion: "legacy-text"
};

fs.writeFileSync(outputPath, `${JSON.stringify(backup, null, 2)}\n`);
console.log(`Converted ${Object.keys(history).length} scored question records.`);
