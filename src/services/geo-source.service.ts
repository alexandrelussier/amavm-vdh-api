import { BicyclePath, BicyclePathDivider, BicyclePathNetwork, BicyclePathType } from "@entities/bicycle-paths";
import { bicyclePathSchema } from "@entities/schemas";
import { FeatureCollection, MultiLineString, Position } from "geojson";
import proj4 = require("proj4");
import { Response, Request, Filter, FilterChain, newHttpClient } from 'typescript-http-client'

/** The GeoSourceService is responsible for getting source geographical information. */
export interface GeoSourceService {
  /** Returns the list of bicycle paths from source data. */
  getBicyclePaths(): Promise<BicyclePath[]>;
}

export interface MTLOpenDataGeoSourceServiceOptions {
  bicyclePathsSourceUrl: string | undefined;
}

export class MTLOpenDataGeoSourceService implements GeoSourceService {

  private readonly sourceCoordinateSystem =
    "+proj=tmerc +lat_0=0 +lon_0=-73.5 +k=0.9999 +x_0=304800 +y_0=0 +datum=NAD83 +units=m +no_defs";
  private readonly destinationCoordinateSystem = "+proj=longlat +datum=WGS84 +no_defs";

  private readonly transformCoordinates = proj4(this.sourceCoordinateSystem, this.destinationCoordinateSystem);

  public constructor(
    private readonly options: MTLOpenDataGeoSourceServiceOptions) { }

  public async getBicyclePaths(): Promise<BicyclePath[]> {
    const client = newHttpClient();
    const request = new Request(this.options.bicyclePathsSourceUrl!);
    const response = await client.execute<MTLOpenDataBicyclePath>(request);

    const result = response.features
    .filter((x) => x.properties.Ville_MTL === "OUI")
      .map<BicyclePath>((x) => ({
        borough: x.properties.NOM_ARR_VI,
        divider: this.convertDivider(x.properties.SEPARATEUR),
        geometry: {
          coordinates: x.geometry.coordinates,
          type: x.geometry.type,
        },
        id: Math.trunc(x.properties.ID).toString(),
        length: Math.trunc(x.properties.LONGUEUR),
        network: this.convertNetwork(x.properties.SAISONS4),
        numberOfLanes: Math.trunc(x.properties.NBR_VOIE),
        type: this.convertType(Math.trunc(x.properties.TYPE_VOIE)),
      }));

    return result;
  }

  /** This converts geojson coordinates when they are inappropriate. */
  private convertCoordinates(position: Position[][]): Position[][] {
    return position.map(
      (x) => x.map(
        (y) => {
          return this.transformCoordinates
            .forward([y[0], y[1]])
            .map((z: number) => parseFloat(z.toFixed(10)))
            .reverse();
        }));
  }

  private convertDivider(sourceSeparateur?: string): BicyclePathDivider {
    switch (sourceSeparateur) {
      case "M":
        return BicyclePathDivider.Mail;
      case "D":
        return BicyclePathDivider.Delineateur;
      case "P":
        return BicyclePathDivider.MarquageAuSol;
      case "C":
        return BicyclePathDivider.Cloture;
      case "J":
        return BicyclePathDivider.Jersey;
      default:
        return BicyclePathDivider.Unknown;
    }
  }

  private convertNetwork(sourceSaison4?: string): BicyclePathNetwork {
    switch (sourceSaison4) {
      case "OUI":
        return BicyclePathNetwork.Seasons4;
      case "NON":
        return BicyclePathNetwork.Seasons3;
      default:
        return BicyclePathNetwork.Unknown;
    }
  }

  private convertType(sourceType?: number): BicyclePathType {
    switch (sourceType) {
      case 1:
        return BicyclePathType.ChausseeDesignee;
      case 2:
        return BicyclePathType.AccotementAsphalte;
      case 3:
        return BicyclePathType.BandeCyclable;
      case 4:
        return BicyclePathType.PisteCyclableSurRue;
      case 5:
        return BicyclePathType.PisteCyclableEnSitePropre;
      case 6:
        return BicyclePathType.PisteCyclableAuNiveauDuTrottoir;
      case 7:
        return BicyclePathType.SentierPolyvalent;
      case 8:
        return BicyclePathType.Velorue;
      default:
        return BicyclePathType.Unknown;
    }
  }
}

type MTLOpenDataBoolean = "OUI" | "NON";

interface MTLOpenDataBicyclePathGeoJSONProperties {
  ID: number;
  ID_TRC_GEO: number;
  TYPE_VOIE: number;
  TYPE_VOIE2: number;
  LONGUEUR: number;
  NBR_VOIE: number;
  SEPARATEUR?: string;
  SAISONS4: MTLOpenDataBoolean;
  PROTEGE_4S: MTLOpenDataBoolean;
  Ville_MTL: MTLOpenDataBoolean;
  NOM_ARR_VI: string;
}

type MTLOpenDataBicyclePath = FeatureCollection<MultiLineString, MTLOpenDataBicyclePathGeoJSONProperties>;
