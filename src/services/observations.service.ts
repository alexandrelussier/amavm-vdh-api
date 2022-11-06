import {
  GetObservationsRequest, GetObservationsRequestSort, ObservationRequest,
  ObservationStatus, ReportedObservation, ReportedObservationContinuationArray, UpdateObservationStatusRequest,
} from "@entities/observations";
import { MongoClient, MongoClientOptions, ObjectID, Db } from "mongodb";
import { AssetsService } from "./assets.service";
import { CheckHealth } from "./health";

export interface ObservationsService extends CheckHealth {
  delete(observationId: string): Promise<void>;
  find(request: GetObservationsRequest): Promise<ReportedObservationContinuationArray>;
  get(observationId: string): Promise<ReportedObservation | undefined>;
  /** Reports an observation. */
  report(request: ObservationRequest): Promise<ReportedObservation>;
  updateStatus(observationId: string, request: UpdateObservationStatusRequest): Promise<ReportedObservation>;
}

export interface MongoDbBicyclePathsServiceOptions {
  url: string | undefined;
  db: string | undefined;
  mongoOptions?: MongoClientOptions;
}

export const OBSERVATIONS_COLLECTION = "observations";
const DEFAULT_LIMIT = 200;

export class MongoDbObservationsService implements ObservationsService {

  private readonly lazyClient = new MongoClient(
        this.options.url!,
        this.options.mongoOptions);

  private readonly lazyDb: Db;

  public constructor(
    private readonly options: MongoDbBicyclePathsServiceOptions,
    private readonly assetsService: AssetsService) { this.lazyDb = this.lazyClient.db(this.options.db); }

  public async init() {
    await this.lazyClient.connect();
  }

  public async checkHealth(): Promise<boolean> {
    return true;/*checkHealth(
      "MongoDbObservationsService",
      undefined,
      async () => {
        const db = await this.lazyDb();
        await db.collection(OBSERVATIONS_COLLECTION).createIndex({ timestamp: 1 });
        await db.collection(OBSERVATIONS_COLLECTION).createIndex({ attributes: 1 });
        await db.collection(OBSERVATIONS_COLLECTION).createIndex({ status: 1 });
      });*/
  }

  public async delete(observationId: string): Promise<void> {
    const db = await this.lazyDb;
    const result = await db.collection(OBSERVATIONS_COLLECTION).findOneAndDelete({ id: observationId });
    if (!result.ok) {
      throw {status: 404, message: `Observation ${observationId} not found.`};
    }

    for (const asset of (result.value.assets || [])) {
      if (asset && asset.url) {
        this.assetsService.delete(asset.url);
      }
    }
  }

  public async find(request: GetObservationsRequest): Promise<ReportedObservationContinuationArray> {
    const db = await this.lazyDb;
    const nextToken = JSON.parse(request.nextToken!.toString()) as NextToken;
    let pagination: Pagination;
    if (!nextToken) {
      pagination = { skip: 0, limit: DEFAULT_LIMIT };
    } else {
      pagination = nextToken.pagination;
      request = nextToken.request;
    }

    let query: any = {};

    if (request.attributes && request.attributes.length > 0) {
      query = {
        ...query,
        attributes: { $in: request.attributes },
      };
    }

    if (request.status && request.status.length > 0) {
      query = {
        ...query,
        status: { $in: request.status },
      };
    }

    if (request.endTs) {
      query = {
        ...query,
        timestamp: { $lte: request.endTs },
      };
    }

    if (request.startTs) {
      query = {
        ...query,
        timestamp: { $gte: request.startTs },
      };
    }

    if (request.endTs) {
      query = {
        ...query,
        timestamp: { $lte: request.endTs },
      };
    }

    if (request.startTs && request.endTs) {
      query = {
        ...query,
        timestamp: { $gte: request.startTs, $lte: request.endTs },
      };
    }

    let sortKey: string;
    let sortDirection: number;

    switch (request.sort) {
      case GetObservationsRequestSort.TimestampAsc:
        sortKey = "timestamp";
        sortDirection = -1;
        break;
      case GetObservationsRequestSort.TimestampDesc:
      default:
        sortKey = "timestamp";
        sortDirection = 1;
        break;
    }

    const result = await db.collection(OBSERVATIONS_COLLECTION).find(query)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .sort(sortKey, sortDirection)
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
      items: result.map((x) => this.mapObservation(x)),
      nextToken: nextNextToken,
    };
  }

  public async get(observationId: string): Promise<ReportedObservation | undefined> {
    const db = await this.lazyDb;
    const result = await db.collection(OBSERVATIONS_COLLECTION).findOne({ id: observationId });
    if (!result) {
      return undefined;
    }

    return this.mapObservation(result);
  }

  public async report(request: ObservationRequest): Promise<ReportedObservation> {
    const db = await this.lazyDb;
    const now = Math.trunc(new Date().getTime() / 1000);
    if (request.timestamp > now) {
      throw {status: 400, message: "Timestamp cannot be in the future"};
    }

    const reportedObs: ReportedObservation = {
      attributes: request.attributes,
      comment: request.comment,
      deviceId: request.deviceId,
      id: new ObjectID().toHexString(),
      position: request.position,
      status: ObservationStatus.pending,
      timestamp: request.timestamp,
    };

    if (request.assets && request.assets.length > 0) {
      reportedObs.assets = [];
      for (const asset of request.assets) {
        reportedObs.assets.push(await this.assetsService.upload(asset));
      }
    }

    await db.collection(OBSERVATIONS_COLLECTION).insertOne(reportedObs);
    return this.mapObservation(reportedObs);
  }

  public async updateStatus(observationId: string, request: UpdateObservationStatusRequest)
    : Promise<ReportedObservation> {
    const db = await this.lazyDb;
    await db.collection(OBSERVATIONS_COLLECTION).updateOne(
      { id: observationId },
      { $set: { status: request.status } },
    );

    return (await this.get(observationId))!;
  }

  private mapObservation(from: any): ReportedObservation {
    const { _id, ...result } = from;

    return result;
  }
}

interface Pagination {
  skip: number;
  limit: number;
}

interface NextToken {
  request: GetObservationsRequest;
  pagination: Pagination;
}
