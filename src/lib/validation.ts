import {z} from "zod";

export const loginSchema=z.object({email:z.string().trim().email().max(254),password:z.string().min(8).max(128)});

export const submitSchema=z.object({
  answers:z.array(z.object({questionId:z.string().min(1),optionId:z.string().min(1).nullable()})).max(200)
}).superRefine((data,ctx)=>{
  const seen=new Set<string>();
  data.answers.forEach((answer,index)=>{
    if(seen.has(answer.questionId))ctx.addIssue({code:z.ZodIssueCode.custom,path:["answers",index,"questionId"],message:"Duplicate question"});
    seen.add(answer.questionId);
  });
});

export const quizSchema=z.object({
  title:z.string().trim().min(1).max(160),description:z.string().max(1000).optional(),opensAt:z.coerce.date(),closesAt:z.coerce.date(),
  durationMinutes:z.number().int().min(1).max(300),pointsPerQuestion:z.number().positive().max(100),negativeMarkPercent:z.number().min(0).max(100),classId:z.string().min(1),
  questions:z.array(z.object({text:z.string().trim().min(1).max(2000),options:z.array(z.object({text:z.string().trim().min(1).max(500),isCorrect:z.boolean()})).min(2).max(6)})).min(1).max(100)
});