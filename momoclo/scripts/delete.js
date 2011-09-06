#!/usr/bin/env node

var config = require('../config/production');
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
                collection.remove({ date: { $lt: new Date(new Date() - 24 * 60 * 60 * 1000) } }, function (err) {
                    if (err) { throw err; }
                    console.log('ok');
                    db.close();
                });
            });
        }
    );
});
