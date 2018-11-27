function b64EncodeUnicode(str) {
    // first we use encodeURIComponent to get percent-encoded UTF-8,
    // then we convert the percent encodings into raw bytes which
    // can be fed into btoa.
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
    }));
}
function b64DecodeUnicode(str) {
    // Going backwards: from bytestream, to percent-encoding, to original string.
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}
function TryParseInt(str,defaultValue) {
    var retValue = defaultValue;
    // Checker at værdien ikke er null, har en længde og at det er et tal.
    if(str !== null) {
        if(str.length > 0) {
            if (!isNaN(str)) {
                retValue = parseInt(str);
            }
        }
    }
    return retValue;
}
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
function setCookie(cname, cvalue) {
    document.cookie = cname + "=" + cvalue + ";";
}
function userFetch(id) {
    $("#lectiolink").val('https://www.lectio.dk/lectio/31/subnav/members.aspx?holdelementid=' + id + '&showstudents=1');
    $('#fetch').click();
}

//Gets the cookie used by the site
var cookie = getCookie("classes");
//This functions runs all initializing code
$(document).ready(function() {
    //Initilalize 3rd party script, ClipboardJS
    new ClipboardJS('#copy');

    //Clear fields in case browser has saved values from previous sesions
    $('#lectiolink').val('');
    $('#lnk').val('');
    $('#students').val('');

    //Checks if the cookie is empty or does not exist
    if(cookie != '') {
        //Display dropdown with previous classes, since the cookie exists
        $('#userClassesElement').css("display", "flex");
        //We split the cookie string to get an array of classes
        //We loop the array and add a dropdown value for each
        var classesArray = cookie.split('|');
        for(var i = 0; i < classesArray.length; i++) {
            var classProperties = classesArray[i].split(',');
            $("#dropdownitems").append("<button onclick=\"this.disabled = true; this.classList.add('disabled'); userFetch('" + classProperties[0] + "');\" class=\"dropdown-item\" type=\"button\">" + classProperties[1] + "</button>");
        }
    }

    //Get the url param. If the param is empty, then no content needs to be loaded
    //The param contains data for generated groups.
    const urlParams = new URLSearchParams(window.location.search);
    const myParam = urlParams.get('q');
    if(myParam == null) {
        return;
    }

    //decode and parse group data to JSON object
    var decoded = b64DecodeUnicode(myParam);
    var obj = JSON.parse(decoded);

    //Loop the JSON. For each group add a group, and for each student in the group, add them to the group
    for (i = 0; i < obj.length; i++) {
        $('.groups').append('<div class="group card" id="group' + (i+1) + '"><div class="card-body"><h5>Group ' + (i+1) + '</h5></div></div>');
        for (j = 0; j < obj[i].length; j++) {
            $('#group' + (i+1)).find(".card-body").append('<p class=\"card-text\">' + obj[i][j] + '</p>');
        }
    }

    //Scroll down to the generated groups
    $('.groups').animatescroll({scrollSpeed:2000,easing:'easeInSine'});
});

