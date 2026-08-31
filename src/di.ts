// 의존성 주입 컨테이너: 인프라→데이터→도메인 레이어를 연결하고 유스케이스를 조립
import { createHttpClient } from './infrastructure/http/HttpClient.js';

import { createMenuApiDataSource } from './data/datasources/MenuApiDataSource.js';
import { createWeatherApiDataSource } from './data/datasources/WeatherApiDataSource.js';
import { createWeatherBriefingApiDataSource } from './data/datasources/WeatherBriefingApiDataSource.js';
import { createLibraryApiDataSource } from './data/datasources/LibraryApiDataSource.js';
import { createBannerApiDataSource } from './data/datasources/BannerApiDataSource.js';
import { createBusApiDataSource } from './data/datasources/BusApiDataSource.js';
import { createGymApiDataSource } from './data/datasources/GymApiDataSource.js';
import { createFeedbackDataSource } from './data/datasources/FeedbackDataSource.js';
import { createHolidayApiDataSource } from './data/datasources/HolidayApiDataSource.js';
import { createPartnerStoreApiDataSource } from './data/datasources/PartnerStoreApiDataSource.js';
import { createCampusBuildingApiDataSource } from './data/datasources/CampusBuildingApiDataSource.js';
import { createSmokingSpotApiDataSource } from './data/datasources/SmokingSpotApiDataSource.js';

import { createMenuRepository } from './data/repositories/MenuRepository.js';
import { createWeatherRepository } from './data/repositories/WeatherRepository.js';
import { createWeatherBriefingRepository } from './data/repositories/WeatherBriefingRepository.js';
import { createLibraryRepository } from './data/repositories/LibraryRepository.js';
import { createBannerRepository } from './data/repositories/BannerRepository.js';
import { createBusRepository } from './data/repositories/BusRepository.js';
import { createGymRepository } from './data/repositories/GymRepository.js';
import { createFeedbackRepository } from './data/repositories/FeedbackRepository.js';
import { createHolidayRepository } from './data/repositories/HolidayRepository.js';
import { createPartnerStoreRepository } from './data/repositories/PartnerStoreRepository.js';
import { createCampusBuildingRepository } from './data/repositories/CampusBuildingRepository.js';
import { createSmokingSpotRepository } from './data/repositories/SmokingSpotRepository.js';

import { createGetMenuForDateUseCase } from './domain/usecases/GetMenuForDateUseCase.js';
import { createGetMenuForPeriodUseCase } from './domain/usecases/GetMenuForPeriodUseCase.js';
import { createGetShuttleDataUseCase } from './domain/usecases/GetShuttleDataUseCase.js';
import { createGetSubwayScheduleUseCase } from './domain/usecases/GetSubwayScheduleUseCase.js';
import { createGetWeatherUseCase } from './domain/usecases/GetWeatherUseCase.js';
import { createGetWeatherBriefingUseCase } from './domain/usecases/GetWeatherBriefingUseCase.js';
import { createGetLibraryStatusUseCase } from './domain/usecases/GetLibraryStatusUseCase.js';
import { createGetBannersUseCase } from './domain/usecases/GetBannersUseCase.js';
import { createGetBusArrivalsUseCase } from './domain/usecases/GetBusArrivalsUseCase.js';
import { createGetGymScheduleUseCase } from './domain/usecases/GetGymScheduleUseCase.js';
import { createSubmitFeedbackUseCase } from './domain/usecases/SubmitFeedbackUseCase.js';
import { createGetIsHolidayUseCase } from './domain/usecases/GetIsHolidayUseCase.js';
import { createGetPartnerStoresUseCase } from './domain/usecases/GetPartnerStoresUseCase.js';
import { createGetCampusBuildingsUseCase } from './domain/usecases/GetCampusBuildingsUseCase.js';
import { createGetSmokingSpotsUseCase } from './domain/usecases/GetSmokingSpotsUseCase.js';

import { createShuttleApiDataSource } from './data/datasources/ShuttleApiDataSource.js';
import { createSubwayApiDataSource } from './data/datasources/SubwayApiDataSource.js';
import { createShuttleRepository } from './data/repositories/ShuttleRepository.js';
import { createSubwayRepository } from './data/repositories/SubwayRepository.js';

