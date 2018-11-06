var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var AWS = require("aws-sdk");

var app = express();

app.listen(3000, () => console.log('API listening on port 3000!'))

AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

var docClient = new AWS.DynamoDB.DocumentClient();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.set('view engine', 'jade');


const routes = require('./routes/routes');

app.get('/', function (req, res) {
  res.send({ title: "NAMafiA Entry Point" })
})

app.get('/getGames', function (req, res) {

var params = {
    TableName: "namafia",
};

console.log("Getting All Games");
docClient.scan(params, onScan);

function onScan(err, data) {
    if (err) {
        console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        // print all the movies
        console.log("Scan succeeded.");
        data.Items.forEach(function(item) {
           console.log(item);
             res.send(data.Items)

        });

        if (typeof data.LastEvaluatedKey != "undefined") {
            console.log("Scanning for more...");
            params.ExclusiveStartKey = data.LastEvaluatedKey;
            docClient.scan(params, onScan);
        }
    }
}

});

app.get('/getGame/:id', function (req, res) {

var id = parseInt(req.url.slice(9));
  console.log(req.url)
  console.log(id)

var params = {
      TableName : "namafia",
      KeyConditionExpression: "#game_id = :game_id",
      ExpressionAttributeNames:{
          "#game_id": "game_id"
      },
      ExpressionAttributeValues: {
          ":game_id": String(id)
      }
  };

docClient.query(params, function(err, data) {
    if (err) {
        console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
    } else {
        console.log("Query succeeded.");
        res.send(data.Items)
        data.Items.forEach(function(game) {
            console.log(game);
        });
    }
});

});
