var http = require('http');
var qs = require('querystring');
var mongodb = require('mongodb');
var express = require('express');
var app = express.createServer();
var config = require('./config/default');

app.configure(function () {
    app.set('view engine', 'jade');
    app.use(express['static'](__dirname + '/public'));
});
app.configure('production', function () {
    var production = require('./config/production');
    Object.keys(production).forEach(function (key) {
        config[key] = production[key];
    });
});
app.get('/', function (req, res) {
    res.render('index');
});
app.listen(8080);

var db = new mongodb.Db(config.mongodb.dbname, new mongodb.Server(
    config.mongodb.server.host,
    config.mongodb.server.port,
    config.mongodb.server.opts
));
var collection = function (name, callback) {
    db.open(function (err, db) {
        if (err) { throw err; }
        db.authenticate(
            config.mongodb.auth.username,
            config.mongodb.auth.password,
            function (err, result) {
                if (err) { throw err; }
                db.collection(name, callback);
            }
        );
    });
};
collection('tweet', function (err, collection) {
    if (err) { throw err; }
    var max_id_str;
    var search = function (params, callback) {
        http.get({
            host: 'search.twitter.com',
            path: '/search.json?' + qs.stringify(params)
        }, function (res) {
            var data = '';
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', function () {
                callback(data);
            });
        });
    };
    setInterval(function () {
        var params = {
            result_type: 'recent',
            rpp: 100,
            q: '#momoclo OR ももクロ OR ももいろクローバー OR 夏菜子 OR 玉井詩織 OR しおりん OR 佐々木彩夏 OR あーりん OR 杏果 OR 高城れに OR れにちゃん'
        };
        if (max_id_str) {
            params.since_id = max_id_str;
        }
        search(params, function (json) {
            var i, obj, base_date, tweet, timeout;
            try {
                obj = JSON.parse(json);
            } catch (e) {
                console.error(e);
                return;
            }
            var push = function (tweet) {
                var data = {
                    id: tweet.id_str,
                    date: new Date(tweet.created_at),
                    user: tweet.from_user,
                    user_id: tweet.from_user_id_str,
                    text: tweet.text,
                    icon: tweet.profile_image_url
                };
                collection.findOne({ id: data.id }, function (err, result) {
                    if (err) { throw err; }
                    if (result) { return; }
                    collection.insert(data, function (err, results) {
                        if (err) { throw err; }
                        delete results[0]._id;
                        results[0].date = Date.parse(results[0].date);
                        io.sockets.emit('tweet', results[0]);
                    });
                });
            };
            tweet = obj.results.pop();
            if (tweet) {
                // delay
                base_date = max_id_str ? Date.parse(tweet.created_at) : new Date().getTime();
                push(tweet);
                for (i = obj.results.length; i--;) {
                    tweet = obj.results[i];
                    timeout = Date.parse(tweet.created_at) - base_date;
                    setTimeout(push, timeout, tweet);
                }
            }
            max_id_str = obj.max_id_str;
        });
    }, 5000);

    var io = require('socket.io').listen(app);
    io.set('transports', ['xhr-polling']);
    io.sockets.on('connection', function (socket) {
        collection.find().sort({ date: -1 }).limit(100).toArray(function (err, results, i) {
            for (i = results.length; i--;) {
                delete results[i]._id;
                results[i].date = Date.parse(results[i].date);
                socket.emit('tweet', results[i]);
            }
        });
        io.sockets.emit('connection', io.of().clients().length);
        socket.on('disconnect', function () {
            process.nextTick(function () {
                io.sockets.emit('connection', io.of().clients().length);
            });
        });
    });
    
    setInterval(function () {
        var status = null;
        http.get({
            host: 'api.ustream.tv',
            path: '/json/channel/momoclotv/getInfo?key=' + config.ustream.auth.key
        }, function (res) {
            var data = '';
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', function () {
             var response = JSON.parse(data);
                if (response.results.status != 'offline' && status != response.results.status) {
                    io.sockets.emit('ustream', response.results);
                    status = response.results.status;
                }
            });
        });
    }, 30000);

    var items = require('./momoclo/config/rss');
    rss.setup(items, function(info) {
        io.sockets.emit('ustream', info);
    });    
});

// for nginx + socket.io >=0.7
// https://github.com/learnboost/socket.io/issues/301
// http://d.hatena.ne.jp/sugyan/20110803/1312368491
(function () {
    var path = require('path');
    var HTTPPolling = require(path.join(path.dirname(require.resolve('socket.io')), 'lib', 'transports', 'http-polling'));
    var XHRPolling  = require(path.join(path.dirname(require.resolve('socket.io')), 'lib', 'transports', 'xhr-polling'));
    XHRPolling.prototype.doWrite = function (data) {
        HTTPPolling.prototype.doWrite.call(this);
        
        var origin = this.req.headers.origin,
        headers = {
            'Content-Type': 'text/plain; charset=UTF-8',
            'Content-Length': data === undefined ? 0 : Buffer.byteLength(data)
        };
        
        if (origin) {
            // https://developer.mozilla.org/En/HTTP_Access_Control
            headers['Access-Control-Allow-Origin'] = '*';
            if (this.req.headers.cookie) {
                headers['Access-Control-Allow-Credentials'] = 'true';
            }
        }
        
        this.response.writeHead(200, headers);
        this.response.write(data);
        this.log.debug(this.name + ' writing', data);
    };
}());
