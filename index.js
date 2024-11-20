const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const routes = require('./routes/routes');

const app = express();
app.use(express.json())
app.use(bodyParser.json());
app.use(cors());
app.use(routes);

app.listen(3000, ()=> {
    console.log("Server berjalan di port 3000")
})