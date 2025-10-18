import jwt from "jsonwebtoken";
import { Server } from 'socket.io';

let io;

async function initWebSocket(server) {
    io = new Server(server, {
        path: "/ws",
        cors: {
            origin: [
                "http://localhost:3000",
                // If testing with ngrok
                /\.ngrok-free\.app$/
            ],
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        socket.on(
            "test",
            async () => {
                try {
                    // TODO
                } catch (error) {
                    // TODO
                }
            }
        );
    });

    return io;
}

function getIo() {
    if (!io) {
        throw new Error(
            "Socket.io n'a pas été initialisé. Assurez-vous d'avoir appelé initialize() auparavant."
        );
    }
    return io;
}

module.exports = { initWebSocket, getIo };
