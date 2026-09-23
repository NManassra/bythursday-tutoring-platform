import {PrismaClient,Role,QuizStatus} from "@prisma/client";
import bcrypt from "bcryptjs";

const p=new PrismaClient();

const studentNames=[
  "Omar Khalil","Lina Ahmad","Yazan Nasser","Jana Saleh","Kareem Haddad","Mariam Abu Ali","Adam Qasem","Leen Darwish","Rami Hamdan","Dana Mansour",
  "Samer Odeh","Aya Khalil","Laith Saleh","Razan Nasser","Tareq Ahmad","Malak Hamdan","Zaid Haddad","Sara Mansour","Hala Qasem","Yousef Darwish",
  "Mohammad Odeh","Nour Khalil","Basil Saleh","Reem Ahmad","Anas Nasser","Farah Haddad","Khaled Mansour","Saja Hamdan","Ali Qasem","Dima Darwish",
  "Ibrahim Odeh","Raneem Khalil","Sultan Saleh","Jouri Ahmad","Alaa Nasser","Hussein Haddad","Mira Mansour","Fadi Hamdan","Layan Qasem","Saeed Darwish",
  "Tamer Odeh","Tasneem Khalil","Hamza Saleh","Rama Ahmad","Mahmoud Nasser","Salsabil Haddad","Wael Mansour","Batool Hamdan","Ammar Qasem","Aya Darwish",
  "Firas Odeh","Maya Khalil","Qais Saleh","Jana Ahmad","Laith Nasser","Rana Haddad","Othman Mansour","Lama Hamdan","Kinan Qasem","Samer Darwish"
];

async function main(){
  await p.attemptAnswer.deleteMany();
  await p.attempt.deleteMany();
  await p.quizClass.deleteMany();
  await p.question.deleteMany();
  await p.quiz.deleteMany();
  await p.classStudent.deleteMany();
  await p.class.deleteMany();
  await p.session.deleteMany();
  await p.user.deleteMany();

  const hash=await bcrypt.hash("Demo12345!",12);
  const teachers=await Promise.all(["Lina Haddad","Ahmad Saleh","Maya Nasser","Omar Darwish"].map((name,i)=>p.user.create({data:{name,email:`teacher${i+1}@bythursday.demo`,passwordHash:hash,role:Role.TEACHER}})));
  const students=await Promise.all(studentNames.map((name,i)=>p.user.create({data:{name,email:`student${i+1}@bythursday.demo`,passwordHash:hash,role:Role.STUDENT}})));

  const classes=[];
  for(let i=0;i<3;i++){
    classes.push(await p.class.create({
      data:{
        name:["Grade 9 Mathematics","Grade 10 Science","Grade 11 English"][i],
        code:`G${i+9}-${i+1}`,
        teacherId:teachers[i].id,
        students:{create:students.slice(i*20,(i+1)*20).map(s=>({studentId:s.id}))}
      }
    }));
  }

  const now=Date.now();
  const quizConfigs=[
    ["Algebra | الجبر","Core algebra practice",now-3600000,now+86400000,15,2,25,QuizStatus.PUBLISHED],
    ["Physics | الفيزياء","Forces and motion",now+3600000,now+90000000,20,1,0,QuizStatus.PUBLISHED],
    ["English Grammar | قواعد اللغة","Grammar review",now-86400000,now-3600000,25,2,25,QuizStatus.PUBLISHED],
    ["Biology | الأحياء","Cell biology",now-1800000,now+86400000,30,1,0,QuizStatus.PUBLISHED],
    ["Sample Upcoming | اختبار قادم","Scheduled demonstration",now+172800000,now+259200000,20,2,25,QuizStatus.PUBLISHED],
    ["Draft Assessment | مسودة","Teacher draft example",now,now+86400000,20,1,0,QuizStatus.DRAFT]
  ];

  const quizzes=[];
  for(let i=0;i<quizConfigs.length;i++){
    const [title,description,open,close,duration,points,negative,status]=quizConfigs[i];
    quizzes.push(await p.quiz.create({
      data:{
        title,description,status,opensAt:new Date(open as number),closesAt:new Date(close as number),
        durationMinutes:duration as number,pointsPerQuestion:points as number,negativeMarkPercent:negative as number,
        creatorId:teachers[i%4].id,
        classes:{create:{classId:classes[i%3].id}},
        questions:{create:Array.from({length:5},(_,j)=>({
          text:`Question ${j+1} / السؤال ${j+1}`,order:j+1,
          options:{create:[
            {text:"A / أ",isCorrect:j%4===0},{text:"B / ب",isCorrect:j%4===1},
            {text:"C / ج",isCorrect:j%4===2},{text:"D / د",isCorrect:j%4===3}
          ]}
        }))}
      }
    }));
  }

  const algebra=await p.quiz.findUnique({where:{id:quizzes[0].id},include:{questions:{include:{options:true},orderBy:{order:"asc"}}}});
  if(algebra){
    for(let i=1;i<=5;i++){
      const student=students[i];
      const attempt=await p.attempt.create({
        data:{
          quizId:algebra.id,studentId:student.id,
          startedAt:new Date(now-1800000-i*60000),deadlineAt:new Date(now-900000-i*60000),submittedAt:new Date(now-600000-i*30000)
        }
      });
      const answers=algebra.questions.map((q,j)=>{
        const correct=q.options.find(o=>o.isCorrect)!;
        const wrong=q.options.find(o=>!o.isCorrect)!;
        return {attemptId:attempt.id,questionId:q.id,optionId:j%3===0?correct.id:wrong.id};
      });
      const score=answers.reduce((sum,a,j)=>sum+(j%3===0?2:-0.5),0);
      await p.attemptAnswer.createMany({data:answers});
      await p.attempt.update({where:{id:attempt.id},data:{score:Math.max(0,score),maxScore:10}});
    }
  }

  console.log("Seed complete. Demo password: Demo12345!");
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>p.$disconnect());