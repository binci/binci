"use strict"

const mongodb = require('./');
const connString = "mongodb://localhost:31000,localhost:31001,localhost:31002/test?readPreference=secondary";
// mongodb.Logger.setLevel('info')

function getStream(db) {
  return db.collection('t').find({}).batchSize(2).stream();
}

mongodb.MongoClient.connect(connString, { replSet: { replicaSet: "rs", socketOptions: {
  // socketTimeoutMS: 5000
} } })
  .then((db) => {

    // setTimeout(function() {
    //   console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ CLOSE")
    //   db.close();
    // }, 10000)

    db.serverConfig.on('left', function(t, s, s1) {
      console.log("--------------------- left " + t + " = " + s.name)
    })

    db.serverConfig.on('joined', function(t, s, s1) {
      console.log("--------------------- joined " + t + " = " + s1.name)
    })

    const stream = getStream(db);
    stream.on('data', (doc) => {
      // console.log(Date.now());
    });

    stream.on('error', (chunk) => {
      console.error('Got an error from cursor');
    });

    stream.on('end', () => {
      console.log('Got everything')
      db.close();
    });
  })
  .then(null, console.error);