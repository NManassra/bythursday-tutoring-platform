import crypto from "node:crypto";
import {cookies} from "next/headers";
import {prisma} from "@/lib/db";
const COOKIE=process.env.SESSION_COOKIE_NAME??"bythursday_session";
const TTL=Number(process.env.SESSION_TTL_DAYS??7);
const digest=(v:string)=>crypto.createHash("sha256").update(v).digest("hex");
export async function createSession(userId:string){
 const token=crypto.randomBytes(32).toString("base64url");
 await prisma.session.create({data:{tokenHash:digest(token),userId,expiresAt:new Date(Date.now()+TTL*86400000)}});
 (await cookies()).set(COOKIE,token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:TTL*86400});
}
export async function getCurrentUser(){
 const token=(await cookies()).get(COOKIE)?.value;if(!token)return null;
 const session=await prisma.session.findUnique({where:{tokenHash:digest(token)},include:{user:true}});
 if(!session)return null;
 if(session.expiresAt<=new Date()){await prisma.session.delete({where:{id:session.id}});return null;}
 return session.user;
}
export async function destroySession(){
 const token=(await cookies()).get(COOKIE)?.value;
 if(token)await prisma.session.deleteMany({where:{tokenHash:digest(token)}});
 (await cookies()).delete(COOKIE);
}