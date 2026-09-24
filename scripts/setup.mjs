import {existsSync,copyFileSync} from "node:fs";
import {spawnSync} from "node:child_process";

if(!existsSync(".env")){
  copyFileSync(".env.example",".env");
  console.log("Created .env from .env.example");
}

const npm=process.platform==="win32"?"npm.cmd":"npm";
for(const args of [["run","db:push"],["run","db:seed"]]){
  const result=spawnSync(npm,args,{stdio:"inherit"});
  if(result.status!==0)process.exit(result.status??1);
}

const result=spawnSync(npm,["run","dev"],{stdio:"inherit"});
process.exit(result.status??0);
