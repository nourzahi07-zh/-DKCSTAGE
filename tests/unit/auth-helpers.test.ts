import { describe, expect, it } from "vitest";
import { loginRedirectFor, safeRedirect } from "@/lib/auth/redirects";
import { authErrorMessage, GENERIC_AUTH_ERROR } from "@/lib/auth/errors";
import { loginSchema, newPasswordSchema, registerSchema } from "@/lib/validation/auth";

const validRegistration = {
  fullName: "Amina Benali",
  email: "  Amina@Example.COM ",
  phone: "06 12-34.56.78",
  password: "motdepasse1",
  confirmPassword: "motdepasse1",
};

describe("registerSchema", () => {
  it("accepts a valid registration and normalizes e-mail and phone", () => {
    const r = registerSchema.parse(validRegistration);
    expect(r.email).toBe("amina@example.com");
    expect(r.phone).toBe("0612345678");
  });

  it("keeps a leading + on international numbers", () => {
    expect(registerSchema.parse({ ...validRegistration, phone: "+212 6 12 34 56 78" }).phone)
      .toBe("+212612345678");
  });

  it.each([
    ["short password", { password: "abc1", confirmPassword: "abc1" }, "password"],
    ["password without digit", { password: "motdepasse", confirmPassword: "motdepasse" }, "password"],
    ["mismatched confirmation", { confirmPassword: "autre1234" }, "confirmPassword"],
    ["invalid e-mail", { email: "pas-un-email" }, "email"],
    ["invalid phone", { phone: "12" }, "phone"],
    ["empty name", { fullName: " " }, "fullName"],
  ])("rejects %s", (_label, override, field) => {
    const r = registerSchema.safeParse({ ...validRegistration, ...override });
    expect(r.success).toBe(false);
    expect(r.error?.issues.some((i) => i.path[0] === field)).toBe(true);
  });

  it("ignores a 'role' field sent by a malicious form", () => {
    const r = registerSchema.parse({ ...validRegistration, role: "admin" });
    expect(r).not.toHaveProperty("role");
  });
});

describe("loginSchema / newPasswordSchema", () => {
  it("login only requires a non-empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });

  it("new password must be strong and confirmed", () => {
    expect(newPasswordSchema.safeParse({ password: "abcdefg1", confirmPassword: "abcdefg1" }).success).toBe(true);
    expect(newPasswordSchema.safeParse({ password: "abcdefg1", confirmPassword: "abcdefg2" }).success).toBe(false);
  });
});

describe("safeRedirect", () => {
  it.each([
    ["/patient/dashboard", "/patient/dashboard"],
    ["/patient/appointments?tab=past", "/patient/appointments?tab=past"],
  ])("keeps internal path %s", (input, expected) => {
    expect(safeRedirect(input, "/fallback")).toBe(expected);
  });

  it.each(["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "evil", "", null, undefined, "/\t/evil.com"])(
    "rejects %s",
    (input) => {
      expect(safeRedirect(input as string, "/fallback")).toBe("/fallback");
    },
  );
});

describe("loginRedirectFor", () => {
  it("sends visitors of the patient area to the patient login", () => {
    expect(loginRedirectFor("/patient/dashboard")).toBe("/auth/login?next=%2Fpatient%2Fdashboard");
  });

  it("sends visitors of the admin area to the admin login", () => {
    expect(loginRedirectFor("/admin/patients")).toBe("/admin/login?next=%2Fadmin%2Fpatients");
    expect(loginRedirectFor("/admin")).toBe("/admin/login?next=%2Fadmin");
  });

  it("leaves public pages and the admin login page alone", () => {
    for (const path of ["/", "/services", "/auth/login", "/admin/login", "/administration", "/patients-info"]) {
      expect(loginRedirectFor(path)).toBeNull();
    }
  });
});

describe("authErrorMessage", () => {
  it("translates known Supabase codes and hides unknown ones", () => {
    expect(authErrorMessage({ code: "invalid_credentials" })).toBe("E-mail ou mot de passe incorrect.");
    expect(authErrorMessage({ code: "something_internal" })).toBe(GENERIC_AUTH_ERROR);
    expect(authErrorMessage(null)).toBe(GENERIC_AUTH_ERROR);
  });
});
