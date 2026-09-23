import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/session";
import {finalizeExpiredAttempt} from "@/lib/finalize-attempt";
import {assertSameOrigin} from "@/lib/security";

export async function POST(req:Request,{params}:{params:Promise<{attemptId:string}>}){
  const u=await getCurrentUser();
  if(!u||u.role!=="STUDENT")return NextResponse.json({error:"Forbidden"},{status:403});
  if(!assertSameOrigin(req))return NextResponse.json({error:"Invalid origin"},{status:403});
  const {attemptId}=await params;
  const result=await finalizeExpiredAttempt(attemptId,u.id);
  if(!result)return NextResponse.json({error:"Not found"},{status:404});
  if("expired" in result&&result.expired===false)return NextResponse.json(result,{status:202});
  return NextResponse.json(result);
}
