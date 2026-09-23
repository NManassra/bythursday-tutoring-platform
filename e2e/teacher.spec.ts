import {test,expect} from "@playwright/test";

test("teacher creates and publishes a quiz that a student can see",async({browser})=>{
  const teacher=await browser.newContext();
  const tp=await teacher.newPage();
  await tp.goto("/login");
  await tp.getByLabel("Email").fill("teacher1@bythursday.demo");
  await tp.getByLabel("Password").fill("Demo12345!");
  await tp.getByRole("button",{name:"Sign in"}).click();
  await expect(tp.getByText("Teacher")).toBeVisible();

  const title="E2E Published Quiz";
  await tp.getByLabel("Quiz title").fill(title);
  await tp.getByLabel("Class").selectOption({label:"Grade 9 Mathematics"});
  await tp.getByRole("button",{name:"Create draft"}).click();
  await expect(tp.getByText(title)).toBeVisible();

  const quizRow=tp.locator(".card").filter({hasText:title}).last();
  await quizRow.getByRole("button",{name:"Publish"}).click();
  await expect(quizRow.getByText("PUBLISHED")).toBeVisible();
  await teacher.close();

  const student=await browser.newContext();
  const sp=await student.newPage();
  await sp.goto("/login");
  await sp.getByLabel("Email").fill("student1@bythursday.demo");
  await sp.getByLabel("Password").fill("Demo12345!");
  await sp.getByRole("button",{name:"Sign in"}).click();
  await expect(sp.getByText(title)).toBeVisible();
  await student.close();
});