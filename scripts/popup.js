var state = document.getElementById('state');
var downloadbtn = document.getElementById('button-download');
var startBtn = document.getElementById('button-start');

const SITE_URL = "https://www.allmusic.com";


downloadbtn.onclick = function(){

	chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
		let tab = tabs[0];
		chrome.runtime.sendMessage({action: "pm_start_download", tabId: tab.id });
	});
	
	
}





