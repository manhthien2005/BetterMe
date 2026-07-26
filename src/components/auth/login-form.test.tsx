import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginForm } from "@/components/auth/login-form";

// Server actions ("use server") — mock the module wholesale.
const authMocks = vi.hoisted(() => ({
  loginWithPassword: vi.fn(),
  signUpWithPassword: vi.fn(),
  verifySignupOtp: vi.fn(),
  resendSignupOtp: vi.fn()
}));

vi.mock("@/lib/server/auth-actions", () => authMocks);

beforeEach(() => {
  vi.clearAllMocks();
  authMocks.loginWithPassword.mockResolvedValue(undefined); // success -> server redirect
  authMocks.signUpWithPassword.mockResolvedValue({ ok: true });
  authMocks.verifySignupOtp.mockResolvedValue(undefined);
  authMocks.resendSignupOtp.mockResolvedValue({ ok: true });
});

describe("LoginForm", () => {
  it("defaults to email + password login (no magic link)", async () => {
    render(<LoginForm />);

    expect(screen.getByRole("heading", { name: "Vào BetterMe" })).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Mật khẩu")).toBeTruthy();
    // The removed magic-link affordance must be gone.
    expect(screen.queryByRole("button", { name: /magic link/i })).toBeNull();

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "thien@example.com" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "hunter2!" } });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => {
      expect(authMocks.loginWithPassword).toHaveBeenCalledWith("thien@example.com", "hunter2!");
    });
    expect(authMocks.verifySignupOtp).not.toHaveBeenCalled();
  });

  it("surfaces a non-enumerating note when login fails", async () => {
    authMocks.loginWithPassword.mockResolvedValue({
      ok: false,
      reason: "Invalid login credentials"
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@b.com" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "nope" } });
    fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(await screen.findByText("Email hoặc mật khẩu chưa đúng.")).toBeTruthy();
  });

  it("signs up then verifies the 6-digit OTP", async () => {
    render(<LoginForm />);

    // Switch login -> signup.
    fireEvent.click(screen.getByRole("button", { name: "Đăng ký" }));

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@example.com" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "secret6" } });
    fireEvent.click(screen.getByRole("button", { name: "Đăng ký" }));

    await waitFor(() => {
      expect(authMocks.signUpWithPassword).toHaveBeenCalledWith("new@example.com", "secret6");
    });

    // The verify step appears with the OTP field.
    const otp = await screen.findByLabelText("Mã xác nhận");
    fireEvent.change(otp, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }));

    await waitFor(() => {
      expect(authMocks.verifySignupOtp).toHaveBeenCalledWith("new@example.com", "123456");
    });
  });

  it("keeps the OTP field numeric and accepts the full code length (no silent truncation)", async () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: "Đăng ký" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@example.com" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "secret6" } });
    fireEvent.click(screen.getByRole("button", { name: "Đăng ký" }));

    const otp = (await screen.findByLabelText("Mã xác nhận")) as HTMLInputElement;

    // Strips non-digits; keeps up to 8 (headroom over the 6-digit config so a
    // valid code is never silently truncated — the bug that broke signup).
    fireEvent.change(otp, { target: { value: "12ab34cd56789" } });
    expect(otp.value).toBe("12345678");
  });

  it("maps an expired/invalid OTP to a friendly retry note", async () => {
    authMocks.verifySignupOtp.mockResolvedValue({
      ok: false,
      reason: "Token has expired or is invalid"
    });

    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: "Đăng ký" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@example.com" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "secret6" } });
    fireEvent.click(screen.getByRole("button", { name: "Đăng ký" }));

    const otp = await screen.findByLabelText("Mã xác nhận");
    fireEvent.change(otp, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Xác nhận" }));

    expect(await screen.findByText(/Mã đã hết hạn hoặc chưa đúng/)).toBeTruthy();
  });

  it("routes an already-registered email back to login", async () => {
    authMocks.signUpWithPassword.mockResolvedValue({ ok: false, reason: "already-registered" });

    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: "Đăng ký" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "taken@example.com" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "secret6" } });
    fireEvent.click(screen.getByRole("button", { name: "Đăng ký" }));

    expect(
      await screen.findByText("Email này đã có tài khoản rồi — Sếp đăng nhập nha.")
    ).toBeTruthy();
    // Landed back on the login screen so they can sign in.
    expect(screen.getByRole("heading", { name: "Vào BetterMe" })).toBeTruthy();
  });

  it("throttles resend with a cooldown once a code is sent", async () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: "Đăng ký" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@example.com" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "secret6" } });
    fireEvent.click(screen.getByRole("button", { name: "Đăng ký" }));

    // In verify mode the resend control shows a countdown and is disabled.
    const resend = (await screen.findByRole("button", {
      name: /Gửi lại sau \d+s/
    })) as HTMLButtonElement;
    expect(resend.disabled).toBe(true);
  });

  it("does not re-send the OTP for the same email while cooling down", async () => {
    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: "Đăng ký" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "dup@example.com" } });
    fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "secret6" } });
    fireEvent.click(screen.getByRole("button", { name: "Đăng ký" }));

    // Now on the verify screen after one send.
    await screen.findByLabelText("Mã xác nhận");
    expect(authMocks.signUpWithPassword).toHaveBeenCalledTimes(1);

    // Go back and submit the SAME email again while the cooldown is active.
    fireEvent.click(screen.getByRole("button", { name: "Đổi email" }));
    fireEvent.click(screen.getByRole("button", { name: "Đăng ký" }));

    // Still exactly one send — no duplicate email.
    await screen.findByLabelText("Mã xác nhận");
    expect(authMocks.signUpWithPassword).toHaveBeenCalledTimes(1);
  });
});
