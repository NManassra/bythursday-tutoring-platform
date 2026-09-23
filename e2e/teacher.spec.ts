import {test,expect} from "@playwright/test";

test("teacher creates and publishes a quiz that a student can see",async({browser})=>{
  const teacher=await browser.newContext();
  const tp=await teacher.newPage();

  await tp.goto("/login");
  await tp.getByLabel("Email").fill("teacher1@bythursday.demo");
  await tp.getByLabel("Password").fill("Demo12345!");
  const loginResponse = tp.waitForResponse(response =>
    response.url().endsWith("/api/auth/login") &&
    response.request().method() === "POST"
  );
  await tp.getByRole("button",{name:"Sign in"}).click();
  await expect((await loginResponse).ok()).toBeTruthy();
  await expect(tp).toHaveURL(/\/dashboard/);
  await expect(tp.getByText("Teacher",{exact:true})).toBeVisible();

  const title="E2E Published Quiz";
  const classSelect=tp.getByLabel("Class");
  await expect(classSelect.locator("option",{hasText:"Grade 9 Mathematics"})).toHaveCount(1);
  await tp.getByLabel("Quiz title").fill(title);
  await classSelect.selectOption({label:"Grade 9 Mathematics"});

  const createButton=tp.getByRole("button",{name:"Create draft"});
  await expect(createButton).toBeEnabled();
  await createButton.click();

  const quizRow=tp.locator(".card").filter({hasText:title}).last();
  await expect(quizRow.getByText(title,{exact:true})).toBeVisible();

  const publishResponse = tp.waitForResponse(response => response.url().includes("/api/quizzes/") && response.url().endsWith("/publish") && response.request().method() === "POST");
  await quizRow.getByRole("button",{name:"Publish"}).click();
  await expect((await publishResponse).ok()).toBeTruthy();
  await tp.reload();
  const refreshedQuizRow = tp.locator(".card").filter({hasText:title}).last();
  await expect(refreshedQuizRow.getByText("PUBLISHED",{exact:true})).toBeVisible();

  await teacher.close();

  const student=await browser.newContext();
  const sp=await student.newPage();
  await sp.goto("/login");
  await sp.getByLabel("Email").fill("student9@bythursday.demo");
  await sp.getByLabel("Password").fill("Demo12345!");
  await sp.getByRole("button",{name:"Sign in"}).click();
  await expect(sp.getByText(title,{exact:true})).toBeVisible();
  await student.close();
});