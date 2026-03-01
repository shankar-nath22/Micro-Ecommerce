const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { startKafka } = require('./kafka');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 8087;

app.get('/health', (req, res) => {
    res.send({ status: 'OK', socketClients: io.engine.clientsCount });
});

io.on('connection', (socket) => {
    console.log('🔌 New client connected to Notification WebSocket');
    socket.on('disconnect', () => {
        console.log('🔌 Client disconnected');
    });
});

// Start Kafka after WebSocket is ready
startKafka(io);

server.listen(PORT, () => {
    console.log(`🚀 Notification Service with WebSockets started on port ${PORT}`);
});
