"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";

type QuizOption={id:string;text:string};
type QuizQuestion={id:string;text:string;options:QuizOption[]};
type SavedAnswer={questionId:string;optionId:string|null};
type StartedQuiz={
  attemptId:string;
  deadlineAt:string;
  submittedAt?:string|null;
  savedAnswers?:SavedAnswer[];
  quiz:{title:string;questions:QuizQuestion[]}
};

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
  const router=useRouter();

  useEffect(()=>{
    fetch("/api/quizzes/"+quizId+"/start",{method:"POST"}).then(async r=>{
      const x=await r.json() as StartedQuiz&{error?:string};
      if(!r.ok){setMsg(x.error??"Unable to start quiz");return}
      if(x.submittedAt){router.push("/results/"+x.attemptId);return}
      setA(x);
      setAnswers(Object.fromEntries((x.savedAnswers??[]).filter(v=>v.optionId).map(v=>[v.questionId,v.optionId as string])));
      setSeconds(Math.max(0,Math.floor((new Date(x.deadlineAt).getTime()-Date.now())/1000)));
    }).catch(()=>setMsg("Unable to load the quiz. Please refresh and try again."));
  },[quizId,router]);

  useEffect(()=>{
    if(!a)return;
    const t=setInterval(()=>{
      setSeconds(Math.max(0,Math.floor((new Date(a.deadlineAt).getTime()-Date.now())/1000)));
    },500);
    return()=>clearInterval(t);
  },[a]);

  useEffect(()=>{
    if(!a||submitting)return;
    const selected=Object.entries(answers).map(([questionId,optionId])=>({questionId,optionId}));
    if(!selected.length)return;
    setSaveState("saving");
    const timer=setTimeout(()=>{
      fetch("/api/attempts/"+a.attemptId+"/answers",{
        method:"PUT",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({answers:selected})
      }).then(r=>{
        if(!r.ok)throw new Error("save");
        setSaveState("saved");
      }).catch(()=>setSaveState("error"));
    },350);
    return()=>clearTimeout(timer);
  },[answers,a,submitting]);

  useEffect(()=>{
    if(!a)return;
    const state={quizGuard:true};
    window.history.pushState(state,"",window.location.href);

    const onPopState=()=>{
      const leave=window.confirm("Your quiz is still in progress. Your timer will continue running if you leave, and you can resume the same attempt later. Leave the quiz?");
      if(leave)router.push("/dashboard");
      else window.history.pushState(state,"",window.location.href);
    };
    const onBeforeUnload=(event:BeforeUnloadEvent)=>{
      event.preventDefault();
      event.returnValue="";
    };

    window.addEventListener("popstate",onPopState);
    window.addEventListener("beforeunload",onBeforeUnload);
    return()=>{
      window.removeEventListener("popstate",onPopState);
      window.removeEventListener("beforeunload",onBeforeUnload);
    };
  },[a,router]);

  async function submit(){
    if(!a||submitting||seconds===0)return;
    setSubmitting(true);
    setMsg("");
    const r=await fetch("/api/attempts/"+a.attemptId+"/submit",{
      method:"POST",
      headers:{"content-type":"application/json"},
      body:JSON.stringify({answers:a.quiz.questions.map(q=>({questionId:q.id,optionId:answers[q.id]??null}))})
    });
    const x=await r.json() as {error?:string};
    if(r.ok)router.push("/results/"+a.attemptId);
    else{
      setMsg(x.error??"Unable to submit quiz");
      setSubmitting(false);
    }
  }

  if(!a)return <main className="shell"><div className="card">{msg?<p className="danger">{msg}</p>:"Loading quiz…"}</div></main>;

  const urgent=seconds<=60;
  const saveLabel=saveState==="saving"?"Saving answers…":saveState==="error"?"Answers not saved — retrying":"Answers saved";
  return <main className="shell" dir="auto">
    <div className="quiz-toolbar">
      <div className="quiz-title">
        <p className="eyebrow">Quiz in progress</p>
        <h1 dir="auto">{a.quiz.title}</h1>
        <span className={"save-status "+(saveState==="error"?"save-status-error":"")}>{saveLabel}</span>
      </div>
      <div className={"countdown "+(urgent?"countdown-urgent":"")} role="timer" aria-live="polite" aria-label={"Time remaining "+formatTime(seconds)}>
        <span className="countdown-label">Time remaining</span>
        <strong>{formatTime(seconds)}</strong>
      </div>
      <button className="btn" disabled={seconds===0||submitting} onClick={submit}>{submitting?"Submitting…":seconds===0?"Time expired":"Submit quiz"}</button>
    </div>
    {seconds<=60&&seconds>0&&<div className="card timer-warning" role="status">You have less than one minute remaining. Make sure you submit before the server deadline.</div>}
    {seconds===0&&<div className="card timer-warning" role="alert">Your time has expired. Submission is no longer available.</div>}
    {msg&&<div className="card"><p className="danger" role="alert">{msg}</p></div>}
    <div className="grid">{a.quiz.questions.map((q,i)=><section className="card" key={q.id}>
      <h2 dir="auto">{i+1}. {q.text}</h2>
      {q.options.map(o=><label className="option" key={o.id} dir="auto">
        <input type="radio" name={q.id} checked={answers[q.id]===o.id} onChange={()=>setAnswers(v=>({...v,[q.id]:o.id}))}/>
        {" "}{o.text}
      </label>)}
    </section>)}</div>
  </main>
}