// 데이터 소스: 학식 정보 서버리스 API 원시 호출
import { parseOrThrow, type HttpClient } from '../../infrastructure/http/HttpClient.js';

export interface MenuApiItem {
  type: string;
  menu: string;
  price: string;
}

export interface CafeApiItem {
  id: string;
  name: string;
  menus: MenuApiItem[];
  hours: Record<string, string>;
  hasJeyuk: boolean;
  available: boolean;
}

export interface MenusApiResponse {
  success: boolean;
  date: string;
  data: CafeApiItem[];
}

export interface MenuApiDataSource {
  getMenus: (dateStr: string) => Promise<MenusApiResponse>;
}

export const createMenuApiDataSource = ({ httpClient }: { httpClient: HttpClient }): MenuApiDataSource => ({
  getMenus: async (dateStr: string) =>
    parseOrThrow(await httpClient.get(`/api/menu?id=all&date=${dateStr}`)),
});