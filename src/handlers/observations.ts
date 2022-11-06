import app from "@app";

import {
  GetObservationsRequest, GetObservationsRequestSort, ObservationRequest,
  ObservationStatus, UpdateObservationStatusRequest,
} from "@entities/observations";

app.get("/api/v1/observations/:endTs/:sort/:startTs/:attributes/:status/:nextToken", async(req, res) => {
  const {endTs, sort, startTs, attributes, status, nextToken} = req.params;

  const request: GetObservationsRequest = {
    attributes: attributes ? attributes.split(",") : undefined,
    endTs: endTs ? parseInt(endTs, 10) : undefined,
    nextToken: nextToken,
    sort: sort
      ? sort as GetObservationsRequestSort
      : GetObservationsRequestSort.TimestampDesc,
    startTs: startTs ? parseInt(startTs, 10) : undefined,
    status: status ? status.split(",") as ObservationStatus[] : undefined,
  };

  return app.locals.container.observationsService().find(request);
});

app.post("/api/v1/observations", async(req, res) => {
  const request = req.body as ObservationRequest;

  const observation = await app.locals.container.observationsService().report(request);
  res.statusCode = 201;
  res.setHeader("Location", `/api/v1/observations/${observation.id}`);
  return res.send(observation);
});

app.get("/api/v1/observations/:observationId", async(req, res) => {
  const {observationId} = req.params;
  return app.locals.container.observationsService().get(observationId);
});

app.delete("/api/v1/observations/:observationId", async(req, res) => {
  const {observationId} = req.params;
  await app.locals.container.observationsService().delete(observationId);
  res.statusCode = 204;
  return res;
});

app.put("/api/v1/observations/:observationId/status", async(req, res) => {
  const {observationId} = req.params;
  const request = req.body as UpdateObservationStatusRequest;

  return app.locals.container.observationsService().updateStatus(observationId, request);
});

