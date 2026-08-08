export const AUTH_PASSWORD_MIN_LENGTH = 8;

const hasLower = /[a-z]/;
const hasUpper = /[A-Z]/;
const hasDigit = /\d/;
const hasSymbol = /[^A-Za-z0-9]/;

export const validateAuthPassword = (password: string): string | null => {
  if (password.length < AUTH_PASSWORD_MIN_LENGTH) {
    return `يجب أن تكون كلمة المرور ${AUTH_PASSWORD_MIN_LENGTH} أحرف على الأقل`;
  }

  if (!hasLower.test(password) || !hasUpper.test(password) || !hasDigit.test(password) || !hasSymbol.test(password)) {
    return 'يجب أن تحتوي كلمة المرور على حرف صغير وحرف كبير ورقم ورمز خاص';
  }

  return null;
};
