$(function () {
    // socket.io
    var socket = io.connect();
    socket.on('connection', function (count) {
        $('#connections').text(count + ' connections');
    });
    socket.on('tweet', function (data) {
        data.text = data.text.replace(/(http:\/\/t\.co\/\w{7})/g, '<a href="$1" target="_blank">$1</a>');
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
        tweet.slideDown();
        // anywhere
        twttr.anywhere(function (T) {
            T("#" + data.id).linkifyUsers();
            $('a.twitter-anywhere-user').attr({ target: '_blank' });
        });
    });
    twttr.anywhere(function (T) {
        T("#footer").hovercards();
    });
});
