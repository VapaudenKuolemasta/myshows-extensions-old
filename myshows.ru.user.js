// ==UserScript==
// @id 				myshows.me
// @name 			myshows.me
// @version 		4.0.2
// @description 	Добавляет ссылки на поиск торрента и субтитров, плюс прямую ссылку на магнет.
// @include 		http://myshows.me/*
// @match 			http://myshows.me/*
// @homepageURL 	https://github.com/VapaudenKuolemasta/myshows.ru-userscript
// @updateURL 		https://github.com/VapaudenKuolemasta/myshows.ru-userscript/raw/master/myshows.ru.user.js
// @grant 			GM_addStyle
// @grant 			GM_xmlhttpRequest
// ==/UserScript==

// Сделать макет ридми
// Обновлять раз в 10-15 минут, не останавливать аякс совсем, просто запускать его периодически
// Размер релиза форматировать типа 9 999.99
// Убрать нафиг файл со стилями, лишний гемор

// Небольшую менюшку с настройками и возможностью прикрутить свой торент трекер

(function myshows_extention(){
	// Очередь для аяксов
	queue = {};

	// Дефолтные настройки для первого запуска
	var ls = window.localStorage;
	if( ls.getItem('param') === undefined || ls.getItem('param') === null ){
		ls.setItem('param', '720p');
	}
	if( ls.getItem('threads') === undefined || ls.getItem('threads') === null ){
		ls.setItem('threads', '5');
	}
	if( ls.getItem('use_custom_css') === undefined || ls.getItem('use_custom_css') === null ){
		ls.setItem('use_custom_css', '0');
	}
	param = ls.getItem('param');
	threads = ls.getItem('threads'); 
	use_custom_css = ls.getItem('use_custom_css'); 

	GM_addStyle(
		'.fv_icon{'+
			'width: 13px;'+
			'margin: -5px 5px 0 0'+
		'}'+
		'.torrentLinks{'+
			'width:24px;'+
		'}'+
		'.buttonPopup.red{'+
			'background-color:red;'+
		'}'+
		'#cfg_button:hover{'+
			'right:0px;'+
			'bottom:0px;'+
			'transition:0.5s;'+
			'transition-timing-function:ease-out;'+
		'}'+
		'#cfg_button{'+
			'color:#252525;'+
			'transition:0.5s;'+
			'transition-timing-function:ease-out;'+
			'background: none repeat scroll 0 0 #fff;'+
			'border-left: 2px solid #252525;'+
			'border-top: 2px solid #252525;'+
			'border-radius: 10px 0 0 0;'+
			// 'right:-118px;'+
			'right:0px;'+
			// 'bottom:-118px;'+
			'bottom:0px;'+
			'position:fixed;'+
			'width:225px;'+
			'height:225px;'+
		'}'+
		'#cfg_holder{'+
			'padding:5px;'+
		'}'+
		'#cfg_title{'+
			'border-radius: 10px 0 0 0;'+
			'background: none repeat scroll 0 0 #252525;'+
			'color:#fff;'+
			'padding-left:5px;'+
			'padding-top:5px;'+
		'}'+
		'#cfg_title img{'+
			'padding-right:8px;'+
			'padding-bottom:3px;'+
		'}'+
		'#cfg_title input{'+
			'width:auto !important;'+
		'}'+
		'.cfg_tab{'+
			'border-left: 2px solid #ccc;'+
			'border-right: 2px solid #ccc;'+
			'border-bottom: 2px solid #ccc;'+
			'padding:5px;'+
			'display:none;'+
		'}'+
		'.cfg_tab_title{'+
			'border-left: 2px solid #ccc;'+
			'border-bottom: 2px solid #ccc;'+
			'display:inline-block;'+
			'width:33%;'+
			'text-align:center;'+
			'cursor:pointer;'+
		'}'+
		'.cfg_activ_tab{'+
			'border-bottom:0px;'+
		'}'+
		'.cfg_activ{'+
			'width:100%;'+
			'height:100%;'+
			'display:block;'+
		'}'+
		''
	);

	/* BOF Интерфейс */
	function drawSettingsInterface(){
		var cfg_button = document.createElement('div');
		cfg_button.setAttribute('id','cfg_button');
		cfg_button.innerHTML = 
		'<div id="cfg_title">'+
			'<img src="http://myshows.me/favicon.ico">'+
			'<span>Настройки</span>'+
		'</div>'+
		'<div id="cfg_holder">'+
			'<div id="cfg_tabs">'+
				'<div class="cfg_tab_title cfg_activ_tab">Главная</div>'+
				'<div class="cfg_tab_title">CSS</div>'+
				'<div class="cfg_tab_title">Меню</div>'+
			'</div>'+
			
			'<div id="cfg_settings" class="cfg_tab cfg_activ">'+
				'<span>Параметр запроса</span><input type="text" value="'+param+'"/>'+
				'<span>Количество потоков</span><input type="text" value="'+threads+'"/>'+
			'</div>'+
			
			'<div id="cfg_settings" class="cfg_tab">'+
				'<span>Параметр запроса</span><input type="text" value="'+param+'"/>'+
				'<span>Количество потоков</span><input type="text" value="'+threads+'"/>'+
			'</div>'+
			
		'</div>'+
		'';
		document.body.appendChild(cfg_button);
		
		// Обработчик количества потоков
		var input = document.querySelectorAll('#cfg_settings input')[1];
		input.onchange = function() {
			input.value = parseInt(input.value);
			ls.setItem('threads', input.value);
		}
		
		// Обработчик параметра запросов
		var input = document.querySelectorAll('#cfg_settings input')[0];
		input.onchange = function() {
			ls.setItem('param', input.value);
		}
	}
	/* EOF Интерфейс */

	function addMainIcons(){
		var div_seasonBlockBody = document.querySelectorAll('.seasonBlockBody > table > tbody > tr');
		var count = div_seasonBlockBody.length;
		for( i=0; i<count; i++ ){
			/* BOF Достаем название сериала */
			var tmp = div_seasonBlockBody[i].parentElement.parentElement.parentElement.parentElement.getAttribute('data-show-id');
			var serial_name = document.getElementById('s'+tmp).children[0].children[1].textContent;
			
			// Если нет не русского названия
			if( serial_name == '' ){ 
				serial_name = document.getElementById('s'+tmp).children[0].children[0].textContent;
			}
			/* EOF Достаем название сериала */
			
			/* BOF Достаем сезон и эпизод */
			var tmp = div_seasonBlockBody[i].childNodes[1].textContent.split('x');
			var season = tmp[0]>9?tmp[0]:'0'+tmp[0];
			var episode = tmp[1]>9?tmp[1]:'0'+tmp[1];
			var season_episode = 's'+season+'e'+episode;
			/* EOF Достаем сезон и эпизод */
			
			var newTd = document.createElement('td');
			newTd.className = 'torrentLinks';
			newTd.innerHTML =
			'<div class="buttonPopup _download _compact red">'+
				'<ul>'+
					'<li>'+
						'<a target="_blank" href="https://thepiratebay.se/search/'+serial_name+'+'+season_episode+'+'+param+'/0/3/0" rel="nofollow external">'+
							'<img alt="img" class="fv_icon" src="http://thepiratebay.se/static/img/tpblogo_sm_ny.gif" title="Искать '+serial_name+' '+season_episode+' '+param+' на ThePirateBay">'+
							'Искать '+serial_name+' '+season_episode+' '+param+' на ThePirateBay'+
						'</a>'+
					'</li>'+
					'<li>'+
						'<a target="_blank" href="https://www.google.com/search?q='+serial_name+'+'+season_episode+'+'+param+'" rel="nofollow external">'+
							'<img alt="img" class="fv_icon" src="https://www.google.com/images/google_favicon_128.png" title="Искать '+serial_name+' '+season_episode+' '+param+' на ThePirateBay">'+
							'Искать '+serial_name+' '+season_episode+' '+param+' в Google'+
						'</a>'+
					'</li>'+
					'<li>'+
						'<a target="_blank" href="http://www.addic7ed.com/search.php?search='+serial_name+'+'+season_episode+'+'+param+'" rel="nofollow external">'+
							'<img alt="img" class="fv_icon" src="http://cdn.addic7ed.com/favicon.ico" title="Искать '+serial_name+' '+season_episode+' '+param+' на ThePirateBay">'+
							'Искать субтитры к '+serial_name+' '+season_episode+' на Addic7ed'+
						'</a>'+
					'</li>'+
					'<li class="magnet">'+
						'<a target="_blank" href="https://thepiratebay.se/search/'+serial_name+'+'+season_episode+'+'+param+'/0/3/0" rel="nofollow external">'+
							'<img alt="img" class="fv_icon" src="http://myshows.me/shared/img/vfs/ajax-loader.gif" title="Ищу магнет к '+serial_name+' '+season_episode+' на ThePirateBay">'+
							'Ищу магнет к '+serial_name+' '+season_episode+' на ThePirateBay'+
						'</a>'+
					'</li>'+
				'</ul>'+
			'</div>';
			div_seasonBlockBody[i].appendChild(newTd);
			queue[div_seasonBlockBody[i].getAttribute('data-id')] = serial_name+'+'+season_episode+'+'+param;
		}
	}

	function getMagnetPage( episode_id, episode_href ){
		delete queue[episode_id];
		setTimeout( function(){
			GM_xmlhttpRequest({
				method : "GET",
				url : 'https://thepiratebay.se/search/'+episode_href+'/0/3/0',
				onload : function( msg ){
					if( msg ){
						var parsingResult = parseMagnetPage( msg );	
						var tmp = document.querySelector('tr[data-id="'+episode_id+'"] li.magnet a');
						if( tmp != null ){
							if( parsingResult !== 0 ){ // Если нашел магнет
								tmp.setAttribute('href', parsingResult.link );
								tmp.childNodes[0].setAttribute('src','https://thepiratebay.se/static/img/icon-magnet.gif');
								tmp.childNodes[1].textContent = '('+parsingResult.size+' MB) '+parsingResult.name;
							}else{ // Если не нашел магнет
								tmp.childNodes[0].setAttribute('src','https://thepiratebay.se/static/img/trusted.png');
								tmp.childNodes[1].textContent = 'Магнет не найден.';
							}
						}
					}
					var tmp_ei = Object.keys(queue).shift();
					var tmp_eh = queue[tmp_ei]
					if( tmp_ei ){
						getMagnetPage( tmp_ei, tmp_eh );
					}
				}
			});
		},	0 );
	}

	function parseMagnetPage( pageContent ){
		var responseDiv = document.createElement('div');
		responseDiv.innerHTML = pageContent.responseText;
		
		if( responseDiv.getElementsByClassName('detLink').length > 0 ){
			
			var cur_size = 0, index = 0;
			
			var tr_list = responseDiv.querySelectorAll('#searchResult > tbody > tr');
			for (i=0; i<tr_list.length; i++) {
				var new_size = toMib( tr_list[i].children[1].querySelector('.detDesc').childNodes[0].textContent ); 
				if( new_size > cur_size ){ 
					index = i;
					cur_size = new_size;
				}
			}
			
			var r = {
				name : tr_list[index].querySelector('.detName a').childNodes[0].textContent,
				link : tr_list[index].children[1].children[1].getAttribute('href'),
				size : cur_size
			}
			
			return r;
		}else{
			return 0;
		}
	}

	function toMib( size ){
		var regexp = /(\d+(\.\d+|))\s(GiB|KiB|MiB)/;
		var res = regexp.exec( size );
		if( res == null ) return 0;
		switch ( res[3] ) {
			case 'GiB': return ( +res[1] * 1000 );
			case 'KiB': return ( +res[1] * 0.001 );
			case 'MiB': return ( +res[1] );
			default: return 0;
		}
	}
	
	function str_replace(search, replace, subject) {
		for(var i=0; i<search.length; i++) {
			subject.replace(new RegExp (search[i], 'g'), replace[i]);
		}
		return subject;
	}

	// function addSoonBlock(){
		// setTimeout( function(){
			// GM_xmlhttpRequest({
				// method : "GET",
				// url : 'http://myshows.me/',
				// onload : function( answer ){
					// var responseDiv = document.createElement('div');
					// responseDiv.innerHTML = answer.responseText;
					// var seasonBlock = responseDiv.getElementsByClassName('seasonBlock');
					// document.getElementsByTagName('h1')[0].parentElement.insertBefore(seasonBlock[0], document.getElementsByTagName('h1')[0]);
					// document.getElementsByTagName('h1')[0].parentElement.insertBefore(seasonBlock[1], document.getElementsByTagName('h1')[0]);
				// }
			// });
		// },	0 );
	// }

	// drawSettingsInterface();
	addMainIcons();
	for( i=0; i<threads; i++ ){
		getMagnetPage( Object.keys(queue).shift(), queue[Object.keys(queue).shift()] );
	}
	// addSoonBlock();
})();