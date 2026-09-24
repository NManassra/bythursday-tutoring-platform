"use client";
import {useEffect,useRef,useState} from "react";
import {useRouter} from "next/navigation";

type QuizOption={id:string;text:string};
type QuizQuestion={id:string;text:string;options:QuizOption[]};
type SavedAnswer={questionId:string;optionId:string|null};
type StartedQuiz={attemptId:string;deadlineAt:string;submittedAt?:string|null;savedAnswers?:SavedAnswer[];quiz:{title:string;questions:QuizQuestion[]}};

function formatTime(totalSeconds:number){
  const safe=Math.max(0,totalSeconds);
  return Math.floor(safe/60)+":"+String(safe%60).padStart(2,"0");
}

export default function QuizClient({quizId}:{quizId:string}){
  const[a,setA]=useState<StartedQuiz>();
  const[answers,setAnswers]=useState<Record<string,string>>({});
  const[msg,setMsg]=useState("");
  const[seconds,setSeconds]=useState(0);
  const[submitting,setSubmitting]=useState(false);
  const[saveState,setSaveState]=useState<"saved"|"saving"|"error">("saved");
  const[online,setOnline]=useState(true);
  const[autoSubmitting,setAutoSubmitting]=useState(false);
  const[retryTick,setRetryTick]=useState(0);
  const router=useRouter();
  const autoSubmittedRef=useRef(false);
  const headingRef=useRef<HTMLHeadingElement>(null);

  useEffect(()=>{
    fetch("/api/quizzes/"+quizId+"/start",{method:"POST"})
      .then(async r=>{const x=await r.json() as StartedQuiz&{error?:string};if(!r.ok)throw new Error(x.error??"Unable to start quiz");if(x.submittedAt){router.push("/results/"+x.attemptId);return}setA(x);setAnswers(Object.fromEntries((x.savedAnswers??[]).filter(v=>v.optionId).map(v=>[v.questionId,v.optionId as string])));setSeconds(Math.max(0,Math.floor((new Date(x.deadlineAt).getTime()-Date.now())/1000)));})
      .catch(e=>setMsg(e instanceof Error?e.message:"Unable to load the quiz. Please refresh and try again."));
  },[quizId,router]);

  useEffect(()=>{if(a)headingRef.current?.focus()},[a]);

  useEffect(()=>{
    const on=()=>setOnline(true),off=()=>setOnline(false);
    setOnline(navigator.onLine);
    window.addEventListener("online",on);window.addEventListener("offline",off);
    return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off)};
  },[]);

  useEffect(()=>{
    if(!a)return;
    const t=setInterval(()=>setSeconds(Math.max(0,Math.floor((new Date(a.deadlineAt).getTime()-Date.now())/1000))),500);
    return()=>clearInterval(t);
  },[a]);

  useEffect(()=>{
    if(!a||submitting)return;
    const selected=Object.entries(answers).map(([questionId,optionId])=>({questionId,optionId}));
    if(!selected.length)return;
    let cancelled=false;
    const timer=setTimeout(async()=>{
      if(!navigator.onLine){setSaveState("error");return}
      setSaveState("saving");
      for(let attempt=0;attempt<3&&!cancelled;attempt++){
        try{
          const r=await fetch("/api/attempts/"+a.attemptId+"/answers",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({answers:selected})});
          if(r.ok){setSaveState("saved");return}
          if(r.status===409){setSaveState("error");return}
        }catch{}
        await new Promise(resolve=>setTimeout(resolve,500*Math.pow(2,attempt)));
      }
      if(!cancelled)setSaveState("error");
    },350);
    return()=>{cancelled=true;clearTimeout(timer)};
  },[answers,a,submitting,online]);

  useEffect(()=>{
    if(!a||seconds>0||autoSubmittedRef.current||submitting||!online)return;
    autoSubmittedRef.current=true;
    setAutoSubmitting(true);
    fetch("/api/attempts/"+a.attemptId+"/finalize",{method:"POST"})
      .then(async r=>{const x=await r.json() as {submittedAt?:string;error?:string};if(r.status===202){setAutoSubmitting(false);autoSubmittedRef.current=false;setTimeout(()=>setRetryTick(v=>v+1),500);return}if(r.ok&&x.submittedAt)router.push("/results/"+a.attemptId);else{setMsg(x.error??"Time expired. Your attempt could not be finalized automatically.");setAutoSubmitting(false);}})
      .catch(()=>{setMsg("Time expired. We could not reach the server to finalize your attempt. Reconnect and retry.");setAutoSubmitting(false);autoSubmittedRef.current=false});
  },[a,seconds,submitting,router,online,retryTick]);

  useEffect(()=>{
    if(!a)return;
    const state={quizGuard:true};
    window.history.pushState(state,"",window.location.href);
    const onPopState=()=>{
      const leave=window.confirm("Your quiz is still in progress. Your timer will continue running if you leave, and you can resume the same attempt later. Leave the quiz?");
      if(leave)router.push("/dashboard");else window.history.pushState(state,"",window.location.href);
    };
    const onBeforeUnload=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue=""};
    window.addEventListener("popstate",onPopState);window.addEventListener("beforeunload",onBeforeUnload);
    return()=>{window.removeEventListener("popstate",onPopState);window.removeEventListener("beforeunload",onBeforeUnload)};
  },[a,router]);

  async function submit(){
    if(!a||submitting||seconds===0)return;
    setSubmitting(true);setMsg("");
    try{
      const r=await fetch("/api/attempts/"+a.attemptId+"/submit",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({answers:a.quiz.questions.map(q=>({questionId:q.id,optionId:answers[q.id]??null}))})});
      const x=await r.json() as {error?:string};
      if(r.ok)router.push("/results/"+a.attemptId);else{setMsg(x.error??"Unable to submit quiz");setSubmitting(false)}
    }catch{setMsg("Network error. Reconnect and try again.");setSubmitting(false)}
  }

  function exitQuiz(){
    if(window.confirm("Exit the quiz? Your timer will continue and your saved answers can be resumed later."))router.push("/dashboard");
  }

  if(!a)return <main className="shell"><div className="card" role="status">{msg?<p className="danger">{msg}</p>:"Loading quiz…"}</div></main>;

  const urgent=seconds<=60;
  const deadline=new Date(a.deadlineAt).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"});
  const saveLabel=!online?"Offline — changes will retry when you reconnect":saveState==="saving"?"Saving answers…":saveState==="error"?"Answers not saved — retrying":"Answers saved";

  return <main className="shell" dir="auto">
    <div className="quiz-toolbar">
      <div className="quiz-title">
        <p className="eyebrow">Quiz in progress</p>
        <h1 ref={headingRef} tabIndex={-1} dir="auto">{a.quiz.title}</h1>
        <span className={"save-status "+(saveState==="error"||!online?"save-status-error":"")}>{saveLabel}</span>
        <span className="deadline-label">Deadline: {deadline}</span>
      </div>
      <div className={"countdown "+(urgent?"countdown-urgent":"")} role="timer" aria-live="polite" aria-label={"Time remaining "+formatTime(seconds)}>
        <span className="countdown-label">Time remaining</span><strong>{formatTime(seconds)}</strong>
      </div>
      <div className="row quiz-actions">
        <button className="btn secondary" type="button" onClick={exitQuiz} disabled={submitting}>Exit quiz</button>
        <button className="btn" type="button" disabled={seconds===0||submitting||autoSubmitting} onClick={submit}>{submitting?"Submitting…":seconds===0?"Time expired":"Submit quiz"}</button>
      </div>
    </div>
    {!online&&<div className="card network-banner" role="alert">You are offline. Your current selections remain on this page and saved answers will retry automatically when the connection returns.</div>}
    {urgent&&seconds>0&&<div className="card timer-warning" role="status">Less than one minute remains. Submit before the server deadline.</div>}
    {seconds===0&&<div className="card timer-warning" role="status">{autoSubmitting?"Time expired — finalizing your attempt…":"Your time has expired. Your attempt is being finalized from the last server-saved answers."}</div>}
    {msg&&<div className="card"><p className="danger" role="alert">{msg}</p></div>}
    <div className="grid">{a.quiz.questions.map((q,i)=><fieldset className="card question-card" key={q.id}>
      <legend dir="auto">{i+1}. {q.text}</legend>
      {q.options.map(o=><label className="option" key={o.id} dir="auto">
        <input type="radio" name={q.id} checked={answers[q.id]===o.id} onChange={()=>setAnswers(v=>({...v,[q.id]:o.id}))}/>
        {" "}{o.text}
      </label>)}
    </fieldset>)}</div>
  </main>;
}
