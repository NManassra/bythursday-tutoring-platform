import {test,expect} from "@playwright/test";

test("student completes a timed quiz and sees the result",async({page})=>{
  await page.goto("/login");

  await page.getByLabel("Email").fill("student14@bythursday.demo");
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
  const saveResponse=page.waitForResponse(response => response.url().includes("/api/attempts/") && response.url().endsWith("/answers") && response.request().method() === "PUT" && response.status() === 200);
  await first.check();
  await saveResponse;
  page.once("dialog",async dialog=>{await dialog.accept()});
  await page.getByRole("button",{name:"Exit quiz"}).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await page.getByRole("link",{name:"Open quiz"}).first().click();
  await expect(page.getByRole("heading",{name:"Algebra | الجبر"})).toBeVisible();
  await expect(page.locator('input[type="radio"]').first()).toBeChecked();
});

test("quiz navigation warns before leaving an active attempt",async({page})=>{
  await page.goto("/login");
  await page.getByLabel("Email").fill("student15@bythursday.demo");
  await page.getByLabel("Password").fill("Demo12345!");
  await page.getByRole("button",{name:"Sign in"}).click();
  await page.getByRole("link",{name:"Open quiz"}).first().click();
  await expect(page.getByRole("heading",{name:"Algebra | الجبر"})).toBeVisible();
  let dialogSeen=false;
  page.on("dialog",async dialog=>{dialogSeen=true;await dialog.dismiss()});
  await page.getByRole("button",{name:"Exit quiz"}).click();
  await expect.poll(()=>dialogSeen).toBeTruthy();
  await expect(page).toHaveURL(/\/quiz\//);
  await expect(page.getByRole("heading",{name:"Algebra | الجبر"})).toBeVisible();
});

test("quiz remains usable at a mobile viewport",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/login");
  await page.getByLabel("Email").fill("student16@bythursday.demo");
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
  await page.getByLabel("Email").fill("student17@bythursday.demo");
  await page.getByLabel("Password").fill("Demo12345!");
  await page.getByRole("button",{name:"Sign in"}).click();
  await page.getByRole("link",{name:"Open quiz"}).first().click();
  await expect(page.getByRole("button",{name:"Exit quiz"})).toBeVisible();
  await expect(page.getByRole("button",{name:"Submit quiz"})).toBeVisible();
});

test("quiz remains readable at tablet width",async({page})=>{
  await page.setViewportSize({width:1024,height:768});
  await page.goto("/login");
  await page.getByLabel("Email").fill("student18@bythursday.demo");
  await page.getByLabel("Password").fill("Demo12345!");
  await page.getByRole("button",{name:"Sign in"}).click();
  await page.getByRole("link",{name:"Open quiz"}).first().click();
  await expect(page.getByRole("heading",{name:"Algebra | الجبر"})).toBeVisible();
  await expect(page.locator('input[type="radio"]').first()).toBeVisible();
});


test("student sees reconnect state during a network interruption",async({page,context})=>{
  await page.goto("/login");
  await page.getByLabel("Email").fill("student19@bythursday.demo");
  await page.getByLabel("Password").fill("Demo12345!");
  await page.getByRole("button",{name:"Sign in"}).click();
  await page.getByRole("link",{name:"Open quiz"}).first().click();
  await expect(page.getByRole("heading",{name:"Algebra | الجبر"})).toBeVisible();
  await context.setOffline(true);
  await page.evaluate(()=>{
    Object.defineProperty(navigator,"onLine",{configurable:true,get:()=>false});
    window.dispatchEvent(new Event("offline"));
  });
  await expect(page.getByRole("alert").filter({hasText:"You are offline."})).toBeVisible({timeout:5000});
  await context.setOffline(false);
  await page.evaluate(()=>{
    Object.defineProperty(navigator,"onLine",{configurable:true,get:()=>true});
    window.dispatchEvent(new Event("online"));
  });
});
