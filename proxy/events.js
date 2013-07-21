
var ACCESS_TOKEN = require('fs').readFileSync('/srv/www/githubbub.com/access_token', 'utf-8');
var GITHUB_EVENTS = 'https://api.github.com/events?access_token=' + ACCESS_TOKEN;
var EXPIRY = 1000; // cache lasts one second

var cached;
var cachedTime = 0;
var listeners = [];
function pipeGithubEvents(out) {
    var now = Date.now();
    if (now - cachedTime < EXPIRY) { // cache is fresh
        out.write(cached);
        out.end();
    } else {
        listeners.push(out);
        if (listeners.length == 1) { // only the first listener initiates a request
            console.log('calling github api at t=' + now);
            var request = require('https').request(GITHUB_EVENTS, function (response) {
                cached = new Buffer(parseInt(response.headers['content-length']));
                var offset = 0;

                response.on('data', function(data) {
                    // TODO stream directly to the first listener, since it's definitely been listening from the beginning
                    data.copy(cached, offset);
                    offset += data.length;
                }).on('end', function() {
                    cachedTime = now;
                    for (var i in listeners) {
                        listeners[i].write(cached);
                        listeners[i].end();
                    }
                    listeners = [];
                });
            });
            request.setHeader('User-Agent',
                              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_3) AppleWebKit/537.31 (KHTML, like Gecko) Chrome/26.0.1410.65 Safari/537.31');
            request.end();
        } else console.log(' ' + listeners.length + ' listeners');
    }
}

require('http').createServer(function(request, response) {
    if (request.method !== 'GET' || request.url !== '/') {
        response.statusCode = 404;
        response.end();
        return;
    }

    // TODO set content-length / avoid keepalive?
    response.statusCode = 200;
    response.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
    pipeGithubEvents(response);
}).listen(8118);
