import { describe, expect, it } from "vitest";
import { pumpFunUrl, twitterUrl } from "./site";

describe("social links", () => {
  it("accepts a handle with or without @, or a full URL", () => {
    expect(twitterUrl("@plax")).toBe("https://x.com/plax");
    expect(twitterUrl("plax")).toBe("https://x.com/plax");
    expect(twitterUrl("https://x.com/plax")).toBe("https://x.com/plax");
    expect(twitterUrl("  ")).toBeNull();
  });

  it("builds the pump.fun coin URL from a contract address, or hides it", () => {
    expect(pumpFunUrl(" 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU ")).toBe(
      "https://pump.fun/coin/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    );
    expect(pumpFunUrl("")).toBeNull();
  });
});
