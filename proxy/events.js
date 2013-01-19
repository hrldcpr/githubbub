var http = require('http');
var https = require('https');

var ACCESS_TOKEN = require('fs').readFileSync('access_token', 'utf-8');
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
            console.log('calling github api');
            https.get('https://api.github.com/events?access_token=' + ACCESS_TOKEN, function (response) {
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
        }
    }
}

http.createServer(function(request, response) {
    if (request.method !== 'GET' || request.url !== '/') {
        response.statusCode = 404;
        response.end();
        return;
    }

    // TODO set content-length / avoid keepalive?
    response.statusCode = 200;
    response.writeHead(200, {"Content-Type": "application/json; charset=utf-8"});
    pipeGithubEvents(response);
}).listen(8000);
