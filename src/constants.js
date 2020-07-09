const AUTH_TOKEN = 'auth-token';
const ROLE = 'role';

export const getToken = () => localStorage.getItem(AUTH_TOKEN);
export const setToken = token => localStorage.setItem(AUTH_TOKEN, token);
export const deleteToken = () => localStorage.removeItem(AUTH_TOKEN);


export const getRole = () => localStorage.getItem(ROLE);
export const setRole = role => localStorage.setItem(ROLE, role);
export const deleteRole = () => localStorage.removeItem(ROLE);