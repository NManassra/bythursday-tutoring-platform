import Link from "next/link";import {redirect} from "next/navigation";import {getCurrentUser} from "@/lib/session";import {prisma} from "@/lib/db";

export default async function Result({params}:{params:Promise<{attemptId:string}>}){
  const u=await getCurrentUser();
  if(!u)redirect("/login");
  const {attemptId}=await params;
  const a=await prisma.attempt.findUnique({where:{id:attemptId},include:{quiz:true}});
  if(!a||a.studentId!==u.id||!a.submittedAt)redirect("/dashboard");
  return <main className="shell" style={{maxWidth:700}}>
    <div className="card result-card">
      <p className="eyebrow">Result</p>
      <h1 dir="auto">{a.quiz.title}</h1>
      <div className="stat">{a.score} / {a.maxScore}</div>
      <p className="success">Submitted successfully.</p>
      <Link className="btn" href="/dashboard">Back to main page</Link>
    </div>
  </main>
}