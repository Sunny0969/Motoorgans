const AUTH_USER_KEY = 'tms_auth_user';
const AUTH_PASSWORD_KEY = 'tms_auth_password';
const AUTH_LOGIN_TIME_KEY = 'tms_auth_login_time';
const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = 'password';

export function getStoredPassword() {
  return localStorage.getItem(AUTH_PASSWORD_KEY) || DEFAULT_PASSWORD;
}

export function getStoredUser() {
  return localStorage.getItem(AUTH_USER_KEY) || '';
}

export function getLoginTime() {
  return localStorage.getItem(AUTH_LOGIN_TIME_KEY) || '';
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem(AUTH_USER_KEY));
}

export function login(username, password) {
  const expectedUser = DEFAULT_USERNAME;
  const expectedPass = getStoredPassword();
  if (username.trim().toLowerCase() !== expectedUser || password !== expectedPass) {
    return { ok: false, message: 'Invalid username or password.' };
  }
  const now = new Date();
  localStorage.setItem(AUTH_USER_KEY, expectedUser.toUpperCase());
  localStorage.setItem(AUTH_LOGIN_TIME_KEY, now.toLocaleTimeString('en-US'));
  return { ok: true };
}

export function logout() {
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(AUTH_LOGIN_TIME_KEY);
}

export function changePassword(currentPassword, newPassword) {
  if (currentPassword !== getStoredPassword()) {
    return { ok: false, message: 'Current password is incorrect.' };
  }
  if (!newPassword || newPassword.length < 4) {
    return { ok: false, message: 'New password must be at least 4 characters.' };
  }
  localStorage.setItem(AUTH_PASSWORD_KEY, newPassword);
  return { ok: true, message: 'Password changed successfully.' };
}
