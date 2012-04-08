var N = 20;
var T = 1000;

var maxId = 0;
var allDivs = [];

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
    var x = Math.floor(90 * Math.random());
    var y = Math.floor(90 * Math.random());
    return $('<a href="https://github.com/' + event.actor.login + '"' +
	     ' class="bubble" style="top:' + x + '%; left: ' + y + '%;">' +
	     '<img src="http://gravatar.com/avatar/' + event.actor.gravatar_id + '?d=retro"/>' +
	     '<div class="text">' + text + '</div></a>');
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
    console.log(event);
}

function update() {
    $.get("https://api.github.com/events", {}, function(events) {
	$.each(events.reverse(), function(i, event) {
	    if (event.id > maxId) {
		maxId = event.id;
		$.each(makeDivs(event) || [], function(i, div) {
		    div.find('img').load(function() {
			$('#main').append(div);
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
	    }
	});
	setTimeout(update, T);
    });
}

$(function() {
    setTimeout(update, T);
});
