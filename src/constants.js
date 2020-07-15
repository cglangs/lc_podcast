const AUTH_TOKEN = 'auth-token';
const ROLE = 'role';

export const getToken = () => localStorage.getItem(AUTH_TOKEN);
export const setToken = token => localStorage.setItem(AUTH_TOKEN, token);
export const deleteToken = () => localStorage.removeItem(AUTH_TOKEN);


export const getRole = () => localStorage.getItem(ROLE);
export const setRole = role => localStorage.setItem(ROLE, role);
export const deleteRole = () => localStorage.removeItem(ROLE);

export const punctuations = [
	{id: 1, text: '，', type: 'COMMA'},
	{id: 2, text: '。', type: 'PERIOD'},
	{id: 3, text: '“', type: 'QUOTE'},
	{id: 4, text: '！', type: 'EXCLAMATION'},
	{id: 5, text: '？', type: 'QUESTION'},
	{id: 6, text: '：', type: 'COLON'}，
	{id: 7, text: ' ', type: 'SPACE'}
]