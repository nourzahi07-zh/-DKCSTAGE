/**
 * Auth Server Actions and area guards, with Supabase replaced by a fake.
 * (Whether Supabase itself stores/validates passwords correctly is Supabase's
 * job; what we test is OUR logic around it: validation, roles, redirects,
 * deactivated accounts, error messages.)
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

// --- fakes -----------------------------------------------------------------
const auth = {
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(async () => ({ error: null })),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  getClaims: vi.fn(),
};
let profileRow: Record<string, unknown> | null = null;
const fakeClient = {
  auth,
  from: vi.fn(() => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: profileRow, error: null }) }) }),
  })),
};

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => fakeClient }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

const actions = await import("@/app/auth/actions");
const { requireAdmin, requirePatient } = await import("@/lib/auth/session");
const idle = { status: "idle" as const };

function form(data: Record<string, string>) {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.set(k, v));
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  profileRow = null;
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// ---------------------------------------------------------------------------
describe("registerAction", () => {
  const valid = {
    fullName: "Amina Benali",
    email: "amina@example.com",
    phone: "0612345678",
    password: "motdepasse1",
    confirmPassword: "motdepasse1",
  };

  it("signs up with name + phone only (never a role, no e-mail redirect) and goes to the dashboard", async () => {
    auth.signUp.mockResolvedValue({ data: { session: { access_token: "t" }, user: {} }, error: null });
    await expect(actions.registerAction(idle, form({ ...valid, role: "admin" })))
      .rejects.toThrow("REDIRECT:/patient/dashboard");

    const arg = auth.signUp.mock.calls[0][0];
    expect(arg.options).toEqual({ data: { full_name: "Amina Benali", phone: "0612345678" } });
    expect(arg).toMatchObject({ email: "amina@example.com", password: "motdepasse1" });
  });

  it("never shows a 'confirmation e-mail sent' message", async () => {
    auth.signUp.mockResolvedValue({ data: { session: null, user: {} }, error: null });
    const state = await actions.registerAction(idle, form(valid));
    expect(state.status).toBe("error");
    expect(state.message).toMatch(/Veuillez vous connecter/);
    expect(state.message).not.toMatch(/e-mail de confirmation/);
  });

  it("returns field errors and does not call Supabase when invalid", async () => {
    const state = await actions.registerAction(idle, form({ ...valid, confirmPassword: "x" }));
    expect(state.status).toBe("error");
    expect(state.fieldErrors?.confirmPassword).toBeDefined();
    expect(state.values).not.toHaveProperty("password");
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("explains that the e-mail already has an account", async () => {
    auth.signUp.mockResolvedValue({ data: { user: null, session: null }, error: { code: "user_already_exists" } });
    const state = await actions.registerAction(idle, form(valid));
    expect(state.status).toBe("error");
    expect(state.message).toMatch(/existe déjà/);
    expect(state.values?.email).toBe("amina@example.com");
  });

  it("shows a French message (not the raw error) on a Supabase failure", async () => {
    auth.signUp.mockResolvedValue({ data: {}, error: { code: "over_request_rate_limit", message: "raw" } });
    const state = await actions.registerAction(idle, form(valid));
    expect(state.message).toMatch(/Trop de tentatives/);
    expect(state.message).not.toContain("raw");
  });
});

// ---------------------------------------------------------------------------
describe("loginAction / adminLoginAction", () => {
  const creds = { email: "a@example.com", password: "motdepasse1" };
  const signedIn = { data: { user: { id: "u1" } }, error: null };

  it("a patient is sent to their dashboard", async () => {
    auth.signInWithPassword.mockResolvedValue(signedIn);
    profileRow = { role: "patient", is_active: true };
    await expect(actions.loginAction(idle, form(creds))).rejects.toThrow("REDIRECT:/patient/dashboard");
  });

  it("honours a safe ?next= and ignores an external one", async () => {
    auth.signInWithPassword.mockResolvedValue(signedIn);
    profileRow = { role: "patient", is_active: true };
    await expect(actions.loginAction(idle, form({ ...creds, next: "/patient/profile" })))
      .rejects.toThrow("REDIRECT:/patient/profile");
    await expect(actions.loginAction(idle, form({ ...creds, next: "//evil.com" })))
      .rejects.toThrow("REDIRECT:/patient/dashboard");
  });

  it("a patient can never be redirected into the admin area", async () => {
    auth.signInWithPassword.mockResolvedValue(signedIn);
    profileRow = { role: "patient", is_active: true };
    await expect(actions.loginAction(idle, form({ ...creds, next: "/admin/patients" })))
      .rejects.toThrow("REDIRECT:/patient/dashboard");
  });

  it("wrong credentials give a French error", async () => {
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: { code: "invalid_credentials" } });
    const state = await actions.loginAction(idle, form(creds));
    expect(state.message).toBe("E-mail ou mot de passe incorrect.");
  });

  it("a deactivated account is signed out immediately", async () => {
    auth.signInWithPassword.mockResolvedValue(signedIn);
    profileRow = { role: "patient", is_active: false };
    const state = await actions.loginAction(idle, form(creds));
    expect(state.message).toMatch(/désactivé/);
    expect(auth.signOut).toHaveBeenCalled();
  });

  it("the admin login refuses (and signs out) a patient account", async () => {
    auth.signInWithPassword.mockResolvedValue(signedIn);
    profileRow = { role: "patient", is_active: true };
    const state = await actions.adminLoginAction(idle, form(creds));
    expect(state.status).toBe("error");
    expect(auth.signOut).toHaveBeenCalled();
  });

  it("the admin login lets the admin in", async () => {
    auth.signInWithPassword.mockResolvedValue(signedIn);
    profileRow = { role: "admin", is_active: true };
    await expect(actions.adminLoginAction(idle, form(creds))).rejects.toThrow("REDIRECT:/admin/dashboard");
  });
});

// ---------------------------------------------------------------------------
describe("logout & passwords", () => {
  it("logout signs out and goes home (admin goes to the admin login)", async () => {
    await expect(actions.logoutAction(form({ area: "patient" }))).rejects.toThrow("REDIRECT:/");
    await expect(actions.logoutAction(form({ area: "admin" }))).rejects.toThrow("REDIRECT:/admin/login");
    expect(auth.signOut).toHaveBeenCalledTimes(2);
  });

  it("forgot password always answers the same way (no account enumeration)", async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: { code: "user_not_found" } });
    const state = await actions.forgotPasswordAction(idle, form({ email: "x@example.com" }));
    expect(state.status).toBe("success");
    expect(auth.resetPasswordForEmail.mock.calls[0][1].redirectTo).toBe(
      "http://localhost:3000/auth/confirm?next=%2Fauth%2Freset-password",
    );
  });

  it("reset password requires the session opened by the e-mail link", async () => {
    auth.getClaims.mockResolvedValue({ data: null });
    const state = await actions.resetPasswordAction(idle, form({ password: "nouveau123", confirmPassword: "nouveau123" }));
    expect(state.message).toMatch(/expiré/);
    expect(auth.updateUser).not.toHaveBeenCalled();
  });

  it("reset password updates it and returns to the dashboard", async () => {
    auth.getClaims.mockResolvedValue({ data: { claims: { sub: "u1" } } });
    auth.updateUser.mockResolvedValue({ data: {}, error: null });
    profileRow = { role: "patient" };
    await expect(actions.resetPasswordAction(idle, form({ password: "nouveau123", confirmPassword: "nouveau123" })))
      .rejects.toThrow("REDIRECT:/patient/dashboard?password=updated");
  });
});

// ---------------------------------------------------------------------------
describe("area guards", () => {
  it("no session: patient area -> patient login, admin area -> admin login", async () => {
    auth.getClaims.mockResolvedValue({ data: null });
    await expect(requirePatient()).rejects.toThrow("REDIRECT:/auth/login");
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login");
  });

  it("a patient cannot enter the admin area", async () => {
    auth.getClaims.mockResolvedValue({ data: { claims: { sub: "u1" } } });
    profileRow = { id: "u1", role: "patient", is_active: true };
    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/patient/dashboard");
    await expect(requirePatient()).resolves.toMatchObject({ role: "patient" });
  });

  it("the admin is sent to the admin area from the patient area", async () => {
    auth.getClaims.mockResolvedValue({ data: { claims: { sub: "u2" } } });
    profileRow = { id: "u2", role: "admin", is_active: true };
    await expect(requirePatient()).rejects.toThrow("REDIRECT:/admin/dashboard");
  });

  it("a deactivated account is signed out", async () => {
    auth.getClaims.mockResolvedValue({ data: { claims: { sub: "u1" } } });
    profileRow = { id: "u1", role: "patient", is_active: false };
    await expect(requirePatient()).rejects.toThrow("REDIRECT:/auth/signout?reason=inactive");
  });
});
