import {prisma} from "@/lib/db";

export async function recordAudit(action:string,entityType:string,entityId?:string,actorId?:string,metadata?:Record<string,unknown>){
  try{
    await prisma.auditEvent.create({data:{
      action,entityType,entityId,actorId,
      metadata:metadata?JSON.stringify(metadata):undefined
    }});
  }catch{
    // Audit logging must never break the user-facing operation.
  }
}