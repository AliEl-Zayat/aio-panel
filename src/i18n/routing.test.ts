import { describe, it, expect } from "vitest";
import { getDir, isRtl, defaultLocale, locales, rtlLocales } from "./routing";

describe("getDir", () => {
  it('returns "ltr" for en', () => {
    expect(getDir("en")).toBe("ltr");
  });

  it('returns "rtl" for ar', () => {
    expect(getDir("ar")).toBe("rtl");
  });

  it("returns ltr for invalid or unknown locale (fallback behavior)", () => {
    expect(getDir("")).toBe("ltr");
    expect(getDir("fr")).toBe("ltr");
    expect(getDir("invalid")).toBe("ltr");
  });
});

describe("isRtl", () => {
  it("returns true only for RTL locales", () => {
    expect(isRtl("ar")).toBe(true);
  });

  it("returns false for LTR locales and others", () => {
    expect(isRtl("en")).toBe(false);
    expect(isRtl("fr")).toBe(false);
    expect(isRtl("")).toBe(false);
  });
});

describe("routing constants", () => {
  it("defaultLocale is en", () => {
    expect(defaultLocale).toBe("en");
  });

  it("locales includes en and ar", () => {
    expect(locales).toContain("en");
    expect(locales).toContain("ar");
  });

  it("rtlLocales contains only ar", () => {
    expect(rtlLocales).toContain("ar");
    expect(rtlLocales).not.toContain("en");
  });
});
