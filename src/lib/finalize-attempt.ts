import {prisma} from "@/lib/db";
import {calculateScore} from "@/lib/scoring";

export async function finalizeExpiredAttempt(attemptId:string,studentId:string){
  return prisma.$transaction(async tx=>{
    const attempt=await tx.attempt.findUnique({
      where:{id:attemptId},
      include:{quiz:{include:{questions:{include:{options:true}}}},answers:true}
    });
    if(!attempt||attempt.studentId!==studentId)return null;
    if(attempt.submittedAt)return {score:attempt.score,maxScore:attempt.maxScore,submittedAt:attempt.submittedAt,alreadySubmitted:true};
    if(new Date()<attempt.deadlineAt)return {expired:false,deadlineAt:attempt.deadlineAt};

    const answers=new Map(attempt.answers.map(a=>[a.questionId,a.optionId]));
    const {score,maxScore}=calculateScore(attempt.quiz.questions,answers,attempt.quiz.pointsPerQuestion,attempt.quiz.negativeMarkPercent);
    const submittedAt=new Date();
    const updated=await tx.attempt.update({
      where:{id:attempt.id},
      data:{submittedAt,score,maxScore}
    });
    await tx.auditEvent.create({data:{action:"ATTEMPT_AUTO_SUBMITTED",entityType:"Attempt",entityId:attempt.id,actorId:studentId,metadata:JSON.stringify({reason:"deadline"})}});
    return {score:updated.score,maxScore:updated.maxScore,submittedAt:updated.submittedAt,autoSubmitted:true};
  });
}