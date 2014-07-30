// ==UserScript==
// @id 				myshows.ru
// @name 			myshows.ru
// @version 		1.0.4
// @description 	Добавляет ссылки на торрент и субтитры. Добавляет фавикон.
// @include 		http://myshows.ru/*
// @match 			http://myshows.ru/*
// @resource 		myshows-css https://raw.githubusercontent.com/VapaudenKuolemasta/myshows.ru-userscript/master/myshows.ru.css
// @homepageURL 	https://github.com/VapaudenKuolemasta/myshows.ru-userscript
// @updateURL 		https://github.com/VapaudenKuolemasta/myshows.ru-userscript/raw/master/myshows.ru.user.js
// @grant 			GM_addStyle
// @grant 			GM_getResourceText
// ==/UserScript==

param = '720p';

GM_addStyle(GM_getResourceText('myshows-css'));

var icon = document.createElement('link');
icon.setAttribute('type', 'image/x-icon');
icon.setAttribute('rel', 'shortcut icon');
icon.setAttribute('href', 'http://myshows.ru/shared/images/header/logo-tv.gif');

function show_icons(){
	var bss_seri = document.getElementsByClassName('bss_seri');
	var count = bss_seri.length;
	for (i=0; i<count; i++) {
		var episode_arr = bss_seri[i].textContent.split('x');
		var episode_str = 'S'+(episode_arr[0]>9?episode_arr[0]:'0'+episode_arr[0])+'E'+(episode_arr[1]>9?episode_arr[1]:'0'+episode_arr[1]);

		if(bss_seri[i].parentElement.parentElement.parentElement.parentElement.previousElementSibling != null){
			var name = bss_seri[i].parentElement.parentElement.parentElement.parentElement.previousElementSibling
			while(name.tagName == 'DIV'){
				name = name.previousElementSibling;
			}
			name = name.childNodes[1] != null?name.childNodes[1].textContent.substr(3):name.textContent;
			var href = name+'+'+episode_str+'+'+param;

			var newDiv = document.createElement('span');
			newDiv.innerHTML =
			'<a href="https://thepiratebay.se/search/'+href+'/0/3/0" target="_blank">'+
				'<img class="fv_icon" src="http://thepiratebay.se/static/img/tpblogo_sm_ny.gif">'+
			'</a> '+
			'<a href="https://www.google.com/search?q='+href+'+torrent" target="_blank">'+
				'<img class="fv_icon" src="https://www.google.com/images/google_favicon_128.png">'+
			'</a> '+
			'<a href="http://www.addic7ed.com/search.php?search='+href+'" target="_blank">'+
				'<img src="http://cdn.addic7ed.com/favicon.ico">'+
			'</a> '+
			'<a href="http://notabenoid.com/search?t='+name+'" target="_blank">'+
				'<img src="http://notabenoid.com/i/favicon.ico">'+
			'</a> ';

			var bss_link = document.getElementsByClassName('bss_link')[i];
			if(bss_link.childNodes[0]!= null && bss_link.childNodes[0].tagName == 'A'){
				bss_link.insertBefore(newDiv, bss_link.childNodes[0]);
			} else if(bss_link.childNodes[0]== null) {
				bss_link.appendChild(newDiv);
			}	
		}
	}
}

document.getElementsByTagName('head')[0].appendChild(icon);

show_icons();
document.addEventListener( 
	'DOMNodeRemoved', 
	function( e ){
		if(e.relatedNode.className=='') {
			show_icons();
		}
	}, 
	false 
);