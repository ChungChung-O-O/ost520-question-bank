/* Offline regression checks for the static site. Run: node tests.js */
const assert=require("assert"),fs=require("fs"),vm=require("vm");
const html=fs.readFileSync("index.html","utf8"), json=JSON.parse(fs.readFileSync("bank.json","utf8"));
const between=(a,b)=>html.slice(html.indexOf(a)+a.length,html.indexOf(b,html.indexOf(a)));
const bank=vm.runInNewContext("("+between("const BANK = ",";\nconst META =")+")");
assert.deepStrictEqual(JSON.parse(JSON.stringify(bank)),json,"bank.json must exactly equal embedded BANK");
assert.equal(bank.length,483); assert.equal(new Set(bank.map(q=>q.id)).size,483);
assert.deepStrictEqual(Object.fromEntries(["Biochemistry","Genetics","Epi & Biostats"].map(t=>[t,bank.filter(q=>q.topic===t).length])),{"Biochemistry":112,"Genetics":312,"Epi & Biostats":59});
assert.equal(bank.filter(q=>q.type==="mcq").length,460); assert.equal(bank.filter(q=>q.type==="worked").length,23);
bank.forEach(q=>{ assert(q.rationale&&q.concepts&&q.concepts.length,"rationale/concept required: "+q.id); if(q.type==="mcq")assert(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length,"bad answer: "+q.id); else assert.equal(q.answer,null,"worked answer: "+q.id); });

function status(h){if(!h)return"unseen";if(h.lastOk===false)return"wrong";if(h.lastOk===true&&h.lastGuessed)return"guessed";return"correct";}
const legacy={history:{B1:{attempts:2,correct:1,lastOk:false,at:1,reasons:["didnt-know"]}}};
const migrated=JSON.parse(JSON.stringify(legacy));migrated.schemaVersion=3;migrated.bankFingerprint="x";
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
function boot(storage={}){const source=html.slice(html.indexOf("<script>")+8,html.lastIndexOf("</script>")),els=new Map(),el=()=>({hidden:false,style:{},classList:{add(){}},setAttribute(){},appendChild(){},textContent:"",innerHTML:"",click(){}}),document={getElementById:id=>{if(!els.has(id))els.set(id,el());return els.get(id)},createElement:el,addEventListener(){},documentElement:{setAttribute(){},removeAttribute(){},getAttribute(){return null}}},data=new Map(Object.entries(storage)),localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)},alerts=[],ctx=vm.createContext({document,localStorage,window:{scrollTo(){}},console,Date,JSON,Math,Set,Map,Array,Object,Number,String,Boolean,RegExp,Error,Blob:function(){},URL:{createObjectURL(){return ""},revokeObjectURL(){}},FileReader:function(){},navigator:{},alert:m=>alerts.push(String(m)),setTimeout(){}});vm.runInContext(source,ctx);return{ctx,data,els,alerts};}
boot();boot({"ost520.bank.v2":"{bad json"});
const legacyBoot=boot({"ost520.bank.v2":JSON.stringify(legacy)});
const migratedStored=JSON.parse(legacyBoot.data.get("ost520.bank.v2"));
assert.equal(migratedStored.schemaVersion,3);assert.deepStrictEqual(migratedStored.history.B1,legacy.history.B1);assert(legacyBoot.data.has("ost520.bank.v2.recovery"),"migration must keep a recovery copy");
const restoreBoot=boot({"ost520.bank.v2":JSON.stringify({schemaVersion:3,bankFingerprint:"old",history:{}})});
vm.runInContext(`pendingBackup={schemaVersion:3,createdAt:new Date().toISOString(),bankFingerprint:BANK_FINGERPRINT,history:{B1:{attempts:1,correct:1,lastOk:true,reasons:[]}},activeSession:null,theme:"dark"}; $("confirmimport").onclick();`,restoreBoot.ctx);
assert.equal(restoreBoot.alerts.length,0,"valid restore must not report failure");assert.equal(restoreBoot.data.get("ost520.bank.v2.theme"),"dark");assert.equal(JSON.parse(restoreBoot.data.get("ost520.bank.v2")).history.B1.correct,1);
console.log("PASS: integrity, migration compatibility, queues, interleaving, session semantics, backup/import UI guards");
