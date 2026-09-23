import {defineConfig,devices} from "@playwright/test";

export default defineConfig({
  testDir:"./e2e",
  fullyParallel:false,
  workers:1,
  forbidOnly:!!process.env.CI,
  retries:process.env.CI?2:0,
  reporter:"html",
  use:{
    baseURL:"http://127.0.0.1:3000",
    trace:"retain-on-failure"
  },
  webServer:{
    command:"npm run db:push && npm run db:seed && npm run dev",
    url:"http://127.0.0.1:3000",
    reuseExistingServer:false
  },
  projects:[{
    name:"chromium",
    use:{...devices["Desktop Chrome"]}
  }]
});