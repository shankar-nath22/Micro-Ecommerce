const express = require('express');
const app = express();
app.use(express.json());
app.get('/', (req,res) => res.send('cart-service up'));
app.listen(8083, () => console.log('Cart service listening on 8083'));
