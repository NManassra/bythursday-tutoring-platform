import {test,expect} from "@playwright/test";

async function login(page:any,email:string){
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Demo12345!");
  await page.getByRole("button",{name:"Sign in"}).click();
}

test("student cannot submit another student's attempt",async({browser})=>{
  const owner=await browser.newContext();
  const op=await owner.newPage();
  await login(op,"student1@bythursday.demo");
  const href=await op.getByRole("link",{name:"Open quiz"}).first().getAttribute("href");
  expect(href).toBeTruthy();

  const responsePromise=op.waitForResponse(r=>r.url().includes("/api/quizzes/")&&r.url().endsWith("/start"));
  await op.goto(href!);
  const response=await responsePromise;
  const started=await response.json() as {attemptId:string};
  expect(started.attemptId).toBeTruthy();
  await owner.close();

  const attacker=await browser.newContext();
  const ap=await attacker.newPage();
  await login(ap,"student2@bythursday.demo");
  const result=await ap.request.post("/api/attempts/"+started.attemptId+"/submit",{
    data:{answers:[]}
  });
  expect(result.status()).toBe(404);
  await attacker.close();
});