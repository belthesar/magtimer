
<html>

<SCRIPT LANGUAGE="JavaScript">

// MAGFEST TIMER
// I DIDN'T KNOW ABOUT JQUERY WHEN I WROTE THIS FOREVER AGO. I SORRY.
// license: TBD, for now don't sell this as a standalone program.
// (c) 2011 Dominic Cerquetti

var MINS_TIL_LAST_SONG_WARNING   = 6  * 60;
var MINS_TIL_LAST_SONG_MUST_STOP = 3  * 60;

// don't set these directly
var g_current_time_left = 0;
var g_is_countdown_enabled = false;
var g_is_setup_timer_active = true;
var g_crazy_blink = false;

var g_timer_call_is_cued = false;

// set these directly:
var g_setup_time = 0;
var g_playing_time = 0;

function supports_html5_storage() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}

function local_store_set(name, value)
{
	if (!supports_html5_storage()) {
		return;
	}
	
	localStorage[name] = value;
}

function local_store_get(name, defaultvalue)
{
	if (!supports_html5_storage() || localStorage[name] === null) {
		return defaultvalue;
	}
	
	return localStorage[name];
}


function pad_with_zeroes(number, length) 
{
    var str = '' + number;
    while (str.length < length) {
        str = '0' + str;
    }
   
    return str;
}

function set_timer_display(time_in_seconds) 
{
	// calculate the values
	var secs =  parseInt( time_in_seconds)             % 60;
	var mins =  parseInt( time_in_seconds  / 60)       % 60;
	var hours = parseInt((time_in_seconds  / 60) / 60) % 12;
	
	// add some leading zeroes (i.e. 5 seconds becomes "05")
	var disp_secs = pad_with_zeroes(secs,2);
	var disp_mins = pad_with_zeroes(mins,2);
	var disp_hours = hours;

	document.getElementById("timer").innerHTML = hours + ":" + disp_mins + ":" + disp_secs;
}

function on_countdown_finished() 
{
	// alert("DONE!");
	update_display();
}

function set_bgcolor(color) {
	document.getElementById("bgtable").style.backgroundColor=color;
}

function set_crazy_blink(onoff) 
{
	g_crazy_blink = onoff;
	update_crazy_blink();
}

function update_crazy_blink() 
{
	if (!g_crazy_blink) {
		set_bgcolor('#000000');
		return;
	}
	
	var r = Math.floor(Math.random()*256).toString(16);
	var g = Math.floor(Math.random()*256).toString(16);
	var b = Math.floor(Math.random()*256).toString(16);
	
	set_bgcolor('#' + r + g + b);
	
	setTimeout("update_crazy_blink()", 30); // as much as possible
}

function update_display() 
{
	set_timer_display( g_current_time_left );
	
	var start_stop_link = document.getElementById("start_stop_link")
	if (g_is_countdown_enabled) {
		start_stop_link.innerHTML = "[Pause]";
	} else {
		start_stop_link.innerHTML = "[GO!]";
	}
	
	var msg = document.getElementById("msg");

	if (g_is_countdown_enabled) {
		set_crazy_blink(is_end_of_timer());
	}
	
	if (is_end_of_timer()) {
		msg.innerHTML = "<font color=red>TIME OVER!</font>";
	} else if (!g_is_countdown_enabled) {
		msg.innerHTML = "<font color=blue>-paused-</font>";
	} else if (g_is_setup_timer_active) {
		msg.innerHTML = "<font color=grey>BAND SETUP</font>";
	} else {	
		if (g_current_time_left < MINS_TIL_LAST_SONG_MUST_STOP) {
			msg.innerHTML = "<font color=red>NO MORE SONGS</font>";
		} else if (g_current_time_left < MINS_TIL_LAST_SONG_WARNING) {
			msg.innerHTML = "<font color=yellow>ONLY 1 MORE SONG</font>";
		} else {
			msg.innerHTML = "<font color=green>OK TO PLAY NEXT SONG</font>";
		}
	}
	
	var play_time = document.getElementById("play_time");
	var setup_time = document.getElementById("setup_time");
	
	setup_time.innerHTML = g_setup_time / 60;
	play_time.innerHTML = g_playing_time / 60;
}

// set everything to OFF and original values for timers.
function reset_timers() 
{	
	reset_timer_state();
	g_is_countdown_enabled = false;
	update_display();
	set_crazy_blink(false);
}

function reset_timer_state()
{
	// use the setup timer first, and if it's zero, use the real one.
	if (g_setup_time > 0) {
		g_current_time_left = g_setup_time;
		g_is_setup_timer_active = true;
	} else {
		g_current_time_left = g_playing_time;
		g_is_setup_timer_active = false;
	}
}

function switch_to_play_timer() {
	g_is_setup_timer_active = false; 
	g_current_time_left = g_playing_time;
	g_current_time_left++; // cause we decrement below
	update_display();
}

