require('dotenv').config();
var express = require('express');
var http = require('http');
var path = require('path');
var cors = require('cors');
var indexRouter = require('./routes/index');
var port = process.env.PORT;

var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use('/', indexRouter);

var server = http.createServer(app);
server.listen(port, () => {
    console.log(`file server running on port ${port}`)
});