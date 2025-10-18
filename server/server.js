import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
// import config from './utils/config.js';
import { styleText } from 'node:util';
import { initWebSocket } from "./websocket/initWebSocket.js";

import errorHandler from "./middlewares/errorHandler.js";


const app = express();
const server = http.createServer(app);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

initWebSocket(server).then(() =>
    console.log(styleText("green", "✅ Websocket server initialisé."))
);

// SERVE STATIC WEB APP
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "..", "app", "dist")));

// Endpoints here

// use error handling middleware in last position
app.use(errorHandler);

app.get("*splat", (req, res, next) => {
    console.log(req.query)
    return res.sendFile(path.join(__dirname, "..", "app", "dist", "index.html"));
});

let port = process.env.PORT || 8888;
server.listen(port, () => {
    console.log(styleText("green", `✅ API listening on port ${port}`));
});
