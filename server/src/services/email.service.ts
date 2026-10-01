import { env } from '../config/env';

export interface TestEmail {
  to: string;
  subject: string;
  resetUrl: string;
}

// Kept in memory only for isolated integration tests. It is never exposed by
// an HTTP route, so reset tokens cannot be retrieved from the public API.
export const testEmailOutbox: TestEmail[] = [];

export const sendPasswordResetEmail = async (
  to: string,
  name: string,
  resetUrl: string
): Promise<void> => {
  const subject = 'Reset your CareerPilot password';
  if (env.NODE_ENV === 'test') {
    testEmailOutbox.push({ to, subject, resetUrl });
    return;
  }

  if (env.EMAIL_PROVIDER === 'console') {
    console.info(`[Email preview] Password reset for ${to}: ${resetUrl}`);
    return;
  }

  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is required when EMAIL_PROVIDER=resend');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [to],
      subject,
      html: `<p>Hello ${escapeHtml(name)},</p><p>Use the link below to reset your CareerPilot password. It expires in ${env.PASSWORD_RESET_EXPIRES_MINUTES} minutes and can only be used once.</p><p><a href="${escapeHtml(resetUrl)}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Email provider rejected the request (${response.status})`);
  }
};

const escapeHtml = (value: string): string => value.replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character] ?? character));
