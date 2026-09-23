import {NextResponse} from "next/server";
import {prisma} from "@/lib/db";
import {loginSchema} from "@/lib/validation";
import {verifyPassword} from "@/lib/password";
import {createSession} from "@/lib/session";
import {loginAllowed,recordLoginAttempt} from "@/lib/login-rate-limit";
import {recordAudit} from "@/lib/audit";
import {assertSameOrigin} from "@/lib/security";

export async function POST(req:Request){
  const forwarded=req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const emailHint=req.headers.get("content-type")?.includes("application/json")?((await req.clone().json().catch(()=>({}))) as {email?:string}).email?.trim().toLowerCase():"";
  const source=(forwarded||"unknown").slice(0,80);
  const key="login:"+source+":"+emailHint.slice(0,254);
  if(!assertSameOrigin(req))return NextResponse.json({error:"Invalid origin"},{status:403});
  if(!(await loginAllowed(key)))return NextResponse.json({error:"Too many login attempts. Please try again later."},{status:429});
  try{
    const d=loginSchema.parse(await req.json());
    const u=await prisma.user.findUnique({where:{email:d.email.toLowerCase()}});
    await recordLoginAttempt(key);
    if(!u||!(await verifyPassword(d.password,u.passwordHash))){
      await recordAudit("LOGIN_FAILED","User",u?.id,undefined,{key});
      return NextResponse.json({error:"Invalid credentials"},{status:401});
    }
    await createSession(u.id);
    await recordAudit("LOGIN_SUCCEEDED","User",u.id,u.id);
    return NextResponse.json({ok:true});
  }catch{return NextResponse.json({error:"Invalid request"},{status:400})}
}