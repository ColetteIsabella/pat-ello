/**
 *
 * This is a Greasemonkey script and must be run using a Greasemonkey-compatible browser.
 *
 * @author Niphada Frost <thebrightobvious@gmail.com>
 */
// ==UserScript==
// @name           Predator Alert Tool for Ello (PAT-Ello)
// @version        0.1
// @namespace      com.maybemaimed.pat.ello
// @updateURL      ??
// @description    Alerts you of people who have allegedly assaulted others as you browse Ello. Empowers you to anonymously report a consent violation perpetrated by a FurAffinity user.
// @include        https://ello.co/*
// @include        http://www.creepshield.com/search*
// @exclude        ?
// @exclude        ?
// @exclude        ?
// @exclude        ?
// @grant          GM_log
// @grant          GM_xmlhttpRequest
// @grant          GM_addStyle
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_openInTab
// ==/UserScript==
ELLO_ASL = {}; // object
ELLO_ASL.users = {}; // "users" property of ELLO_ASL; also an object
ELLO_ASL.getUserProfile = function (id) { // a method of ELLO_ASL
    if (ELLO_ASL.users[id]) { // can't understand this condition - existence of an [id] property of the ELLO_ASL.users object?
        return ELLO_ASL.users[id].profile_html; // if it ALREADY EXISTS, return it
    } else {
        ELLO_ASL.users[id] = {}; // create this property?
        GM_xmlhttpRequest({ //what is this function - is the parameter an object?
            'method': 'GET', // ??
            'url': 'http://ello.co/*' + id.toString(),
            'onload': function (response) {
                ELLO_ASL.users[id].profile_html = response.responseText; // this CREATES the .profile_html property what is response.responseText?
            }
        });
    }
};

FAADE = {}; //an object; what is it?
FAADE.CONFIG = { //.CONFIG object within FAADE object
    'debug': false, // switch to true to debug.
    'gdocs_key': '0ArYmNHuRadHbdGNVT1kzSzFnOXhHRjh1RnczZVVmMXc', // how to create a googledoc? look up
    'gform_key': 'dGNVT1kzSzFnOXhHRjh1RnczZVVmMXc6MQ', //wut
    'gdocs_development_key': '0ArYmNHuRadHbdGxjMUhyR0FzLWJicHNXUFdxckFEQWc', //ditto
    'gform_development_key': 'dGxjMUhyR0FzLWJicHNXUFdxckFEQWc6MQ', //help
};

// Utility debugging function.
FAADE.log = function (msg) { // a .log method of FAADE; no parameters; seems to add debugging info to a log
    if (!FAADE.CONFIG.debug) { return; } // if 'debug' = false?
    GM_log('FETLIFE FAADE: ' + msg); // what is GM_log?
    //console.log('FETLIFE FAADE: ' + msg); // a test that writes msg to the console
};

// Initializations. [DON'T UNDERSTAND ANY OF THIS SYNTAX. if unsafeWindow is true/exists,set uw to unsafeWindow, if not make uw window '\ doesn't make sense either. why is it pink?]
var uw = (unsafeWindow) ? unsafeWindow : window ; // Help with Chrome compatibility? //what is unsafeWindow?? //the lines below seem to be CSS for displaying reports on profile pages
GM_addStyle('\
/* Highlight alleged abusers in bright yellow. */\
.faade_alleged_abuser {\
    display: inline-block;\
    border: 2px solid yellow;\
}\
#faade_abuse_reports caption {\
    background: yellow;\
    color: red;\
}\
#faade_abuse_reports tfoot td {\
    padding-top: 1em;\
    text-align: center;\
}\
#faade_abuse_reports tr:target > * {\
    border: 1px solid red;\
}\
#faade_abuse_reports tr:target th {\
    border-width: 1px 0 1px 1px;\
}\
#faade_abuse_reports tr:target td {\
    border-width: 1px 1px 1px 0;\
}\
/* FAADE location broadcast dialog styles. */\
[aria-labelledby="ui-dialog-title-faade"] { border-color: yellow; }\
#ui-dialog-title-faade { color: red; }\
/* General prettiness. */\
#profile #main_content a + a.faade_report_link { padding-left: 5px; }\
footer .faade_report_link,\
.blog_entry p.quiet.small .faade_report_link,\
.byline .faade_report_link {\
    display: block;\
    color: #777;\
}\
.mini_feed_title .faade_report_link {\
    float: left;\
    padding-right: 5px;\
}\
ul.pictures li a.faade_report_link,\
#profile ul.friends li { width: auto; }\
');
FAADE.init = function () { // another method, .init, of the FAADE object. don't understand what it does
    // Whenever we load CreepShield, just clear the cookies.
    if (window.location.hostname.match(/creepshield.com/)) { //don't understand the syntax here
        FAADE.clearCookies(); //why is this method available
        return;
    }
    ELLO.ASL.getUserProfile(uw.FetLife.currentUser.id); // run early // why does .getUserProfile method work when it hasn't been declared on ELLO.ASL?
    FAADE.injectDialog(); // scroll down to lines 183-221 for function definition 
    FAADE.abuser_database = FAADE.getValue('abuser_database', false); //what is this
    if (FAADE.abuserDatabaseExpired()) { //if the abuserDatabase is expired, fetch it. I guess.
        FAADE.fetchAbuserDatabase();
    }
    FAADE.main();
};
window.addEventListener('DOMContentLoaded', FAADE.init); //what event is it listening for?

