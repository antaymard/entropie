import express from "express";
import bodyParser from "body-parser";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
// import config from './utils/config.js';
import { styleText } from 'node:util';


const app = express();
const server = http.createServer(app);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

initWebSocket(server).then(() =>
    console.log(styleText("green", "✅ Websocket server initialisé."))
);

app.use(express.static(path.join(__dirname, "..", "app", "dist")));

app.get("*splat", (req, res, next) => {
    console.log(req.query)
    return res.sendFile(path.join(__dirname, "..", "app", "dist", "index.html"));
});

let port = process.env.PORT || 8888;
server.listen(port, () => {
    console.log(styleText("green", `✅ API listening on port ${port}`));
});
