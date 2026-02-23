import { describe, it, expect, vi } from "vitest";
import { localeCookieName } from "@/i18n/routing";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("getLocaleAndMessages", () => {
  it("returns default locale and messages when cookie is missing", async () => {
    const { cookies } = await import("next/headers");
    vi.mocked(cookies).mockResolvedValue({
      get: () => undefined,
      has: () => false,
      set: () => {},
      delete: () => {},
      getAll: () => [],
    } as ReturnType<typeof cookies> extends Promise<infer R> ? R : never);

    const { getLocaleAndMessages } = await import("./i18n-server");
    const result = await getLocaleAndMessages();
    expect(result.locale).toBe("en");
    expect(result.messages).toBeDefined();
    expect(typeof result.messages).toBe("object");
  });

  it("returns ar locale when cookie is ar", async () => {
    const { cookies } = await import("next/headers");
    vi.mocked(cookies).mockResolvedValue({
      get: (name: string) =>
        name === localeCookieName ? { value: "ar", name } : undefined,
      has: () => true,
      set: () => {},
      delete: () => {},
      getAll: () => [],
    } as ReturnType<typeof cookies> extends Promise<infer R> ? R : never);

    const { getLocaleAndMessages } = await import("./i18n-server");
    const result = await getLocaleAndMessages();
    expect(result.locale).toBe("ar");
    expect(result.messages).toBeDefined();
  });

  it("returns en locale when cookie is en", async () => {
    const { cookies } = await import("next/headers");
    vi.mocked(cookies).mockResolvedValue({
      get: (name: string) =>
        name === localeCookieName ? { value: "en", name } : undefined,
      has: () => true,
      set: () => {},
      delete: () => {},
      getAll: () => [],
    } as ReturnType<typeof cookies> extends Promise<infer R> ? R : never);

    const { getLocaleAndMessages } = await import("./i18n-server");
    const result = await getLocaleAndMessages();
    expect(result.locale).toBe("en");
    expect(result.messages).toBeDefined();
  });

  it("falls back to default when cookie has invalid locale", async () => {
    const { cookies } = await import("next/headers");
    vi.mocked(cookies).mockResolvedValue({
      get: (name: string) =>
        name === localeCookieName ? { value: "fr", name } : undefined,
      has: () => true,
      set: () => {},
      delete: () => {},
      getAll: () => [],
    } as ReturnType<typeof cookies> extends Promise<infer R> ? R : never);

    const { getLocaleAndMessages } = await import("./i18n-server");
    const result = await getLocaleAndMessages();
    expect(result.locale).toBe("en");
  });
});