// Determines whether the abuser database has expired and needs to be re-fetched.
FAADE.abuserDatabaseExpired = function () {
    // If we don't have a database, then of course it's "expired."
    if (!FAADE.abuser_database) {
        FAADE.log('Abuser database expired because of false-equivalent value.');
        return true;
    } else if ( (new Date().getTime() > (parseInt(FAADE.getValue('last_fetch_time')) + 86400)) ) { //where does last_fetch_time come from
        // Abuser database was last fetched more than 24 hours (86400 seconds) ago, so refresh.
        FAADE.log('Abuser database expired because of time.');
        return true;
    } else {
        FAADE.log('Abuser database still fresh.');
        return false;
    }
};

FAADE.getDatabaseConnectionString = function () { // .getDatabaseConnectionString method defined on FAADE object. what does it do tho
    return (FAADE.CONFIG.debug) ? // if debug is true, return gdocs_development_key, if debug false, return gdocs_key. why???
        FAADE.CONFIG.gdocs_development_key : //
        FAADE.CONFIG.gdocs_key;
};
FAADE.getReportFormKey = function () { //.getReportFormKey method defined in FAADE object
    return (FAADE.CONFIG.debug) ? //if debug true, return gform_development_key; if debug false, return gform_key
        FAADE.CONFIG.gform_development_key :
        FAADE.CONFIG.gform_key;
};

FAADE.setValue = function (x, y) { // .setValue method defined on FAADE object; takes 2 params x and y
    return (FAADE.CONFIG.debug) ? // if debug true, set some value to something? if debug false, set value to something else? what is GM_setValue??
        GM_setValue(x += '_development', y) :
        GM_setValue(x, y);
};
FAADE.getValue = function (x, y) { // .getValue method defined on FAADE object
    if (arguments.length === 1) { //what is arguments?
        return (FAADE.CONFIG.debug) ? //if debug false, do one thing, if not do another
            GM_getValue(x += '_development'):
            GM_getValue(x);
    } else {
        return (FAADE.CONFIG.debug) ? // if debug true do something, if not do another. wtf are x and y
            GM_getValue(x += '_development', y):
            GM_getValue(x, y);
    }
};

FAADE.fetchAbuserDatabase = function () { // fetchAbuserDatabse method defined on FAADE object; see lines 113-114 for call
    var key = FAADE.getDatabaseConnectionString(); // private variable. see lines 136 thru 140
    var url = 'https://docs.google.com/spreadsheet/pub?key=' + key + '&output=html'; // private var. don't get it
    FAADE.log('fetching abusers database from ' + url); //what does this do
    GM_xmlhttpRequest({ //what is this
        'method': 'GET',
        'url': url,
        'onload': function (response) {
            if (!response.finalUrl.match(/^https:\/\/docs.google.com\/spreadsheet\/pub/)) { //syntax in URL confusing what are \^/
                FAADE.log('Failed to fetch abuser database from ' + url);
                return false;
            }
            FAADE.setValue('last_fetch_time', new Date().getTime().toString()); // timestamp this fetch // don't get it
            FAADE.setValue('abuser_database', response.responseText);
            FAADE.abuser_database = FAADE.getValue('abuser_database');
        }
    });
};