// 기존 Vercel BFF(/api/*) 전용 
const httpClient = createHttpClient();
// 새 백엔드 전용 
const apiHttpClient = createHttpClient({
  baseUrl: import.meta.env.DEV ? '/backend' : import.meta.env.VITE_API_BASE_URL,
});

// Data Sources
const menuApiDataSource = createMenuApiDataSource({ httpClient: apiHttpClient });
const shuttleApiDataSource = createShuttleApiDataSource({ httpClient: apiHttpClient });
const subwayApiDataSource = createSubwayApiDataSource({ httpClient: apiHttpClient });
const weatherApiDataSource = createWeatherApiDataSource({ httpClient: apiHttpClient });
const weatherBriefingApiDataSource = createWeatherBriefingApiDataSource({ httpClient: apiHttpClient });
const libraryApiDataSource = createLibraryApiDataSource({ httpClient: apiHttpClient });
const bannerApiDataSource = createBannerApiDataSource({ httpClient: apiHttpClient });
const busApiDataSource = createBusApiDataSource({ httpClient });
const gymApiDataSource = createGymApiDataSource({ httpClient: apiHttpClient });
const feedbackDataSource = createFeedbackDataSource();
const holidayApiDataSource = createHolidayApiDataSource({ httpClient });
const partnerStoreApiDataSource = createPartnerStoreApiDataSource({ httpClient: apiHttpClient });
const campusBuildingApiDataSource = createCampusBuildingApiDataSource({ httpClient });
const smokingSpotApiDataSource = createSmokingSpotApiDataSource({ httpClient });

// Repositories
export const menuRepository = createMenuRepository({ menuApiDataSource });
export const shuttleRepository = createShuttleRepository({ shuttleApiDataSource });
export const subwayRepository = createSubwayRepository({ subwayApiDataSource });
export const weatherRepository = createWeatherRepository({ weatherApiDataSource });
export const weatherBriefingRepository = createWeatherBriefingRepository({ weatherBriefingApiDataSource });
export const libraryRepository = createLibraryRepository({ libraryApiDataSource });
export const bannerRepository = createBannerRepository({ bannerApiDataSource });
export const busRepository = createBusRepository({ busApiDataSource });
export const gymRepository = createGymRepository({ gymApiDataSource });
export const feedbackRepository = createFeedbackRepository({ feedbackDataSource });
export const holidayRepository = createHolidayRepository({ holidayApiDataSource });
export const partnerStoreRepository = createPartnerStoreRepository({ partnerStoreApiDataSource });
export const campusBuildingRepository = createCampusBuildingRepository({ campusBuildingApiDataSource });
export const smokingSpotRepository = createSmokingSpotRepository({ smokingSpotApiDataSource });

// Use Cases
export const getMenuForDateUseCase = createGetMenuForDateUseCase({ menuRepository });
export const getMenuForPeriodUseCase = createGetMenuForPeriodUseCase({ menuRepository });
export const getShuttleDataUseCase = createGetShuttleDataUseCase({ shuttleRepository });
export const getSubwayScheduleUseCase = createGetSubwayScheduleUseCase({ subwayRepository });
export const getWeatherUseCase = createGetWeatherUseCase({ weatherRepository });
export const getWeatherBriefingUseCase = createGetWeatherBriefingUseCase({ weatherBriefingRepository });
export const getLibraryStatusUseCase = createGetLibraryStatusUseCase({ libraryRepository });
export const getBannersUseCase = createGetBannersUseCase({ bannerRepository });
export const getBusArrivalsUseCase = createGetBusArrivalsUseCase({ busRepository });
export const getGymScheduleUseCase = createGetGymScheduleUseCase({ gymRepository });
export const submitFeedbackUseCase = createSubmitFeedbackUseCase({ feedbackRepository });
export const getIsHolidayUseCase = createGetIsHolidayUseCase({ holidayRepository });
export const getPartnerStoresUseCase = createGetPartnerStoresUseCase({ partnerStoreRepository });
export const getCampusBuildingsUseCase = createGetCampusBuildingsUseCase({ campusBuildingRepository });
export const getSmokingSpotsUseCase = createGetSmokingSpotsUseCase({ smokingSpotRepository });
