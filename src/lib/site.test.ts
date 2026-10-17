import { describe, expect, it } from "vitest";
import { pumpFunUrl, twitterUrl } from "./site";

describe("social links", () => {
  it("accepts a handle with or without @, or a full URL", () => {
    expect(twitterUrl("@parallax")).toBe("https://x.com/parallax");
    expect(twitterUrl("parallax")).toBe("https://x.com/parallax");
    expect(twitterUrl("https://x.com/parallax")).toBe("https://x.com/parallax");
    expect(twitterUrl("  ")).toBeNull();
  });

  it("builds the pump.fun coin URL from a contract address, or hides it", () => {
    expect(pumpFunUrl(" 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU ")).toBe(
      "https://pump.fun/coin/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    );
    expect(pumpFunUrl("")).toBeNull();
  });
});
