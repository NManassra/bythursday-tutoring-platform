"use client";

import {useEffect,useState} from "react";

type TeacherQuiz={id:string;title:string;status:string;attempts:Array<unknown>;questions:Array<{id:string}>};
type TeacherClass={id:string;name:string};
type Analytics={attempted:number;assigned:number;average:number;highest:number;lowest:number;completionRate:number};
type BuilderOption={text:string;isCorrect:boolean};
type BuilderQuestion={text:string;points:number;options:BuilderOption[]};

const blankQuestion=():BuilderQuestion=>({text:"",points:1,options:[{text:"",isCorrect:true},{text:"",isCorrect:false},{text:"",isCorrect:false},{text:"",isCorrect:false}]});

export default function TeacherDashboard({user}:{user:{name:string}}){
 const[q,setQ]=useState<TeacherQuiz[]>([]),[classes,setClasses]=useState<TeacherClass[]>([]);
 const[title,setTitle]=useState(""),[description,setDescription]=useState(""),[classId,setClassId]=useState("");
 const[opensAt,setOpensAt]=useState(()=>new Date().toISOString().slice(0,16));
 const[closesAt,setClosesAt]=useState(()=>new Date(Date.now()+86400000).toISOString().slice(0,16));
 const[duration,setDuration]=useState(20),[points,setPoints]=useState(1),[negative,setNegative]=useState(0);
 const[questions,setQuestions]=useState<BuilderQuestion[]>([blankQuestion()]);
 const[analytics,setAnalytics]=useState<Record<string,Analytics>>({});
 const[busy,setBusy]=useState<string|null>(null),[message,setMessage]=useState("");

 async function load(){
   const[a,b]=await Promise.all([fetch("/api/quizzes"),fetch("/api/classes")]);
   const qa=await a.json() as {quizzes?:TeacherQuiz[]};
   const ca=await b.json() as {classes?:TeacherClass[]};
   setQ(qa.quizzes??[]);setClasses(ca.classes??[]);
 }
 useEffect(()=>{void load()},[]);

 function updateQuestion(index:number,patch:Partial<BuilderQuestion>){
   setQuestions(prev=>prev.map((item,i)=>i===index?{...item,...patch}:item));
 }
 function updateOption(qi:number,oi:number,patch:Partial<BuilderOption>){
   setQuestions(prev=>prev.map((q,i)=>i===qi?{...q,options:q.options.map((o,j)=>j===oi?{...o,...patch}:o)}:q));
 }
 function setCorrect(qi:number,oi:number){
   setQuestions(prev=>prev.map((q,i)=>i===qi?{...q,options:q.options.map((o,j)=>({...o,isCorrect:j===oi}))}:q));
 }
 function addOption(qi:number){
   setQuestions(prev=>prev.map((q,i)=>i===qi&&q.options.length<6?{...q,options:[...q.options,{text:"",isCorrect:false}]}:q));
 }
 function removeOption(qi:number,oi:number){
   setQuestions(prev=>prev.map((q,i)=>i===qi&&q.options.length>2?{...q,options:q.options.filter((_,j)=>j!==oi)}:q));
 }
 function removeQuestion(qi:number){
   setQuestions(prev=>prev.length>1?prev.filter((_,i)=>i!==qi):prev);
 }

 async function create(){
   setBusy("create");setMessage("");
   const body={
     title,description,opensAt:new Date(opensAt).toISOString(),closesAt:new Date(closesAt).toISOString(),
     durationMinutes:duration,pointsPerQuestion:points,negativeMarkPercent:negative,classId,
     questions:questions.map(q=>({text:q.text,points:q.points,options:q.options}))
   };
   const r=await fetch("/api/quizzes/create",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
   const data=await r.json() as {error?:string};
   if(r.ok){
     setMessage("Draft created. Review it in the quiz list, then publish when ready.");
     setTitle("");setDescription("");setQuestions([blankQuestion()]);await load();
   }else setMessage(data.error??"Unable to create quiz.");
   setBusy(null);
 }
 async function publish(id:string){
   setBusy(id);setMessage("");
   const r=await fetch("/api/quizzes/"+id+"/publish",{method:"POST"});
   const data=await r.json() as {error?:string};
   if(r.ok)await load();else setMessage(data.error??"Unable to publish quiz.");
   setBusy(null);
 }
 async function showAnalytics(id:string){
   const r=await fetch("/api/analytics/"+id);
   if(r.ok){const data=await r.json() as Analytics;setAnalytics(prev=>({...prev,[id]:data}))}
 }

 return <main className="shell" dir="auto">
   <div className="top">
     <div><p className="eyebrow">Teacher</p><h1>{user.name}</h1><p className="muted">Create, publish and monitor your quizzes.</p></div>
     <button className="btn secondary" onClick={async()=>{await fetch("/api/auth/logout",{method:"POST"});location.href="/login"}}>Sign out</button>
   </div>

   <section className="card builder">
     <div className="section-heading"><div><p className="eyebrow">Quiz builder</p><h2>Create a new quiz</h2><p className="muted">Build the questions, set the rules, then publish when everything is ready.</p></div></div>
     <div className="form-grid">
       <label>Quiz title<input className="input" dir="auto" value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Algebra | الجبر" maxLength={160}/></label>
       <label>Class<select className="input" value={classId} onChange={e=>setClassId(e.target.value)}><option value="">Select class</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
     </div>
     <label>Description<textarea className="input textarea" dir="auto" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Optional instructions for students" maxLength={1000}/></label>
     <div className="form-grid four">
       <label>Opens<input className="input" type="datetime-local" value={opensAt} onChange={e=>setOpensAt(e.target.value)}/></label>
       <label>Closes<input className="input" type="datetime-local" value={closesAt} onChange={e=>setClosesAt(e.target.value)}/></label>
       <label>Duration (min)<input className="input" type="number" min={1} max={300} value={duration} onChange={e=>setDuration(Number(e.target.value))}/></label>
       <label>Default points<input className="input" type="number" min={0.01} max={100} step="0.25" value={points} onChange={e=>setPoints(Number(e.target.value))}/></label>
     </div>
     <label className="compact-field">Negative marking
       <select className="input" value={negative} onChange={e=>setNegative(Number(e.target.value))}>
         <option value={0}>None</option><option value={25}>25% of question points</option><option value={50}>50% of question points</option><option value={100}>100% of question points</option>
       </select>
     </label>

     <div className="question-list">
       {questions.map((q,qi)=><article className="question-editor" key={qi}>
         <div className="question-header"><div><span className="question-number">Question {qi+1}</span><span className="muted"> · {q.points} point{q.points===1?"":"s"}</span></div>{questions.length>1&&<button type="button" className="text-button danger" onClick={()=>removeQuestion(qi)}>Remove</button>}</div>
         <label>Question text<textarea className="input textarea" dir="auto" value={q.text} onChange={e=>updateQuestion(qi,{text:e.target.value})} placeholder="Write the question in English or Arabic"/></label>
         <label className="compact-field">Points<input className="input" type="number" min={0.01} max={100} step="0.25" value={q.points} onChange={e=>updateQuestion(qi,{points:Number(e.target.value)})}/></label>
         <div className="options-editor">
           <span className="field-label">Answer options <span className="muted">— select the correct answer</span></span>
           {q.options.map((o,oi)=><div className="option-editor" key={oi}>
             <input aria-label={"Correct option "+(oi+1)} type="radio" name={"correct-"+qi} checked={o.isCorrect} onChange={()=>setCorrect(qi,oi)}/>
             <input className="input" dir="auto" value={o.text} onChange={e=>updateOption(qi,oi,{text:e.target.value})} placeholder={"Option "+(oi+1)}/>
             {q.options.length>2&&<button type="button" className="text-button" onClick={()=>removeOption(qi,oi)} aria-label={"Remove option "+(oi+1)}>Remove</button>}
           </div>)}
           {q.options.length<6&&<button type="button" className="btn secondary small" onClick={()=>addOption(qi)}>+ Add option</button>}
         </div>
       </article>)}
     </div>
     <div className="row builder-actions">
       <button type="button" className="btn secondary" onClick={()=>setQuestions(prev=>[...prev,blankQuestion()])}>+ Add question</button>
       <button type="button" className="btn" disabled={busy==="create"||!title.trim()||!classId||questions.some(q=>!q.text.trim()||q.options.some(o=>!o.text.trim()))} onClick={create}>{busy==="create"?"Creating…":"Create draft"}</button>
     </div>
     {message&&<p className={message.includes("created")?"success":"danger"} role="status">{message}</p>}
   </section>

   <section className="card" style={{marginTop:20}}>
     <div className="section-heading"><div><p className="eyebrow">Quiz management</p><h2>Your quizzes</h2></div><span className="muted">{q.length} total</span></div>
     {!q.length&&<div className="empty"><p>No quizzes yet.</p><span className="muted">Create your first quiz above.</span></div>}
     {q.map(x=><article className="quiz-row" key={x.id}>
       <div className="quiz-row-main"><div><h3 dir="auto">{x.title}</h3><p className="muted">{x.questions.length} questions · <span className={x.status==="PUBLISHED"?"success":""}>{x.status}</span> · {x.attempts.length} submitted</p></div></div>
       <div className="row">
         {x.status==="DRAFT"&&<button className="btn" disabled={busy===x.id} onClick={()=>publish(x.id)}>{busy===x.id?"Publishing…":"Publish"}</button>}
         <button className="btn secondary" onClick={()=>showAnalytics(x.id)}>View analytics</button>
       </div>
       {analytics[x.id]&&<div className="analytics-grid">
         <div><span className="muted">Attempted</span><strong>{analytics[x.id].attempted}/{analytics[x.id].assigned}</strong></div>
         <div><span className="muted">Average</span><strong>{analytics[x.id].average}</strong></div>
         <div><span className="muted">Highest</span><strong>{analytics[x.id].highest}</strong></div>
         <div><span className="muted">Lowest</span><strong>{analytics[x.id].lowest}</strong></div>
         <div><span className="muted">Completion</span><strong>{analytics[x.id].completionRate}%</strong></div>
       </div>}
     </article>)}
   </section>
 </main>
}