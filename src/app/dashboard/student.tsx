"use client";

import {useEffect,useState} from "react";
import Link from "next/link";

type StudentQuiz={id:string;title:string;description:string|null;durationMinutes:number;questions:Array<{id:string}>;attempts:Array<{id:string;submittedAt:string|null;score:number|null;deadlineAt:string}>};

export default function StudentDashboard({user}:{user:{name:string}}){
 const[q,setQ]=useState<StudentQuiz[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState("");
 useEffect(()=>{fetch("/api/quizzes").then(async r=>{if(!r.ok)throw new Error("Unable to load quizzes");return r.json()}).then((x:{quizzes?:StudentQuiz[]})=>setQ(x.quizzes??[])).catch(()=>setError("We couldn't load your quizzes. Please refresh and try again.")).finally(()=>setLoading(false))},[]);
 return <main className="shell" dir="auto">
   <div className="top"><div><p className="eyebrow">Student workspace</p><h1>Hi, {user.name}</h1><p className="muted">Your assigned quizzes appear here when they are available.</p></div><button className="btn secondary" onClick={async()=>{await fetch("/api/auth/logout",{method:"POST"});location.href="/login"}}>Sign out</button></div>
   {loading&&<div className="card"><p className="muted" role="status">Loading your quizzes…</p></div>}
   {error&&<div className="card"><p className="danger" role="alert">{error}</p></div>}
   {!loading&&!error&&!q.length&&<div className="card empty"><h2>You&apos;re all caught up</h2><p className="muted">There are no assigned quizzes available right now.</p></div>}
   {!loading&&!error&&q.length>0&&<div className="grid">{q.map(x=>{const attempt=x.attempts[0];return <article className="card quiz" key={x.id}>
     <div className="quiz-card-head"><div><p className="eyebrow">Available quiz</p><h2 dir="auto">{x.title}</h2></div>{attempt?.submittedAt&&<span className="badge success-badge">Completed</span>}</div>
     {x.description&&<p className="muted" dir="auto">{x.description}</p>}
     <div className="quiz-meta"><span>{x.questions.length} questions</span><span>{x.durationMinutes} minutes</span></div>
     <Link className="btn" href={"/quiz/"+x.id}>{attempt?.submittedAt?"View result":"Open quiz"}</Link>
   </article>})}</div>}
 </main>
}