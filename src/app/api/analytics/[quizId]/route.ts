import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/session";
import {prisma} from "@/lib/db";

export async function GET(_:Request,{params}:{params:Promise<{quizId:string}>}){
 const u=await getCurrentUser();if(!u||u.role!=="TEACHER")return NextResponse.json({error:"Forbidden"},{status:403});
 const {quizId}=await params;
 const q=await prisma.quiz.findFirst({where:{id:quizId,creatorId:u.id},include:{classes:{include:{class:{select:{students:{select:{studentId:true}}}}}},questions:{orderBy:{order:"asc"},include:{options:{select:{id:true,isCorrect:true}}}},attempts:{where:{submittedAt:{not:null}},include:{answers:{select:{questionId:true,optionId:true}}}}}});
 if(!q)return NextResponse.json({error:"Not found"},{status:404});
 const submitted=q.attempts.length;const scores=q.attempts.map(a=>a.score??0);const assigned=new Set(q.classes.flatMap(x=>x.class.students.map(s=>s.studentId))).size;
 const avg=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:0;
 const questionPerformance=q.questions.map(question=>{
   let correct=0,answered=0;
   for(const attempt of q.attempts){
     const answer=attempt.answers.find(x=>x.questionId===question.id);
     if(answer?.optionId){answered++;if(question.options.some(o=>o.id===answer.optionId&&o.isCorrect))correct++}
   }
   return {questionId:question.id,question:question.text,answeredRate:submitted?Number((answered/submitted*100).toFixed(1)):0,correctRate:answered?Number((correct/answered*100).toFixed(1)):0,unansweredRate:submitted?Number(((submitted-answered)/submitted*100).toFixed(1)):0};
 });
 return NextResponse.json({attempted:submitted,assigned,average:Number(avg.toFixed(2)),highest:scores.length?Math.max(...scores):0,lowest:scores.length?Math.min(...scores):0,completionRate:assigned?Number((submitted/assigned*100).toFixed(1)):0,questionPerformance});
}