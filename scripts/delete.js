#!/usr/bin/env node
var url     = require('url');
var mongodb = require('mongodb');

var parsed = url.parse(process.env.MONGOHQ_URL);
var db = new mongodb.Db(parsed.pathname.substr(1), new mongodb.Server(
    parsed.hostname,
    Number(parsed.port)
));
db.open(function (err, db) {
    if (err) { throw err; }
    var auths = parsed.auth.split(/:/);
    db.authenticate(
        auths[0],
        auths[1],
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
