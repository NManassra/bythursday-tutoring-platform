import {prisma} from "@/lib/db";

const WINDOW_MS=15*60*1000;
const MAX_ATTEMPTS=8;

export async function loginAllowed(key:string){
  const cutoff=new Date(Date.now()-WINDOW_MS);
  await prisma.loginAttempt.deleteMany({where:{createdAt:{lt:cutoff}}});
  const count=await prisma.loginAttempt.count({where:{key,createdAt:{gte:cutoff}}});
  return count<MAX_ATTEMPTS;
}

export async function recordLoginAttempt(key:string){
  await prisma.loginAttempt.create({data:{key}});
}