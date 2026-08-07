// 의존성 주입 컨테이너: 인프라→데이터→도메인 레이어를 연결하고 유스케이스를 조립
import { createHttpClient } from './infrastructure/http/HttpClient.js';

import { createMenuApiDataSource } from './data/datasources/MenuApiDataSource.js';
import { createInstagramApiDataSource } from './data/datasources/InstagramApiDataSource.js';
import { createPortalApiDataSource } from './data/datasources/PortalApiDataSource.js';
import { createBannerApiDataSource } from './data/datasources/BannerApiDataSource.js';
import { createBusApiDataSource } from './data/datasources/BusApiDataSource.js';
import { createGymApiDataSource } from './data/datasources/GymApiDataSource.js';
import { createFeedbackDataSource } from './data/datasources/FeedbackDataSource.js';
import { createPartnershipApiDataSource } from './data/datasources/PartnershipApiDataSource.js';
import { createCampusBuildingApiDataSource } from './data/datasources/CampusBuildingApiDataSource.js';
import { createSmokingSpotApiDataSource } from './data/datasources/SmokingSpotApiDataSource.js';

import { createMenuRepository } from './data/repositories/MenuRepository.js';
import { createInstagramRepository } from './data/repositories/InstagramRepository.js';
import { createPortalRepository } from './data/repositories/PortalRepository.js';
import { createBannerRepository } from './data/repositories/BannerRepository.js';
import { createBusRepository } from './data/repositories/BusRepository.js';
import { createGymRepository } from './data/repositories/GymRepository.js';
import { createFeedbackRepository } from './data/repositories/FeedbackRepository.js';
import { createPartnershipRepository } from './data/repositories/PartnershipRepository.js';
import { createCampusBuildingRepository } from './data/repositories/CampusBuildingRepository.js';
import { createSmokingSpotRepository } from './data/repositories/SmokingSpotRepository.js';

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
import { createGetPartnershipStoresUseCase } from './domain/usecases/GetPartnershipStoresUseCase.js';
import { createGetCampusBuildingsUseCase } from './domain/usecases/GetCampusBuildingsUseCase.js';
import { createGetSmokingSpotsUseCase } from './domain/usecases/GetSmokingSpotsUseCase.js';

import { createShuttleDataSource } from './data/datasources/ShuttleDataSource.js';
import { createShuttleRepository } from './data/repositories/ShuttleRepository.js';

// Infrastructure
const httpClient = createHttpClient();

// Data Sources
const menuApiDataSource = createMenuApiDataSource({ httpClient });
const instagramApiDataSource = createInstagramApiDataSource({ httpClient });
const shuttleDataSource = createShuttleDataSource({ httpClient });
const portalApiDataSource = createPortalApiDataSource({ httpClient });
const bannerApiDataSource = createBannerApiDataSource({ httpClient });
const busApiDataSource = createBusApiDataSource({ httpClient });
const gymApiDataSource = createGymApiDataSource({ httpClient });
const feedbackDataSource = createFeedbackDataSource();
const partnershipApiDataSource = createPartnershipApiDataSource({ httpClient });
const campusBuildingApiDataSource = createCampusBuildingApiDataSource({ httpClient });
const smokingSpotApiDataSource = createSmokingSpotApiDataSource({ httpClient });

// Repositories
export const menuRepository = createMenuRepository({ menuApiDataSource });
export const instagramRepository = createInstagramRepository({ instagramApiDataSource });
export const shuttleRepository = createShuttleRepository({ shuttleDataSource });
export const portalRepository = createPortalRepository({ portalApiDataSource });
export const bannerRepository = createBannerRepository({ bannerApiDataSource });
export const busRepository = createBusRepository({ busApiDataSource });
export const gymRepository = createGymRepository({ gymApiDataSource });
export const feedbackRepository = createFeedbackRepository({ feedbackDataSource });
export const partnershipRepository = createPartnershipRepository({ partnershipApiDataSource });
export const campusBuildingRepository = createCampusBuildingRepository({ campusBuildingApiDataSource });
export const smokingSpotRepository = createSmokingSpotRepository({ smokingSpotApiDataSource });

// Use Cases
export const getMenuUseCase = createGetMenuUseCase({ menuRepository });
export const getInstagramProfileUseCase = createGetInstagramProfileUseCase({ instagramRepository });
export const getShuttleDataUseCase = createGetShuttleDataUseCase({ shuttleRepository });
export const getSubwayArrivalsUseCase = createGetSubwayArrivalsUseCase({ shuttleRepository });
export const getWeatherUseCase = createGetWeatherUseCase({ portalRepository });
export const getLibraryStatusUseCase = createGetLibraryStatusUseCase({ portalRepository });
export const getBannersUseCase = createGetBannersUseCase({ bannerRepository });
export const getBusArrivalsUseCase = createGetBusArrivalsUseCase({ busRepository });
export const getGymScheduleUseCase = createGetGymScheduleUseCase({ gymRepository });
export const submitFeedbackUseCase = createSubmitFeedbackUseCase({ feedbackRepository });
export const getPartnershipStoresUseCase = createGetPartnershipStoresUseCase({ partnershipRepository });
export const getCampusBuildingsUseCase = createGetCampusBuildingsUseCase({ campusBuildingRepository });
export const getSmokingSpotsUseCase = createGetSmokingSpotsUseCase({ smokingSpotRepository });
