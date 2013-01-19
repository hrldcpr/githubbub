var N = 25;
var T = 1000;

var maxId = 0;
var allDivs = [];
var paused = false;

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

function makeDiv(event, text) {
    var x = Math.floor(80 * Math.random());
    var y = Math.floor(80 * Math.random());
    var bubble = $('<a href="https://github.com/' + event.actor.login + '"' +
		   ' class="bubble git" style="top:' + x + '%; left: ' + y + '%;">' +
		   '<img src="http://gravatar.com/avatar/' + event.actor.gravatar_id + '?d=retro"/>' +
		   '<pre class="text"></pre></a>');
    bubble.find('.text').text(text);
    return bubble;
}

function makeDivs(event) {
    if (event.type == 'PushEvent') { // contains multiple texts
	return $.map(event.payload.commits, function(commit) {
	    return makeDiv(event, commit.message);
	});
    }
    var path = textPaths[event.type];
    if (path) {
	var text = event.payload;
	for (var i=0; i<path.length; i++) {
	    text = text[path[i]];
	    if (!text) return;
	}
	return [makeDiv(event, text)];
    }
    // console.log(event); // skipped event
}

function update() {
    // TODO only start using local proxy after client's direct api connection has been rate-limited
    $.get("/events", {}, function(events) {
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
    }, 'json');
}

$(function() {
    update();
    mixpanel.track('view');
});
