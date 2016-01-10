var N = 25;
var T = 1000;

var maxId = 0;
var allDivs = [];
var paused = false;

function repoUrl(event) {
    return 'https://github.com/' + event.repo.name;
}

function userUrl(event) {
    return 'https://github.com/' + event.actor.login;
}

var textPaths = {
    CommitCommentEvent: ['comment', 'body'],
    CreateEvent: ['description'],
    DownloadEvent: ['download', 'description'],
    ForkEvent: ['forkee', 'description'],
    GistEvent: ['gist', 'description'],
    IssueCommentEvent: ['comment', 'body'],
    IssuesEvent: ['issue', 'body'],
    MemberEvent: ['member', 'bio'],
    PullRequestEvent: ['pull_request', 'body'],
    PullRequestReviewCommentEvent: ['comment', 'body'],
};

var urlPaths = {
    CommitCommentEvent: ['comment', 'html_url'],
    ForkEvent: ['forkee', 'html_url'],
    IssuesEvent: ['issue', 'html_url'],
    PullRequestEvent: ['pull_request', 'html_url'],
    PullRequestReviewCommentEvent: ['comment', '_links', 'html'],
};

var urlGetters = {
    CreateEvent: repoUrl,
    IssueCommentEvent: function(event) {
        return event.payload.issue.html_url + '#issuecomment-' + event.payload.comment.id;
    },
};

function makeDiv(event, text, url) {
    var x = Math.floor(80 * Math.random());
    var y = Math.floor(80 * Math.random());
    var bubble = $('<a href="' + url + '" class="bubble git" style="top:' + x + '%; left: ' + y + '%;">' +
		   '<img src="' + event.actor.avatar_url + '"/>' +
		   '<pre class="text"></pre></a>');
    bubble.find('.text').text(text);
    return bubble;
}

function walk(x, path) {
    if (x && path) {
        for (var i in path) {
	    x = x[path[i]];
	    if (!x) return;
        }
        return x;
    }
}

function makeDivs(event) {
    if (event.type === 'PushEvent') { // contains multiple texts
	return $.map(event.payload.commits, function(commit) {
            var url = repoUrl(event) + '/commit/' + commit.sha;
	    return makeDiv(event, commit.message, url);
	});
    }

    var text = walk(event.payload, textPaths[event.type]);
    if (text) {
        // first try urlPaths, then urlGetters, then default to user url:
        var url = walk(event.payload, urlPaths[event.type]);
        if (!url) url = (urlGetters[event.type] || userUrl)(event);

	return [makeDiv(event, text, url)];
    }

    //console.log(event); // skipped event
}

var direct = true; // initially call github api directly
function update() {
    $.get(direct ? 'https://api.github.com/events' : '/events', {}, function(events) {
        if (direct) events = events.data; // when using jsonp, github api nests its response in 'data'

        if (Object.prototype.toString.call(events) !== '[object Array]') {
            if (direct) {
                // client IP has probably been rate-limited, so switch to proxy immediately:
                direct = false;
                update();
                return;
            }
            events = [];
        }

	var divs = $.map(events.reverse(), function(event) {
	    if (event.id > maxId) {
		maxId = event.id;
		return makeDivs(event);
	    }
	});

	$.each(divs, function(_, div) {
	    div.find('img').load(function() {
		$('body').append(div);
		allDivs.push(div);
		if (allDivs.length > N)
		    allDivs.shift().remove();
		$.each(allDivs, function(i, div) {
		    var k = Math.floor(255 * (i + 1) / allDivs.length);
		    div.css({background: 'rgb(' + k + ',' + k + ',' + k + ')'});
		    div.find('img').css({opacity: (i + 1) / allDivs.length});
		});
	    });
	});

        setTimeout(update, T);
    }, direct ? 'jsonp' : 'json').fail(function () {
        // even if the call failed, try again.
        // would put this in .always() and remove redundant setTimeout above,
        // but then recursive call to update() above would lead to two timers
        setTimeout(update, T);
    });
}

$(function() {
    update();
    mixpanel.track('view');
});
