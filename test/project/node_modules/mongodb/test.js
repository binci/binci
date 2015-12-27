var MongoClient = require('./').MongoClient;

MongoClient.connect('mongodb://localhost:27017/test', {
  server: {
    socketOptions: {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000
    }
  }
}, function(err, db) {
  db.close();
});
