import { Container } from "@container";
import app from "@app";

interface HealthCheckResult {
  assetsHealth: boolean;
  bicycleHealth: boolean;
  observationHealth: boolean;
}

class HealthCheckResult implements HealthCheckResult {
  public assetsHealth = false;
  public bicycleHealth = false;
  public observationHealth = false;
}

export const handler = app.get('/api/health/', async (req, res) => {
  const container = app.locals.container as Container;
  let health = new HealthCheckResult();
  health.assetsHealth = await container.assetsService().checkHealth();
  health.bicycleHealth = await container.bicyclePathsService().checkHealth();
  health.observationHealth = await container.observationsService().checkHealth();

  if (health.assetsHealth !== true || health.bicycleHealth !== true || health.observationHealth !== true) {
    res.status(500).send(health);
  }
  else{
    res.send(health);
  }
});
