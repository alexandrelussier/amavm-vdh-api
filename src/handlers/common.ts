import { Container, createContainer } from "@container";
import app from "@app";

/**
 * The serverless service name.
 * Must be the same as the service name in the serverless.yml file.
 */
export const SERVICE_NAME = "amavm-vdh-api";

app.locals.container = createContainer;