FAADE.injectDialog = function () { // .injectDialog method defined in FAADE object. see line 111 for the call
    // Inject hidden dialog box link.
    var trigger_el = document.createElement('a');
    trigger_el.setAttribute('class', 'opens-modal');
    trigger_el.setAttribute('data-opens-modal', 'faade');
    document.body.appendChild(trigger_el);

    // Inject dialog box HTML. FetLife currently uses Rails 3, so mimic that. // oh dear. do I need to change the code here??
    // See, for instance, Rails Behaviors: http://josh.github.com/rails-behaviors/
    var faade_dialog = document.createElement('div'); /// AUGH WHAT IS THISSSSSSS
    faade_dialog.setAttribute('style', 'display: none; position: absolute; overflow: hidden; z-index: 1000; outline: 0px none;');
    faade_dialog.setAttribute('class', 'ui-dialog ui-widget ui-widget-content ui-corner-all');
    faade_dialog.setAttribute('tabindex', '-1');
    faade_dialog.setAttribute('role', 'dialog');
    faade_dialog.setAttribute('aria-labelledby', 'ui-dialog-title-faade');
    var html_string = '<div class="ui-dialog-titlebar ui-widget-header ui-corner-all ui-helper-clearfix" unselectable="on" style="-moz-user-select: none;">';
    html_string += '<span class="ui-dialog-title" id="ui-dialog-title-faade" unselectable="on" style="-moz-user-select: none;">Predator Alert Tool for FetLife (PAT-FetLife)</span>';
    html_string += '<a href="#" class="ui-dialog-titlebar-close ui-corner-all" role="button" unselectable="on" style="-moz-user-select: none;">';
    html_string += '<span class="ui-icon ui-icon-closethick" unselectable="on" style="-moz-user-select: none;">close</span>';
    html_string += '</a>';
    html_string += '</div>';
    html_string += '<div data-modal-title="Predator Alert Tool for FetLife (PAT-FetLife)" data-modal-height="280" data-modal-auto-open="false" class="modal ui-dialog-content ui-widget-content" id="faade">';
    html_string += '<p class="mbm">There have been <span id="faade_reports_to_alert">X</span> new consent violations filed to the Predator Alert Tool for FetLife that may have been perpetrated near your location (<span id="faade_user_loc">X, X, X</span>).</p>';
    html_string += '<p>Click "View new nearby PAT-FetLife reports" to view the profiles of the people who have been accused of consent violations near your area in new tabs.</p>';
    html_string += '<p id="faade-actions" class="ac">';
    html_string += '<a rel="nofollow" class="btnsqr close" data-closes-modal="faade" href="#">View new nearby PAT-FetLife reports</a>';
    html_string += '<span class="i s q">&nbsp;-or-&nbsp;</span>';
    html_string += '<a data-closes-modal="faade" class="close tdn q" href="#">Cancel</a>';
    html_string += '</p>';
    html_string += '<p>(Don\'t worry, I\'m not looking for where you actually are. Your location was determined from your FetLife profile.)</p>';
    html_string += '</div>';
    faade_dialog.innerHTML = html_string;
    document.body.appendChild(faade_dialog);

    // Attach event listener to trigger element. //what is .querySelector? why is it called twice??
    document.querySelector('[data-opens-modal="faade"]').addEventListener('click', function (e) {
        document.querySelector('[data-opens-modal="faade"]').dialog("open");
    });
};

FAADE.getLocationFromProfileHtml = function (html) { // .getLocationFromProfileHtml method defined on FAADE obj. get location. I guess. somehow
    var parser = new DOMParser(); //what is a DOMParser? where does it come from
    var doc = parser.parseFromString(html, 'text/html'); // wut
    return doc.querySelector('h2.bottom + p > em').textContent.split(', '); // split with comma AND space
};

