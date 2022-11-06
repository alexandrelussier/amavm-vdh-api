import { GeoJSONBicyclePathProperties } from "@entities/bicycle-paths";
import { ObservationRequestAsset, ReportedObservationAsset } from "@entities/observations";
import { CheckHealth } from "./health";
import { FeatureCollection, MultiLineString } from "geojson";
import { extension } from "mime-types";
import { URL } from "url";
import { v4 as uuid } from "uuid";
export interface AssetsService extends CheckHealth {
  delete(url: string): Promise<void>;
  upload(asset: ObservationRequestAsset): Promise<ReportedObservationAsset>;
  uploadBicyclePaths(data: FeatureCollection<MultiLineString, GeoJSONBicyclePathProperties>): Promise<void>;
}
export class DummyLocalAssetsService implements AssetsService  {

  public async checkHealth(): Promise<boolean> {
    return true;
  }

  public async delete(url: string): Promise<void> {
    return;
  }

  public async upload(asset: ObservationRequestAsset): Promise<ReportedObservationAsset> {
    const key = `${uuid()}.${extension(asset.contentType)}`;
    return {
      contentType: asset.contentType,
      url: new URL(key, "https://example.org").toString(),
    };
  }

  public async uploadBicyclePaths(
    data: FeatureCollection<MultiLineString, GeoJSONBicyclePathProperties>): Promise<void> {
    console.log(data);
  }

}
