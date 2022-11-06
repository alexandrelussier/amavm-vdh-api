import { BicyclePath, BicyclePathsRequest, BicyclePathContinuationArray } from "@entities/bicycle-paths";
import { MongoClient, MongoClientOptions, Db } from "mongodb";
import { CheckHealth } from "./health";

export interface BicyclePathsService extends CheckHealth {
  delete(id: string): Promise<void>;
  get(id: string): Promise<BicyclePath | undefined>;
  findAll(): Promise<BicyclePath[]>;
  find(request: BicyclePathsRequest): Promise<BicyclePathContinuationArray>;
  set(bp: BicyclePath): Promise<BicyclePath>;
}

export interface MongoDbBicyclePathsServiceOptions {
  url: string | undefined;
  db: string | undefined;
  mongoOptions?: MongoClientOptions;
}

export const BICYCLE_PATH_COLLECTION = "bicycle-paths";
const DEFAULT_LIMIT = 200;

export class MongoDbBicyclePathsService implements BicyclePathsService {

  private readonly lazyClient = new MongoClient(
    this.options.url!,
    this.options.mongoOptions);

  private readonly lazyDb: Db;

  public constructor(private readonly options: MongoDbBicyclePathsServiceOptions) {this.lazyDb = this.lazyClient.db(this.options.db);}

  public async init() {
    await this.lazyClient.connect();
  }

  public async checkHealth(): Promise<boolean> {
    return true;/*checkHealth(
      "MongoDbBicyclePathsService",
      undefined,
      async () => {
        const db = await this.lazyDb();
        return new Promise<void>((resolve, reject) => {
          db.collection(BICYCLE_PATH_COLLECTION).createIndex(
            { geometry : "2dsphere" },
            (err: any, _: any) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
        });
      });*/
  }

  public async delete(id: string): Promise<void> {
    const db = await this.lazyDb;
    await db.collection(BICYCLE_PATH_COLLECTION).deleteOne({ id });
  }

  public async get(id: string): Promise<BicyclePath | undefined> {
    const db = await this.lazyDb;
    const response = await db.collection(BICYCLE_PATH_COLLECTION).findOne({ id });
    if (!response) {
      return undefined;
    }

    return this.mapBp(response);
  }

  public async find(request: BicyclePathsRequest): Promise<BicyclePathContinuationArray> {
    const db = await this.lazyDb;
    const nextToken = JSON.parse(request.nextToken!.toString()) as NextToken;
    let pagination: Pagination;
    if (!nextToken) {
      pagination = { skip: 0, limit: request.limit || DEFAULT_LIMIT };
    } else {
      pagination = nextToken.pagination;
      request = nextToken.request;
    }

    let query: any = {};
    if (request.bbox) {
      if (request.bbox.length !== 4) {
        throw {status: 400, message: "Bounding box must have 4 numbers to specify the 4 corners. Order is SW lat, SW long, NE lat, NE long"};
      }
      const bbox = {
        geometry: {
          $geoWithin: {
            $geometry: {
              coordinates: [
                [
                  [ request.bbox[1], request.bbox[0] ], // SW
                  [ request.bbox[1], request.bbox[2] ], // NW
                  [ request.bbox[3], request.bbox[2] ], // NE
                  [ request.bbox[3], request.bbox[0] ], // SE
                  [ request.bbox[1], request.bbox[0] ], // SW
                ],
              ],
              type : "Polygon",
            },
          },
        },
      };
      query = {
        ...query,
        ...bbox,
      };
    }

    if (request.near) {
      if (request.near.length !== 2) {
        throw {status: 400, message: "Near must have 2 numbers to specify the coordinates"};
      }
      const near = {
        geometry: {
          $near: {
            $geometry: {
              coordinates: [request.near[0], request.near[1]],
              type : "Point",
            },
            $maxDistance: 100,
          },
        },
      };
      query = {
        ...query,
        ...near,
      };
    }

    if (request.borough) {
      query = {
        ...query,
        borough: request.borough,
      };
    }

    if (request.network) {
      query = {
        ...query,
        network: request.network,
      };
    }

    if (request.numberOfLanes) {
      query = {
        ...query,
        numberOfLanes: request.numberOfLanes,
      };
    }

    if (request.type) {
      query = {
        ...query,
        type: request.type,
      };
    }

    const result = await db.collection(BICYCLE_PATH_COLLECTION).find(query)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .toArray();

    pagination.skip += pagination.limit;
    request.nextToken = undefined;
    const nextNextToken = result.length < pagination.limit
      ? undefined
      : Buffer.from(JSON.stringify({
        pagination,
        request,
      })).toString("base64");
    return {
      items: result.map((x: any) => this.mapBp(x)),
      nextToken: nextNextToken,
    };
  }

  public async findAll(): Promise<BicyclePath[]> {
    const db = await this.lazyDb;
    return (await db.collection(BICYCLE_PATH_COLLECTION).find().toArray())
      .map((x: any) => this.mapBp(x));
  }

  public async set(bp: BicyclePath): Promise<BicyclePath> {
    const db = await this.lazyDb;
    await db.collection(BICYCLE_PATH_COLLECTION).updateOne({ id: bp.id }, { $set: bp }, { upsert: true });
    return bp;
  }

  private mapBp(from: any): BicyclePath {
    const { _id, ...result } = from;

    return result;
  }

}

interface Pagination {
  skip: number;
  limit: number;
}

interface NextToken {
  request: BicyclePathsRequest;
  pagination: Pagination;
}
