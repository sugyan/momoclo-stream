$(function () {
    // anywhere
    twttr.anywhere(function (T) {
        T.hovercards();
    });
    // socket.io
    var socket = io.connect();
    socket.on('connection', function (count) {
        $('#connections').text(count + ' connections');
    });
    socket.on('tweet', function (data) {
        $('#tweets').prepend(
            $('<div>').attr({ id: data.id }).addClass('tweet')
                .append($('<div>').addClass('image')
                        .append($('<img>').attr({ src: data.icon })))
                .append($('<div>').addClass('text')
                        .append($('<div>').addClass('info')
                                .append($('<span>').addClass('user')
                                        .append($('<a>').attr({
                                            href: "https://twitter.com/" + data.user,
                                            target: '_blank'
                                        }).text('@' + data.user)))
                                .append($('<span>').addClass('date')
                                        .append($('<a>').attr({
                                            href: 'https://twitter.com/#!/' + data.user + '/status/' + data.id,
                                            target: '_blank'
                                        }).text(new Date(data.date).toLocaleString()))))
                        .append($('<div>')
                                .append($('<span>').html(data.text))))
        );
    });
});
