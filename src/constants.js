const AUTH_TOKEN = 'auth-token';
const ROLE = 'role';
const USER_ID = 'user_id';


export const getToken = () => localStorage.getItem(AUTH_TOKEN);
export const setToken = token => localStorage.setItem(AUTH_TOKEN, token);
export const deleteToken = () => localStorage.removeItem(AUTH_TOKEN);

export const getRole = () => localStorage.getItem(ROLE);
export const setRole = role => localStorage.setItem(ROLE, role);
export const deleteRole = () => localStorage.removeItem(ROLE);


export const getUserId = () => localStorage.getItem(USER_ID);
export const setUserId = user_id => localStorage.setItem(USER_ID, user_id);
export const deleteUserId = () => localStorage.removeItem(USER_ID);

export const punctuations = [
	{id: 1, text: '，', type: 'COMMA'},
	{id: 2, text: '。', type: 'PERIOD'},
	{id: 3, text: '”', type: 'QUOTE'},
	{id: 4, text: '！', type: 'EXCLAMATION'},
	{id: 5, text: '？', type: 'QUESTION'},
	{id: 6, text: '：', type: 'COLON'},
	{id: 7, text: '0', type: 'ZERO'},
	{id: 8, text: '1', type: 'ONE'},
	{id: 9, text: '2', type: 'TWO'},
	{id: 10, text: '3', type: 'THREE'},
	{id: 11, text: '4', type: 'FOUR'},
	{id: 12, text: '5', type: 'FIVE'},
	{id: 13, text: '6', type: 'SIX'},
	{id: 14, text: '7', type: 'SEVEN'},
	{id: 15, text: '8', type: 'EIGHT'},
	{id: 16, text: '9', type: 'NINE'},
	{id: 17, text: ' ', type: 'SPACE'}
]