"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";

type QuizOption={id:string;text:string};
type QuizQuestion={id:string;text:string;options:QuizOption[]};
type StartedQuiz={attemptId:string;deadlineAt:string;submittedAt?:string|null;quiz:{title:string;questions:QuizQuestion[]}};

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
  const router=useRouter();

  useEffect(()=>{
    fetch("/api/quizzes/"+quizId+"/start",{method:"POST"}).then(async r=>{
      const x=await r.json() as StartedQuiz&{error?:string};
      if(!r.ok){setMsg(x.error??"Unable to start quiz");return}
      if(x.submittedAt){router.push("/results/"+x.attemptId);return}
      setA(x);
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
  return <main className="shell" dir="auto">
    <div className="quiz-toolbar">
      <div className="quiz-title">
        <p className="eyebrow">Quiz in progress</p>
        <h1 dir="auto">{a.quiz.title}</h1>
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