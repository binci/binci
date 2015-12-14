'use strict';

var mongo = require('./');
var MongoClient = mongo.MongoClient;
var ReplicaSet = mongo.ReplSet;
var Server = mongo.Server;
var Db = mongo.Db;

function getRandom(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

// var delay = getRandom(1, 10) * 100;
// var total = getRandom(10, 100);
// var haInterval = getRandom(1, 3) * 10000;
// var haInterval = 5000;
var delay =500;
var total = 100;
var haInterval = 10000;

console.log('delay:', delay);
console.log('total:', total);
console.log('haInterval:', haInterval);

var servers = [];
var server = new Server('localhost', 31000);
servers.push(server);

var replicaSet = new ReplicaSet(servers, {haInterval: haInterval});
//var replicaSet = new ReplicaSet(servers, {ha: false});
var database = new Db('replica_set_test', replicaSet, {w: 1});

var collectionName = 'test';

database.open(function(err, db) {
  if (err) {
    console.log(err.stack);
  } else {
    console.log('Open db - success!');
    var collection = db.collection(collectionName);
    var startTime = new Date().getTime();
    var count = 0;
    var interval = setInterval(function() {
      ++count;
      console.log('\n#', count, '; time =', new Date().getTime() - startTime);
      someOperations(db, collection, function() {
        if (count >= total) {
          clearInterval(interval);
          done(db);
        }
      });
    }, delay)
  }
});

function someOperations(db, collection, callback) {
  collection.insert({a:1, b:2}, function(err, result) {
    //console.log('******** insert result', err, result);
    collection.findOne({}, function(err, result) {
      //console.log('******** findOne result', err, result);
      db.dropDatabase(function (err) {
        //console.log('******** dropDatabase', err);
        callback();
      });
    });
  });
}

function done(db) {
  db.close(function() {
    console.log('db is closed!');
    process.exit();
  });
}

// var MongoClient = require('./').MongoClient,
//   Timestamp = require('./').Timestamp;

// MongoClient.connect('mongodb://localhost:31000/test?replicaSet=rs', function(err, db) {
//   var db1 = db.db('local');

//   db1.collection("oplog.rs")
//     .find({ts:{$gte:Timestamp(0, (Date.now()/1000)|0)}},{ts:1})
//     .addCursorFlag("oplogReplay", true).explain(function(err, r) {
//       console.log("-------------------------------------------------")
//       console.dir(err)
//       console.dir(r)
//       db.close();
//       process.exit(0)
//     });
//   // console.dir(db.serverConfig)

//   // setInterval(function() {
//   //   var s = db.serverConfig.s.replset.s.replState.arbiters[0];
//   //   console.log("--------------------------- ARBITERS :: " + s.connections().length)
//   // }, 1000);
// });


// MongoClient.connect('mongodb://localhost/test?readPreference=secondaryPreferred&maxPoolSize=1', function(err, db) {

//   var documents = [];
//   for(var i = 0; i < 100000; i++) {
//     documents.push({a:i});
//   }

//   db.collection('history').insertMany(documents, function(err, r) {
//     db.collection('history')
//       .find({})
//       .project({req_date:1})
//       .sort({req_date:1})
//       .limit(1).next(function(err, doc) {
//         console.log("----------------------------------------------")
//         console.dir(err)
//         console.dir(doc)
//         db.close();      
//     });
//   });

//   // db.authenticate('dog', 'whistle', function(err, r) {
//   //   console.log("---------------------------------------------------")
//   //   console.dir(err)
//   //   console.dir(r)

//     // db.collection('t').findOne({a:1}, function(err, r) {
//     //   if (err) throw err;
//       // var options = { sort: [['_id', 'descending']] };
//       // db.collection('documents').findOne({}, options, function(err, doc){
//       //   if (err) throw err;
//       //   console.log(doc)

//       //   db.close();
//       // })
//     // });


//     // db.collection('t').insert({a:1}, function(err, r) {
//     //   console.log("---------------------------------------------------")
//     //   console.dir(err)
//     //   console.dir(r)

//     //   db.close();
//     // });
//   // });
// });

// var mongo = require('./').MongoClient,
//   ReadPreference = require('./').ReadPreference;

// var connectionParams = [
//   'replicaSet=rs',
//   // 'readPreference=secondaryPreferred',
//   // 'readPreferenceTags=loc:sf'
// ];
// var options = {
//   db: {
//     readPreference: 'secondaryPreferred', 
//     readPreferenceTags: {loc:'sf'}
//   }
// };

// //new ReadPreference('secondaryPreferred', {loc:'sf'})
 
// var connectionString = 'mongodb://localhost:31000,localhost:31001,localhost:31002/test?' + connectionParams.join('&');
 
// var listener = require('./').instrument(function(err, instrumentations) {
//   callbackTriggered = true;
// });

// mongo.connect(connectionString, options, function (err, db) {
//   console.log("----------------------------------- err")
//   console.dir(db)
//   var started = [];
//   var succeeded = [];
//   var failed = [];

//   listener.on('started', function(event) {
//     // if(event.commandName == 'insert')
//       started.push(event);
//   });

//   listener.on('succeeded', function(event) {
//     // if(event.commandName == 'insert')
//       succeeded.push(event);
//   });

//   setTimeout(function() {
//     // db.collection('test').find({}).toArray(function(err, r) {
//     db.command({count:'t'}, function(err, r) {
//       console.log("----------------------------------------------")
//       console.dir(r)
//       console.dir(started[started.length - 1].connectionId.port)

//       db.close();
//       process.exit(0);
//     });    
//   }, 1000)
// });

// MongoClient.connect('mongodb://localhost:31000/test?rs_name=rs', function (err, db) {
//   var collection = db.collection('test');

//   setInterval(function() {
//     console.dir(db.serverConfig.s.replset.s.replState.arbiters[0].connections().length)
//   }, 1000);

//   // db.close();
//   // collection.insertMany([{a:1}, {a:2}], {w:1}, function (err, docs) {
//   //   if (err) {
//   //     console.log("ERROR");
//   //   }

//   //   collection.find().sort({'a': -1}).toArray(function(err, items) {
//   //     if (err) {
//   //       console.log("ERROR");
//   //     }
//   //     console.log("Items: ", items);
//   //   });
//   // });
// });

// var MongoClient = require('./').MongoClient;

// MongoClient.connect('mongodb://localhost:27017/page-testing', function (err, db) {
//   collection = db.collection('test');

//   collection.insertMany([{a:1}, {a:2}], {w:1}, function (err, docs) {
//     if (err) {
//       console.log("ERROR");
//     }

//     collection.find().sort({'a': -1}).toArray(function(err, items) {
//       if (err) {
//         console.log("ERROR");
//       }
//       console.log("Items: ", items);
//     });
//   });
// });
// var database = null;
//
// var MongoClient = require('./').MongoClient;
//
// function connect_to_mongo(callback) {
//   if (database != null) {
//     callback(null, database);
//   } else {
//     var connection = "mongodb://127.0.0.1:27017/test_db";
//     MongoClient.connect(connection, {
//       server : {
//         reconnectTries : 5,
//         reconnectInterval: 1000,
//         autoReconnect : true
//       }
//     }, function (err, db) {
//       database = db;
//       callback(err, db);
//     });
//   }
// }
//
// function log(message) {
//   console.log(new Date(), message);
// }
//
// var queryNumber = 0;
//
// function make_query(db) {
//   var currentNumber = queryNumber;
//   ++queryNumber;
//   log("query " + currentNumber + ": started");
//
//   setTimeout(function() {
//       make_query(db);
//   }, 5000);
//
//   var collection = db.collection('test_collection');
//   collection.findOne({},
//     function (err, result) {
//       if (err != null) {
//         log("query " + currentNumber + ": find one error: " + err.message);
//         return;
//       }
//       log("query " + currentNumber + ": find one result: " + result);
//     }
//   );
// }
//
// connect_to_mongo(
//   function(err, db) {
//     if (err != null) {
//       log(err.message);
//       return;
//     }
//
//     make_query(db);
//   }
// );
