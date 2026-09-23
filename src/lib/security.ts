export function assertSameOrigin(req:Request){
  const origin=req.headers.get("origin");
  if(!origin)return true;
  try{
    const requestOrigin=new URL(req.url).origin;
    return origin===requestOrigin;
  }catch{return false}
}