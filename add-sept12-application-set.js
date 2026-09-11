#!/usr/bin/env node
/* Integrate the verified, staged September 12 UE2 application set (20 items,
   MQG-SEP12-*) into the public bank AND the Week 3 practice-ready source that
   feeds the validation report. Append-only. sourceBlock is normalized to the
   provisioned 20-block syllabus map (L038/039, L040/041); L036/L037 unchanged. */
const fs = require("fs");
const htmlPath="index.html", jsonPath="bank.json", readyPath="week3/qbank_practice_ready.json";
const sourcePath="week3/remediation_batches/sept12_application_candidates.json";
const marker="let BANK = ", endMarker=";\nconst META =";
const blockMap={L038:"L038/039",L039:"L038/039",L040:"L040/041",L041:"L040/041"};

const raw=JSON.parse(fs.readFileSync(sourcePath,"utf8"));
if(raw.length!==20) throw new Error(`Expected 20, got ${raw.length}`);
const incoming=raw.map(q=>{const c={...q}; delete c.n; if(blockMap[c.sourceBlock]) c.sourceBlock=blockMap[c.sourceBlock]; return c;});

// guards
if(incoming.some(q=>!/^MQG-SEP12-/.test(q.id))) throw new Error("bad id");
if(incoming.some(q=>q.source!=="sept12-practice"||q.unit!=="UE2"||q.course!=="OST520")) throw new Error("bad tag");
if(incoming.some(q=>q.holdout||q.requiresMedia)) throw new Error("holdout/media leak");
if(incoming.some(q=>!Array.isArray(q.options)||q.options.length!==5||new Set(q.options).size!==5)) throw new Error("options");
if(incoming.some(q=>!Array.isArray(q.optionExplanations)||q.optionExplanations.length!==5||q.optionExplanations.some(t=>typeof t!=="string"||t.trim().length<40))) throw new Error("explanations");
if(incoming.some(q=>!q.closestDistractor||q.closestDistractor.index===q.answer)) throw new Error("closestDistractor");
const wantBlocks={"L036":3,"L037":3,"L038/039":6,"L040/041":8};
const gotBlocks=incoming.reduce((m,q)=>(m[q.sourceBlock]=(m[q.sourceBlock]||0)+1,m),{});
for(const b in wantBlocks) if(gotBlocks[b]!==wantBlocks[b]) throw new Error(`block ${b}: ${JSON.stringify(gotBlocks)}`);
const ro=incoming.reduce((m,q)=>(m[q.reasoningOrder]=(m[q.reasoningOrder]||0)+1,m),{});
if(ro[1]!==3||ro[2]!==15||ro[3]!==2) throw new Error(`reasoningOrder ${JSON.stringify(ro)}`);

// 1) practice-ready source (feeds validation report)
const ready=JSON.parse(fs.readFileSync(readyPath,"utf8"));
const readyIds=new Set(ready.map(q=>q.id));
for(const q of incoming) if(readyIds.has(q.id)) throw new Error(`ready id collision ${q.id}`);
const newReady=[...ready,...incoming];
fs.writeFileSync(readyPath, `${JSON.stringify(newReady,null,2)}\n`);

// 2) embedded bank + bank.json
const html=fs.readFileSync(htmlPath,"utf8");
const start=html.indexOf(marker), end=html.indexOf(endMarker,start);
const oldBank=JSON.parse(html.slice(start+marker.length,end));
const oldIds=new Set(oldBank.map(q=>q.id)); const oldCount=oldBank.length;
for(const q of incoming) if(oldIds.has(q.id)) throw new Error(`bank id collision ${q.id}`);
const bank=[...oldBank, ...incoming.map(q=>({...q}))];
for(const id of oldIds) if(!bank.some(q=>q.id===id)) throw new Error(`dropped ${id}`);
if(bank.length!==oldCount+20) throw new Error(`size ${bank.length}`);
const topicNumbers={};
for(const q of bank){ q.n=(topicNumbers[q.topic]||0)+1; topicNumbers[q.topic]=q.n; }
fs.writeFileSync(htmlPath, html.slice(0,start+marker.length)+JSON.stringify(bank)+html.slice(end));
fs.writeFileSync(jsonPath, `${JSON.stringify(bank,null,2)}\n`);
console.log(`practice-ready ${ready.length}->${newReady.length}; bank ${oldCount}->${bank.length}.`);
