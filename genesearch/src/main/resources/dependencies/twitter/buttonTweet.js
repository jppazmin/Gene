/* attempt to find a text selection */
function getSelected() {
        if(window.getSelection) { return window.getSelection(); }
        else if(document.getSelection) { return document.getSelection(); }
        else {
                var selection = document.selection && document.selection.createRange();
                if(selection.text) { return selection.text; }
                return false;
        }
        return false;
}
/* create sniffer */
$(document).ready(function() {
        $('#list').mouseup(function(e) {
                var selection = getSelected();
                if(selection && (selection = new String(selection).replace(/^\s+|\s+$/g,''))) {
                        showDiv(e,selection);
                        $.ajax({
                                type: 'post',
                                url: 'index.html',
                                data: 'selection=' + encodeURI(selection)
                        });
                }
        });
        
        $('#list'). mousedown(function(e) {
                hiddenDiv(e);
            });
});
        
function showDiv(e,selection){
    $('#buttonTweet').css({"position":"absolute","left":e.pageX,"top":e.pageY,"display":"block"});
    var linkT = "<a href='https://twitter.com/intent/tweet?original_referer=http%3A%2F%2Flocalhost%3A8888%2Fgenepdf%2Ftarget%2F&text="+selection+"&tw_p=tweetbutton&url=http%3A%2F%2Flocalhost%3A8888%2Fgenepdf%2Ftarget' target='_blank'><img src='css/images/buttonTweet.png' width='32' height='32'></a>";
    $('#buttonTweet').append(linkT);
}

function hiddenDiv(e){
    $('#buttonTweet').empty();
    $('#buttonTweet').css({"display":"none"});
}