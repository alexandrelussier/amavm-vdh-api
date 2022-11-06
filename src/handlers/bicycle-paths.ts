import { BicyclePathNetwork, BicyclePathsRequest, BicyclePathType } from "@entities/bicycle-paths";
import app from "@app";

export const handler = app.get("/api/v1/bicycle-paths/:bbox/:borough/:limit/:near/:network/:nextToken/:numberOfLanes/:type", async (req, res) => {
  const {bbox, borough, limit, near, network, nextToken, numberOfLanes, type} = req.params;
        const request: BicyclePathsRequest = {
          bbox: bbox
            ? bbox.split(",")
                .map((x) => x.trim())
                .map((x) => parseFloat(x))
            : undefined,
          borough: borough,
          limit: limit ? parseInt(limit, 10) : undefined,
          near: near
            ? near.split(",")
              .map((x) => x.trim())
              .map((x) => parseFloat(x))
            : undefined,
          network: network as BicyclePathNetwork,
          nextToken: nextToken,
          numberOfLanes: numberOfLanes ? parseInt(numberOfLanes, 10) : undefined,
          type: type as BicyclePathType,
        };
        return app.locals.container.bicyclePathsService().find(request);
      });
