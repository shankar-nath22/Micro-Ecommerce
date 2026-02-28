const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('./kafka'); // Start Kafka consumer

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 8087;

app.get('/health', (req, res) => {
    res.send({ status: 'OK' });
});

app.listen(PORT, () => {
    console.log(`🚀 Notification Service started on port ${PORT}`);
});