FAADE.broadcastNewProximalReports = function (doc) { // .broadcastNewProximalReports method on FAADE obj. reports on users close to your location, I guess
    // Recall timestamp of last record checked.
    var last_timestamp_checked = parseInt(FAADE.getValue('last_timestamp_checked', '0')); // default is "never!"
    // Get latest timestamp in stored alleged abuser database.
    var rows = doc.querySelectorAll('#tblMain tr'); // read in every report, in full
    var latest_timestamp_filed = Date.parse(rows[rows.length - 1].childNodes[1].textContent);

    // If never checked, or if there are new records since last timestamp checked
    if (last_timestamp_checked < latest_timestamp_filed) {
        FAADE.log('Last timestamp checked (' + last_timestamp_checked.toString() + ') is older than latest timestamp filed (' + latest_timestamp_filed.toString() + ').');

        // count how many new records there are since last check
        var num_reports = 0;
        for (var i = rows.length - 1; i > 0; i--) {
            if (Date.parse(rows[i].childNodes[1].textContent) > last_timestamp_checked) {
                num_reports++;
            } else {
                break; // we've reached the timestamps we've already checked, we're done
            }
        }
        FAADE.log('Total of ' + num_reports + ' new reports since last check.');

        var user_loc = FAADE.getLocationFromProfileHtml(ELLO.ASL.users[uw.FetLife.currentUser.id].profile_html);
        FAADE.log('Current user location seems to be ' + user_loc.join(', ') + '.');

        // Loop over all new records one by one
        var reports_to_alert = [];
        for (var i = rows.length - num_reports; i <= rows.length - 1; i++) {
            // extract the location data from the report
            report_loc = rows[i].childNodes[6].textContent;
            // compare current user's FetLife profile location against alleged abuse location
            // and test each substring of the user profile against the reported location
            for (var z = 0; z < user_loc.length; z++) {
                // if a relevant case insensitive substring matches
                if (-1 !== report_loc.toLowerCase().search(user_loc[z].toLowerCase())) {
                    FAADE.log('Filed report location ' + report_loc + ' matches user location substring ' + user_loc[z] + '!');
                    // store for future pop-up
                    reports_to_alert.push(rows[i]);
                    break; // we found a match, so stop trying on this row
                }
            }
        }

        // Ask user to view the profiles of the alleged abusers in the user's local vicinity.
        if (reports_to_alert.length) {
            // Fill in the user-facing message with the appropriate info.
            document.getElementById('faade_reports_to_alert').innerHTML = reports_to_alert.length.toString();
            document.getElementById('faade_user_loc').innerHTML = user_loc.join(', ');
            // Create the click event we're going to use.
            var evt = document.createEvent('MouseEvents');
            evt.initEvent('click', true, false); // can bubble, can't be cancelled
            // "Click" event on hidden code.
            document.querySelector('a[data-opens-modal="faade"]').dispatchEvent(evt);
            // Attach event listener to "View" button and pass in appropriate URLs.
            document.querySelector('.btnsqr[data-closes-modal="faade"]').addEventListener('click', function () {
                for (var i = 0; i < reports_to_alert.length; i++) {
                    // TODO: Add the permalink to the specific report to this URL, so it's highlighted when opened.
                    var url = 'https://fetlife.com/users/';
                    GM_openInTab(url + reports_to_alert[i].childNodes[2].textContent.match(/\d+/)[0]);
                }
            });
        }
    }

    // Make a note of the latest timestamp filed, so we start here next time we're loaded.
    FAADE.setValue('last_timestamp_checked', latest_timestamp_filed.toString());
};