function on_one_second_passed() 
{
	g_timer_call_is_cued = false;

	if (!g_is_countdown_enabled) {
		return;
	}

	if (g_current_time_left == 0) {
		// current timer reached zero
		
		if (g_is_setup_timer_active) {
			switch_to_play_timer();
		} else {
			// really done.
			on_countdown_finished();
			g_is_countdown_enabled = false;
			update_display();
			return;
		}
	}
	
	--g_current_time_left;	
	update_display();

	g_timer_call_is_cued = true;
	setTimeout("on_one_second_passed()",1000);
}

function is_end_of_timer()
{
	return g_current_time_left == 0 && !g_is_setup_timer_active;
}

function toggle_countdown()
{
	g_is_countdown_enabled = !g_is_countdown_enabled;
	
	var start_countdown = g_is_countdown_enabled || is_end_of_timer();
	
	if (is_end_of_timer()) {
		reset_timer_state();
	}
		
	if (start_countdown) {

		// we need the is_cued thing to make sure that 
		// if user spams the spacebar that multiple timer calls
		// don't happen at once, or else it will cause the clock
		// to tick faster than once per second, which would suck.
		if (!g_timer_call_is_cued) {
			g_timer_call_is_cued = true;
			setTimeout("on_one_second_passed()", 1000);
		}
	}
	
	update_display();
}

function prompt_for_setup_time() 
{
	var old_time = g_setup_time;
	g_setup_time = prompt("enter setup time, in minutes", g_setup_time / 60) * 60;
	if (old_time == g_setup_time) {
		return;
	}
	
	g_is_countdown_enabled = false;
	reset_timers();
	
	local_store_set('g_setup_time', g_setup_time);
	
	update_display();
}

function prompt_for_play_time()
{
	var old_time = g_playing_time;
	g_playing_time = prompt("enter playing time, in minutes", g_playing_time / 60) * 60;
	if (old_time == g_playing_time) {
		return;
	}
	
	g_is_countdown_enabled = false;
	reset_timers();
	
	local_store_set('g_playing_time', g_playing_time);
	
	update_display();
}

function page_load() 
{
	// TEST g_setup_time = 1;
	// TEST g_playing_time = 15;

	g_playing_time = local_store_get('g_playing_time', 0);
	g_setup_time =   local_store_get('g_setup_time', 0);

	if (isNaN(g_playing_time)) {
		g_playing_time = 0;
	}
	
	if (isNaN(g_setup_time)) {
		g_setup_time = 0;
	}
	
	reset_timers();
	
	update_display();
}

var g_dash_count = 0;
function on_key(e)
{
	if (!e) var e = window.event; 
		
	if (e.keyCode) { 
		code = e.keyCode; 
	} else if (e.which) { 
		code = e.which; 
	} 
	
	var key = String.fromCharCode(code);
	
	switch (key) {
		case ' ':
			toggle_countdown();
			break;
		case 'R':
			reset_timers();
			break;
		case 'S':
			switch_to_play_timer();
			break;
		case '1':
			prompt_for_setup_time();
			break;
		case '2':
			prompt_for_play_time();
			break;
			
		// debug junk. press 9 key three times then you can press '0' to skip 30 sec
		case '9':
			g_dash_count++;
			if (g_dash_count > 3) {
				g_dash_count = 0;
			}
			break;
		case '0':
			if (g_dash_count == 3) {
				g_current_time_left -= 30;
				if (g_current_time_left < 0) {
					g_current_time_left = 0;
				}
				update_display();
			}
			break;
		case 'B':
			if (g_dash_count == 3) {
				set_crazy_blink(!g_crazy_blink);	
			}
			break;
		default:
			break;
	}
}

</SCRIPT>

<style>
.big
{
font-size:2000%;
font-weight: bold;
color:#ffffff
}
.msg
{
font-size:800%;
font-weight: bold;
color:#aaaaaa
letter-spacing:-10px
}
</style>

<body bgcolor="black" text="red" style="overflow: hidden" link="red" vlink="red" alink="white" onload="page_load();" onkeyup="on_key()">

<center>
<table border="0" width="1024" height="740" cellspacing="0" cellpadding="0" id="bgtable">
<tr>
<td valign=center border=0>

<center>
<span id="timer" class="big">00:00:00</span>
<span id="msg" class="msg">SETUP TIME</span>
</center>

</td>
</tr>

<tr>
<td height=0 align="right" valign="bottom">
<font size=-1>
<A HREF="javascript:void(0)" onclick="prompt_for_setup_time();">Set Setup Time</A> |
<A HREF="javascript:void(0)" onclick="prompt_for_play_time();">Set Playing Time</A> | 
<A HREF="javascript:void(0)" id="start_stop_link" onclick="toggle_countdown();">[GO!]</A>
<A HREF="javascript:void(0)" onclick="reset_timers();">[RESET]</A>
<A HREF="javascript:void(0)" onclick="switch_to_play_timer();">[SKIP SETUP]</A>
<br/>
<font color=grey>
Magfest Timer (c) 2011 Dominic Cerquetti v1.1 7/23/11 | Setup(min)=<span id="setup_time">X</span> | Play(min)=<span id="play_time">X</span>
</font>
</td>
</tr>
</table>
</center>

</body>
</html>
