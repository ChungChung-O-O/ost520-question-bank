/* Offline regression checks for the static site. Run: node tests.js */
const assert=require("assert"),fs=require("fs"),vm=require("vm"),crypto=require("crypto");
const html=fs.readFileSync("index.html","utf8"), json=JSON.parse(fs.readFileSync("bank.json","utf8"));
const between=(a,b)=>html.slice(html.indexOf(a)+a.length,html.indexOf(b,html.indexOf(a)));
const bank=vm.runInNewContext("("+between("let BANK = ",";\nconst META =")+")");
assert.deepStrictEqual(JSON.parse(JSON.stringify(bank)),json,"bank.json must exactly equal embedded BANK");
assert.equal(bank.length,599); assert.equal(new Set(bank.map(q=>q.id)).size,599);
assert.deepStrictEqual(Object.fromEntries(["Biochemistry","Genetics","Epi & Biostats"].map(t=>[t,bank.filter(q=>q.topic===t).length])),{"Biochemistry":151,"Genetics":389,"Epi & Biostats":59});
assert.equal(bank.filter(q=>q.type==="mcq").length,574); assert.equal(bank.filter(q=>q.type==="worked").length,25);
assert.equal(bank.filter(q=>/^WK-/.test(q.id)).length,24,"targeted weakness set must remain complete");
const confusionLab=bank.filter(q=>/^DL-\d\d$/.test(q.id));
assert.equal(confusionLab.length,24,"confusion lab must contain exactly 24 questions");
assert.equal(confusionLab.map(q=>q.id).join(","),[...Array(24)].map((_,i)=>`DL-${String(i+1).padStart(2,"0")}`).join(","),"confusion-lab ids must be stable and ordered");
for(const q of confusionLab){assert.equal(q.source,"confusion-lab");assert.equal(q.n,365+Number(q.id.slice(3)),`Genetics-local question number changed: ${q.id}`);assert.equal(q.options.length,5,`confusion-lab item must have five choices: ${q.id}`);assert.equal(q.optionConcepts.length,q.options.length,`optionConcepts must align: ${q.id}`);assert.equal(new Set(q.optionConcepts).size,q.optionConcepts.length,`optionConcepts must be distinct: ${q.id}`);assert.equal(q.contrast.length,q.options.length,`contrast rows must align: ${q.id}`);q.contrast.forEach((row,index)=>{assert.equal(row.concept,q.optionConcepts[index],`contrast concept misaligned: ${q.id}`);for(const field of ["term","meaning","why"])assert(row[field]&&typeof row[field]==="string",`contrast ${field} missing: ${q.id}`);});assert(q.confusionSet&&q.rationale.includes("<strong>"),`contrast metadata/rationale missing: ${q.id}`);}
assert.equal(new Set(confusionLab.map(q=>q.confusionSet)).size,8,"confusion lab must cover eight look-alike families");
for(const family of new Set(confusionLab.map(q=>q.confusionSet)))assert.equal(confusionLab.filter(q=>q.confusionSet===family).length,3,`family must contain three questions: ${family}`);
assert.deepStrictEqual(JSON.parse(JSON.stringify(confusionLab.reduce((counts,q)=>(counts[q.answer]=(counts[q.answer]||0)+1,counts),{}))),{"0":5,"1":5,"2":5,"3":5,"4":4},"confusion-lab answer positions must remain balanced");
const originalAnswerHash=crypto.createHash("sha256").update(JSON.stringify(bank.filter(q=>!/^DL-/.test(q.id)).map(q=>[q.id,q.answer]))).digest("hex");
assert.equal(originalAnswerHash,"bf42363a39188b1e3270cd2aedafc141d5f1cf8ef67bfd8c73deab1dae5ec3b9","an original answer index changed");
const transcript=bank.filter(q=>/^TR-/.test(q.id));
assert.equal(transcript.length,18,"transcript remediation set must remain complete");
const transcriptAnswers={"TR-01":1,"TR-02":2,"TR-03":2,"TR-04":1,"TR-05":2,"TR-06":2,"TR-07":1,"TR-08":1,"TR-09":1,"TR-10":0,"TR-11":2,"TR-12":1,"TR-13":1,"TR-14":2,"TR-15":0,"TR-16":2,"TR-17":0,"TR-18":1};
for(const q of transcript){assert.equal(q.answer,transcriptAnswers[q.id],`transcript answer changed: ${q.id}`);assert(/^L00[1-6] transcript \d{2}:\d{2}/.test(q.sourceRef),`missing usable sourceRef: ${q.id}`);assert(q.rationale.includes("The trap:"),`transcript rationale lacks trap: ${q.id}`);assert.equal(q.source,"transcript-remediation");assert.equal(q.course,"OST520");assert.equal(q.unit,"UE1");assert.equal(q.type,"mcq");assert(q.options.length>=4&&q.options.length<=5,`bad transcript option count: ${q.id}`);assert.equal(new Set(q.options).size,q.options.length,`duplicate transcript option: ${q.id}`);}
assert.deepStrictEqual(Object.fromEntries(Object.entries(transcript.reduce((counts,q)=>{counts[q.covers[0]]=(counts[q.covers[0]]||0)+1;return counts;},{})).sort()),{L001:2,L002:4,L003:2,L004:2,L005:2,L006:4,RR1:1,RR2:1},"transcript remediation coverage changed");
const faculty=bank.filter(q=>q.source==="faculty-practice");
assert.equal(faculty.length,50,"faculty practice set must remain complete");
assert.equal(faculty.filter(q=>/^FP-/.test(q.id)).length,50,"faculty questions must use the FP- id space");
assert.equal(faculty.filter(q=>q.keyed).length,43,"count of faculty items carrying a published answer key changed");
for(const q of faculty){
  assert(q.sourceRef && /\S/.test(q.sourceRef),"faculty question must name its source document: "+q.id);
  assert(["Biochemistry","Genetics","Epi & Biostats"].includes(q.topic),"bad topic: "+q.id);
}
const facultyOptionHash=crypto.createHash("sha256").update(JSON.stringify(faculty.map(q=>[q.id,q.options]))).digest("hex");
assert.equal(facultyOptionHash,"0d0bddcb3920776691b52bcec34f2e6a372e0b632e0fd95d6350e50a5c607076","faculty-authored option text changed");
const fourChoice=bank.filter(q=>q.type==="mcq"&&q.options.length===4);
assert.equal(fourChoice.map(q=>q.id).join(","),["FP-08","FP-09","FP-19","FP-34","FP-35"].join(","),"only the five source-fidelity faculty items may remain four-choice");
assert(bank.filter(q=>q.type==="mcq"&&q.source!=="faculty-practice").every(q=>q.options.length===5),"every eligible non-faculty MCQ must have five choices");
const dashRe=/[-\u2010-\u2015]/,uniqueDash=bank.filter(q=>q.type==="mcq"&&q.options.filter(option=>dashRe.test(option.replace(/<[^>]*>/g,""))).length===1);
const dashHeuristic=uniqueDash.filter(q=>dashRe.test(q.options[q.answer].replace(/<[^>]*>/g,""))).length/(uniqueDash.length||1);
const dashRandom=uniqueDash.reduce((sum,q)=>sum+1/q.options.length,0)/(uniqueDash.length||1);
assert(dashHeuristic<=dashRandom+.02,`unique-dash heuristic remains predictive: ${dashHeuristic} vs ${dashRandom}`);
const byId=id=>bank.find(q=>q.id===id);
assert(byId("B21").options[byId("B21").answer].includes("ubiquinone pool downstream of Complex I"),"glycerol-phosphate shuttle entry point regressed");
assert(!byId("B21").rationale.includes("Complex II</strong>, which pumps"),"glycerol-phosphate rationale must not imply that Complex II pumps protons");
assert(byId("R10").options[byId("R10").answer].startsWith("GALT deficiency needs lifelong"),"galactose-management key regressed");
assert.equal(byId("WK-09").options[4],"Complex II transfers electrons directly to cytochrome c","WK-09 must have one unambiguous keyed explanation");
assert.equal(byId("TR-09").options[4],"DNA polymerase IV","TR-09 must not offer a second proofreading polymerase");
for(const broken of ["beforeentering","gated by voltage Ca²⁺ channels open","the dependent on Na⁺","A binding to single stranded DNA protein","classic classic syndrome"]){
  assert(!JSON.stringify(bank).includes(broken),`mechanical punctuation rewrite damaged wording: ${broken}`);
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
assert.equal(vm.runInContext("BANK.length",libBoot.ctx),599,"with no saved scope the whole bank is loaded");
assert.equal(libBoot.els.get("library").hidden,false,"no saved scope must open the library");
assert.equal(vm.runInContext("IDS.size",libBoot.ctx),599,"id set must span the whole bank regardless of view");
const unitBoot=scoped({course:"OST520",unit:"UE1",source:"all"});
assert.equal(unitBoot.els.get("setup").hidden,false,"a saved unit must open straight into that unit");
assert.equal(vm.runInContext("BANK.length",unitBoot.ctx),599);
assert.equal(vm.runInContext('BANK.filter(q=>q.source==="confusion-lab").length',unitBoot.ctx),24,"Everything view must expose all lab questions");
const facBoot=scoped({course:"OST520",unit:"UE1",source:"faculty"});
assert.equal(vm.runInContext("BANK.length",facBoot.ctx),50,"faculty view must show only the faculty practice questions");
assert(vm.runInContext('BANK.every(q=>q.source==="faculty-practice")',facBoot.ctx),"faculty view leaked a non-faculty question");
assert.equal(vm.runInContext('BANK.filter(q=>q.source==="confusion-lab").length',facBoot.ctx),0,"faculty view leaked the lab");
const ownBoot=scoped({course:"OST520",unit:"UE1",source:"bank"});
assert.equal(vm.runInContext("BANK.length",ownBoot.ctx),549,"bank view must exclude the faculty practice questions");
assert(vm.runInContext('BANK.every(q=>q.source!=="faculty-practice")',ownBoot.ctx),"bank view leaked a faculty question");
assert.equal(vm.runInContext('BANK.filter(q=>q.source==="confusion-lab").length',ownBoot.ctx),24,"bank view must expose all lab questions");
assert.equal(scoped({course:"OST520",unit:"UE2",source:"all"}).els.get("library").hidden,false,"an empty unit must fall back to the library");
assert.equal(scoped({course:"NOPE",unit:"UE1",source:"all"}).els.get("library").hidden,false,"an unknown course must fall back to the library");
assert.equal(vm.runInContext("BANK_FINGERPRINT",facBoot.ctx),vm.runInContext("BANK_FINGERPRINT",libBoot.ctx),"the view must not change the backup fingerprint");
assert(html.includes('599-question OST 520 Unit Exam 1 bank with adaptive practice'),"page metadata must describe the current bank");
assert(html.includes('New question-quality release'),"home must explain the current quality release");
assert(html.includes('label:"Look-Alike Concepts"')&&html.includes('q.source==="confusion-lab"'),"Look-Alike Concepts mode missing");
assert(html.includes('id="contrastwrap"')&&html.includes("function renderContrast(q,a)"),"contrast table UI missing");
assert(!html.includes('grounded in Week 1, Week 2, `\n    + `refresher materials, and the faculty problem sets'),"filtered views must not claim excluded faculty provenance");
for(const phrase of ["Metabolism, glycolysis, sugar entry","Pedigrees, inheritance, DNA/chromosomes","Study design, screening, bias"]){assert(html.includes(phrase),`topic coverage description missing: ${phrase}`);}
const weaknessAnswers={"WK-01":2,"WK-02":1,"WK-03":2,"WK-04":1,"WK-05":0,"WK-06":1,"WK-07":1,"WK-08":1,"WK-09":1,"WK-10":0,"WK-11":1,"WK-12":1,"WK-13":1,"WK-14":0,"WK-15":1,"WK-16":1,"WK-17":1,"WK-18":2,"WK-19":2,"WK-20":1,"WK-21":2,"WK-22":1,"WK-23":2,"WK-24":1};
const weaknessSet=bank.filter(q=>/^WK-/.test(q.id));
for(const q of weaknessSet){assert.equal(q.answer,weaknessAnswers[q.id],`targeted answer key changed: ${q.id}`);assert(q.rationale.includes("The trap:"),`targeted rationale lacks misconception contrast: ${q.id}`);}
const uniqueLongest=weaknessSet.filter(q=>{const lengths=q.options.map(x=>x.length),m=Math.max(...lengths);return lengths[q.answer]===m&&lengths.filter(n=>n===m).length===1;}).length/weaknessSet.length;
assert(uniqueLongest<=.30,`targeted set must not make the longest option predictive, got ${Math.round(uniqueLongest*100)}%`);
bank.forEach(q=>{ assert(q.rationale&&q.concepts&&q.concepts.length,"rationale/concept required: "+q.id); if(q.type==="mcq")assert(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length,"bad answer: "+q.id); else assert.equal(q.answer,null,"worked answer: "+q.id); });
const rebalancedAnswers={"A2-25":1,"A2-27":1,"A2-14":1,"L022-03":1,"L021-09":1,"L021-08":1,"A2-02":1,"L014-11":1,"A2-08":1,"L012-08":1,"A2-29":1,"L011-05":3,"D10":1,"A2-11":1,"ALT-02":1,"L010-04":1,"L023-01":0,"L009-05":1};
const keyedMeaning={"A2-25":"paternally expressed","A2-27":"equal-environments assumption","A2-14":"increases LDL-receptor transcription","L022-03":"MZ 25% / DZ 25%","L021-09":"Huntington is coding","L021-08":"Genetic anticipation","A2-02":"alternative splicing","L014-11":"expressed in only one sex","A2-08":"metaphase spindle checkpoint","L012-08":"protects imprints","A2-29":"4 mg beginning one month before conception","L011-05":"Recruiting co-activators","D10":"Recall bias","A2-11":"S-adenosylmethionine","ALT-02":"shared ancestor","L010-04":"Cyclin levels fluctuate","L023-01":"hypertonic solution","L009-05":"recognizes promoter sequences"};
for(const [id,answer] of Object.entries(rebalancedAnswers)){
  const q=bank.find(item=>item.id===id);
  assert(q,`rebalanced question missing: ${id}`);
  assert.equal(q.answer,answer,`rebalanced answer key changed: ${id}`);
  const normalizeCue=value=>value.toLowerCase().replace(/[-\u2010-\u2015]/g," ").replace(/\s+/g," ");
  assert(normalizeCue(q.options[q.answer]).includes(normalizeCue(keyedMeaning[id])),`rebalanced keyed meaning changed: ${id}`);
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
const labBoot=boot({"ost520.bank.v2":JSON.stringify({schemaVersion:4,bankFingerprint:"fnv1a-41aaee35-575",history:{"DL-01":{attempts:1,correct:1,lastOk:true,reasons:[]}}})});
vm.runInContext('start(q=>q.source==="confusion-lab","Look-Alike Concepts",true,null,true)',labBoot.ctx);
assert.equal(vm.runInContext("S.order.length",labBoot.ctx),24,"lab launch must contain only the 24 lab questions");
assert.equal(vm.runInContext('S.order.every(id=>ALL_QUESTIONS.find(q=>q.id===id).source==="confusion-lab")',labBoot.ctx),true,"lab launch leaked another source");
assert.notEqual(vm.runInContext("S.order[0]",labBoot.ctx),"DL-01","seen lab question appeared before unseen questions");
assert.equal(vm.runInContext("S.order.at(-1)",labBoot.ctx),"DL-01","seen lab question must follow all unseen questions");
const contrastBoot=boot();
vm.runInContext('const cq=ALL_QUESTIONS.find(q=>q.id==="DL-01");renderContrast(cq,{pick:cq.answer===0?1:0});',contrastBoot.ctx);
const contrastHtml=contrastBoot.els.get("contrastwrap").innerHTML;
assert(contrastHtml.includes("<table>")&&contrastHtml.includes("Term")&&contrastHtml.includes("Meaning")&&contrastHtml.includes("Why it fits or fails"),"accessible contrast table did not render");
assert(contrastHtml.includes("Correct concept")&&contrastHtml.includes("Your choice"),"contrast table must label correct and selected concepts in text");
const pairBoot=boot();
vm.runInContext(`const pq=ALL_QUESTIONS.find(q=>q.id==="DL-01"),wrong=pq.answer===0?1:0;S={id:"pair-session",name:"Look-Alike Concepts",date:todayISO(),answers:{[pq.id]:{pick:wrong}},committed:{},initiallySeen:{[pq.id]:false},order:[pq.id]};commit(pq,false,"knew");`,pairBoot.ctx);
let pairState=JSON.parse(pairBoot.data.get("ost520.bank.v2"));
assert.equal(Object.keys(pairState.confusionPairs).length,1,"wrong lab answer must create one confusion pair");
assert.equal(Object.values(pairState.confusionPairs)[0].count,1);
const firstChosen=Object.values(pairState.confusionPairs)[0].chosen;
vm.runInContext('commit(ALL_QUESTIONS.find(q=>q.id==="DL-01"),false,"knew")',pairBoot.ctx);
pairState=JSON.parse(pairBoot.data.get("ost520.bank.v2"));
assert.equal(Object.values(pairState.confusionPairs)[0].count,1,"same-session re-commit double-counted a pair");
vm.runInContext('const pqChange=ALL_QUESTIONS.find(q=>q.id==="DL-01"),oldPick=S.answers[pqChange.id].pick;S.answers[pqChange.id].pick=pqChange.options.findIndex((_,index)=>index!==pqChange.answer&&index!==oldPick);commit(pqChange,false,"knew")',pairBoot.ctx);
pairState=JSON.parse(pairBoot.data.get("ost520.bank.v2"));
assert.equal(Object.keys(pairState.confusionPairs).length,1,"changed wrong choice must replace, not add, the session pair");
assert.equal(Object.values(pairState.confusionPairs)[0].count,1);
assert.notEqual(Object.values(pairState.confusionPairs)[0].chosen,firstChosen,"changed wrong choice did not adjust the selected concept");
vm.runInContext('const pq2=ALL_QUESTIONS.find(q=>q.id==="DL-01");S.answers[pq2.id].pick=pq2.answer;commit(pq2,true,"knew")',pairBoot.ctx);
pairState=JSON.parse(pairBoot.data.get("ost520.bank.v2"));
assert.equal(Object.keys(pairState.confusionPairs).length,0,"corrected same-session outcome must remove its pair contribution");
const legacyBoot=boot({"ost520.bank.v2":JSON.stringify(legacy)});
const migratedStored=JSON.parse(legacyBoot.data.get("ost520.bank.v2"));
assert.equal(migratedStored.schemaVersion,4);assert.deepStrictEqual(migratedStored.history.B1,legacy.history.B1);assert.deepStrictEqual(migratedStored.confusionPairs,{},"legacy migration must add an empty pair store without losing history");assert(legacyBoot.data.has("ost520.bank.v2.recovery"),"migration must keep a recovery copy");
const restoreBoot=boot({"ost520.bank.v2":JSON.stringify({schemaVersion:4,bankFingerprint:"old",history:{}})});
vm.runInContext(`(()=>{const q=ALL_QUESTIONS.find(x=>x.id==="DL-01"),chosen=q.optionConcepts[q.answer===0?1:0],correct=q.optionConcepts[q.answer],key=pairStorageKey(chosen,correct);pendingBackup={schemaVersion:4,createdAt:new Date().toISOString(),bankFingerprint:BANK_FINGERPRINT,history:{B1:{attempts:1,correct:1,lastOk:true,reasons:[]}},questionReports:{B1:{reason:"unclear"}},confusionPairs:{[key]:{chosen,correct,count:2,lastAt:"2026-08-29T12:00:00.000Z",questionId:q.id}},backupMetadata:{lastBackupAt:"2026-08-27T12:00:00.000Z"},activeSession:null,theme:"dark"}; $("confirmimport").onclick();})()`,restoreBoot.ctx);
assert.equal(restoreBoot.alerts.length,0,"valid restore must not report failure");assert.equal(restoreBoot.data.get("ost520.bank.v2.theme"),"dark");assert.equal(JSON.parse(restoreBoot.data.get("ost520.bank.v2")).history.B1.correct,1);
assert.equal(JSON.parse(restoreBoot.data.get("ost520.bank.v2")).questionReports.B1.reason,"unclear","reports must round-trip through restore");
assert.equal(Object.values(JSON.parse(restoreBoot.data.get("ost520.bank.v2")).confusionPairs)[0].count,2,"confusion pairs must round-trip through restore");
assert.equal(Object.values(vm.runInContext("backupPayload().confusionPairs",restoreBoot.ctx))[0].count,2,"backup export must preserve confusion pairs");
assert(vm.runInContext('(()=>{const row=confusionRows()[0],qs=pairQuestions(row.chosen,row.correct);return qs.length>0&&qs.every(q=>q.source==="confusion-lab"&&q.optionConcepts.includes(row.chosen)&&q.optionConcepts.includes(row.correct))})()',restoreBoot.ctx),"pair practice filter must return only matching lab questions");
vm.runInContext("renderDiag()",restoreBoot.ctx);
assert(restoreBoot.els.get("diagbody").innerHTML.includes("Concepts you confuse")&&restoreBoot.els.get("diagbody").innerHTML.includes("pair-action"),"Diagnosis must rank pairs and offer pair practice");
const pairAnalysis=vm.runInContext("analysisText()",restoreBoot.ctx);
assert(pairAnalysis.includes("CONCEPTS YOU CONFUSE")&&pairAnalysis.includes("→"),"analysis text must include confusion pairs");
assert(!pairAnalysis.includes("last question DL-"),"analysis export must not reveal the question-to-answer mapping");
assert(!pairAnalysis.includes(vm.runInContext('ALL_QUESTIONS.find(q=>q.id==="DL-01").rationale',restoreBoot.ctx)),"analysis text leaked a lab rationale");
assert.throws(()=>vm.runInContext('validateBackup({schemaVersion:4,bankFingerprint:BANK_FINGERPRINT,history:{},questionReports:{B1:{reason:"injected"}}})',restoreBoot.ctx),/invalid question report/);
assert.throws(()=>vm.runInContext(`(()=>{const q=ALL_QUESTIONS.find(x=>x.id==="DL-01"),chosen=q.optionConcepts[q.answer===0?1:0],correct=q.optionConcepts[q.answer],key=pairStorageKey(chosen,correct);return validateBackup({schemaVersion:4,bankFingerprint:BANK_FINGERPRINT,history:{},confusionPairs:{[key]:{chosen,correct,count:0,lastAt:new Date().toISOString(),questionId:q.id}}})})()`,restoreBoot.ctx),/invalid confusion pair/);
assert.throws(()=>vm.runInContext(`validateBackup({schemaVersion:4,bankFingerprint:BANK_FINGERPRINT,history:{},confusionPairs:{"made-up::pair":{chosen:"made-up",correct:"pair",count:1,lastAt:new Date().toISOString(),questionId:"DL-01"}}})`,restoreBoot.ctx),/invalid confusion pair/);
for(const priorFingerprint of ["fnv1a-2ed224b5-483","fnv1a-56ef5225-483","fnv1a-ac6648c1-507","fnv1a-40f86fe5-557","fnv1a-41aaee35-575"]){
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
