'use strict';

function convertToCSV(objArray) {
	var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
	var str = '';

	for (var i = 0; i < array.length; i++) {
		var line = '';
		for (var index in array[i]) {
			if (line != '') line += ',';

			line += array[i][index];
		}

		str += line + '\r\n';
	}

	return str;
}

function exportCSVFile(items, fileTitle) {
	
	// Convert Object to JSON
	//var jsonObject = JSON.stringify(items);
	var csv = jQuery.csv.fromObjects(items);

	var exportedFilenmae = fileTitle + '.csv' || 'export.csv';

	var blob = new Blob([ csv ], { type: 'text/csv;charset=utf-8;' });
	if (navigator.msSaveBlob) {
		// IE 10+
		navigator.msSaveBlob(blob, exportedFilenmae);
	} else {
		var link = document.createElement('a');
		if (link.download !== undefined) {
			// feature detection
			// Browsers that support HTML5 download attribute
			var url = URL.createObjectURL(blob);
			link.setAttribute('href', url);
			link.setAttribute('download', exportedFilenmae);
			link.style.visibility = 'hidden';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	}
}

// chrome.webRequest.onCompleted.addListener(function (details) {
// 	console.log( "Rquest details", details );
//   }, {urls: ['https://*.semrush.com/*']});

let saveData = [];
let fileName = '';
let do_get_data = false;

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

var headers = {
	name: 'Name',
	price: 'Price',
	keywords_count: 'Keywords Count',
	shop_name: 'Shop Name',
	url: 'URL'
};

async function getDataFromHTML(requestId = false) {
	if (!do_get_data) {
		return false;
	}
	const $ = jQuery;

	let $list = $('#root .cl-copies-list');
	let downloadBtn = $('#pm-download-csv-btn');

	$list.find('.cl-copies-list__copy').each(function() {
		let $item = $(this);
		let url = $('.cl-pla-info__title a', $item).attr('href') || false;
		let name = $('.cl-pla-info__title a .sc-1_3_4-link__content', $item).text();
		let price_txt = $('.cl-pla-info__price', $item).text();
		let price = price_txt.replace(/[^(\d+)\.(\d+)]/g, '');
		let keywords_count = $('.cl-copies-list__keywords-count', $item).text();
		let shop_name = $('.cl-pla-info__store', $item).text();
		name = name.replace(/,/g, '');
		// url = ur
		saveData.push({ name, price, keywords_count, shop_name, url });
	});

	await sleep(500);

	// $('html, body').animate({ scrollTop: $(document).height() }, 300);

	let maxPage = $('#root .sc-1_3_4-pagination .sc-1_3_4-pagination__last-item').text();
	let inputControl = $('#root .sc-1_3_4-pagination .sc-1_3_4-input__control');
	let currentPage = inputControl.val();
	let nextBtn = $('#root .sc-1_3_4-pagination .sc-1_3_4-btn__type_primary').eq(0);
	currentPage = parseInt(currentPage);
	maxPage = parseInt(maxPage);
	if (isNaN(maxPage)) {
		maxPage = 1;
	}
	if (isNaN(currentPage)) {
		currentPage = 1;
	}

	if (currentPage < maxPage) {
		let nextNumber = currentPage + 1;
		inputControl.val(nextNumber);
		// Create a new 'change' event
		downloadBtn.text('Loading...' + nextNumber + '/' + maxPage);
		console.log('Loading...' + nextNumber + '/' + maxPage, saveData.length);
		nextBtn.trigger('click');
		jQuery(document).trigger('pm_next_page', [ nextNumber ]);
	} else {
		jQuery(document).trigger('pm_done_all');
	}
}

chrome.extension.onMessage.addListener(async function(req, sender, sendResponse) {
	if (req.action == 'pm_rpc_done') {
		sendResponse({ status: true });
		//console.log('Content ok Message recieved!');
		await sleep(600);
		getDataFromHTML(req.requestId);
	}

	if (req.action == 'pm_start_download') {
		saveData = [];
		fileName = '';
		getDataFromHTML(req.requestId);
	}
});

jQuery(document).ready(function($) {
	let downloadBtn = $(
		'<a id="pm-download-csv-btn" class="srf-searchbar__projects__show-project-list js-searchbar-project-list-button"/>'
	);
	downloadBtn.text('Export CSV');
	downloadBtn.attr('href', '#');
	$('.srf-searchbar__projects').append(downloadBtn);
	downloadBtn.css({ 'border-radius': '4px', 'margin-left': '5px', 'background-color': '#4fae33' });

	// Start download
	downloadBtn.on('click', function(e) {
		e.preventDefault();
		downloadBtn.text('Loading....');
		do_get_data = true;
		getDataFromHTML();
	});

	jQuery(document).on('pm_done_all', function() {
		do_get_data = false;
		downloadBtn.text('Export CSV');
		fileName = jQuery('#root .cl-elepsis-text__head').text();
		console.log('Download file here.......', saveData.length);
		exportCSVFile( saveData, fileName + '.csv' );
		// downloadCSV({ filename: fileName + '.csv' }, saveData);
	});
});
