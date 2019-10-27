'use strict';

function convertArrayOfObjectsToCSV(args) {
	var result, ctr, keys, columnDelimiter, lineDelimiter, data;

	data = args.data || null;
	if (data == null || !data.length) {
		return null;
	}

	columnDelimiter = args.columnDelimiter || ',';
	lineDelimiter = args.lineDelimiter || '\n';

	keys = Object.keys(data[0]);

	result = '';
	result += keys.join(columnDelimiter);
	result += lineDelimiter;

	data.forEach(function(item) {
		ctr = 0;
		keys.forEach(function(key) {
			if (ctr > 0) result += columnDelimiter;

			result += item[key];
			ctr++;
		});
		result += lineDelimiter;
	});

	return result;
}

const downloadCSV = function(args, data) {
	var data, filename, link;
	var csv = convertArrayOfObjectsToCSV({
		data: data
	});

	console.log('here here');

	if (csv == null) return;

	filename = args.filename || 'export.csv';
	if (!csv.match(/^data:text\/csv/i)) {
		csv = 'data:text/csv;charset=utf-8,' + csv;
	}
	data = encodeURI(csv);
	link = document.createElement('a');
	link.setAttribute('href', data);
	link.setAttribute('download', filename);
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
};

// chrome.webRequest.onCompleted.addListener(function (details) {
// 	console.log( "Rquest details", details );
//   }, {urls: ['https://*.semrush.com/*']});

let saveData = [];
let fileName = '';
let do_get_data = false;

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getDataFromHTML(requestId = false ) {
	if ( ! do_get_data ) {
		return false;
	}
	const $ = jQuery;

	let $list = $('#root .cl-copies-list');
	let downloadBtn = $( '#pm-download-csv-btn' );

	$list.find('.cl-copies-list__copy').each(function() {
		let $item = $(this);
		let url = $('.cl-pla-info__title a', $item).attr('href') || false;
		let name = $('.cl-pla-info__title a .sc-1_3_4-link__content', $item).text();
		let price_txt = $('.cl-pla-info__price', $item).text();
		let price = price_txt.replace(/[^(\d+)\.(\d+)]/g, '');
		let keywords_count = $('.cl-copies-list__keywords-count', $item).text();
		let shop_name = $('.cl-pla-info__store', $item).text();
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
		downloadBtn.text( 'Loading...'+nextNumber+'/'+maxPage )
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
	let downloadBtn = $('<a id="pm-download-csv-btn" class="srf-searchbar__projects__show-project-list js-searchbar-project-list-button"/>');
	downloadBtn.text('Export CSV');
	downloadBtn.attr('href', '#');
	$('.srf-searchbar__projects').append(downloadBtn);
	downloadBtn.css( { 'border-radius': '4px', 'margin-left': '5px', 'background-color': '#4fae33' } );

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
		// console.log('Download file here.......', saveData.length);
		downloadCSV({ filename: fileName + '.csv' }, saveData);
	});

});
