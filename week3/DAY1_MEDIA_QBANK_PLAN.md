# Day 1 Media Transcript QBank Audit Plan

Internal audit record for the Tue Sep 8 teaching set. This is not learner-facing content.

## Source inventory and transcript cues

| Block | Authenticated source inventory | Audited cue / clip duration | Decision relevance |
|---|---|---|---|
| L026 Connective Tissue | Existing `Study Pack/validation/MEDIA_AUDIT_HISTO_BLOOD.md` plus the local lecture PDF | 25:17-27:12 and 32:42-33:48 | The Marfan/fibrillin cue supports a new aortic-risk item. The brown-adipocyte cue was audited but not added because it duplicated a reserved holdout; the second item instead uses the PDF cell-types section to test active-fibroblast secretion. |
| L027 Protein Translation | Authenticated MediaSpace transcript | 30:09-30:44 (0:35) | EF-2 drives translocation; toxin blockade stops elongation after peptide-bond formation. |
| L028 Pentose Phosphate Pathway | Authenticated MediaSpace transcript | 33:41-36:50 (3:09) | Instructor's favored thiamine/transketolase question: Mode 1 still supplies NADPH plus ribose-5-P. |
| L029 Glycogen Metabolism | Authenticated MediaSpace transcript | 05:31-08:33 (3:02) | Child ethanol risk: limited glycogen plus high-NADH blockade of gluconeogenesis. |
| RR6 Gluconeogenesis | Lippincott 9e Ch23 IV.C plus the L029 transcript cue | 05:31-08:33 (3:02) | Supports the ethanol-hypoglycemia mechanism tested in W3-RR6-08. |

The inventory records the supplied authenticated transcript cue ranges and their durations, not full MediaSpace recording durations.

## Coverage comparison

- Existing L026 coverage was already audited. One added item uses the verified Marfan/fibrillin transcript cue; the other uses the local lecture's cell-types section to test active-fibroblast extracellular-matrix secretion without exposing the brown-adipocyte holdout.
- The Day 1 release now has **152 UE2 practice questions** and the whole bank has **765 questions**. The three prior stable-ID revisions remain intact; eight approved practice IDs were added.
- The replacements close three high-value gaps without changing answer-position balance or progress compatibility:
  - RR6: O2/O3/O6 combined child ethanol-hypoglycemia mechanism.
  - L027: O4 EF-2/translocation mechanism.
  - L028: O4/O6 Mode 1 selection under thiamine deficiency/transketolase loss.

## Approved replacements

| Stable ID | Zero-based answer index | Revision |
|---|---:|---|
| W3-RR6-08 | 4 | Toddler ethanol ingestion after missed dinner: limited glycogen plus high NADH sends pyruvate to lactate and oxaloacetate to malate, suppressing gluconeogenesis. Source: Lippincott 9e Ch23 IV.C; L029 05:31-08:33. |
| W3-L027-01 | 4 | Diphtheria toxin inactivates EF-2: translocation after peptide-bond formation stops. Source: L027 30:09-30:44. |
| W3-L028-03 | 2 | Severe thiamine deficiency/transketolase loss: oxidative PPP plus ribulose-5-P isomerization to ribose-5-P (Mode 1) supplies NADPH and ribose-5-P. Source: L028 33:41-36:50. |

## Approved expansion

- `W3-L026-CONNECTIVE-TISSUE-11` and `-12`: fibrillin-associated aortic risk; active-fibroblast extracellular-matrix synthesis during wound repair. The `-12` replacement avoids overlap with reserved holdout `W3-L026-CONNECTIVE-TISSUE-09`.
- `W3-L027-11` and `-12`: buried hydrophobic-to-charged missense substitution destabilizes tertiary folding; stepwise O-linked Golgi glycosylation of mucin serine/threonine residues. The `-11` replacement avoids overlap with reserved holdout `W3-L027-10`; the `-12` replacement avoids the reserved holdout's distinct ER event.
- `W3-L028-11` and `-12`: NADPH-dependent nitric oxide synthesis; oxidative PPP product stoichiometry before nonoxidative rearrangement.
- `W3-L029-11` and `-12`: glycogen phosphorylase-mediated release of glucose-1-P from nonreducing alpha-1,4 ends; glycogenin as the glycogen-synthesis primer.

All eight are five-option, non-media-gated mechanism items. Their key indices are `0, 2, 1, 3, 4, 2, 0, 3`, giving the 152-item UE2 release a 30/31/30/31/30 answer distribution.

## Explicit no-change decisions

- **Holdouts 09/10:** not modified or released for L026, L027, L028, or L029.
- **L026-L029 outside the three revisions and eight listed additions:** no change.
- No deletion, renaming, source-block migration, or media-gated release occurred.

## Acceptance criteria

1. `week3/qbank_practice_ready.json` is a 152-item array with unique IDs and valid five-option MCQ schema.
2. W3-RR6-08, W3-L027-01, and W3-L028-03 retain answer indices 4, 4, and 2; the eight approved additions retain their documented indices.
3. `add-week3-questions.js` synchronizes the same 152 Week 3 items into `bank.json` and the embedded `index.html` bank, preserving 765 total questions.
4. `node tests.js` and `node quality-audit.js` pass after synchronization.
5. Tuesday's six taught blocks provide a 50-question eligible pool, while the Wednesday adaptive assignment remains capped at 22 total questions.
6. The released Week 3 unique-longest answer cue rate remains at or below 30%, and the validation report is regenerated from the current source files.

## Post-change results

- Updater result: `Applied 3 transcript revisions and ensured 8 Day 1 additions; practice-ready set now has 152.`
- Sync result: `Added 152 verified Week 3 questions; bank now has 765.` The embedded `index.html` bank is structurally identical to `bank.json`; both contain 152 UE2 questions.
- `node tests.js`: `PASS: integrity, answer-key safeguards, migration compatibility, queues, interleaving, session semantics, backup/import UI guards`.
- `node quality-audit.js`: completed with no malformed-data failure; 765 questions, 740 MCQs, and zero exact or normalized duplicate-choice sets.
- Validation recomputation: released unique-longest `35/130` (`26.9%`) and unique-dash `5/27` (`18.5%`); all authored Week 3 items unique-longest `46/183` (`25.1%`) and unique-dash `7/39` (`17.9%`).
- Wednesday workload: 50 eligible questions exist across RR6, L026, L027, L028, L029, and LABL3; the adaptive queue selects exactly 22.
