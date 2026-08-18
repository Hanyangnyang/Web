// 데이터 소스: 학식 정보 API 원시 호출
import { parseOrThrow, type ApiResponse, type HttpClient } from '../../infrastructure/http/HttpClient.js';

export interface MenuItemDto {
  id: number;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER';
  displayOrder: number;
  price: number;
  menuItems: string[];
  rawMenu: string;
}

export interface CafeteriaDto {
  cafeteriaCode: 'RE11' | 'RE12' | 'RE13' | 'RE15';
  name: string;
  operatingHours: Record<string, string>;
  menu: MenuItemDto[];
}

export interface MenuResponseDto {
  [date: string]: CafeteriaDto[];
}

// 요청 파라미터
export interface GetMenusParams {
  startDate: string;
  endDate: string;
}

export interface MenuApiDataSource {
  getMenus: (params: GetMenusParams) => Promise<ApiResponse<MenuResponseDto>>;
}

export const createMenuApiDataSource = ({ httpClient }: { httpClient: HttpClient }): MenuApiDataSource => ({
  getMenus: async ({ startDate, endDate }) => {
    const query = new URLSearchParams({ startDate, endDate });
    return parseOrThrow(await httpClient.get(`/api/v1/menu?${query.toString()}`));
  },
});
