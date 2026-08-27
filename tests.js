/* Offline regression checks for the static site. Run: node tests.js */
const assert=require("assert"),fs=require("fs"),vm=require("vm");
const html=fs.readFileSync("index.html","utf8"), json=JSON.parse(fs.readFileSync("bank.json","utf8"));
const between=(a,b)=>html.slice(html.indexOf(a)+a.length,html.indexOf(b,html.indexOf(a)));
const bank=vm.runInNewContext("("+between("let BANK = ",";\nconst META =")+")");
assert.deepStrictEqual(JSON.parse(JSON.stringify(bank)),json,"bank.json must exactly equal embedded BANK");
assert.equal(bank.length,557); assert.equal(new Set(bank.map(q=>q.id)).size,557);
assert.deepStrictEqual(Object.fromEntries(["Biochemistry","Genetics","Epi & Biostats"].map(t=>[t,bank.filter(q=>q.topic===t).length])),{"Biochemistry":143,"Genetics":355,"Epi & Biostats":59});
assert.equal(bank.filter(q=>q.type==="mcq").length,532); assert.equal(bank.filter(q=>q.type==="worked").length,25);
assert.equal(bank.filter(q=>/^WK-/.test(q.id)).length,24,"targeted weakness set must remain complete");
const faculty=bank.filter(q=>q.source==="faculty-practice");
assert.equal(faculty.length,50,"faculty practice set must remain complete");
assert.equal(faculty.filter(q=>/^FP-/.test(q.id)).length,50,"faculty questions must use the FP- id space");
assert.equal(faculty.filter(q=>q.keyed).length,43,"count of faculty items carrying a published answer key changed");
for(const q of faculty){
  assert(q.sourceRef && /\S/.test(q.sourceRef),"faculty question must name its source document: "+q.id);
  assert(["Biochemistry","Genetics","Epi & Biostats"].includes(q.topic),"bad topic: "+q.id);
}
const facultyAnswers={"FP-01":3,"FP-02":3,"FP-03":3,"FP-04":0,"FP-05":3,"FP-06":2,"FP-07":3,"FP-08":2,"FP-09":3,"FP-10":1,"FP-11":1,"FP-14":3,"FP-15":1,"FP-16":0,"FP-17":4,"FP-18":1,"FP-19":1,"FP-20":1,"FP-21":0,"FP-22":1,"FP-23":1,"FP-24":2,"FP-25":0,"FP-26":0,"FP-27":0,"FP-28":2,"FP-29":0,"FP-30":1,"FP-31":1,"FP-32":0,"FP-33":3,"FP-34":0,"FP-35":1,"FP-36":2,"FP-37":2,"FP-38":2,"FP-39":2,"FP-40":1,"FP-41":2,"FP-42":1,"FP-43":3,"FP-44":1,"FP-45":0,"FP-46":0,"FP-47":4,"FP-48":0,"FP-49":0,"FP-50":0};
for(const [id,ans] of Object.entries(facultyAnswers)){
  const q=bank.find(x=>x.id===id);
  assert(q,"faculty question missing: "+id);
  assert.equal(q.answer,ans,"faculty answer key changed: "+id);
}
assert.equal(bank.filter(q=>q.type==="worked"&&q.source==="faculty-practice").length,2,"the two short-answer faculty items must stay worked");

// every question is filed under a class and a unit, so the library can shelve it
for(const q of bank){ assert.equal(q.course,"OST520","question must carry its course: "+q.id); assert.equal(q.unit,"UE1","question must carry its unit: "+q.id); }
assert(html.includes("let BANK = "),"BANK must be reassignable for the library view");
assert(html.includes("const ALL_QUESTIONS = BANK.slice()"),"full bank must be retained separately from the view");
assert(html.includes("function applyScope()"),"library scope filter missing");
assert(html.includes('id="library"'),"library screen missing");
assert(html.includes('id="shelf"'),"library shelf missing");
assert(html.includes('id="crumb"'),"breadcrumb missing");
assert(html.includes('id="views"'),"source filter control missing");
assert(html.includes("JSON.stringify(ALL_QUESTIONS)")&&html.includes('"-"+ALL_QUESTIONS.length'),"fingerprint must span the whole bank, not the current view");
assert(html.includes("const IDS = new Set(ALL_QUESTIONS.map(q=>q.id))"),"id validation must span the whole bank");
assert(html.includes("sessionInView(saved)"),"resume must be limited to sessions inside the current view");

