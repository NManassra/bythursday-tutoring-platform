import {NextResponse} from "next/server";import {prisma} from "@/lib/db";import {getCurrentUser} from "@/lib/session";import {recordAudit} from "@/lib/audit";import {assertSameOrigin} from "@/lib/security";

export async function POST(req:Request,{params}:{params:Promise<{quizId:string}>}){
 const u=await getCurrentUser();if(!u||u.role!=="STUDENT")return NextResponse.json({error:"Forbidden"},{status:403});if(!assertSameOrigin(req))return NextResponse.json({error:"Invalid origin"},{status:403});
 const {quizId}=await params;const now=new Date();const existing=await prisma.attempt.findUnique({where:{quizId_studentId:{quizId,studentId:u.id}}});
 if(existing?.submittedAt)return NextResponse.json({attemptId:existing.id,deadlineAt:existing.deadlineAt,submittedAt:existing.submittedAt});
 const quiz=await prisma.quiz.findFirst({where:{id:quizId,status:"PUBLISHED",opensAt:{lte:now},closesAt:{gt:now},classes:{some:{class:{students:{some:{studentId:u.id}}}}}},include:{questions:{select:{id:true,text:true,order:true,options:{select:{id:true,text:true}}},orderBy:{order:"asc"}}}});
 if(!quiz)return NextResponse.json({error:"Quiz unavailable"},{status:404});
 if(existing){const savedAnswers=await prisma.attemptAnswer.findMany({where:{attemptId:existing.id},select:{questionId:true,optionId:true}});return NextResponse.json({attemptId:existing.id,deadlineAt:existing.deadlineAt,submittedAt:null,quiz,savedAnswers})}
 const deadline=new Date(Math.min(now.getTime()+quiz.durationMinutes*60000,quiz.closesAt.getTime()));
 try{const a=await prisma.attempt.create({data:{quizId,studentId:u.id,startedAt:now,deadlineAt:deadline}});await recordAudit("ATTEMPT_STARTED","Attempt",a.id,u.id,{quizId});return NextResponse.json({attemptId:a.id,deadlineAt:a.deadlineAt,quiz})}catch{return NextResponse.json({error:"Attempt already exists"},{status:409})}
}