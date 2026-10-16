/**
 * Accounts on the server (guest · email · password reset · withdrawal).
 * A request made while holding guest tokens carries them, so the server upgrades the guest
 * on signup and merges its data on login (POST /auth/signup · /auth/login).
 */
import { api, call } from '../../api/client';
import { IS_WEB, setTokens } from '../../api/tokens';

export interface Account {
  id: number;
  email: string | null;
  status: string;
}

/** refreshToken is absent on the web (the server puts it in an httpOnly cookie). */
export interface LoginPayload { accessToken: string; refreshToken?: string }

export async function keep(payload: LoginPayload, isGuest: boolean) {
  await setTokens({ accessToken: payload.accessToken, refreshToken: payload.refreshToken ?? '', isGuest });
}

export const authApi = {
  /** Creates a guest (called when the first profile is submitted). */
  async startGuest(): Promise<void> {
    await keep(await call<LoginPayload>(api.POST('/v1/auth/guest')), true);
  },

  async me(): Promise<Account> {
    const user = await call<{ id: number; email: string | null; status: string }>(api.GET('/v1/auth/user'));
    return { id: user.id, email: user.email, status: user.status };
  },

  async login(email: string, password: string): Promise<void> {
    const data = await call<LoginPayload & { twoFactorToken?: string }>(
      api.POST('/v1/auth/login', { body: { email: email.trim().toLowerCase(), password } }),
    );
    await keep(data, false);
  },

  /** Step 1 of signup: a 6-digit code is sent to the address. */
  async sendSignupCode(email: string): Promise<void> {
    await call(api.POST('/v1/auth/send-signup-email-verification', { body: { email: email.trim().toLowerCase() } }));
  },

  async resendSignupCode(email: string): Promise<void> {
    await call(api.POST('/v1/auth/resend-email-verification', { body: { email: email.trim().toLowerCase() } }));
  },

  /** Step 2: the code becomes a 10-minute token for step 3. */
  async verifySignupCode(email: string, otp: string): Promise<string> {
    const data = await call<{ emailVerifiedToken: string }>(
      api.POST('/v1/auth/verify-email', { body: { email: email.trim().toLowerCase(), otp } }),
    );
    return data.emailVerifiedToken;
  },

  async signup(params: { emailVerifiedToken: string; password: string; marketing: boolean }): Promise<void> {
    const data = await call<LoginPayload>(
      api.POST('/v1/auth/signup', {
        body: {
          emailVerifiedToken: params.emailVerifiedToken,
          password: params.password,
          isAllowTerms: true,
          isAllowPrivacy: true,
          isAllowMarketing: params.marketing,
        },
      }),
    );
    await keep(data, false);
  },

  async sendResetCode(email: string): Promise<void> {
    await call(api.POST('/v1/auth/send-password-reset-code', { body: { email: email.trim().toLowerCase() } }));
  },

  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    const { resetToken } = await call<{ resetToken: string }>(
      api.POST('/v1/auth/verify-password-reset-code', { body: { email: email.trim().toLowerCase(), otp } }),
    );
    await call(api.POST('/v1/auth/reset-password', { body: { resetToken, newPassword } }));
  },

  async withdraw(reason?: string): Promise<void> {
    await call(api.DELETE('/v1/auth/withdraw', { body: { reason } }));
    await setTokens(null);
  },

  async signOut(): Promise<void> {
    // web: clears the login cookie (apps only forget the stored tokens)
    if (IS_WEB) await call(api.POST('/v1/auth/logout', {})).catch(() => {});
    await setTokens(null);
  },
};

/** Server password rule: 8+ characters with a letter, a number and a special character. */
export const isServerPassword = (pw: string) => /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+]).{8,}$/.test(pw);
export const PASSWORD_HINT = '영문·숫자·특수문자(!@#$%^&*()_+) 포함 8자 이상';
