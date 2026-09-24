import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfigError, getSiteUrl, getSupabaseEnv } from "@/lib/env";

afterEach(() => vi.unstubAllEnvs());

describe("getSupabaseEnv", () => {
  it("throws a clear ConfigError when the URL is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x");
    expect(() => getSupabaseEnv()).toThrow(ConfigError);
    expect(() => getSupabaseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("throws when the publishable key is blank", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "  ");
    expect(() => getSupabaseEnv()).toThrow(/PUBLISHABLE_KEY/);
  });

  it("returns trimmed values when set", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", " https://x.supabase.co ");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x");
    expect(getSupabaseEnv()).toEqual({
      url: "https://x.supabase.co",
      publishableKey: "sb_publishable_x",
    });
  });
});

describe("NEXT_PUBLIC_SUPABASE_URL normalization", () => {
  it.each([
    "https://abc.supabase.co/rest/v1/",
    "https://abc.supabase.co/rest/v1",
    "https://abc.supabase.co/",
    "https://abc.supabase.co/auth/v1",
  ])("reduces %s to the bare project URL", (value) => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", value);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x");
    expect(getSupabaseEnv().url).toBe("https://abc.supabase.co");
  });

  it("rejects a value that is not a URL, or not https", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "abc.supabase.co");
    expect(() => getSupabaseEnv()).toThrow(/not a valid URL/);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://abc.supabase.co");
    expect(() => getSupabaseEnv()).toThrow(/https/);
  });
});

describe("getSiteUrl", () => {
  it("strips trailing slashes", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://dkc.example/");
    expect(getSiteUrl()).toBe("https://dkc.example");
  });
});
