/** Input checks shared by the auth screens. */
export const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
export { isServerPassword as isStrongPassword, PASSWORD_HINT } from '../services/server/authApi';
