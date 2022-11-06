import { Config, ConfigService } from "@config";
import { AssetsService, DummyLocalAssetsService } from "@services/assets.service";
import { BicyclePathsService, MongoDbBicyclePathsService } from "@services/bicycle-paths.service";
import { GeoSourceService, MTLOpenDataGeoSourceService } from "@services/geo-source.service";
import { MongoDbObservationsService, ObservationsService } from "@services/observations.service";
import { DefaultSyncService, SyncService } from "@services/sync.service";

/** The specification for the container. */
export interface Container {
  assetsService(): AssetsService;
  bicyclePathsService(): BicyclePathsService;
  geoSourceService(): GeoSourceService;
  observationsService(): ObservationsService;
  syncService(): SyncService;
}

const configService = new ConfigService();

/** Definition of factories for the container. */
export const createContainer: Container = {
  assetsService: () => new DummyLocalAssetsService(),

  bicyclePathsService: () => new MongoDbBicyclePathsService({
    db: configService.get(Config.MongoDbDb),
    url: configService.get(Config.MongoDbUrl),
  }),

  geoSourceService: () => new MTLOpenDataGeoSourceService(
    { bicyclePathsSourceUrl: configService.get(Config.MTLOpenDataBicyclePathUrl) }),

  observationsService: () => new MongoDbObservationsService(
    {
      db: configService.get(Config.MongoDbDb),
      url: configService.get(Config.MongoDbUrl),
    },
    createContainer.assetsService()),

  syncService: () => new DefaultSyncService(
    createContainer.assetsService(),
    createContainer.geoSourceService(),
    createContainer.bicyclePathsService()),
};