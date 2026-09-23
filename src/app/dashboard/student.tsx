"use client";
import {useEffect,useState} from "react";
import Link from "next/link";

type StudentQuiz = {id:string;title:string;description:string|null;durationMinutes:number;questions:Array<{id:string}>};

export default function StudentDashboard({user}:{user:{name:string}}){
  const[q,setQ]=useState<StudentQuiz[]>([]);
  useEffect(()=>{fetch("/api/quizzes").then(r=>r.json()).then((x:{quizzes?:StudentQuiz[]})=>setQ(x.quizzes??[]))},[]);
  return <main className="shell"><div className="top"><div><p className="muted">Student</p><h1>Hi, {user.name}</h1></div><button className="btn secondary" onClick={async()=>{await fetch("/api/auth/logout",{method:"POST"});location.href="/login"}}>Sign out</button></div><div className="grid">{q.map(x=><div className="card quiz" key={x.id}><h2>{x.title}</h2><p className="muted">{x.description}</p><p>{x.questions.length} questions · {x.durationMinutes} minutes</p><Link className="btn" href={"/quiz/"+x.id}>Open quiz</Link></div>)}{!q.length&&<div className="card">No assigned quizzes are currently available.</div>}</div></main>
}