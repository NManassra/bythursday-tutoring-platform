import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/session";
import {prisma} from "@/lib/db";

export async function GET(_:Request,{params}:{params:Promise<{quizId:string}>}){
  const u=await getCurrentUser();
  if(!u||u.role!=="TEACHER")return NextResponse.json({error:"Forbidden"},{status:403});
  const {quizId}=await params;
  const q=await prisma.quiz.findFirst({
    where:{id:quizId,creatorId:u.id},
    include:{classes:{include:{class:{select:{students:{select:{studentId:true}}}}}},attempts:{where:{submittedAt:{not:null}},select:{score:true,maxScore:true}}}
  });
  if(!q)return NextResponse.json({error:"Not found"},{status:404});
  const scores=q.attempts.map(a=>a.score??0);
  const assigned=new Set(q.classes.flatMap(x=>x.class.students.map(s=>s.studentId))).size;
  const avg=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:0;
  return NextResponse.json({attempted:scores.length,assigned,average:Number(avg.toFixed(2)),highest:scores.length?Math.max(...scores):0,lowest:scores.length?Math.min(...scores):0,completionRate:assigned?Number((scores.length/assigned*100).toFixed(1)):0});
}