#!/usr/bin/env node
/* Recompute Week 3 question-pool, answer-position, and option-cue metrics. */
const fs = require("fs");

const paths = {
  report: "week3/validation_report.json",
  ready: "week3/qbank_practice_ready.json",
  media: "week3/qbank_media_gated_questions.json",
  holdout: "week3/qbank_holdout_questions.json"
};
const read = path => JSON.parse(fs.readFileSync(path, "utf8"));
if (!fs.existsSync(paths.holdout)) {
  throw new Error(`Private audit requires ${paths.holdout}; it is intentionally absent from public clones.`);
}
const stripHtml = value => String(value).replace(/<[^>]*>/g, " ").replace(/&[a-z]+;|&#\d+;/gi, " ");
const normalize = value => stripHtml(value).normalize("NFKC").toLowerCase()
  .replace(/[\u2010-\u2015]/g, "-").replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
const dashRe = /[-\u2010-\u2015]/;
const countBy = (items, key) => items.reduce((counts, item) => {
  const value = key(item);
  counts[value] = (counts[value] || 0) + 1;
  return counts;
}, {});
const answerCounts = questions => [0, 1, 2, 3, 4].map(answer => questions.filter(question => question.answer === answer).length);
const cueMetrics = questions => {
  const mcq = questions.filter(question => question.type === "mcq");
  const uniqueDash = mcq.filter(question => question.options.filter(option => dashRe.test(stripHtml(option))).length === 1);
  const uniqueLongest = mcq.filter(question => {
    const lengths = question.options.map(option => normalize(option).length);
    return lengths.filter(length => length === Math.max(...lengths)).length === 1;
  });
  return {
    dashEligible: uniqueDash.length,
    dashCorrect: uniqueDash.filter(question => dashRe.test(stripHtml(question.options[question.answer]))).length,
    longestEligible: uniqueLongest.length,
    longestCorrect: uniqueLongest.filter(question => {
      const lengths = question.options.map(option => normalize(option).length);
      return lengths[question.answer] === Math.max(...lengths);
    }).length
  };
};

const existing = read(paths.report);
const ready = read(paths.ready);
const media = read(paths.media);
const holdout = read(paths.holdout);
const practice = [...ready, ...media];
const all = [...practice, ...holdout];
const readyLevels = countBy(ready, question => question.applicationLevel);
const allLevels = countBy(all, question => question.applicationLevel);
const allCues = cueMetrics(all);
const readyCues = cueMetrics(ready);
const ids = all.map(question => question.id);
const errors = [];
if (new Set(ids).size !== ids.length) errors.push("duplicate question IDs across Week 3 pools");
for (const question of all) {
  if (question.type !== "mcq" || !Array.isArray(question.options) || question.options.length !== 5 || !Number.isInteger(question.answer) || question.answer < 0 || question.answer > 4) errors.push(`invalid MCQ schema: ${question.id}`);
}
const rate = (numerator, denominator) => Number((numerator / (denominator || 1)).toFixed(3));

const report = {
  files: existing.files,
  totals: {
    ...existing.totals,
    "answer:holdout:0": answerCounts(holdout)[0],
    "answer:holdout:1": answerCounts(holdout)[1],
    "answer:holdout:2": answerCounts(holdout)[2],
    "answer:holdout:3": answerCounts(holdout)[3],
    "answer:holdout:4": answerCounts(holdout)[4],
    "answer:practice:0": answerCounts(practice)[0],
    "answer:practice:1": answerCounts(practice)[1],
    "answer:practice:2": answerCounts(practice)[2],
    "answer:practice:3": answerCounts(practice)[3],
    "answer:practice:4": answerCounts(practice)[4],
    "cue:unique_dash_correct": allCues.dashCorrect,
    "cue:unique_dash_eligible": allCues.dashEligible,
    "cue:unique_longest_correct": allCues.longestCorrect,
    "cue:unique_longest_eligible": allCues.longestEligible,
    "level:discrimination": allLevels.discrimination || 0,
    "level:mechanism": allLevels.mechanism || 0,
    "level:presentation": allLevels.presentation || 0,
    "level:recall": allLevels.recall || 0,
    "media:holdout": holdout.filter(question => question.requiresMedia).length,
    "media:practice": practice.filter(question => question.requiresMedia).length,
    "pool:holdout": holdout.length,
    "pool:practice": practice.length,
    "ready:cue:unique_dash_correct": readyCues.dashCorrect,
    "ready:cue:unique_dash_eligible": readyCues.dashEligible,
    "ready:cue:unique_longest_correct": readyCues.longestCorrect,
    "ready:cue:unique_longest_eligible": readyCues.longestEligible,
    "ready:level:discrimination": readyLevels.discrimination || 0,
    "ready:level:mechanism": readyLevels.mechanism || 0,
    "ready:level:presentation": readyLevels.presentation || 0,
    "ready:level:recall": readyLevels.recall || 0,
    "ready:questions": ready.length
  },
  unique_question_ids: new Set(ids).size,
  beyond_recall_percent: Number((((all.length - (allLevels.recall || 0)) / all.length) * 100).toFixed(1)),
  presentation_or_discrimination_percent: Number(((((allLevels.presentation || 0) + (allLevels.discrimination || 0)) / all.length) * 100).toFixed(1)),
  ready_beyond_recall_percent: Number((((ready.length - (readyLevels.recall || 0)) / ready.length) * 100).toFixed(1)),
  ready_presentation_or_discrimination_percent: Number(((((readyLevels.presentation || 0) + (readyLevels.discrimination || 0)) / ready.length) * 100).toFixed(1)),
  errors,
  answer_positions: {
    practice: answerCounts(practice),
    holdout: answerCounts(holdout)
  },
  cue_rates: {
    unique_longest_correct: rate(allCues.longestCorrect, allCues.longestEligible),
    unique_dash_correct: rate(allCues.dashCorrect, allCues.dashEligible)
  },
  ready_cue_rates: {
    unique_longest_correct: rate(readyCues.longestCorrect, readyCues.longestEligible),
    unique_dash_correct: rate(readyCues.dashCorrect, readyCues.dashEligible)
  }
};

fs.writeFileSync(paths.report, `${JSON.stringify(report, null, 2)}\n`);
console.log(`Updated ${paths.report}: ready unique-longest ${readyCues.longestCorrect}/${readyCues.longestEligible}; ready unique-dash ${readyCues.dashCorrect}/${readyCues.dashEligible}.`);
