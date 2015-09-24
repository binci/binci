import Promise from 'bluebird';
import { EventEmitter } from 'events';
import { MongoClient } from 'mongodb';

const event = new EventEmitter();

/**
 * @class mongo
 */
export default class {

  /**
   * Handles setup of connection
   * @param {Object|String} config The db config obejct or connection string
   * @property {String} config.host
   * @property {Number} config.port
   * @property {String} config.database
   * @property {String} config.username
   * @property {String} config.password
   */
  constructor (config) {
    let connStr;
    this.db = false;
    if (typeof config === 'string') {
      // If full conn string is passed
      connStr = config;
    } else {
      // Build from object
      connStr = `mongodb://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
    }
    // Create connection
    MongoClient.connect(connStr, (err, db) => {
      /* istanbul ignore if */
      if (err) {
        throw new Error(err);
      } else {
        // Set instance db
        this.db = db;
        // Emit when conn established
        event.emit('dbInit');
        return db;
      }
    });
  }

  /**
   * Ensures connection established or waits for emit
   * @returns {Object} promise
   */
  checkConn () {
    return new Promise((resolve) => {
      /* istanbul ignore if */
      if (!this.db) {
        event.on('dbInit', () => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Executes mongo commands after ensuring established connection
   * @param {String} command The command to execute
   * @param {*} ...params Spread of args to command
   * @returns {Object} promise
   */
  execute (command, ...params) {
    return new Promise((resolve, reject) => {
      // Ensure (or wait for) connection
      this.checkConn()
        .then(() => {
          // Execute
          try {
            const coll = this.db.collection(this.collection);
            if (command === 'find') {
              // Find needs `toArray`
              resolve(coll.find(params[0]).toArray());
            } else {
              // All other commands
              resolve(coll[command](...params));
            }
          } catch (e) {
            reject(e);
          }
        });
    });
  }
  
    createCollection (options) {
    return new Promise((resolve) => {
      // Ensure (or wait for) connection
      this.checkConn()
        .then(() => {
          resolve(this.db.createCollection(this.collection, options));
        });
    });
  }
  
}