#!/usr/bin/env node
var twitter = new (require('twit'))({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

var query = {
    q: '#momoclo',
    result_type: 'recent',
    count: 100,
    include_entities: 1
};
(function loop (since_id) {
    if (since_id) {
        query.since_id = since_id;
    }
    console.log('search with query: %s', JSON.stringify(query));
    twitter.get('search/tweets', query, function (err, data) {
        if (err) {
            console.error(err.message);
            return;
        }
        if (data) {
            data.statuses.reverse().forEach(function (e) {
                console.log(e.user.screen_name, e.text);
            });
        }
        setTimeout(function () {
            loop(data.search_metadata.max_id_str);
        }, 3000);
    });
}());
