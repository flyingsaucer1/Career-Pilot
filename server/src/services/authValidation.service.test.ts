import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerSchema, loginSchema, resetPasswordSchema, changePasswordSchema, deleteAccountSchema, updateProfileSchema } from '../validators/auth.validator';
test('rejects passwords that bcrypt would silently truncate, including multibyte characters', () => {
  const prefix = 'A1a'.repeat(24);
  const input = { name: 'Synthetic User', email: 'test@example.test', password: prefix };
  assert.equal(registerSchema.safeParse(input).success, true);
  for (const password of [prefix + 'x', 'A1a' + 'é'.repeat(35)]) {
    assert.equal(registerSchema.safeParse({ ...input, password }).success, false);
    assert.equal(loginSchema.safeParse({ email: input.email, password }).success, false);
    assert.equal(resetPasswordSchema.safeParse({ token: 'a'.repeat(64), password }).success, false);
    assert.equal(changePasswordSchema.safeParse({ currentPassword: password, newPassword: 'SafePassword123' }).success, false);
    assert.equal(deleteAccountSchema.safeParse({ password }).success, false);
    assert.equal(updateProfileSchema.safeParse({ name: input.name, email: input.email, currentPassword: password }).success, false);
  }
});
