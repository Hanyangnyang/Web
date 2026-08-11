// 의존성 주입 컨테이너: 인프라→데이터→도메인 레이어를 연결하고 유스케이스를 조립
import { createHttpClient } from './infrastructure/http/HttpClient.js';

import { createMenuApiDataSource } from './data/datasources/MenuApiDataSource.js';
import { createInstagramApiDataSource } from './data/datasources/InstagramApiDataSource.js';
import { createWeatherApiDataSource } from './data/datasources/WeatherApiDataSource.js';
import { createLibraryApiDataSource } from './data/datasources/LibraryApiDataSource.js';
import { createBannerApiDataSource } from './data/datasources/BannerApiDataSource.js';
import { createBusApiDataSource } from './data/datasources/BusApiDataSource.js';
import { createGymApiDataSource } from './data/datasources/GymApiDataSource.js';
import { createFeedbackDataSource } from './data/datasources/FeedbackDataSource.js';

import { createMenuRepository } from './data/repositories/MenuRepository.js';
import { createInstagramRepository } from './data/repositories/InstagramRepository.js';
import { createWeatherRepository } from './data/repositories/WeatherRepository.js';
import { createLibraryRepository } from './data/repositories/LibraryRepository.js';
import { createBannerRepository } from './data/repositories/BannerRepository.js';
import { createBusRepository } from './data/repositories/BusRepository.js';
import { createGymRepository } from './data/repositories/GymRepository.js';
import { createFeedbackRepository } from './data/repositories/FeedbackRepository.js';

import { createGetMenuUseCase } from './domain/usecases/GetMenuUseCase.js';
import { createGetInstagramProfileUseCase } from './domain/usecases/GetInstagramProfileUseCase.js';
import { createGetShuttleDataUseCase } from './domain/usecases/GetShuttleDataUseCase.js';
import { createGetSubwayArrivalsUseCase } from './domain/usecases/GetSubwayArrivalsUseCase.js';
import { createGetWeatherUseCase } from './domain/usecases/GetWeatherUseCase.js';
import { createGetLibraryStatusUseCase } from './domain/usecases/GetLibraryStatusUseCase.js';
import { createGetBannersUseCase } from './domain/usecases/GetBannersUseCase.js';
import { createGetBusArrivalsUseCase } from './domain/usecases/GetBusArrivalsUseCase.js';
import { createGetGymScheduleUseCase } from './domain/usecases/GetGymScheduleUseCase.js';
import { createSubmitFeedbackUseCase } from './domain/usecases/SubmitFeedbackUseCase.js';

import { createShuttleDataSource } from './data/datasources/ShuttleDataSource.js';
import { createShuttleRepository } from './data/repositories/ShuttleRepository.js';

// Infrastructure
// 기존 Vercel BFF(/api/*) 전용 — 같은 origin 상대경로
const httpClient = createHttpClient();
// 새 백엔드 전용 - 마이그레이션된 DataSource부터 하나씩 이걸로 옮겨 붙인다.
const apiHttpClient = createHttpClient({ baseUrl: import.meta.env.VITE_API_BASE_URL });

// Data Sources
const menuApiDataSource = createMenuApiDataSource({ httpClient });
const instagramApiDataSource = createInstagramApiDataSource({ httpClient });
const shuttleDataSource = createShuttleDataSource({ httpClient });
const weatherApiDataSource = createWeatherApiDataSource({ httpClient });
const libraryApiDataSource = createLibraryApiDataSource({ httpClient: apiHttpClient });
const bannerApiDataSource = createBannerApiDataSource({ httpClient: apiHttpClient });
const busApiDataSource = createBusApiDataSource({ httpClient });
const gymApiDataSource = createGymApiDataSource({ httpClient });
const feedbackDataSource = createFeedbackDataSource();

// Repositories
export const menuRepository = createMenuRepository({ menuApiDataSource });
export const instagramRepository = createInstagramRepository({ instagramApiDataSource });
export const shuttleRepository = createShuttleRepository({ shuttleDataSource });
export const weatherRepository = createWeatherRepository({ weatherApiDataSource });
export const libraryRepository = createLibraryRepository({ libraryApiDataSource });
export const bannerRepository = createBannerRepository({ bannerApiDataSource });
export const busRepository = createBusRepository({ busApiDataSource });
export const gymRepository = createGymRepository({ gymApiDataSource });
export const feedbackRepository = createFeedbackRepository({ feedbackDataSource });

// Use Cases
export const getMenuUseCase = createGetMenuUseCase({ menuRepository });
export const getInstagramProfileUseCase = createGetInstagramProfileUseCase({ instagramRepository });
export const getShuttleDataUseCase = createGetShuttleDataUseCase({ shuttleRepository });
export const getSubwayArrivalsUseCase = createGetSubwayArrivalsUseCase({ shuttleRepository });
export const getWeatherUseCase = createGetWeatherUseCase({ weatherRepository });
export const getLibraryStatusUseCase = createGetLibraryStatusUseCase({ libraryRepository });
export const getBannersUseCase = createGetBannersUseCase({ bannerRepository });
export const getBusArrivalsUseCase = createGetBusArrivalsUseCase({ busRepository });
export const getGymScheduleUseCase = createGetGymScheduleUseCase({ gymRepository });
export const submitFeedbackUseCase = createSubmitFeedbackUseCase({ feedbackRepository });
