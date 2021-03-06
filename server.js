var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var AWS = require("aws-sdk");
var cors = require('cors')
var app = express();

app.listen(9999, () => console.log('API listening on port 9999!'))

AWS.config.update({
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com"
});

var docClient = new AWS.DynamoDB.DocumentClient();
app.use(cors())
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.set('view engine', 'jade');

app.get('/', function (req, res) {
  res.send({ title: "NAMafiA Entry Point" })
})

app.get('/getGames', function (req, res) {

var params = {
    TableName: "mafia-game",
};

docClient.scan(params, onScan);

function onScan(err, data) {
    if (err) {
        console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        // print all the movies
        console.log("Scan succeeded.");
        data.Items.forEach(function(item) {
           console.log(item);
        });
         res.send(data.Items)
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
      TableName: "mafia-game",
      KeyConditionExpression: "#game_id = :game_id",
      ExpressionAttributeNames:{
          "#game_id": "game_id"
      },
      ExpressionAttributeValues: {
          ":game_id": id
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
app.get('/getDays' , function(req,res){

  var params = {
      TableName: "mafia-day",
  };
  docClient.scan(params, onScan);
  function onScan(err, data) {
      if (err) {
          console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
      } else {
          // print all the movies
          console.log("Scan succeeded.");
          data.Items.forEach(function(item) {
             console.log(item);
          });
           res.send(data.Items)
          if (typeof data.LastEvaluatedKey != "undefined") {
              console.log("Scanning for more...");
              params.ExclusiveStartKey = data.LastEvaluatedKey;
              docClient.scan(params, onScan);
          }
      }
  }

  });

app.get('/getDays/:game_id' , function(req,res){

  var id = req.url.slice(9);

    var getParent = {}
    getParent.TableName = "mafia-day"
    getParent.IndexName = "parent_id-index"
    getParent.KeyConditionExpression = "parent_id = :parent_id"
    getParent.ExpressionAttributeValues = {
      ":parent_id": id
    }

    docClient.query(getParent, function(err, data) {
        if (err) {
            console.error("Unable to query. Error:", JSON.stringify(err, null, 2));
        } else {
            console.log("Query succeeded.");

            data.Items.forEach(function(game) {
              var vote_map = [];
              Object.values(game.votes).forEach(function(vote_item){
                 vote_map.push(vote_item);

              });
              game.votes = vote_map;
            });
            res.send(data.Items);
        }
    });

});

app.get('/getDay/:day_id' , function(req,res){

  var id = parseInt(req.url.slice(8));
    console.log(req.url)
    console.log(id)

    var params = {
          TableName: "mafia-day",
          KeyConditionExpression: "#day_id = :day_id",
          ExpressionAttributeNames:{
              "#day_id": "day_id"
          },
          ExpressionAttributeValues: {
              ":day_id": id
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
