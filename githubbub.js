var N = 20;
var T = 1000;

var maxId = 0;
var divs = [];

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

function makeDiv(gravatar_id, text) {
    return $('<div><img src="http://gravatar.com/avatar/' + gravatar_id + '?d=retro"/>' +
	     '<p>' + text + '</p></div>');
}

function makeDivs(event) {
    if (event.type == 'PushEvent') { // contains multiple texts
	return $.map(event.payload.commits, function(commit) {
	    divs.push(makeDiv(event.actor.gravatar_id, commit.message));
	});
    }
    var path = textPaths[event.type];
    if (path) {
	var text = event.payload;
	for (var i=0; i<path.length; i++) {
	    text = text[path[i]];
	    if (!text) return;
	}
	return [makeDiv(event.actor.gravatar_id, text)];
    }
    console.log(event);
}

function update() {
    $.get("https://api.github.com/events", {}, function(events) {
	$.each(events.reverse(), function(i, event) {
	    if (event.id > maxId) {
		maxId = event.id;
		$.each(makeDivs(event) || [], function(i, div) {
		    div.find('img').load(function() {
			$('body').prepend(div);
			divs.push(div);
			if (divs.length > N)
			    divs.shift().remove();
		    });
		});
	    }
	});
	setTimeout(update, T);
    });
}

$(function() {
    setTimeout(update, T);
});