FAADE.creepShield = {}; // .creepShield object within FAADE object
FAADE.creepShield.checkPhotoUrl = function (url) { //checkPhotoURL within FAADE object. should I bother with the creepshield stuff? seems pointless when profile pics aren't photos
    // For Chrome, we need to create the multipart request manually because
    // extensions can't decode FormData objects due to its isolated worlds.
    // See http://code.google.com/p/tampermonkey/issues/detail?id=183
    var multipart_boundary = "---xxx111222333444555666777888999";
    var multipart_data = '--' + multipart_boundary + "\n";
    multipart_data += 'Content-Disposition: form-data; name="linked_image"';
    multipart_data += "\n\n";
    multipart_data += url;
    multipart_data += "\n";
    // Mimic hitting the "Search" button.
    multipart_data += '--' + multipart_boundary + "\n";
    multipart_data += 'Content-Disposition: form-data; name="submit_linked_image"';
    multipart_data += "\n\n";
    multipart_data += 'Search';
    multipart_data += "\n";
    multipart_data += '--' + multipart_boundary + '--'; // end

    GM_xmlhttpRequest({
        'method': 'POST',
        'url': 'http://www.creepshield.com/search',
        'headers': {
            'Content-Type': 'multipart/form-data; boundary=' + multipart_boundary
        },
        'data': multipart_data,
        'onload': function (response) {
            var parser = new DOMParser();
            var doc = parser.parseFromString(response.responseText, 'text/html');
            // If our search was successful,
            if (doc.querySelector('.search-details')) {
                // Parse the CreepShield results and display on FetLife.
                var creep_data = FAADE.creepShield.parseResults(doc);
                FAADE.creepShield.displayOnFetLife(creep_data);
            } else {
                FAADE.log('An error occurred searching CreepShield.com.');
                if (doc.getElementById('messages')) {
                    FAADE.creepShield.displayError(doc.getElementById('messages').textContent);
                }
            }
        }
    });
};
FAADE.creepShield.parseResults = function (doc) { // .parseResults method added to creepShield object
    var ret = {
        'searched_url' : doc.querySelector('.searched-image').getAttribute('src'),
        'matches_count': doc.querySelectorAll('.person').length,
        'highest_match': doc.querySelector('.match-percentage p:nth-child(2)').textContent.match(/\d+%/),
        'highest_photo': doc.querySelector('.person-images-inner img'),
        'person_detail': doc.querySelector('.person-name').textContent
    };
    return ret;
};
FAADE.creepShield.getDisclaimerHtml = function () {
    return '<p>This feature is powered by the facial recognition service at <a href="http://creepshield.com/">CreepShield.com</a>. The registered sex offender database is <em>not</em> always a reliable source of information. <a href="https://www.eff.org/deeplinks/2011/04/sexual-predators-please-check-here-match-com-s">Learn more</a>.</p>';
};
FAADE.creepShield.displayOnFetLife = function (creep_data) { //.displayOnFetlife() method added to creepShield object ??
    var base_el = document.querySelector('.pan').parentNode.parentNode;
    var my_el = document.createElement('div');
    my_el.setAttribute('class', 'pat-fetlife-creepshield-results');
    var html = '<h3>Possible Registered Sex Offender matches:</h3>';
    html += '<ul>';
    html += '<li>Highest facial match: ' + creep_data.highest_match + '</li>'
    html += '<li>Most likely offender: <img src="' + creep_data.highest_photo.getAttribute('src') + '" alt="" />' + creep_data.person_detail + '</li>';
    html += '<li>Total possible matches: ' + creep_data.matches_count + '</li>';
    html += '</ul>';
    html += '<form method="POST" action="http://www.creepshield.com/search">';
    html += '<input type="hidden" name="linked_image" value="' + creep_data.searched_url + '" />';
    html += '<p>Search for criminal histories and other possible offenders: ';
    html += '<input type="submit" name="submit_linked_image" value="Search" />';
    html += '</p>';
    html += '</form>';
    html += FAADE.creepShield.getDisclaimerHtml();
    my_el.innerHTML = html;
    base_el.appendChild(my_el);
};
FAADE.creepShield.displayError = function (msg) { // .displayError method added to creepShield object
    var base_el = document.querySelector('.pan').parentNode.parentNode;
    var my_el = document.createElement('div');
    my_el.setAttribute('class', 'pat-fetlife-creepshield-results error');
    var html = '<p>CreepShield returned an error:</p>';
    html += '<blockquote><p>' + msg + '</p></blockquote>';
    html += '<p>If you are being told you need to login before you can do more searches, simply <a href="javascript:window.location.reload();void(0);">reload this page</a> to try again.</p>';
    html += FAADE.creepShield.getDisclaimerHtml();
    my_el.innerHTML = html;
    base_el.appendChild(my_el);
    // If free search limit was hit, go to CreepShield.com to flush it out.
    if (msg.match(/You cannot perform any more searches/i)) {
        GM_openInTab('http://www.creepshield.com/search');
    }
};

