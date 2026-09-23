import {NextResponse} from "next/server";import {prisma} from "@/lib/db";import {getCurrentUser} from "@/lib/session";import {submitSchema} from "@/lib/validation";import {calculateScore} from "@/lib/scoring";

export async function POST(req:Request,{params}:{params:Promise<{attemptId:string}>}){
  const u=await getCurrentUser();
  if(!u||u.role!=="STUDENT")return NextResponse.json({error:"Forbidden"},{status:403});
  const {attemptId}=await params;
  let body;
  try{body=submitSchema.parse(await req.json())}catch{return NextResponse.json({error:"Invalid submission"},{status:400})}
  const a=await prisma.attempt.findUnique({where:{id:attemptId},include:{quiz:{include:{questions:{include:{options:true}}}}}});
  if(!a||a.studentId!==u.id)return NextResponse.json({error:"Not found"},{status:404});
  if(a.submittedAt)return NextResponse.json({error:"Already submitted"},{status:409});
  if(new Date()>a.deadlineAt)return NextResponse.json({error:"Time expired"},{status:409});

  const qs=new Map(a.quiz.questions.map(q=>[q.id,q]));
  const seen=new Set<string>();
  for(const x of body.answers){
    const q=qs.get(x.questionId);
    if(!q||seen.has(x.questionId))return NextResponse.json({error:"Invalid question"},{status:400});
    seen.add(x.questionId);
    if(x.optionId&&!q.options.some(o=>o.id===x.optionId))return NextResponse.json({error:"Invalid option"},{status:400});
  }

  const answerMap=new Map(body.answers.map(x=>[x.questionId,x.optionId]));
  const {score,maxScore}=calculateScore(a.quiz.questions,answerMap,a.quiz.pointsPerQuestion,a.quiz.negativeMarkPercent);

  try{
    const result=await prisma.$transaction(async tx=>{
      const fresh=await tx.attempt.findUnique({where:{id:attemptId}});
      if(!fresh||fresh.studentId!==u.id||fresh.submittedAt||new Date()>fresh.deadlineAt)throw new Error("CONFLICT");
      await tx.attemptAnswer.createMany({data:body.answers.map(x=>({attemptId,questionId:x.questionId,optionId:x.optionId}))});
      return tx.attempt.update({where:{id:attemptId},data:{submittedAt:new Date(),score,maxScore}});
    });
    return NextResponse.json({score:result.score,maxScore:result.maxScore});
  }catch{return NextResponse.json({error:"Submission rejected"},{status:409})}
}