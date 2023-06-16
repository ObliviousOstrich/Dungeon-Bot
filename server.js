
import express from "express";

const server = express()

server.all("/", (req, res) => {
  res.send("Bot is running!")
})

export function keepAlive() {
  server.listen(3000, () => {
    console.log("Server is ready.")
  })
}