FAADE.clearCookies = function () { //clearCookies method added to FAADE object
    var cookie_list = document.cookie.split(';'); //what is .split? what is .cookie?
    for (var i = 0; i < cookie_list.length; i++) {
        var cookie_name = cookie_list[i].replace(/\s*(\w+)=.+$/, "$1"); // what is within the replace() parens?? /\wut
        // To delete a cookie, set its expiration date to a past value.
        document.cookie = cookie_name + '=;expires=Thu, 01-Jan-1970 00:00:01 GMT;';
    }
};

// This is the main() function, executed on page load.
FAADE.main = function () {
    // Make a list of known alleged abuser user IDs.
    var parser = new DOMParser(); //again, what is a DOMParser()?
    var doc = parser.parseFromString(FAADE.abuser_database, 'text/html'); //what is parseFromString?
    var els = doc.querySelectorAll('#tblMain td:nth-child(3)'); // third child is the column of IDs. //what is querySelectorAll?
    var abuser_ids = []; // empty array created
    for (var i = 1; i < els.length; i++) { // we never need the first (0'th) cell because Google provides it blank.
        abuser_ids.push(els[i].innerHTML); //add elements to abuser_ids array, I guess. what is push?
    }
    FAADE.log('recalled abuser ids ' + abuser_ids); //forgot what this does

    // TODO: Refactor this, it's kludgy. //what is refactoring??
    setTimeout(function() {
        FAADE.log('Running time-delayed function.');
        if (ELLO_ASL.users[uw.FetLife.currentUser.id].profile_html) { //wut does this meeeeen
            FAADE.log('We have the current user\'s FetLife profile HTML. Running broadcast checks.');
            FAADE.broadcastNewProximalReports(doc);
        }
    }, 5000); // give us a few seconds to grab the current user's FetLife profile HTML.

    // Are we on a user profile page?
    if (window.location.href.match(/users\/(\d+)\/?$/)) { //what is this syntax? what is href.match?

        var profile_nick = document.querySelector('h2.bottom').childNodes[0].textContent.match(/\S+/)[0]; //hlep
        var id_in_url = window.location.href.match(/users\/(\d+)\/?$/)[1]; //oh deer
        var userpic_el = document.querySelector('.pan'); //what is .pan
        // If we can grab this person's userpic, send it off to CreepShield for testing.
        if (userpic_el) {
            var userpic_src = userpic_el.getAttribute('src');
            // This will check and call back to the renderer, so we can move on now.
            FAADE.creepShield.checkPhotoUrl(userpic_src);
        }

        // If we're not viewing our own profile page, insert a report link.
        usr_ops = document.querySelector('#main_content p.quiet'); //what is p.quiet
        if (usr_ops) {
            usr_ops.appendChild(document.createElement('br'));
            usr_ops.appendChild(FAADE.createAbuseReportLink(id_in_url, profile_nick));
        }

        // If this is a profile page of an alleged abuser,
        if (-1 !== abuser_ids.indexOf(id_in_url)) { //what is id_in_url? perhaps if id_in_url is in the array (i.e. its index isn't -1?)

            var report_el = document.createElement('table');
            report_el.setAttribute('id', 'faade_abuse_reports');
            report_el.setAttribute('summary', 'Reported consent violations committed by ' + profile_nick + '.');
            var caption = document.createElement('caption');
            caption.innerHTML = 'There are reports ' + profile_nick + ' violated others\' consent in these ways:';
            var tfoot = document.createElement('tfoot');
            tfoot.innerHTML = '<tr><td colspan="2"></td></tr>';
            tfoot.querySelector('td').appendChild(FAADE.createAbuseReportLink(id_in_url, profile_nick));
            report_el.appendChild(caption);
            report_el.appendChild(tfoot);

            // Find all reports that match ID number.
            var abuse_reports = [];
            for (var ix = 0; ix < els.length; ix++) {
                if (id_in_url === els[ix].innerHTML) {
                    abuse_reports.push(els[ix].parentNode); // the table row of abuse report
                }
            }
            // Add this information to the top of this user's profile
            for (var iy = 0; iy < abuse_reports.length; iy++) {
                var num = iy + 1;
                var tr = document.createElement('tr');
                tr.setAttribute('id', 'faade_abuse_report-' + num.toString());
                var details_html = '<ul><li class="faade_abuse_report_datetime">' + abuse_reports[iy].childNodes[7].innerHTML + '</li>';
                details_html += '<li class="faade_abuse_report_location">' + abuse_reports[iy].childNodes[6].innerHTML + '</li></ul>';
                var permalink_html = '<a class="faade_abuse_reported_datetime" rel="bookmark" href="'
                    + window.location + '#faade_abuse_report-' + num.toString()
                    + '" title="Permalink for PAT-FetLife abuse report number ' + num.toString() + ' against '
                    + profile_nick + '.">' +  abuse_reports[iy].childNodes[1].innerHTML + '</a>';
                tr.innerHTML += '<th>Abuse report ' + num.toString() + ' (' + permalink_html + '):' + details_html + '</th>';
                tr.innerHTML += '<td>' + abuse_reports[iy].childNodes[5].innerHTML + '</td>';
                report_el.appendChild(tr);
            }

            var before = document.querySelector('#main_content table:last-child');
            before.parentNode.insertBefore(report_el, before);
        }

    }

    // Collect all user links on this page.
    var user_links = [];
    for (i = 0; i < document.links.length; i++) {
        var l = document.links[i].href.match(/^(https:\/\/fetlife.com)?\/users\/(\d+)\/?$/);
        if ( l && (l[2] !== uw.FetLife.currentUser.id.toString()) ) {
            user_links.push(document.links[i]);
        }
    }

    // For each user ID found,
    var last_id = null;
    for (i = 0; i < user_links.length; i++) {
        // Collect its user ID number.
        var id = user_links[i].href.match(/\d+\/?$/);
        if (id) { id = id.toString(); } // cast to string for later comparison

        // Get nickname.
        var n;
        if (user_links[i].children.length) {
            // This is an avatar link, not a text link.
            n = user_links[i].childNodes[0].alt;
        } else {
            // This is a text link. Easy.
            n = user_links[i].innerHTML;
        }

        // check the alleged abusers data store for a match.
        if (-1 !== abuser_ids.indexOf(id)) {
            FAADE.log('found match on this page for alleged abuser ID number ' + id);
            // highlight the user's links that matched an alleged abuser using CSS
            user_links[i].setAttribute('class', user_links[i].className + ' faade_alleged_abuser');

        }

        // Don't create another link if we just made one for that user.
        if (id === last_id) { continue; }

        // Offer a link to add another report for this user.
        // See also: https://support.google.com/docs/bin/answer.py?hl=en&answer=160000
        // Add link to report this user for a consent violation.
        var a = FAADE.createAbuseReportLink(id, n);
        user_links[i].parentNode.appendChild(a);
        last_id = id;
    }
};

