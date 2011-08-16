#!/usr/bin/env node

var config = require('../config/default');
var mongodb = require('mongodb');
var db = new mongodb.Db(config.mongodb.dbname, new mongodb.Server(
    config.mongodb.server.host,
    config.mongodb.server.port,
    config.mongodb.server.opts
));
db.open(function (err, db) {
    if (err) { throw err; }
    db.authenticate(
        config.mongodb.auth.username,
        config.mongodb.auth.password,
        function (err, result) {
            if (err) { throw err; }
            db.collection('tweet', function (err, collection) {
                if (err) { throw err; }
                collection.ensureIndex({ id: 1 }, { unique: true }, function (err, result) {
                    if (err) { throw err; }
                    console.log(result);
                });
                collection.ensureIndex({ date: 1 }, function (err, result) {
                    if (err) { throw err; }
                    console.log(result);
                });
            });
        }
    );
});
