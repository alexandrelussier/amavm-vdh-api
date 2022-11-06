import express from "express"

const app = express()

app.get("/", (req, res) => res.send("Hello"))

app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack)
  res.status(500).send(`Error: ${err.message}`)
})

export default app
