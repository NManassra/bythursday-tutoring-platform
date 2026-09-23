import {test,expect} from "@playwright/test";

test("student completes a timed quiz and sees the result",async({page})=>{
  await page.goto("/login");

  await page.getByLabel("Email").fill("student8@bythursday.demo");
  await page.getByLabel("Password").fill("Demo12345!");
  const quizzesResponse = page.waitForResponse(response => response.url().endsWith("/api/quizzes") && response.request().method() === "GET");
  await page.getByRole("button",{name:"Sign in"}).click();
  await expect((await quizzesResponse).ok()).toBeTruthy();

  await expect(page.getByText("Algebra | الجبر",{exact:true})).toBeVisible();

  await page.getByRole("link",{name:"Open quiz"}).first().click();

  await expect(page.getByRole("heading",{name:"Algebra | الجبر"})).toBeVisible();

  await page.locator('input[type="radio"]').first().check();
  await page.getByRole("button",{name:"Submit quiz"}).click();

  await expect(page).toHaveURL(/\/results\//);
  await expect(page.getByText("Submitted successfully.",{exact:true})).toBeVisible();
});