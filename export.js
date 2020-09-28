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
const tables = [/*'yummy-place',*/ 'yummy-dish', 'yummy-region'];
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
    if (table === 'yummy-dish') {
      var scope='ALL_AUTH';
      try{
        fs.unlinkSync(sqlfile);
      }catch(err){
        console.log("cannot unlink existing sqlfile",sqlfile);
      }
      items.forEach( ele => {
            var sqlstr = "INSERT INTO DISH (id,name,summary,notes,area_code,primary_url,image_url,times_served,rating,created_at,updated_at,created_by,updated_by,tags,auth_scope) VALUES("
                + wrapArg(ele.id)
                + wrapArg(ele.name)
                + wrapArg(ele.authenticName)
                + wrapArg(ele.notes)
                + wrapArg(ele.origin)
                + wrapArg(ele.primaryUrl)
                + wrapArg(ele.imageUrl)
                + wrapArg(ele.timesServed)
                + wrapArg(ele.rating)
                + wrapArg(ele.createdAt)
                + wrapArg(ele.updatedAt)
                + wrapArg(ele.createdBy)
                + wrapArg(ele.updatedBy)
                + getTags(ele.tags)
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
    if (table === 'yummy-place') {
      var scope='ALL_AUTH';
      try{
        fs.unlinkSync(sqlfile);
      }catch(err){
        console.log("cannot unlink existing sqlfile",sqlfile);
      }
      items.forEach( ele => {
        var sqlstr = "INSERT INTO PLACE (id,summary,name,area_code,location_type,image_url,primary_url,notes,created_at,updated_at,created_by,updated_by,coordinates,auth_scope) VALUES("
                + wrapArg(ele.id) // todo convert to 5b046bd2-1e20-7e3d-d2a8-ca04ca04ca04
                + wrapArg(ele.summary)
                + wrapArg(ele.name)
                + wrapArg(ele.country)
                + wrapArg(ele.lotype)
                + wrapArg(ele.imageUrl)
                + wrapArg(ele.primaryUrl)
                + wrapArg(ele.notes)
                + wrapArg(ele.createdAt)
                + wrapArg(ele.updatedAt)
                + wrapArg(ele.createdBy)
                + wrapArg(ele.updatedBy)
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
  // console.log(arg + (typeof arg));
  if (arg && ((typeof arg)==="string") && arg.startsWith("5") && arg.length == 24) {
    return "'" + arg.substr(0,8) + "-"  + arg.substr(8,4) + "-" +
        arg.substr(12,4) + "-" + arg.substr(16,4) + arg.substr(20,4)+arg.substr(20,4)+arg.substr(20,4)+"',";
  } else if (arg && ((typeof arg)==="string") && arg.includes('Mitteleu')) {
    return "current_timestamp,";
  } else if (arg && ((typeof arg)==="string") && arg.includes('222Z')) {
    return "current_timestamp,";
  } else if (arg && ((typeof arg)==="string") && arg === 'ly') {
    return "'la',";
  } else if (arg && ((typeof arg)==="string") && arg === 'eu') {
    return "'europe',";
  } else if (arg && ((typeof arg)==="string")) {
    arg = arg.replace(/'/g, "''");
    return "'" + arg + "',";
  } else if (arg && ((typeof arg)==="number")){
    return arg+",";
  } else if (arg === undefined) {
    return null + ",";
  } else {
    return "'" + arg + "',";
  }
}

function getCoordinates(coordinates) {
  if (coordinates[0] && coordinates[1]) {
    return "'{" +coordinates[0] + "," + coordinates[1]+ "}',";
  }
  return "'{}',";
}

function getTags(tags) {
  if (tags && Array.isArray(tags) && tags.length > 0) {
    var str = tags.join('","');
    return "'{\"" +str +"\"}',";
  }
  return "'{}',";
}