FAADE.createAbuseReportLink = function (id, nick) {
    var a = document.createElement('a');
    a.setAttribute('class', 'faade_report_link');
    a.setAttribute('target', '_blank');
    var href = 'https://docs.google.com/spreadsheet/viewform?formkey=' + FAADE.getReportFormKey();
    href += '&entry_0=' + id;
    href += '&entry_1=' + nick;
    a.setAttribute('href', href);
    a.innerHTML = '(report a consent violation by ' + nick + ')';
    return a;
};

// The following is required for Chrome compatibility, as we need "text/html" parsing.
/*
 * DOMParser HTML extension
 * 2012-09-04
 *
 * By Eli Grey, http://eligrey.com
 * Public domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

/*! @source https://gist.github.com/1129031 */
/*global document, DOMParser*/

(function(DOMParser) {
	"use strict";

	var
	  DOMParser_proto = DOMParser.prototype
	, real_parseFromString = DOMParser_proto.parseFromString
	;

	// Firefox/Opera/IE throw errors on unsupported types
	try {
		// WebKit returns null on unsupported types
		if ((new DOMParser).parseFromString("", "text/html")) {
			// text/html parsing is natively supported
			return;
		}
	} catch (ex) {}

	DOMParser_proto.parseFromString = function(markup, type) {
		if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
			var
			  doc = document.implementation.createHTMLDocument("")
			;

			doc.body.innerHTML = markup;
			return doc;
		} else {
			return real_parseFromString.apply(this, arguments);
		}
	};
}(DOMParser));
