/** Provider backoff affects safe read retries without creating an authentication replay. */
import { describe, expect, it } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import { ApiHttpError, normalizeHttpError } from "@providers/api/httpError";
import { queryRetryDelay, shouldRetryQuery } from "@providers/api/retryPolicy";

describe("Retry-After contract",()=>{
  it("preserves rate-limit headers and enforces their minimum wait",()=>{
    const cause=new AxiosError("provider error","ERR_BAD_RESPONSE",undefined,undefined,{status:503,statusText:"Unavailable",
      headers:new AxiosHeaders({"Retry-After":"45"}),config:{headers:new AxiosHeaders()},data:{success:false,code:"LARK_RATE_LIMITED",
        message:"fallback",data:null,params:{retryAfterSeconds:45},errors:[],meta:{timestamp:"now",path:"/api/test",requestId:"id"}}});
    const error=normalizeHttpError(cause);
    expect(error.retryAfterSeconds).toBe(45);expect(queryRetryDelay(0,error)).toBe(45_000);
    expect(shouldRetryQuery(0,error)).toBe(true);
  });
  it("never retries authentication or deterministic client faults",()=>{
    for(const statusCode of [400,401,403,409,422]) expect(shouldRetryQuery(0,new ApiHttpError({statusCode,code:"TEST",message:"test",requestId:null}))).toBe(false);
  });
});
