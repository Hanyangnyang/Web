// 데이터 소스: 식단 정보 서버리스 API 원시 호출
import { parseOrThrow } from '../../infrastructure/http/HttpClient.js';

export const createMenuApiDataSource = ({ httpClient }) => ({
  getMenus: async (dateStr) =>
    parseOrThrow(await httpClient.get(`/api/menu?id=all&date=${dateStr}`)),
});

// httpClient.get()를 통해 API 호출하면 Promise가 리턴됨 
// await가 그 Promise를 기다렸다가, 다 되면 안에 든 Reponse 객체를 꺼냄 