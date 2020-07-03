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
    var sqlfile = dumpdir + '/' + table + '.sql'
    console.log('Dumping table', table, "to", filename);
    if (table === 'yummy-place') {
      var scope='ALL_AUTH';
      try{
        fs.unlinkSync(sqlfile);
      }catch(err){
        console.log("cannot unlink existing sqlfile",sqlfile);
      }
      items.forEach( ele => {
        var sqlstr = "INSERT INTO PLACE (id,summary,name,country,lotype,image_url,primary_url,coordinates,scope) VALUES("
                + wrapArg(ele.id)
                + wrapArg(ele.summary)
                + wrapArg(ele.name)
                + wrapArg(ele.country)
                + wrapArg(ele.lotype)
                + wrapArg(ele.imageUrl)
                + wrapArg(ele.primaryUrl)
                + getCoordinates(ele.coordinates)
                +"'"+ scope+"') ON CONFLICT (id) DO NOTHING;";
          console.log(sqlstr);
            fs.appendFileSync(sqlfile, sqlstr + "\n", function (err) {
              if (err) return console.log(err);
              // console.log(items ); // only for debug
            });
          }
        // console.log("INSERT INTO PLACE (name,country,summary,coordinates,image_url,lotype,scope) VALUES ('some place','de','summary','{4.8234,56.36816}','https://image.url','EXCURS','PUBLIC')");
      );
    }
    if (table === 'yummy-region') {

    }
    fs.writeFile(filename, JSON.stringify(items), function (err) {
      if (err) return console.log(err);
      // console.log(items ); // only for debug
    });
  });
});

function wrapArg( arg) {
  if (arg) {
    arg = arg.replace(/'/g, "''");
  }
  return "'" + arg + "',";
}

function getCoordinates(coordinates) {
  if (coordinates[0] && coordinates[1]) {
    return "'{" +coordinates[0] + "," + coordinates[1]+ "}',";
  }
  return "'{NULL,NULL}',";
}
