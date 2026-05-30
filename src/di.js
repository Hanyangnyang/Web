// 의존성 주입 컨테이너: 인프라→데이터→도메인 레이어를 연결하고 유스케이스를 조립
import { createHttpClient } from './infrastructure/http/HttpClient.js';
import { createLocalStorageService } from './infrastructure/storage/LocalStorageService.js';

import { createMenuApiDataSource } from './data/datasources/MenuApiDataSource.js';
import { createInstagramApiDataSource } from './data/datasources/InstagramApiDataSource.js';

import { createMenuRepository } from './data/repositories/MenuRepository.js';
import { createInstagramRepository } from './data/repositories/InstagramRepository.js';

import { createGetMenuUseCase } from './domain/usecases/GetMenuUseCase.js';
import { createGetInstagramProfileUseCase } from './domain/usecases/GetInstagramProfileUseCase.js';
import { createGetShuttleDataUseCase } from './domain/usecases/GetShuttleDataUseCase.js';
import { createGetSubwayArrivalsUseCase } from './domain/usecases/GetSubwayArrivalsUseCase.js';

import { createShuttleDataSource } from './data/datasources/ShuttleDataSource.js';
import { createShuttleRepository } from './data/repositories/ShuttleRepository.js';

// Infrastructure
const httpClient = createHttpClient();
const storageService = createLocalStorageService();

// Data Sources
const menuApiDataSource = createMenuApiDataSource({ httpClient });
const instagramApiDataSource = createInstagramApiDataSource({ httpClient });
const shuttleDataSource = createShuttleDataSource({ httpClient });

// Repositories
export const menuRepository = createMenuRepository({ menuApiDataSource });
export const instagramRepository = createInstagramRepository({ instagramApiDataSource });
export const shuttleRepository = createShuttleRepository({ shuttleDataSource });

// Use Cases
export const getMenuUseCase = createGetMenuUseCase({ menuRepository });
export const getInstagramProfileUseCase = createGetInstagramProfileUseCase({ instagramRepository });
export const getShuttleDataUseCase = createGetShuttleDataUseCase({ shuttleRepository });
export const getSubwayArrivalsUseCase = createGetSubwayArrivalsUseCase({ shuttleRepository });