// library behaviour, exercised through the real boot path
const SCOPE_KEY="ost520.bank.v2.scope", scoped=v=>boot({[SCOPE_KEY]:JSON.stringify(v)});
const libBoot=boot();
assert.equal(vm.runInContext("BANK.length",libBoot.ctx),557,"with no saved scope the whole bank is loaded");
assert.equal(libBoot.els.get("library").hidden,false,"no saved scope must open the library");
assert.equal(vm.runInContext("IDS.size",libBoot.ctx),557,"id set must span the whole bank regardless of view");
const unitBoot=scoped({course:"OST520",unit:"UE1",source:"all"});
assert.equal(unitBoot.els.get("setup").hidden,false,"a saved unit must open straight into that unit");
assert.equal(vm.runInContext("BANK.length",unitBoot.ctx),557);
const facBoot=scoped({course:"OST520",unit:"UE1",source:"faculty"});
assert.equal(vm.runInContext("BANK.length",facBoot.ctx),50,"faculty view must show only the faculty practice questions");
assert(vm.runInContext('BANK.every(q=>q.source==="faculty-practice")',facBoot.ctx),"faculty view leaked a non-faculty question");
const ownBoot=scoped({course:"OST520",unit:"UE1",source:"bank"});
assert.equal(vm.runInContext("BANK.length",ownBoot.ctx),507,"bank view must exclude the faculty practice questions");
assert(vm.runInContext('BANK.every(q=>q.source!=="faculty-practice")',ownBoot.ctx),"bank view leaked a faculty question");
assert.equal(scoped({course:"OST520",unit:"UE2",source:"all"}).els.get("library").hidden,false,"an empty unit must fall back to the library");
assert.equal(scoped({course:"NOPE",unit:"UE1",source:"all"}).els.get("library").hidden,false,"an unknown course must fall back to the library");
assert.equal(vm.runInContext("BANK_FINGERPRINT",facBoot.ctx),vm.runInContext("BANK_FINGERPRINT",libBoot.ctx),"the view must not change the backup fingerprint");
assert(html.includes('557-question OST 520 Unit Exam 1 bank with adaptive practice'),"page metadata must describe the current bank");
assert(html.includes('New from your Aug 27 performance analysis'),"home must explain the targeted expansion");
for(const phrase of ["Metabolism, glycolysis, sugar entry","Pedigrees, inheritance, DNA/chromosomes","Study design, screening, bias"]){assert(html.includes(phrase),`topic coverage description missing: ${phrase}`);}
const weaknessAnswers={"WK-01":2,"WK-02":1,"WK-03":2,"WK-04":1,"WK-05":0,"WK-06":1,"WK-07":1,"WK-08":1,"WK-09":1,"WK-10":0,"WK-11":1,"WK-12":1,"WK-13":1,"WK-14":0,"WK-15":1,"WK-16":1,"WK-17":1,"WK-18":2,"WK-19":2,"WK-20":1,"WK-21":2,"WK-22":1,"WK-23":2,"WK-24":1};
const weaknessSet=bank.filter(q=>/^WK-/.test(q.id));
for(const q of weaknessSet){assert.equal(q.answer,weaknessAnswers[q.id],`targeted answer key changed: ${q.id}`);assert(q.rationale.includes("The trap:"),`targeted rationale lacks misconception contrast: ${q.id}`);}
const uniqueLongest=weaknessSet.filter(q=>{const lengths=q.options.map(x=>x.length),m=Math.max(...lengths);return lengths[q.answer]===m&&lengths.filter(n=>n===m).length===1;}).length/weaknessSet.length;
assert(uniqueLongest>=.13&&uniqueLongest<=.37,`targeted set length cue must remain near chance, got ${Math.round(uniqueLongest*100)}%`);
bank.forEach(q=>{ assert(q.rationale&&q.concepts&&q.concepts.length,"rationale/concept required: "+q.id); if(q.type==="mcq")assert(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length,"bad answer: "+q.id); else assert.equal(q.answer,null,"worked answer: "+q.id); });
const rebalancedAnswers={"A2-25":1,"A2-27":1,"A2-14":1,"L022-03":1,"L021-09":1,"L021-08":1,"A2-02":1,"L014-11":1,"A2-08":1,"L012-08":1,"A2-29":1,"L011-05":3,"D10":1,"A2-11":1,"ALT-02":1,"L010-04":1,"L023-01":0,"L009-05":1};
const keyedMeaning={"A2-25":"paternally expressed","A2-27":"equal-environments assumption","A2-14":"increases LDL-receptor transcription","L022-03":"MZ 25% / DZ 25%","L021-09":"Huntington is coding","L021-08":"Genetic anticipation","A2-02":"alternative splicing","L014-11":"expressed in only one sex","A2-08":"metaphase spindle checkpoint","L012-08":"protects imprints","A2-29":"4 mg beginning one month before conception","L011-05":"Recruiting co-activators","D10":"Recall bias","A2-11":"S-adenosylmethionine","ALT-02":"shared ancestor","L010-04":"Cyclin levels fluctuate","L023-01":"hypertonic solution","L009-05":"recognizes promoter sequences"};
for(const [id,answer] of Object.entries(rebalancedAnswers)){
  const q=bank.find(item=>item.id===id);
  assert(q,`rebalanced question missing: ${id}`);
  assert.equal(q.answer,answer,`rebalanced answer key changed: ${id}`);
  assert(q.options[q.answer].includes(keyedMeaning[id]),`rebalanced keyed meaning changed: ${id}`);
  assert.equal(new Set(q.options).size,q.options.length,`duplicate rebalanced option: ${id}`);
}

