import {NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {getCurrentUser} from "@/lib/session";
import {submitSchema} from "@/lib/validation";
import {assertSameOrigin} from "@/lib/security";

export async function PUT(req:Request,{params}:{params:Promise<{attemptId:string}>}){
  const u=await getCurrentUser();
  if(!u||u.role!=="STUDENT")return NextResponse.json({error:"Forbidden"},{status:403});
  if(!assertSameOrigin(req))return NextResponse.json({error:"Invalid origin"},{status:403});
  const {attemptId}=await params;
  let body;try{body=submitSchema.parse(await req.json())}catch{return NextResponse.json({error:"Invalid answers"},{status:400})}
  const a=await prisma.attempt.findUnique({where:{id:attemptId},include:{quiz:{include:{questions:{include:{options:true}}}}}});
  if(!a||a.studentId!==u.id)return NextResponse.json({error:"Not found"},{status:404});
  if(a.submittedAt)return NextResponse.json({error:"Already submitted"},{status:409});
  if(new Date()>a.deadlineAt)return NextResponse.json({error:"Time expired"},{status:409});
  const questions=new Map(a.quiz.questions.map(q=>[q.id,q]));
  for(const answer of body.answers){
    const q=questions.get(answer.questionId);
    if(!q)return NextResponse.json({error:"Invalid question"},{status:400});
    if(answer.optionId&&!q.options.some(o=>o.id===answer.optionId))return NextResponse.json({error:"Invalid option"},{status:400});
  }
  try{
    await prisma.$transaction(async tx=>{
      const fresh=await tx.attempt.findUnique({where:{id:attemptId}});
      if(!fresh||fresh.studentId!==u.id||fresh.submittedAt||new Date()>fresh.deadlineAt)throw new Error("CONFLICT");
      for(const answer of body.answers)await tx.attemptAnswer.upsert({where:{attemptId_questionId:{attemptId,questionId:answer.questionId}},create:{attemptId,questionId:answer.questionId,optionId:answer.optionId},update:{optionId:answer.optionId}});
    });
    return NextResponse.json({saved:true});
  }catch{return NextResponse.json({error:"Answers could not be saved"},{status:409})}
}
