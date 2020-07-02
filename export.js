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
    if (table === 'yummy-place') {
      var scope='ALL_AUTH';
      items.forEach( ele => {
            console.log("INSERT INTO PLACE (name,country,lotype,image_url,coordinates,scope) VALUES('"+ele.name+"','"+ele.country +"','"
                + ele.lotype+ "','"
                + ele.imageUrl + "',"
                + "'{" +ele.coordinates[0] + "," + ele.coordinates[1]+ "}','"
                +scope+"');");
          }
        // console.log("INSERT INTO PLACE (name,country,summary,coordinates,image_url,lotype,scope) VALUES ('some place','de','summary','{4.8234,56.36816}','https://image.url','EXCURS','PUBLIC')");
      );
    }
    fs.writeFile(filename, JSON.stringify(items), function (err) {
      if (err) return console.log(err);
      // console.log(items ); // only for debug
    });
  });
});