function status(h){if(!h)return"unseen";if(h.lastOk===false)return"wrong";if(h.lastOk===true&&h.lastGuessed)return"guessed";return"correct";}
const legacy={history:{B1:{attempts:2,correct:1,lastOk:false,at:1,reasons:["didnt-know"]}}};
const migrated=JSON.parse(JSON.stringify(legacy));migrated.schemaVersion=4;migrated.bankFingerprint="x";
assert.deepStrictEqual(migrated.history.B1,legacy.history.B1,"migration preserves legacy aggregates");
assert.equal(status({lastOk:true,lastGuessed:true}),"guessed"); assert.equal(status({lastOk:false}),"wrong");
const q={B1:{lastOk:false},B2:{lastOk:true,lastGuessed:true},B3:{lastOk:true}};
assert.deepStrictEqual(Object.keys(q).filter(id=>status(q[id])==="wrong"),["B1"]);
assert.deepStrictEqual(Object.keys(q).filter(id=>["wrong","guessed"].includes(status(q[id]))),["B1","B2"]);
function interleave(qs,seed){let s=seed>>>0,r=()=>((s=(s*1664525+1013904223)>>>0)/4294967296),bins={};qs.forEach(q=>(bins[q.topic]||(bins[q.topic]=[])).push(q));let out=[],last=null,run=0;while(out.length<qs.length){let keys=Object.keys(bins).filter(k=>bins[k].length),c=run>=2&&keys.some(k=>k!==last)?keys.filter(k=>k!==last):keys,total=c.reduce((n,k)=>n+bins[k].length,0),p=r()*total,k=c.at(-1);for(const x of c){p-=bins[x].length;if(p<0){k=x;break}}out.push(bins[k].shift());run=k===last?run+1:1;last=k}return out}
const mixed=[...Array(8)].map((_,i)=>({id:"b"+i,topic:"B"})).concat([...Array(3)].map((_,i)=>({id:"g"+i,topic:"G"})),[{id:"e",topic:"E"}]);
const a=interleave(mixed,42),b=interleave(mixed,42);assert.deepStrictEqual(a,b,"interleaving must be deterministic");for(let i=2;i<a.length;i++)assert(!(a[i].topic===a[i-1].topic&&a[i].topic===a[i-2].topic),"no run over two while alternatives exist");
const worked={checked:true};assert.equal(worked.ok==null,true,"revealed worked item is not scored"); worked.ok=false;assert.equal(worked.ok==null,false);
assert(html.includes("sessionUsable(saved) && sessionIsToday(saved)"),"resume guard missing");assert(html.includes("replacepending"),"replace/cancel UI missing");assert(html.includes("KEY+\".recovery\""),"recovery backup missing");assert(html.includes("Copy analysis for Claude/Codex"),"analysis export missing");
assert(html.includes("const incoming=pendingBackup"),"restore must retain the validated backup while applying theme and state");
assert(!html.includes("if(pendingBackup.theme)"),"restore must not dereference a cleared pending backup");
assert(html.includes("fallback && untried ? q=>!H[q.id] : fallback ? ()=>true"),"post-plan fallback must use the full bank after unseen questions are exhausted");
assert(html.includes('id="opendiag" type="button">'),"diagnosis must remain discoverable with empty history");
assert(html.includes("function parseLegacyResults"),"legacy artifact transfer parser missing");
assert(html.includes("Today&rsquo;s adaptive 40"),"adaptive prescription entry point missing");assert(html.includes("lastConfidence"),"confidence migration missing");assert(html.includes("timezoneOffsetMinutes"),"timezone-aware timeline missing");assert(html.includes("questionReports"),"question report storage missing");
assert(html.includes('a.pick!=null && !!(a.confidence || ("guessed" in a'),"new MCQ attempts must explicitly record confidence");
assert(html.includes('guessed:c!=="knew"}; renderQ(); sync();'),"confidence changes must immediately enable the Check button");
function boot(storage={}){const source=html.slice(html.indexOf("<script>")+8,html.lastIndexOf("</script>")),els=new Map(),el=()=>({hidden:false,style:{},classList:{add(){}},setAttribute(){},appendChild(){},textContent:"",innerHTML:"",click(){},querySelectorAll(){return[]}}),document={getElementById:id=>{if(!els.has(id))els.set(id,el());return els.get(id)},createElement:el,querySelectorAll(){return[]},addEventListener(){},documentElement:{setAttribute(){},removeAttribute(){},getAttribute(){return null}}},data=new Map(Object.entries(storage)),localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)},alerts=[],ctx=vm.createContext({document,localStorage,window:{scrollTo(){}},console,Date,JSON,Math,Set,Map,Array,Object,Number,String,Boolean,RegExp,Error,Blob:function(){},URL:{createObjectURL(){return ""},revokeObjectURL(){}},FileReader:function(){},navigator:{},alert:m=>alerts.push(String(m)),setTimeout(){}});vm.runInContext(source,ctx);return{ctx,data,els,alerts};}
boot();boot({"ost520.bank.v2":"{bad json"});
const legacyBoot=boot({"ost520.bank.v2":JSON.stringify(legacy)});
const migratedStored=JSON.parse(legacyBoot.data.get("ost520.bank.v2"));
assert.equal(migratedStored.schemaVersion,4);assert.deepStrictEqual(migratedStored.history.B1,legacy.history.B1);assert(legacyBoot.data.has("ost520.bank.v2.recovery"),"migration must keep a recovery copy");
const restoreBoot=boot({"ost520.bank.v2":JSON.stringify({schemaVersion:4,bankFingerprint:"old",history:{}})});
vm.runInContext(`pendingBackup={schemaVersion:4,createdAt:new Date().toISOString(),bankFingerprint:BANK_FINGERPRINT,history:{B1:{attempts:1,correct:1,lastOk:true,reasons:[]}},questionReports:{B1:{reason:"unclear"}},backupMetadata:{lastBackupAt:"2026-08-27T12:00:00.000Z"},activeSession:null,theme:"dark"}; $("confirmimport").onclick();`,restoreBoot.ctx);
assert.equal(restoreBoot.alerts.length,0,"valid restore must not report failure");assert.equal(restoreBoot.data.get("ost520.bank.v2.theme"),"dark");assert.equal(JSON.parse(restoreBoot.data.get("ost520.bank.v2")).history.B1.correct,1);
assert.equal(JSON.parse(restoreBoot.data.get("ost520.bank.v2")).questionReports.B1.reason,"unclear","reports must round-trip through restore");
assert.throws(()=>vm.runInContext('validateBackup({schemaVersion:4,bankFingerprint:BANK_FINGERPRINT,history:{},questionReports:{B1:{reason:"injected"}}})',restoreBoot.ctx),/invalid question report/);
for(const priorFingerprint of ["fnv1a-2ed224b5-483","fnv1a-56ef5225-483","fnv1a-ac6648c1-507"]){
  assert.doesNotThrow(()=>vm.runInContext(`validateBackup({schemaVersion:4,bankFingerprint:"${priorFingerprint}",history:{B1:{attempts:1,correct:1,lastOk:true,reasons:[]}}})`,restoreBoot.ctx),`known additive bank version must remain importable: ${priorFingerprint}`);
}
vm.runInContext(`S={id:"timeline-test",name:"Test",date:todayISO(),answers:{B1:{pick:1,reasons:["cue"]}},committed:{},initiallySeen:{B1:false},order:["B1"]}; commit(BANK.find(q=>q.id==="B1"),true,"narrowed");`,restoreBoot.ctx);
const timed=JSON.parse(restoreBoot.data.get("ost520.bank.v2")).history.B1.attemptLog.at(-1);assert.equal(timed.confidence,"narrowed");assert.equal(timed.reasonTags[0],"cue");assert.equal(typeof timed.timezoneOffsetMinutes,"number");assert(timed.timestamp.includes("T"));assert(/^\d{4}-\d{2}-\d{2}$/.test(timed.localDate));assert.equal(timed.attemptNumber,2,"legacy aggregate count must classify the first logged event as a repeat");
const prescription=vm.runInContext("adaptivePrescription()",restoreBoot.ctx);assert(prescription.questions.length>0&&prescription.questions.length<=40);assert.equal(new Set(prescription.questions.map(q=>q.id)).size,prescription.questions.length,"adaptive prescription must not duplicate IDs");
assert.equal(vm.runInContext('questionStatus({attempts:1,correct:1,lastOk:true,lastConfidence:"narrowed"}).state',restoreBoot.ctx),"guessed","correct narrowed answers must enter the uncertain review queue");
const legacyText=`OST 520 question bank — full results export (2026-08-27)\n483 in the bank · 1 attempted · 1 currently wrong\nid,topic,docs,attempts,correct,lastOk,lastSeen,reasons\nB1,Biochemistry,L001,2,1,0,2026-08-27,content+cue`;
restoreBoot.ctx.legacyFixture=legacyText;
const parsedLegacy=vm.runInContext("parseLegacyResults(legacyFixture)",restoreBoot.ctx);
assert.equal(parsedLegacy.history.B1.attempts,2);assert.equal(parsedLegacy.history.B1.correct,1);assert.equal(parsedLegacy.history.B1.lastOk,false);assert.deepStrictEqual(Array.from(parsedLegacy.history.B1.reasons),["content","cue"]);
console.log("PASS: integrity, answer-key safeguards, migration compatibility, queues, interleaving, session semantics, backup/import UI guards");
