/** Uses real browser URL state, Refine, Table and HTTP adapters on desktop/mobile. */
import { expect, test } from "@playwright/test";

for (const mobile of [false,true]) for (const current of ["0","NaN"]) {
  test(`pagination current=${current}, ${mobile?"mobile":"desktop"}`,async({page})=>{
    await page.setViewportSize(mobile?{width:390,height:844}:{width:1440,height:900});
    const warnings:string[]=[];
    const requests:Array<{page:string|null;pageSize:string|null}>=[];
    page.on("console",msg=>{if(msg.text().includes("current should be positive"))warnings.push(msg.text());});
    await page.route("**/api/documents*",async route=>{
      const url=new URL(route.request().url());
      requests.push({page:url.searchParams.get("page"),pageSize:url.searchParams.get("pageSize")});
      await route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({success:true,code:"OK",message:"Completed",
        data:{items:[{id:"fixture-document",fileName:"BROWSER-FIXTURE"}],totalItems:41,totalPages:3,currentPage:Number(url.searchParams.get("page")),pageSize:Number(url.searchParams.get("pageSize"))},
        errors:[],meta:{timestamp:new Date().toISOString(),path:"/api/documents",requestId:"browser-fixture"}})});
    });
    await page.goto(`/e2e/fixtures/error-contracts.html?current=${current}&pageSize=NaN`);
    await expect(page.getByText("BROWSER-FIXTURE")).toBeVisible();
    await expect.poll(()=>new URL(page.url()).searchParams.get("current")).toBe("1");
    await expect.poll(()=>new URL(page.url()).searchParams.get("pageSize")).toBe("20");
    expect(requests.length).toBeGreaterThan(0);
    expect(requests.every(row=>row.page==="1"&&row.pageSize==="20")).toBe(true);
    await page.getByTitle("Next Page",{exact:true}).click();
    await expect.poll(()=>requests.some(row=>row.page==="2")).toBe(true);
    expect(warnings).toEqual([]);
  });
}

for (const failure of [
  {status:401,code:"UNAUTHORIZED",params:{},text:"Your session is missing or expired. Please sign in."},
  {status:403,code:"FORBIDDEN",params:{},text:"You do not have permission to perform this action."},
  {status:503,code:"LARK_RATE_LIMITED",params:{retryAfterSeconds:45},text:"Lark is receiving too many requests. Wait 45 seconds before trying again."},
]) {
  test(`structured ${failure.status} failure is translated and preserves the browser route`,async({page})=>{
    let requests=0;
    await page.route("**/api/documents*",async route=>{
      requests++;
      await route.fulfill({status:failure.status,contentType:"application/json",headers:{"Retry-After":"45","X-Request-Id":"failure-fixture"},
        body:JSON.stringify({success:false,code:failure.code,message:"PRIVATE_PROVIDER_DETAIL",params:failure.params,data:null,errors:[],
          meta:{timestamp:new Date().toISOString(),path:"/api/documents",requestId:"failure-fixture"}})});
    });
    await page.goto("/e2e/fixtures/error-contracts.html");
    await expect(page.getByText(failure.text,{exact:true}).first()).toBeVisible();
    await expect(page.getByText("PRIVATE_PROVIDER_DETAIL")).toHaveCount(0);
    expect(new URL(page.url()).pathname).toBe("/e2e/fixtures/error-contracts.html");
    expect(requests).toBe(1);
  });
}
