/** Server base URL. Set EXPO_PUBLIC_API_URL per environment (.env, EAS). */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');
