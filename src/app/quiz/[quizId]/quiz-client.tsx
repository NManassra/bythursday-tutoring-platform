"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";

type QuizOption={id:string;text:string};
type QuizQuestion={id:string;text:string;options:QuizOption[]};
type StartedQuiz={attemptId:string;deadlineAt:string;submittedAt?:string|null;quiz:{title:string;questions:QuizQuestion[]}};

export default function QuizClient({quizId}:{quizId:string}){
  const[a,setA]=useState<StartedQuiz>();
  const[answers,setAnswers]=useState<Record<string,string>>({});
  const[msg,setMsg]=useState("");
  const[seconds,setSeconds]=useState(0);
  const router=useRouter();
  useEffect(()=>{fetch("/api/quizzes/"+quizId+"/start",{method:"POST"}).then(async r=>{const x=await r.json() as StartedQuiz&{error?:string};if(!r.ok){setMsg(x.error??"Unable to start quiz");return}if(x.submittedAt){router.push("/results/"+x.attemptId);return}setA(x);setSeconds(Math.max(0,Math.floor((new Date(x.deadlineAt).getTime()-Date.now())/1000)))})},[quizId,router]);
  useEffect(()=>{if(!a)return;const t=setInterval(()=>setSeconds(Math.max(0,Math.floor((new Date(a.deadlineAt).getTime()-Date.now())/1000))),500);return()=>clearInterval(t)},[a]);
  async function submit(){if(!a)return;const r=await fetch("/api/attempts/"+a.attemptId+"/submit",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({answers:a.quiz.questions.map(q=>({questionId:q.id,optionId:answers[q.id]??null}))})});const x=await r.json() as {error?:string};if(r.ok)router.push("/results/"+a.attemptId);else setMsg(x.error??"Unable to submit quiz")}
  if(!a)return <main className="shell"><div className="card">{msg?<p className="danger">{msg}</p>:"Loading quiz…"}</div></main>;
  return <main className="shell"><div className="top"><div><h1>{a.quiz.title}</h1><p className={seconds<30?"danger":"muted"}>Time remaining: {Math.floor(seconds/60)}:{String(seconds%60).padStart(2,"0")}</p></div><button className="btn" disabled={seconds===0} onClick={submit}>Submit quiz</button></div><div className="grid">{a.quiz.questions.map((q,i)=><section className="card" key={q.id}><h2>{i+1}. {q.text}</h2>{q.options.map(o=><label className="option" key={o.id}><input type="radio" name={q.id} checked={answers[q.id]===o.id} onChange={()=>setAnswers(v=>({...v,[q.id]:o.id}))}/> {o.text}</label>)}</section>)}</div></main>
}