$(function () {
    var filter;
    // anywhere
    twttr.anywhere(function (T) {
        T("#footer").hovercards();
    });
    // filtering
    var filtering = function (text) {
        if (! filter) {
            return false;
        }
        return filter.test(text);
    };
    (function () {
        var updateFilter = function () {
            var reStr = $('#filters input:checked').map(function (i, e) {
                return $(e).val();
            }).toArray().join('|');
            filter = reStr ? new RegExp(reStr, 'm') : null;
        };
        $('#filters input').change(function () {
            updateFilter();
            $('.tweet').each(function (i, e) {
                var tweet = $(e);
                if (filtering(tweet.find('div').last().text())) {
                    tweet.slideDown();
                } else {
                    tweet.slideUp();
                }
            });
        });
        updateFilter();
    }());
    // socket.io
    var socket = io.connect();
    socket.on('connection', function (count) {
        console.log(count);
    });
    socket.on('tweet', function (data) {
        data.text = data.text.replace(/(http:\/\/t\.co\/\w{7,8})/g, '<a href="$1" target="_blank">$1</a>');
        var tweet = $('<div>').attr({ id: data.id }).addClass('tweet').hide()
            .append($('<div>').addClass('image')
                    .append($('<img>').attr({ src: data.icon })))
            .append($('<div>').addClass('text')
                    .append($('<div>').addClass('info')
                            .append($('<span>').text('@' + data.user))
                            .append($('<span>').addClass('date')
                                    .append($('<a>').attr({
                                        href: 'https://twitter.com/#!/' + data.user + '/status/' + data.id,
                                            target: '_blank'
                                    }).text(new Date(data.date).toLocaleString()))))
                    .append($('<div>')
                            .append($('<span>').html(data.text))));
        $('#tweets').prepend(tweet);
        if (filtering(data.text)) {
            tweet.slideDown();
        }
        while ($('.tweet').length > 100) {
            $('.tweet').last().slideUp().remove();
        }

        // anywhere
        twttr.anywhere(function (T) {
            T("#" + data.id).linkifyUsers();
            $('a.twitter-anywhere-user').attr({ target: '_blank' });
        });
    });
});
