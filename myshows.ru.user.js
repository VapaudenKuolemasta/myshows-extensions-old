// ==UserScript==
// @id 				myshows.me
// @name 			myshows.me
// @version 		4.0.3
// @description 	Добавляет ссылки на поиск торрента и субтитров, плюс прямую ссылку на магнет.
// @include 		http://myshows.me/*
// @match 			http://myshows.me/*
// @homepageURL 	https://github.com/VapaudenKuolemasta/myshows.ru-userscript
// @updateURL 		https://github.com/VapaudenKuolemasta/myshows.ru-userscript/raw/master/myshows.ru.user.js
// @grant 			GM_addStyle
// @grant 			GM_xmlhttpRequest
// ==/UserScript==

// Сделать макет ридми

(function myshows_extention(){
	queue = {}; // Очередь для аяксов
	const_list = [ "%_SERIAL_NAME_%", "%_SERIAL_NAME_RUS_%", "%_SEASON_%", "%_SEASON_0_%", "%_EPISODE_%", "%_EPISODE_0_%", "%_SEASON_EPISODE_%", "%_REQUEST_PARAM_%" ]; // Массив констант

	/* Begin Дефолтные настройки для первого запуска */
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
	if( ls.getItem('custom_css') === undefined || ls.getItem('custom_css') === null ){
		ls.setItem('custom_css', "/* Делаем записи плотнее */\n.seasonBlockBody table td {\n\tpadding: 0.3rem;\n}\n\n/* Чуть уменьшаем ряд с сезоном */\n.seasonBlockHeader {\n\tline-height: 2rem;\n}\n\n/* Прячем непросмотренное время */\n.showHeaderMeta{\n\tdisplay:none;\n}\n\n" );
	}
	if( ls.getItem('engine_list') === undefined || ls.getItem('engine_list') === null ){
		ls.setItem('engine_list', '{"ul_list":[{"id":"0","stat":"1", "name":"ThePirateBay", "icon":"http://thepiratebay.se/static/img/tpblogo_sm_ny.gif", "desc":"Искать %_SERIAL_NAME_% %_SEASON_EPISODE_% %_REQUEST_PARAM_% на ThePirateBay", "href":"https://thepiratebay.se/search/%_SERIAL_NAME_%+%_SEASON_EPISODE_%+%_REQUEST_PARAM_%/0/3/0"},{"id":"1","stat":"1", "name":"Google", "icon":"https://www.google.com/images/google_favicon_128.png", "desc":"Искать %_SERIAL_NAME_% %_SEASON_EPISODE_% %_REQUEST_PARAM_% в Google", "href":"https://www.google.com/search?q=%_SERIAL_NAME_%+%_SEASON_EPISODE_%+%_REQUEST_PARAM_%"},{"id":"2","stat":"1", "name":"Addic7ed", "icon":"http://cdn.addic7ed.com/favicon.ico", "desc":"Искать субтитры к %_SERIAL_NAME_% %_SEASON_EPISODE_% на Addic7ed", "href":"http://www.addic7ed.com/search.php?search=%_SERIAL_NAME_%+%_SEASON_EPISODE_%"}],"last_id":"2"}');
	}
	
	param = ls.getItem('param');
	threads = ls.getItem('threads'); 
	use_custom_css = +ls.getItem('use_custom_css'); 
	custom_css = ls.getItem('custom_css'); 
	engine_list = JSON.parse(localStorage.getItem('engine_list'));
	/* End Дефолтные настройки для первого запуска */

	/* Begin Интерфейс */
	function drawSettingsInterface(){
		var cfg_button = document.createElement('div');
		var ul_list = engine_list.ul_list;	

		var inner_html = '<table width="100%" class="firmTable">';
		for(var j = 0; j < ul_list.length; j++) {
			var obj = ul_list[j];
			inner_html += 
			'<tr data-rec-id="'+obj.id+'">'+
				'<td><input class="cfg_select_engine" type="checkbox" '+(+obj.stat == 1?"checked":"")+'></td>'+
				'<td><span>'+obj.name+'</span></td>'+
				'<td><a class="red" href="#">X</a></td>'+
			'</tr>';
		}
		inner_html += '</table>';
		
		cfg_button.setAttribute('id','cfg_button');
		cfg_button.innerHTML = 
		'<div id="cfg_title">'+
			'<img src="http://myshows.me/favicon.ico">'+
			'<span>Настройки</span>'+
		'</div>'+
		'<div id="cfg_holder">'+
			'<div id="cfg_tabs">'+
				'<div data-tab-id="cfg_settings" class="cfg_tab_title cfg_activ_tab">Главная</div>'+
				'<div data-tab-id="cfg_css" class="cfg_tab_title">CSS</div>'+
				'<div data-tab-id="cfg_ul_menu" class="cfg_tab_title">Меню</div>'+
			'</div>'+
			
			'<div id="cfg_settings" class="cfg_tab cfg_activ">'+
				'<span>Параметр запроса</span><input type="text" name="param" value="'+param+'"/>'+
				'<span>Количество потоков</span><input type="text" name="threads" value="'+threads+'"/>'+
			'</div>'+
			
			'<div id="cfg_css" class="cfg_tab">'+
				'<label><input id="cfg_checkbox" type="checkbox" '+(use_custom_css?"checked":"")+'/><span>Применять CSS</span></label>'+
				'<textarea id="cfg_textarea">'+custom_css+'</textarea>'+
				'<a href="#" id="cfg_save_css">Сохранить</a>'+
			'</div>'+
			
			'<div id="cfg_ul_menu" class="cfg_tab">'+
				'<a href="#" id="cfg_show_add_panel">Панель добавления поисковика</a>'+
				'<div id="cfg_add_panel">'+
					'<table width="100%">'+
						'<tr>'+
							'<td><span>Название</span></td>'+
							'<td><input type="text" id="cfg_new_search_name"></td>'+
						'</tr>'+
						'<tr>'+
							'<td><span>Иконка</span></td>'+
							'<td><input type="text" id="cfg_new_search_icon"></td>'+
						'</tr>'+
						'<tr>'+
							'<td><span>Текст</span></td>'+
							'<td><input type="text" id="cfg_new_search_desc"></td>'+
						'</tr>'+
						'<tr>'+
							'<td><span>Ссылка</span></td>'+
							'<td><input type="text" id="cfg_new_search_href"></td>'+
						'</tr>'+
					'</table>'+
					'<a href="#">Добавить поисковик</a>'+
				'</div>'+
				inner_html+
			'</div>'+
			
		'</div>'+
		'';
		document.body.appendChild(cfg_button);
		
		// Обработчик параметра запросов
		var input_param = document.querySelector('#cfg_settings input[name="param"]');
		input_param.onchange = function() {
			ls.setItem('param', input_param.value);
		}
		
		// Обработчик количества потоков
		var input_threads = document.querySelector('#cfg_settings input[name="threads"]');
		input_threads.onchange = function() {
			input_threads.value = parseInt(input_threads.value);
			ls.setItem('threads', input_threads.value);
		}
		
		// Переключатель вкладок
		var div = document.getElementsByClassName("cfg_tab_title");
		for( i=0; i<div.length; i++ ){
			div[i].onclick = function () {
				if( !this.classList.contains('cfg_activ_tab') ){
					for( j=0; j<div.length; j++ ){
						div[j].classList.remove('cfg_activ_tab');
						document.getElementsByClassName("cfg_tab")[j].classList.remove('cfg_activ');
					}		
					this.classList.add('cfg_activ_tab');
					document.getElementById( this.getAttribute('data-tab-id') ).classList.add('cfg_activ');
				}
			}
		}
		
		// Подключить/отключить поисковик из списка
		var cfg_select_engine = document.getElementsByClassName('cfg_select_engine');
		for( i=0; i<cfg_select_engine.length; i++ ){
			cfg_select_engine[i].onchange = function(){
				for(j=0; j<engine_list.ul_list.length; j++){	
					var obj = engine_list.ul_list[j];
					if( obj.id == this.parentElement.parentElement.getAttribute('data-rec-id') ){
						engine_list.ul_list[j].stat = this.checked?"1":"0";
						ls.setItem('engine_list', JSON.stringify( engine_list ) );
					}
				}
			}
		}
		
		// Показываем/скрываем панель с добавлением
		var show_pannel = document.getElementById('cfg_show_add_panel');
		show_pannel.onclick = function() {
			if( document.getElementById('cfg_add_panel').style.display == "block" ){
				document.getElementById('cfg_add_panel').style.display="none";
			}else{
				document.getElementById('cfg_add_panel').style.display="block";
			}
			return false;
		}
		
		// Обработчик добавления поисковика
		
		// Обработчик удаления поисковика
		
		// Подключаем или отключаем CSS
		var chkbox = document.getElementById('cfg_checkbox');
		chkbox.onchange = function() {
			ls.setItem('use_custom_css', this.checked?1:0 );
		}
		
		// Сохраняем CSS
		var cfg_save_css = document.getElementById('cfg_save_css');
		cfg_save_css.onclick = function() {
			ls.setItem('custom_css', document.getElementById('cfg_textarea').value );
			return false;
		}
	}
	/* End Интерфейс */

	function addMainIcons(){
		var div_seasonBlockBody = document.querySelectorAll('.seasonBlockBody > table > tbody > tr');
		var count = div_seasonBlockBody.length;
		for( i=0; i<count; i++ ){
			/* Begin Достаем название сериала */
			var tmp = div_seasonBlockBody[i].parentElement.parentElement.parentElement.parentElement.getAttribute('data-show-id');
			var serial_name = document.getElementById('s'+tmp).children[0].children[1].textContent;
			var serial_name_rus = document.getElementById('s'+tmp).children[0].children[0].textContent;
			
			
			// Если нет не русского названия
			if( serial_name == '' ){ 
				serial_name = serial_name_rus;
			}
			/* End Достаем название сериала */
			
			/* Begin Достаем сезон и эпизод */
			var tmp = div_seasonBlockBody[i].childNodes[1].textContent.split('x');
			var season = tmp[0]>9?tmp[0]:'0'+tmp[0];
			var episode = tmp[1]>9?tmp[1]:'0'+tmp[1];
			var season_episode = 's'+season+'e'+episode;
			/* End Достаем сезон и эпизод */
			
			var replace_list = [ serial_name, serial_name_rus, tmp[0], season, tmp[1], episode, season_episode, param ]; 
	
			var newTd = document.createElement('td');
			newTd.className = 'torrentLinks';
			
			var inner_html = '';
			var ul_list = engine_list.ul_list;	
			for(var j = 0; j < ul_list.length; j++) {
				var obj = ul_list[j];
				if( obj.stat == 1 ){
					inner_html += 
					'<li><a target="_blank" href="'+str_replace(const_list, replace_list, obj.href)+'" rel="nofollow external"><img alt="img" class="fv_icon" src="'+obj.icon+'">'+str_replace(const_list, replace_list, obj.desc)+'</a></li>';
				}
			}
			
			newTd.innerHTML =
			'<div class="buttonPopup _download _compact red">'+
				'<ul>'+inner_html+
					'<li class="magnet">'+
						'<a target="_blank" href="https://thepiratebay.se/search/'+serial_name+'+'+season_episode+'+'+param+'/0/3/0" rel="nofollow external">'+
							'<img alt="img" class="fv_icon" src="http://myshows.me/shared/img/vfs/ajax-loader.gif">'+
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
			subject = subject.replace(new RegExp(search[i], 'g'), replace[i]);
		}
		return subject;
	}
	
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
		'a.red{'+
			'color:red;'+
			'text-align:right;'+
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
			'width:320px;'+
			'height:325px;'+
		'}'+
		'#cfg_holder{'+
			'padding:5px;'+
		'}'+
		'#cfg_add_panel{'+
			'display:none;'+
			'border: 2px solid #ccc;'+
			'padding:5px;'+
			'margin-top:5px;'+
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
		'#cfg_textarea{'+
			'height:220px;'+
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

	// drawSettingsInterface();
	addMainIcons();
	for( i=0; i<threads; i++ ){
		getMagnetPage( Object.keys(queue).shift(), queue[Object.keys(queue).shift()] );
	}
	if( use_custom_css ){
		GM_addStyle( custom_css );
	}
})();