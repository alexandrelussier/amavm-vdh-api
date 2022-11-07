import app from "./app"
import {handler as healthHandler} from "./handlers/health"
import { AddressInfo } from "net"

app.use('/', healthHandler);

const server = app.listen(3001, "0.0.0.0", () => {
  const { port, address } = server.address() as AddressInfo
  console.log(`Server listening on: http://${address}:${port}`)
})
