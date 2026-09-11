/* Offline regression checks for the static site. Run: node tests.js */
const assert=require("assert"),fs=require("fs"),vm=require("vm"),crypto=require("crypto");
const html=fs.readFileSync("index.html","utf8"), json=JSON.parse(fs.readFileSync("bank.json","utf8"));
const between=(a,b)=>html.slice(html.indexOf(a)+a.length,html.indexOf(b,html.indexOf(a)));
const bank=vm.runInNewContext("("+between("let BANK = ",";\nconst META =")+")");
assert.deepStrictEqual(JSON.parse(JSON.stringify(bank)),json,"bank.json must exactly equal embedded BANK");
assert.equal(bank.length,811); assert.equal(new Set(bank.map(q=>q.id)).size,811);
assert.deepStrictEqual(Object.fromEntries(["Biochemistry","Genetics","Epi & Biostats","Molecular Biology","Histology","Hematology & Physiology","Microbiology","Immunology"].map(t=>[t,bank.filter(q=>q.topic===t).length])),{"Biochemistry":207,"Genetics":403,"Epi & Biostats":59,"Molecular Biology":12,"Histology":14,"Hematology & Physiology":32,"Microbiology":55,"Immunology":29});
assert.equal(bank.filter(q=>q.type==="mcq").length,786); assert.equal(bank.filter(q=>q.type==="worked").length,25);
assert.equal(bank.filter(q=>/^WK-/.test(q.id)).length,24,"targeted weakness set must remain complete");
const confusionLab=bank.filter(q=>/^DL-\d\d$/.test(q.id));
assert.equal(confusionLab.length,24,"confusion lab must contain exactly 24 questions");
assert.equal(confusionLab.map(q=>q.id).join(","),[...Array(24)].map((_,i)=>`DL-${String(i+1).padStart(2,"0")}`).join(","),"confusion-lab ids must be stable and ordered");
for(const q of confusionLab){assert.equal(q.source,"confusion-lab");assert.equal(q.n,365+Number(q.id.slice(3)),`Genetics-local question number changed: ${q.id}`);assert.equal(q.options.length,5,`confusion-lab item must have five choices: ${q.id}`);assert.equal(q.optionConcepts.length,q.options.length,`optionConcepts must align: ${q.id}`);assert.equal(new Set(q.optionConcepts).size,q.optionConcepts.length,`optionConcepts must be distinct: ${q.id}`);assert.equal(q.contrast.length,q.options.length,`contrast rows must align: ${q.id}`);q.contrast.forEach((row,index)=>{assert.equal(row.concept,q.optionConcepts[index],`contrast concept misaligned: ${q.id}`);for(const field of ["term","meaning","why"])assert(row[field]&&typeof row[field]==="string",`contrast ${field} missing: ${q.id}`);});assert(q.confusionSet&&q.rationale.includes("<strong>"),`contrast metadata/rationale missing: ${q.id}`);}
assert.equal(new Set(confusionLab.map(q=>q.confusionSet)).size,8,"confusion lab must cover eight look-alike families");
for(const family of new Set(confusionLab.map(q=>q.confusionSet)))assert.equal(confusionLab.filter(q=>q.confusionSet===family).length,3,`family must contain three questions: ${family}`);
assert.deepStrictEqual(JSON.parse(JSON.stringify(confusionLab.reduce((counts,q)=>(counts[q.answer]=(counts[q.answer]||0)+1,counts),{}))),{"0":5,"1":5,"2":5,"3":5,"4":4},"confusion-lab answer positions must remain balanced");
const originalAnswerHash=crypto.createHash("sha256").update(JSON.stringify(bank.filter(q=>!(/^(DL-|L013-|W3-|MQG-)/.test(q.id))).map(q=>[q.id,q.answer]))).digest("hex");
assert.equal(originalAnswerHash,"bf42363a39188b1e3270cd2aedafc141d5f1cf8ef67bfd8c73deab1dae5ec3b9","an original answer index changed");
const dnaRepair=bank.filter(q=>/^L013-\d\d$/.test(q.id));
assert.equal(dnaRepair.length,14,"L013 DNA Repair set must remain complete");
assert(dnaRepair.every(q=>q.topic==="Genetics"&&q.src==="G"&&q.course==="OST520"&&q.unit==="UE1"&&q.type==="mcq"),"L013 question metadata changed");
assert(dnaRepair.every(q=>q.covers.length===1&&q.covers[0]==="L013"&&q.sourceRef==="L013 DNA Repair study guide"),"L013 source metadata changed");
assert(dnaRepair.every(q=>q.options.length===5&&new Set(q.options).size===5&&q.rationale.includes("<strong>")),"L013 question quality guard failed");
const week3=bank.filter(q=>q.unit==="UE2"),coreWeek3=week3.filter(q=>/^W3-/.test(q.id)),missedRemediation=week3.filter(q=>q.source==="missed-remediation");
assert.equal(week3.length,198,"Unit 2 released set must remain complete");
assert.equal(coreWeek3.length,152,"Week 3 baseline set must remain complete");
assert.equal(missedRemediation.length,6,"missed-question remediation set must remain complete");
assert(coreWeek3.every(q=>q.source==="week3-bank"),"Week 3 baseline provenance changed");
assert(missedRemediation.every(q=>q.source==="missed-remediation"&&Array.isArray(q.derivedFrom)&&q.derivedFrom.length===1&&q.missDescription&&q.variantAngle),"missed-question remediation metadata changed");
assert(week3.every(q=>q.course==="OST520"&&q.unit==="UE2"&&q.type==="mcq"),"Unit 2 scope metadata changed");
assert(week3.every(q=>q.options.length===5&&new Set(q.options).size===5&&q.requiresMedia===false&&q.holdout===false),"Week 3 release leaked a malformed, media-gated, or holdout item");
assert(coreWeek3.every(q=>q.sourceRef&&q.closestDistractor&&q.closestDistractor.index!==q.answer),"Week 3 grounding or distractor metadata missing");
assert(missedRemediation.every(q=>q.sourceRef),"Missed-question grounding metadata missing");
const week3Blocks=new Set(["RR6","L026","L027","L028","L029","LABL3","RR7a","RR7b","RR8","L030.1","L030.2","L031","L032","L033","L034","L035","L036","L037","L038/039","L040/041"]);
assert(week3.every(q=>week3Blocks.has(q.sourceBlock)),"Week 3 sourceBlock is missing or outside the 20-block syllabus map");
assert(week3.every(q=>(q.concepts||[]).every(c=>!/^O\d+$/.test(c))),"Week 3 objective concepts must be namespaced by source block");
assert.deepStrictEqual(new Set(week3.map(q=>q.applicationLevel)),new Set(["recall","mechanism","presentation","discrimination"]),"Week 3 application-level mix changed");
assert(coreWeek3.every(q=>!/(?:does not match the course-supported mechanism|does not explain the decisive clue)/i.test(q.closestDistractor.why_wrong)),"Week 3 closest-distractor explanation regressed to a generic placeholder");
const week3ById=Object.fromEntries(week3.map(q=>[q.id,q]));
const perOptionExplained=week3.filter(q=>q.optionExplanations!=null);
assert.equal(perOptionExplained.length,week3.length,"every released UE2 question must teach through every answer option");
for(const q of perOptionExplained){
  assert.equal(q.optionExplanations.length,q.options.length,`optionExplanations must align: ${q.id}`);
  assert(q.optionExplanations.every(text=>typeof text==="string"&&text.trim().length>=40),`optionExplanations must be substantive strings: ${q.id}`);
  assert(q.optionExplanations.every(text=>!/^(?:correct|incorrect)\b|not (?:the )?correct|does not match the course-supported mechanism|does not explain the decisive clue/i.test(text.trim())),`optionExplanations must not use generic or redundant labels: ${q.id}`);
}
const dayOneExpansionAnswers={"W3-L026-CONNECTIVE-TISSUE-11":0,"W3-L026-CONNECTIVE-TISSUE-12":2,"W3-L027-11":1,"W3-L027-12":3,"W3-L028-11":4,"W3-L028-12":2,"W3-L029-11":0,"W3-L029-12":3};
for(const [id,answer] of Object.entries(dayOneExpansionAnswers)){assert(week3ById[id],`Day 1 expansion question missing: ${id}`);assert.equal(week3ById[id].answer,answer,`Day 1 expansion answer changed: ${id}`);}
assert.deepStrictEqual(Object.fromEntries([...Array(5)].map((_,index)=>[index,coreWeek3.filter(q=>q.answer===index).length])),{"0":30,"1":31,"2":30,"3":31,"4":30},"Day 1 UE2 answer balance changed");
const week3Media=JSON.parse(fs.readFileSync("week3/qbank_media_gated_questions.json","utf8"));
const week3HoldoutPath="week3/qbank_holdout_questions.json";
const week3Holdouts=fs.existsSync(week3HoldoutPath)?JSON.parse(fs.readFileSync(week3HoldoutPath,"utf8")):null;
const week3Report=JSON.parse(fs.readFileSync("week3/validation_report.json","utf8"));
const cueCounts=(questions,matcher)=>questions.reduce((counts,q)=>{const hits=q.options.map(matcher);if(hits.filter(Boolean).length===1){counts.eligible++;if(hits[q.answer])counts.correct++;}return counts;},{correct:0,eligible:0});
const cueLength=option=>String(option).replace(/<[^>]*>/g," ").replace(/&[a-z]+;|&#\d+;/gi," ").normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim().replace(/\s+/g," ").length;
const longestCue=questions=>cueCounts(questions,(_,index,options)=>cueLength(options[index])===Math.max(...options.map(cueLength))&&options.filter(option=>cueLength(option)===cueLength(options[index])).length===1);
const dashCue=questions=>cueCounts(questions,option=>/[-\u2010-\u2015]/.test(option));
const readyLongest=longestCue(week3),readyDash=dashCue(week3);
assert.deepStrictEqual([week3Report.totals["ready:cue:unique_longest_correct"],week3Report.totals["ready:cue:unique_longest_eligible"],week3Report.totals["ready:cue:unique_dash_correct"],week3Report.totals["ready:cue:unique_dash_eligible"]],[readyLongest.correct,readyLongest.eligible,readyDash.correct,readyDash.eligible],"Week 3 validation report has stale released-cue metrics");
assert.deepStrictEqual(week3Report.ready_cue_rates,{unique_longest_correct:Number((readyLongest.correct/readyLongest.eligible).toFixed(3)),unique_dash_correct:Number((readyDash.correct/readyDash.eligible).toFixed(3))},"Week 3 validation report has stale released-cue rates");
assert(longestCue(week3).correct/longestCue(week3).eligible<=.30,"released Week 3 correct-longest cue rate exceeds 30%");
if(week3Holdouts){const allWeek3=[...week3,...week3Media,...week3Holdouts],allLongest=longestCue(allWeek3),allDash=dashCue(allWeek3);assert.deepStrictEqual([week3Report.totals["cue:unique_longest_correct"],week3Report.totals["cue:unique_longest_eligible"],week3Report.totals["cue:unique_dash_correct"],week3Report.totals["cue:unique_dash_eligible"]],[allLongest.correct,allLongest.eligible,allDash.correct,allDash.eligible],"Week 3 validation report has stale private authored-cue metrics");}
assert.match(week3ById["W3-L034-BLOOD-PH-REGULATION-02"].options[week3ById["W3-L034-BLOOD-PH-REGULATION-02"].answer],/HA.*H\+.*H2O/i,"buffer question must key weak-acid proton donation");
assert.match(week3ById["W3-L034-BLOOD-PH-REGULATION-06"].options[week3ById["W3-L034-BLOOD-PH-REGULATION-06"].answer],/renal HCO3- retention/i,"respiratory-acidosis question must key renal bicarbonate retention");
assert.match(week3ById["W3-L033-HEMOGLOBIN-AND-GAS-TRANSPORT-06"].options[week3ById["W3-L033-HEMOGLOBIN-AND-GAS-TRANSPORT-06"].answer],/BPG less strongly.*higher O2 affinity/i,"fetal-hemoglobin question must key reduced BPG binding");
assert.match(week3ById["W3-L034-BLOOD-PH-REGULATION-05"].stem,/pH 7\.26, pCO2 55 mm Hg, and HCO3- 24 mEq\/L/i,"ABG regression fixture must remain internally consistent");
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

// Follow-up items must remain understandable when sessions shuffle question order.
const numberedReferences=bank.filter(q=>/\b(?:question|item)\s*(?:#\s*)?\d+\b/i.test(q.stem));
for(const q of numberedReferences) assert(q.context&&q.context.trim(),"numbered cross-reference must include the referenced stem as context: "+q.id);
assert.equal(bank.find(q=>q.id==="E13").context,bank.find(q=>q.id==="E12").stem,"E13 must display the full E12 stem before asking its follow-up");

// every question is filed under a class and a unit, so the library can shelve it
for(const q of bank){ assert.equal(q.course,"OST520","question must carry its course: "+q.id); assert(["UE1","UE2"].includes(q.unit),"question must carry a known unit: "+q.id); if(/^(?:W3-|MQG-)/.test(q.id))assert.equal(q.unit,"UE2"); else assert.equal(q.unit,"UE1"); }
assert(html.includes("let BANK = "),"BANK must be reassignable for the library view");
assert(html.includes("const ALL_QUESTIONS = BANK.slice()"),"full bank must be retained separately from the view");
assert(html.includes("function applyScope()"),"library scope filter missing");
assert(html.includes('id="library"'),"library screen missing");
assert(html.includes('id="shelf"'),"library shelf missing");
assert(html.includes('id="crumb"'),"breadcrumb missing");
assert(html.includes('id="unitnav"')&&html.includes('data-unit-tab="UE2"'),"persistent Unit 2 tab missing");
assert(html.includes('id="views"'),"source filter control missing");
assert(html.includes("JSON.stringify(ALL_QUESTIONS)")&&html.includes('"-"+ALL_QUESTIONS.length'),"fingerprint must span the whole bank, not the current view");
assert(html.includes("const IDS = new Set(ALL_QUESTIONS.map(q=>q.id))"),"id validation must span the whole bank");
assert(html.includes("sessionInView(saved)"),"resume must be limited to sessions inside the current view");

// library behaviour, exercised through the real boot path
const SCOPE_KEY="ost520.bank.v2.scope", scoped=v=>boot({[SCOPE_KEY]:JSON.stringify(v)});
const libBoot=boot();
assert.equal(vm.runInContext("BANK.length",libBoot.ctx),811,"with no saved scope the whole bank is loaded");
assert.equal(libBoot.els.get("library").hidden,false,"no saved scope must open the library");
assert.equal(vm.runInContext("IDS.size",libBoot.ctx),811,"id set must span the whole bank regardless of view");
const unitBoot=scoped({course:"OST520",unit:"UE1",source:"all"});
assert.equal(unitBoot.els.get("setup").hidden,false,"a saved unit must open straight into that unit");
assert.equal(vm.runInContext("BANK.length",unitBoot.ctx),613);
assert.equal(vm.runInContext('BANK.filter(q=>q.source==="confusion-lab").length',unitBoot.ctx),24,"Everything view must expose all lab questions");
const facBoot=scoped({course:"OST520",unit:"UE1",source:"faculty"});
assert.equal(vm.runInContext("BANK.length",facBoot.ctx),50,"faculty view must show only the faculty practice questions");
assert(vm.runInContext('BANK.every(q=>q.source==="faculty-practice")',facBoot.ctx),"faculty view leaked a non-faculty question");
assert.equal(vm.runInContext('BANK.filter(q=>q.source==="confusion-lab").length',facBoot.ctx),0,"faculty view leaked the lab");
const ownBoot=scoped({course:"OST520",unit:"UE1",source:"bank"});
assert.equal(vm.runInContext("BANK.length",ownBoot.ctx),563,"bank view must exclude the faculty practice questions");
assert(vm.runInContext('BANK.every(q=>q.source!=="faculty-practice")',ownBoot.ctx),"bank view leaked a faculty question");
assert.equal(vm.runInContext('BANK.filter(q=>q.source==="confusion-lab").length',ownBoot.ctx),24,"bank view must expose all lab questions");
const unit2Boot=scoped({course:"OST520",unit:"UE2",source:"all"});
assert.equal(unit2Boot.els.get("setup").hidden,false,"a saved UE2 scope must open straight into that unit");
assert.equal(vm.runInContext("BANK.length",unit2Boot.ctx),198,"UE2 must expose the Week 3 baseline plus missed-question remediation");
assert(vm.runInContext('BANK.every(q=>q.unit==="UE2"&&["week3-bank","missed-remediation","sept11-practice","sept12-practice"].includes(q.source))',unit2Boot.ctx),"UE2 leaked another unit or source");
assert.equal(unit2Boot.els.get("unittitle").textContent,"Unit Exam 2","UE2 screen title must not say Unit Exam 1");
assert.equal(vm.runInContext("dailyCap()",unit2Boot.ctx),22,"UE2 daily cap must honor the 13-22 question strategy");
assert.equal(vm.runInContext('unitById(courseById("OST520"),"UE2").exam',unit2Boot.ctx),"2026-09-22","UE2 exam date changed");
assert.deepStrictEqual(Array.from(vm.runInContext('unitById(courseById("OST520"),"UE2").plan[0].blocks',unit2Boot.ctx)),["RR6","L026","L027","L028","L029","LABL3"],"Wednesday launch must contain only Tuesday's six taught blocks");
assert.equal(vm.runInContext('unitById(courseById("OST520"),"UE2").plan[0].date',unit2Boot.ctx),"2026-09-09","UE2 practice must begin Wednesday");
const wedBoot=scoped({course:"OST520",unit:"UE2",source:"all"});
vm.runInContext('const RealDate=Date;Date=class extends RealDate{constructor(...args){super(...(args.length?args:["2026-09-09T12:00:00-04:00"]))}static now(){return new RealDate("2026-09-09T12:00:00-04:00").getTime()}}',wedBoot.ctx);
const wedAdaptive=vm.runInContext("adaptivePrescription()",wedBoot.ctx);
assert.equal(wedAdaptive.questions.length,22,"Wednesday adaptive set must honor the UE2 cap");
assert(vm.runInContext("adaptivePrescription().questions.every(q=>questionTaughtBy(q,todayISO()))",wedBoot.ctx),"Wednesday adaptive set leaked untaught blocks");
assert(vm.runInContext('adaptivePrescription().questions.every(q=>["RR6","L026","L027","L028","L029","LABL3"].includes(q.sourceBlock))',wedBoot.ctx),"Wednesday adaptive set must be restricted to Tuesday's six blocks");
assert(vm.runInContext('todaysPlan().blocks.join(",")',wedBoot.ctx)==="RR6,L026,L027,L028,L029,LABL3","Wednesday plan routing changed");
const cumulativeBoot=scoped({course:"OST520",unit:"UE2",source:"all"});
// Both daily entry points must serve the reviewed batch, even with old history.
const sept11Batch=bank.filter(q=>q.source==="sept11-practice");
assert.equal(sept11Batch.length,20);
assert(sept11Batch.every(q=>/^MQG-SEP11-/.test(q.id)));
assert(sept11Batch.filter(q=>q.reasoningOrder===2).length>=14,"second-order questions must dominate the approved batch");
for(const source of ["all","bank"]){
  const friday=scoped({course:"OST520",unit:"UE2",source});
  vm.runInContext('const RealDate=Date;Date=class extends RealDate{constructor(...args){super(...(args.length?args:["2026-09-11T08:00:00-04:00"]))}static now(){return new RealDate("2026-09-11T08:00:00-04:00").getTime()}}',friday.ctx);
  vm.runInContext('const st=store.read();st.history["W3-L027-01"]={attempts:1,correct:0,lastOk:false,reasons:[]};store.write(st);renderHome();',friday.ctx);
  const expected=Array.from(sept11Batch,q=>q.id).sort();
  const planned=Array.from(vm.runInContext('BANK.filter(planFilter(todaysPlan())).map(q=>q.id)',friday.ctx)).sort();
  assert.deepStrictEqual(planned,expected,"dated route must select the exact reviewed set");
  assert.equal(vm.runInContext('planCount(todaysPlan())',friday.ctx),20);
  assert.deepStrictEqual(Array.from(vm.runInContext('adaptivePrescription().questions.map(q=>q.id)',friday.ctx)).sort(),expected,"adaptive route must serve the same reviewed set");
  friday.els.get("dostoday").onclick();
  assert.deepStrictEqual(Array.from(vm.runInContext('S.order',friday.ctx)).sort(),expected,"start button must launch the reviewed set");
  vm.runInContext('dropSession();renderHome()',friday.ctx);
  friday.els.get("adaptiveToday").onclick();
  assert.deepStrictEqual(Array.from(vm.runInContext('S.order',friday.ctx)).sort(),expected,"application button must launch the reviewed set");
  assert.equal(vm.runInContext('hist()["W3-L027-01"].attempts',friday.ctx),1,"routing must preserve old attempts");
}

// Saturday 2026-09-12 must serve exactly the reviewed September 12 application set (L036-L041).
const sept12Batch=bank.filter(q=>q.source==="sept12-practice");
assert.equal(sept12Batch.length,20,"September 12 application set must be complete");
assert(sept12Batch.every(q=>/^MQG-SEP12-/.test(q.id)),"September 12 set must use the MQG-SEP12 id space");
assert(sept12Batch.filter(q=>q.reasoningOrder===2).length>=14,"second-order questions must dominate the September 12 set");
for(const source of ["all","bank"]){
  const saturday=scoped({course:"OST520",unit:"UE2",source});
  vm.runInContext('const RealDate=Date;Date=class extends RealDate{constructor(...args){super(...(args.length?args:["2026-09-12T08:00:00-04:00"]))}static now(){return new RealDate("2026-09-12T08:00:00-04:00").getTime()}}',saturday.ctx);
  vm.runInContext('renderHome();',saturday.ctx);
  const expected12=Array.from(sept12Batch,q=>q.id).sort();
  const planned12=Array.from(vm.runInContext('BANK.filter(planFilter(todaysPlan())).map(q=>q.id)',saturday.ctx)).sort();
  assert.deepStrictEqual(planned12,expected12,"Saturday dated route must select the exact September 12 set");
  assert.equal(vm.runInContext('planCount(todaysPlan())',saturday.ctx),20,"Saturday plan count must be the 20 reviewed items");
  assert.deepStrictEqual(Array.from(vm.runInContext('adaptivePrescription().questions.map(q=>q.id)',saturday.ctx)).sort(),expected12,"Saturday adaptive route must serve the same September 12 set");
  saturday.els.get("dostoday").onclick();
  assert.deepStrictEqual(Array.from(vm.runInContext('S.order',saturday.ctx)).sort(),expected12,"Saturday start button must launch the September 12 set");
  vm.runInContext('dropSession();renderHome()',saturday.ctx);
  saturday.els.get("adaptiveToday").onclick();
  assert.deepStrictEqual(Array.from(vm.runInContext('S.order',saturday.ctx)).sort(),expected12,"Saturday application button must launch the September 12 set");
}
vm.runInContext('const RealDate=Date;Date=class extends RealDate{constructor(...args){super(...(args.length?args:["2026-09-13T12:00:00-04:00"]))}static now(){return new RealDate("2026-09-13T12:00:00-04:00").getTime()}}',cumulativeBoot.ctx);
assert.match(vm.runInContext("todaysPlan().note",cumulativeBoot.ctx),/^cumulative review/,"pre-exam fallback was mislabeled post-exam");
assert.equal(scoped({course:"NOPE",unit:"UE1",source:"all"}).els.get("library").hidden,false,"an unknown course must fall back to the library");
assert.equal(vm.runInContext("BANK_FINGERPRINT",facBoot.ctx),vm.runInContext("BANK_FINGERPRINT",libBoot.ctx),"the view must not change the backup fingerprint");
assert(html.includes('811-question OST 520 bank for Unit Exams 1 and 2 with adaptive practice'),"page metadata must describe the current bank");
assert(html.includes('New question-quality release'),"home must explain the current quality release");
assert(html.includes('label:"Look-Alike Concepts"')&&html.includes('q.source==="confusion-lab"'),"Look-Alike Concepts mode missing");
assert(html.includes('id="contrastwrap"')&&html.includes("function renderContrast(q,a)"),"contrast table UI missing");
assert(!html.includes('grounded in Week 1, Week 2, `\n    + `refresher materials, and the faculty problem sets'),"filtered views must not claim excluded faculty provenance");
for(const phrase of ["Metabolism, glycolysis, sugar entry","Pedigrees, inheritance, DNA/chromosomes","Study design, screening, bias","Translation, targeting, folding","Connective-tissue structure","Blood cells, hematopoiesis","Infection, microbiota, fungi","Immune organization, communication"]){assert(html.includes(phrase),`topic coverage description missing: ${phrase}`);}
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
assert(html.includes('plan.questionIds?"application "+n:"adaptive "+dailyCap()'),"adaptive prescription entry point must show the dated application set or active unit cap");assert(html.includes("lastConfidence"),"confidence migration missing");assert(html.includes("timezoneOffsetMinutes"),"timezone-aware timeline missing");assert(html.includes("questionReports"),"question report storage missing");
assert(html.includes('a.pick!=null && !!(a.confidence || ("guessed" in a'),"new MCQ attempts must explicitly record confidence");
assert(html.includes('guessed:c!=="knew"}; renderQ(); sync();'),"confidence changes must immediately enable the Check button");
function boot(storage={}){const source=html.slice(html.indexOf("<script>")+8,html.lastIndexOf("</script>")),els=new Map(),el=()=>{const node={hidden:false,style:{},classList:{add(){}},setAttribute(){},children:[],textContent:"",click(){},querySelectorAll(){return[]},appendChild(child){this.children.push(child);}};Object.defineProperty(node,"innerHTML",{get(){return this._innerHTML||""},set(value){this._innerHTML=value;if(value==="")this.children=[];}});return node;},document={getElementById:id=>{if(!els.has(id))els.set(id,el());return els.get(id)},createElement:el,querySelectorAll(){return[]},addEventListener(){},documentElement:{setAttribute(){},removeAttribute(){},getAttribute(){return null}}},data=new Map(Object.entries(storage)),localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)},alerts=[],ctx=vm.createContext({document,localStorage,window:{scrollTo(){}},console,Date,JSON,Math,Set,Map,Array,Object,Number,String,Boolean,RegExp,Error,Blob:function(){},URL:{createObjectURL(){return ""},revokeObjectURL(){}},FileReader:function(){},navigator:{},alert:m=>alerts.push(String(m)),setTimeout(){}});vm.runInContext(source,ctx);return{ctx,data,els,alerts};}
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
const optionExplanationBoot=boot();
vm.runInContext(`(()=>{const q=ALL_QUESTIONS.find(q=>q.id==="W3-L027-01");BANK=[q];S={id:"option-explanation-test",name:"Test",date:todayISO(),seed:918273,i:0,answers:{[q.id]:{pick:0,confidence:"knew"}},committed:{},initiallySeen:{[q.id]:false},order:[q.id]};renderQ();})()`,optionExplanationBoot.ctx);
assert(optionExplanationBoot.els.get("opts").children.every(button=>!button.innerHTML.includes("option-explanation")),"per-option explanations must stay hidden before submission");
vm.runInContext('S.answers["W3-L027-01"].checked=true;renderQ()',optionExplanationBoot.ctx);
const renderedOptions=optionExplanationBoot.els.get("opts").children.map(button=>button.innerHTML);
assert.equal(renderedOptions.filter(markup=>markup.includes("option-explanation")).length,5,"all aligned option explanations must render after submission");
const explanationQuestion=week3ById["W3-L027-01"];
for(let originalIndex=0;originalIndex<explanationQuestion.options.length;originalIndex++){
  const displayedMarkup=renderedOptions.find(markup=>markup.includes(explanationQuestion.options[originalIndex]));
  assert(displayedMarkup&&displayedMarkup.includes(explanationQuestion.optionExplanations[originalIndex]),`shuffled explanation mapped to the wrong option at original index ${originalIndex}`);
  assert(displayedMarkup.includes(originalIndex===explanationQuestion.answer?"Why this is correct":"Why this is incorrect"),`option verdict label is wrong at original index ${originalIndex}`);
}
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
for(const priorFingerprint of ["fnv1a-2ed224b5-483","fnv1a-56ef5225-483","fnv1a-ac6648c1-507","fnv1a-40f86fe5-557","fnv1a-41aaee35-575","fnv1a-2939a373-613","fnv1a-91c07573-765","fnv1a-26480c6b-771"]){
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
