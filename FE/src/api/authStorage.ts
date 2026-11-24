// 로그인 정보는 sessionStorage에 둔다. 브라우저 탭/창을 닫으면 지워져 자동 로그아웃된다.
// (localStorage는 브라우저를 껐다 켜도 남아서 공용 PC에서 로그인이 계속 유지되는 문제가 있었다.)
const ACCESS_KEY = 'token';
const REFRESH_KEY = 'refreshToken';
const USER_KEY = 'user';

// 이전 버전이 localStorage에 남긴 로그인 정보는 지운다.
try {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(USER_KEY);
} catch {
  /* 저장소 접근이 막힌 환경 */
}

function read(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    /* 저장소 접근이 막힌 환경 */
  }
}

export const authStorage = {
  getAccessToken: () => read(ACCESS_KEY),
  getRefreshToken: () => read(REFRESH_KEY),
  getUserJson: () => read(USER_KEY),
  setAccessToken: (token: string) => write(ACCESS_KEY, token),
  setRefreshToken: (token: string | null) => write(REFRESH_KEY, token),
  setUserJson: (json: string) => write(USER_KEY, json),
  clear: () => {
    write(ACCESS_KEY, null);
    write(REFRESH_KEY, null);
    write(USER_KEY, null);
  },
};
