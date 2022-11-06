
/** The configuration keys can be listed here. */
export enum Config {
  AssetsRoot = "assets/root",
  AssetsBucket = "assets/bucket",
  MTLOpenDataBicyclePathUrl = "mtl-od-bp-url",
  MongoDbUrl = "mongodb-url",
  MongoDbDb = "mongodb-db",
}

interface IConfigService {
  configuration: Map<string, string | null>;
}

export class ConfigService implements IConfigService {
  configuration: Map<string, string | null>;
  constructor() {
    this.configuration = new Map<string, string>();
    this.configuration.set(Config.AssetsRoot, process.env.ASSETS_ROOT || null)
    this.configuration.set(Config.AssetsBucket, process.env.ASSETS_BUCKET || null)
    this.configuration.set(Config.MTLOpenDataBicyclePathUrl, process.env.MTL_OPENDATA_BICYCLE_PATH_URL || null)
    this.configuration.set(Config.MongoDbUrl, process.env.MONGODB_URL || null)
    this.configuration.set(Config.MongoDbDb, process.env.MONGODB_DB || null)
  };

  public get(name: string): string | undefined {
    return this.configuration.get(name) || undefined;
  };
}