import {describe,it,expect} from "vitest";
import {loginSchema,quizSchema,submitSchema} from "./validation";

describe("validation",()=>{
  it("rejects malformed login",()=>expect(()=>loginSchema.parse({email:"not-email",password:"x"})).toThrow());
  it("rejects duplicate submission questions",()=>expect(()=>submitSchema.parse({answers:[{questionId:"q",optionId:"a"},{questionId:"q",optionId:"b"}]})).toThrow());
  it("accepts valid quiz input with per-question points",()=>{
    const quiz=quizSchema.parse({
      title:"Quiz",
      opensAt:new Date(),
      closesAt:new Date(Date.now()+10000),
      durationMinutes:10,
      pointsPerQuestion:1,
      negativeMarkPercent:0,
      classId:"c",
      questions:[{text:"Q",points:2,options:[{text:"A",isCorrect:true},{text:"B",isCorrect:false}]}]
    });
    expect(quiz.questions[0].points).toBe(2);
  });
});