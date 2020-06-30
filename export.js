#!/usr/bin/env node
// https://github.com/CascadeEnergy/dynamoDb-marshaler
var AWS = require('aws-sdk');
var unmarshalItem = require('dynamodb-marshaler').unmarshalItem;
var fs = require('fs');

if(! process.env.AWS_PROFILE) { 
  console.log('AWS_PROFILE not set, ciao'); 
  process.exit(1);
}

AWS.config.region = 'eu-central-1';
var dynamoDb = new AWS.DynamoDB();
const tables = ['yummy-place', 'yummy-dish', 'yummy-region'];
const dumpdir = "dump";
if (!fs.existsSync(dumpdir)){
  fs.mkdirSync(dumpdir);
}
tables.forEach(table => {
  var data = dynamoDb.scan({
    TableName: table
  }, function (err, data) {
    // data.Items = [{username: {S: 'nackjicholson'}]
    var items = data.Items.map(unmarshalItem);
    // console.log(items);
    var filename = dumpdir + '/' + table + '.json'
    console.log('Dumping table', table, "to", filename);
    fs.writeFile(filename, JSON.stringify(items), function (err) {
      if (err) return console.log(err);
      // console.log(items ); // only for debug
    });
  });
});