//Event handling for all buttons
$(document).ready(function() {
    //Handle click on the create button
    $('#create').on('click', function(e) {
        e.preventDefault();

        //Get values from fields
        var namespergroup = TryParseInt($('.pergroup').val()),
            allnames = $('textarea').val().replace(/^\s*[\r\n]/gm, "").split('\n'),
            allnameslen = allnames.length;
        
        //Calculate amount of groups
        var numgroups = Math.ceil(allnameslen / namespergroup);
        
        if($('.numgroups').val()) {
            numgroups = TryParseInt($('.numgroups').val(),null);
            namespergroup = allnameslen / numgroups;
        }

        //Display error if either the the number of groups or people per group are empty
        if(namespergroup == null || numgroups == null) {
            $("#error-div").css("display", "flex");
            $('#error-div').animatescroll({scrollSpeed:750,easing:'easeInSine'});
            return;
        }
        
        //Remove groups from any previous generations
        $('.groups').empty();
        
        //Append group html for each group
        for (i = 0; i < numgroups; i++) {
            $('.groups').append('<div class="group card" id="group' + (i+1) + '"><div class="card-body"><h5>Group ' + (i+1) + '</h5></div></div>');
        }
        
        //Append the names to each group
        $('.group').each(function() {
            for (j = 0; j < namespergroup; j++) {
                var randname = Math.floor(Math.random() * allnames.length);
                if(allnames[randname]){
                    $(this).find(".card-body").append('<p class=\"card-text\">' + allnames[randname] + '</p>');
                }
                allnames.splice(randname, 1);
            }
        });

        //Empty the link value, since this is new groups
        $('#lnk').val("");
        //Scroll the page down to the groups
        $('.groups').animatescroll({scrollSpeed:2000,easing:'easeInSine'});
    });
    
    //Handle click on save button
    $('#save').on('click', function(e) {
        e.preventDefault();
        var groups = [];
        //For each group, add all the names within the group to a group object, and add group object to array
        $('.group').each(function() {
            var group = [];
            $(this).find(".card-body").children('p').each(function() {
                group.push($(this).text());
            });
            groups.push(group);
        });
        //Convert JSON object to string
        let objJsonStr = JSON.stringify(groups);
        //Encode data and set link box value to generated data
        $("#lnk").val(window.location + "?q=" + b64EncodeUnicode(objJsonStr));
        //Handle copytoclipboard
        $('#copy').attr("data-clipboard-text", $('#lnk').val());
    });
    
    //Handle click on fetch button
    $('#fetch').click(() => {
        tinyurl($("#lectiolink").val(), () => {
            //Get title object and table of students
            var className = $(tinyurl.url).find("#s_m_HeaderContent_MainTitle").text();
            var rootTable = $(tinyurl.url).find("#s_m_Content_Content_laerereleverpanel_alm_gv").find("tr");
            //Loop the table of students, extract their names, and add them to the textbox
            for (var i = 0; i < rootTable.length; i++) {
                if(i == 0) {
                    continue;
                }
                var item = rootTable[i].childNodes;
                var name = $(item[2]).text().trim() + " " + $(item[3]).text().trim();
                var old = $('textarea').val();
                $('textarea').val(old + "\n" + name);
            }
            //Extract id of lectio class
            var classId = $("#lectiolink").val().includes("holdelementid") ? $("#lectiolink").val().substring($("#lectiolink").val().indexOf("holdelementid") + 14, $("#lectiolink").val().indexOf("&")) : null;

            //Turn on the buttons, since no more calls are being made to other servers
            $('#fetch').attr("disabled", false);
            $('#short').attr("disabled", false);

            //Do not try to set cookie if there was an error getting the id of class
            if(classId == null)
                return false;
            
            //Get the name of the class and check if there was an error
            var team = className.split(' - ')[0].replace('Holdet ', '');
            if(team == '')
                return false;

            //Set the cookie with new class
            if (cookie != "") {
                if(!cookie.includes(classId)) {
                    cookie = cookie + '|' + classId + ',' + team;
                    setCookie("classes", cookie);
                } 
            } else {
                cookie = classId + ',' + team;
                setCookie("classes", cookie);
            }
        });
    });

    //Handle click on close button for error element
    $('#count-error').on('click', function(e) {
        //Show error
        $("#error-div").css("display", "none");
    });

    //Handle click on shorten link button
    $('#short').click(() => {
        tinyurl($("#lnk").val(), () => {
            $("#lnk").val(tinyurl.url);
            $('#copy').attr("data-clipboard-text", $('#lnk').val());
            $('#fetch').attr("disabled", false);
            $('#short').attr("disabled", false);
        });
    });

    //Handle slider at the top of the page
    $('.toggle-wrap a').on('click', function(e){
        e.preventDefault();
        $('.wrap').toggleClass('alt');
        $('.pergroup-wrap, .numgroups-wrap').parent().parent().find('input').val('');
    });
});