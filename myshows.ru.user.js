// ==UserScript==
// @id 				myshows.ru
// @name 			myshows.ru
// @version 		2.0
// @description 	Добавляет ссылки на поиск торрента и субтитров, плюс прямую ссылку на магнет.  Добавляет фавикон.
// @include 		http://myshows.ru/*
// @match 			http://myshows.ru/*
// @resource 		myshows-css https://raw.githubusercontent.com/VapaudenKuolemasta/myshows.ru-userscript/master/myshows.ru.css
// @homepageURL 	https://github.com/VapaudenKuolemasta/myshows.ru-userscript
// @updateURL 		https://github.com/VapaudenKuolemasta/myshows.ru-userscript/raw/master/myshows.ru.user.js
// @grant 			GM_addStyle
// @grant 			GM_getResourceText
// @grant 			GM_xmlhttpRequest
// ==/UserScript==

GM_addStyle(GM_getResourceText('myshows-css'));

var linksPannel = {
	param : '720p',
	
	addMainIcons:function(){
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
				var href = name+'+'+episode_str+'+'+this.param;

				var newDiv = document.createElement('span');
				newDiv.innerHTML =
				'<span class="magnet">'+
					'<img class="fv_icon" src="http://myshows.ru/shared/images/ajax-loader.gif" title="Поиск magnet-ссылки">'+
				'</span>'+
				'<a class="main_link" href="https://thepiratebay.se/search/'+href+'/0/3/0" target="_blank">'+
					'<img class="fv_icon" src="http://thepiratebay.se/static/img/tpblogo_sm_ny.gif" title="Искать серию на ThePirateBay">'+
				'</a> '+
				'<a href="https://www.google.com/search?q='+href+'+torrent" target="_blank">'+
					'<img class="fv_icon" src="https://www.google.com/images/google_favicon_128.png" title="Искать серию в Google">'+
				'</a> '+
				'<a href="http://www.addic7ed.com/search.php?search='+href+'" target="_blank">'+
					'<img src="http://cdn.addic7ed.com/favicon.ico" title="Искать субтитры на Addic7ed">'+
				'</a> '+
				'<a href="http://notabenoid.com/search?t='+name+'" target="_blank">'+
					'<img src="http://notabenoid.com/i/favicon.ico" title="Искать субтитры на Notabenoid">'+
				'</a> ';

				var bss_link = document.getElementsByClassName('bss_link')[i];
				if(bss_link.childNodes[0]!= null && bss_link.childNodes[0].tagName == 'A'){
					bss_link.insertBefore(newDiv, bss_link.childNodes[0]);
				} else if(bss_link.childNodes[0]== null) {
					bss_link.appendChild(newDiv);
				}	
			}
		}
	},
	
	addMagnet:function(){
		var main_link = document.getElementsByClassName('main_link');
		var count = main_link.length;
		for (i=0; i<count; i++) {
			this.getContent( main_link[i].getAttribute('href'), i);
		}
	},
	
	getContent:function( url, index ){
		var _this = this;
		setTimeout( function(){
			GM_xmlhttpRequest({
				method : "GET",
				url : url,
				context:this,
				onload : function( x ){
					var ans = _this.parseContent( x );
					document.getElementsByClassName('magnet')[index].innerHTML = 
						ans.length>2?
						'<a href="'+ans+'" ><img src="https://thepiratebay.se/static/img/icon-magnet.gif" title="Скачать magnet с ThePirateBay"></a>':
						'<img src="https://thepiratebay.se/static/img/trusted.png" title="Ничего не найдено на ThePirateBay">';
				}
			});
		},	0 );
	},
	
	parseContent:function( answer ){
		var responseDiv = document.createElement('div');
		responseDiv.innerHTML = answer.responseText;
		
		if( responseDiv.getElementsByClassName('detLink') != null){
			var links = responseDiv.getElementsByClassName('detLink');
			var descs = responseDiv.querySelectorAll('font.detDesc');
			var count = links.length;
			var webdl_link_size = 0;
			var hd_link_size = 0;
			var webdl_link = 0;
			var hd_link = 0;
			for (i=0; i<count; i++) {
				var cur_size = this.toMiB( descs[i].childNodes[0].textContent )
				if( links[i].text.indexOf('WEB-DL') != -1 ){
					if( cur_size>webdl_link_size ){
						webdl_link_size = cur_size;
						webdl_link = links[i].parentElement.parentElement.querySelector('a[href^=magnet]').getAttribute('href');
					}
				}else{
					if( cur_size > hd_link_size ){
						hd_link_size = cur_size;
						hd_link = links[i].parentElement.parentElement.querySelector('a[href^=magnet]').getAttribute('href');
					}
				}
			}
			return webdl_link_size>0?webdl_link:hd_link;
		}else{
			return 0;
		}
	},
	
	toMiB:function( size ){
		var regexp = /(\d+(\.\d+|))\s(GiB|KiB|MiB)/;
		var res = regexp.exec( size );
		switch ( res[3] ) {
			case 'GiB': return ( +res[1] * 1000);
			case 'KiB': return ( +res[1] * 0.001);
			case 'MiB': return ( +res[1] );
			default: return 0;
		}
	}
}

var icon = document.createElement('link');
icon.setAttribute('type', 'image/x-icon');
icon.setAttribute('rel', 'shortcut icon');
icon.setAttribute('href', 'http://myshows.ru/shared/images/header/logo-tv.gif');
document.getElementsByTagName('head')[0].appendChild(icon);

linksPannel.addMainIcons();
linksPannel.addMagnet();

document.addEventListener( 
	'DOMNodeRemoved', 
	function( e ){
		if(e.relatedNode.className=='') {
			linksPannel.addMainIcons();
			linksPannel.addMagnet();
		}
	}, 
	false 
);