// 의존성 주입 컨테이너: 인프라→데이터→도메인 레이어를 연결하고 유스케이스를 조립
import { createHttpClient } from './infrastructure/http/HttpClient.js';
import { createLocalStorageService } from './infrastructure/storage/LocalStorageService.js';

import { createMenuApiDataSource } from './data/datasources/MenuApiDataSource.js';
import { createInstagramApiDataSource } from './data/datasources/InstagramApiDataSource.js';
import { createPortalApiDataSource } from './data/datasources/PortalApiDataSource.js';
import { createBannerApiDataSource } from './data/datasources/BannerApiDataSource.js';

import { createMenuRepository } from './data/repositories/MenuRepository.js';
import { createInstagramRepository } from './data/repositories/InstagramRepository.js';
import { createPortalRepository } from './data/repositories/PortalRepository.js';
import { createBannerRepository } from './data/repositories/BannerRepository.js';

import { createGetMenuUseCase } from './domain/usecases/GetMenuUseCase.js';
import { createGetInstagramProfileUseCase } from './domain/usecases/GetInstagramProfileUseCase.js';
import { createGetShuttleDataUseCase } from './domain/usecases/GetShuttleDataUseCase.js';
import { createGetSubwayArrivalsUseCase } from './domain/usecases/GetSubwayArrivalsUseCase.js';
import { createGetWeatherUseCase } from './domain/usecases/GetWeatherUseCase.js';
import { createGetLibraryStatusUseCase } from './domain/usecases/GetLibraryStatusUseCase.js';
import { createGetBannersUseCase } from './domain/usecases/GetBannersUseCase.js';

import { createShuttleDataSource } from './data/datasources/ShuttleDataSource.js';
import { createShuttleRepository } from './data/repositories/ShuttleRepository.js';

// Infrastructure
const httpClient = createHttpClient();
const storageService = createLocalStorageService();

// Data Sources
const menuApiDataSource = createMenuApiDataSource({ httpClient });
const instagramApiDataSource = createInstagramApiDataSource({ httpClient });
const shuttleDataSource = createShuttleDataSource({ httpClient });
const portalApiDataSource = createPortalApiDataSource({ httpClient });
const bannerApiDataSource = createBannerApiDataSource({ httpClient });

// Repositories
export const menuRepository = createMenuRepository({ menuApiDataSource });
export const instagramRepository = createInstagramRepository({ instagramApiDataSource });
export const shuttleRepository = createShuttleRepository({ shuttleDataSource });
export const portalRepository = createPortalRepository({ portalApiDataSource });
export const bannerRepository = createBannerRepository({ bannerApiDataSource });

// Use Cases
export const getMenuUseCase = createGetMenuUseCase({ menuRepository });
export const getInstagramProfileUseCase = createGetInstagramProfileUseCase({ instagramRepository });
export const getShuttleDataUseCase = createGetShuttleDataUseCase({ shuttleRepository });
export const getSubwayArrivalsUseCase = createGetSubwayArrivalsUseCase({ shuttleRepository });
export const getWeatherUseCase = createGetWeatherUseCase({ portalRepository });
export const getLibraryStatusUseCase = createGetLibraryStatusUseCase({ portalRepository });
export const getBannersUseCase = createGetBannersUseCase({ bannerRepository });
