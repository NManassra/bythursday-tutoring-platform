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

test("student can exit, resume, and restore an autosaved answer",async({page})=>{
  await page.goto("/login");
  await page.getByLabel("Email").fill("student8@bythursday.demo");
  await page.getByLabel("Password").fill("Demo12345!");
  await page.getByRole("button",{name:"Sign in"}).click();
  await expect(page.getByText("Algebra | الجبر",{exact:true})).toBeVisible();
  await page.getByRole("link",{name:"Open quiz"}).first().click();
  await expect(page.getByRole("heading",{name:"Algebra | الجبر"})).toBeVisible();
  const first=page.locator('input[type="radio"]').first();
  await first.check();
  await expect(page.getByText("Answers saved",{exact:true})).toBeVisible({timeout:5000});
  await page.getByRole("button",{name:"Exit quiz"}).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.getByRole("link",{name:"Open quiz"}).first().click();
  await expect(page.getByRole("heading",{name:"Algebra | الجبر"})).toBeVisible();
  await expect(page.locator('input[type="radio"]').first()).toBeChecked();
});

test("quiz navigation warns before leaving an active attempt",async({page})=>{
  await page.goto("/login");
  await page.getByLabel("Email").fill("student9@bythursday.demo");
  await page.getByLabel("Password").fill("Demo12345!");
  await page.getByRole("button",{name:"Sign in"}).click();
  await page.getByRole("link",{name:"Open quiz"}).first().click();
  await expect(page.getByRole("heading",{name:"Algebra | الجبر"})).toBeVisible();
  let dialogSeen=false;
  page.on("dialog",async dialog=>{dialogSeen=true;await dialog.dismiss()});
  await page.goBack();
  await expect.poll(()=>dialogSeen).toBeTruthy();
  await expect(page.getByRole("heading",{name:"Algebra | الجبر"})).toBeVisible();
});

test("quiz remains usable at a mobile viewport",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/login");
  await page.getByLabel("Email").fill("student10@bythursday.demo");
  await page.getByLabel("Password").fill("Demo12345!");
  await page.getByRole("button",{name:"Sign in"}).click();
  await page.getByRole("link",{name:"Open quiz"}).first().click();
  await expect(page.getByRole("heading",{name:"Algebra | الجبر"})).toBeVisible();
  await expect(page.getByRole("button",{name:"Exit quiz"})).toBeVisible();
  await expect(page.getByRole("button",{name:"Submit quiz"})).toBeVisible();
});


test("quiz controls remain usable at 360px",async({page})=>{
  await page.setViewportSize({width:360,height:800});
  await page.goto("/login");
  await page.getByLabel("Email").fill("student11@bythursday.demo");
  await page.getByLabel("Password").fill("Demo12345!");
  await page.getByRole("button",{name:"Sign in"}).click();
  await page.getByRole("link",{name:"Open quiz"}).first().click();
  await expect(page.getByRole("button",{name:"Exit quiz"})).toBeVisible();
  await expect(page.getByRole("button",{name:"Submit quiz"})).toBeVisible();
});

test("quiz remains readable at tablet width",async({page})=>{
  await page.setViewportSize({width:1024,height:768});
  await page.goto("/login");
  await page.getByLabel("Email").fill("student12@bythursday.demo");
  await page.getByLabel("Password").fill("Demo12345!");
  await page.getByRole("button",{name:"Sign in"}).click();
  await page.getByRole("link",{name:"Open quiz"}).first().click();
  await expect(page.getByRole("heading",{name:"Algebra | الجبر"})).toBeVisible();
  await expect(page.locator('input[type="radio"]').first()).toBeVisible();
});


test("student sees reconnect state during a network interruption",async({page,context})=>{
  await page.goto("/login");
  await page.getByLabel("Email").fill("student13@bythursday.demo");
  await page.getByLabel("Password").fill("Demo12345!");
  await page.getByRole("button",{name:"Sign in"}).click();
  await page.getByRole("link",{name:"Open quiz"}).first().click();
  await expect(page.getByRole("heading",{name:"Algebra | الجبر"})).toBeVisible();
  await context.setOffline(true);
  await expect(page.getByRole("alert",{name:""}).filter({hasText:"offline"})).toBeVisible({timeout:3000});
  await context.setOffline(false);
});
