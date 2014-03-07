// HTML5 Drag n' Drop and Click-to-Select File Upload Library
// Author: Joseph Huckaby
// Copyright (c) 2011 - 2014 Joseph Huckaby
// License: MIT
// Requires: jQuery

var ZeroUpload = {
	
	url: '', // set this to your server API endpoint
	maxFiles: 0, // max files to allow at once, 0 = infinite
	maxBytes: 0, // max bytes to allow at once, 0 = infinite
	acceptTypes: '', // file mime types to accept
	inited: false, // this is set to true when init() is called
		
	hooks: {
		start: null, // argument: array of files
		progress: null, // argument: float between 0.0 and 1.0
		complete: null, // argument: object with: code (http), data (text)
		error: function(type, msg) { alert("ZeroUpload Error: " + msg); } // argument: error message string
	},
	
	setURL: function(url) {
		// set the target URL to upload files to
		this.url = url; 
	},
	
	setMaxFiles: function(maxFiles) {
		// set the maximum number of files allowed at once
		this.maxFiles = parseInt(maxFiles, 10);
		if (this.fileElem) {
			if (this.maxFiles != 1) this.fileElem.attr('multiple', 'multiple');
			else this.fileElem.removeAttr('multiple');
		}
	},
	
	setMaxBytes: function(maxBytes) {
		// set the maximum number of bytes allowed at once
		this.maxBytes = parseInt(maxBytes, 10);
	},
	
	setFileTypes: function() {
		// set the list of accepted file types, e.g. image/*,audio/*
		this.acceptTypes = Array.prototype.slice.call(arguments, 0).join(",");
		if (this.fileElem) {
			if (this.acceptTypes) this.fileElem.attr('accept', this.acceptTypes);
			else this.fileElem.removeAttr('accept');
		}
	},
	
	init: function() {
		// initialize library
		if (this.inited) return;
		this.inited = true;
		
		// jQuery must be loaded at this point
		if (!window.jQuery) throw "ZeroUpload cannot initialize, because jQuery is not loaded.";
		
		// create file element for clicks
		this.setupFileElem();
	},
	
	setupFileElem: function() {
		// create file system for clicks
		if (this.fileElem) {
			this.fileElem.remove();
		}
		this.fileElem = jQuery(
			'<input type="file" ' + 
			((this.maxFiles != 1) ? 'multiple="multiple"' : '') + 
			(this.acceptTypes ? ('accept="'+this.acceptTypes+'"') : '') +
			' style="display:none"/>'
		)
		.appendTo('body')
		.bind('change', function() {
			if (this.files && this.files.length) {
				ZeroUpload.upload(this.files, ZeroUpload.clickUrlParams, ZeroUpload.clickUserData);
			}
		});
	},
	
	addDropTarget: function(target, urlParams, userData) {
		// public method
		// hook drag n' drop events on target dom object (defaults to document)
		// pass in anything that jQuery accepts (selector)
		if (!target) target = document;
		if (!urlParams) urlParams = null;
		if (!userData) userData = null;
		
		jQuery(target).unbind('dragenter').bind('dragenter', function(e) {
			jQuery(this).addClass('dragover');
			e.preventDefault();
			e.stopPropagation();
			return false;
		})
		.unbind('dragover').bind('dragover', function(e) {
			jQuery(this).addClass('dragover');
			e.preventDefault();
			e.stopPropagation();
			return false;
		})
		.unbind('dragleave').bind('dragleave', function(e) {
			jQuery(this).removeClass('dragover');
			e.preventDefault();
			e.stopPropagation();
			return false;
		})
		.unbind('drop').bind('drop', function(e) {
			jQuery(this).removeClass('dragover');
			if (e.originalEvent.dataTransfer.files.length) {
				e.preventDefault();
				e.stopPropagation();
				ZeroUpload.upload(e.originalEvent.dataTransfer.files, urlParams, userData);
				return false;
			}
		});
	},
	
	removeDropTarget: function(target) {
		// public method
		// remove all hooks on target element
		jQuery(target).unbind('dragenter').unbind('dragover').unbind('dragleave').unbind('drop');
	},
	
	chooseFiles: function(urlParams, userData) {
		// public method
		// prompt user for files to upload
		if (!urlParams) urlParams = null;
		if (!userData) userData = null;
		
		this.clickUrlParams = urlParams;
		this.clickUserData = userData;
		
		this.fileElem[0].click();
	},
	
	upload: function(files, urlParams, userData) {
		// upload one or more files
		if (this.inProgress) return;
		if (!this.url) return;
		if (!window.FormData) return this.dispatch('error', 'unsupported', "Your browser is unsupported.", userData);
		
		// clamp to maxFiles
		var numFiles = files.length;
		if (this.maxFiles && (files.length > this.maxFiles)) {
			// numFiles = this.maxFiles;
			return this.dispatch('error', 'maxfiles', "Too many files were selected. Please only select " + this.maxFiles + ".");
		}
		
		// validate file byte size
		if (this.maxBytes) {
			var totalBytes = 0;
			for (var idx = 0; idx < numFiles; idx++) {
				if (typeof(files[idx].size) == 'number') totalBytes += files[idx].size;
			}
			if (totalBytes > this.maxBytes) {
				return this.dispatch('error', 'maxbytes', "File size too large: " + totalBytes + " bytes");
			}
		}
		
		// validate file types
		if (this.acceptTypes) {
			var regex = new RegExp( '^(' + this.acceptTypes.replace(/\*/g, '.+').replace(/\//g, "\\/").split(/\,\s*/).join('|') + ')$' );
			for (var idx = 0; idx < numFiles; idx++) {
				if (!files[idx].type.match(regex)) {
					return this.dispatch('error', 'filetype', "File type not accepted: " + files[idx].name + " (" + files[idx].type + ")");
				}
			}
		}
		
		// start constructing AJAX object
		var http = new XMLHttpRequest();
		this.inProgress = true;
		
		// add listener for progress (if supported)
		if (http.upload && http.upload.addEventListener) {
			http.upload.addEventListener( 'progress', function(e) {
				if (e.lengthComputable) {
					var progress = ZeroUpload.getUploadProgress(e);
					ZeroUpload.dispatch('progress', progress, userData);
				}
			}, false );
		} // supports progress events
		
		// construct form data object
		var form = new FormData();
		for (var idx = 0; idx < numFiles; idx++) {
			form.append('file' + Math.floor(idx + 1), files[idx]);
		}
		
		// include userData in form data as well
		if (jQuery.isPlainObject(userData)) {
			for (var key in userData) {
				form.append(key, ''+userData[key]);
			}
		}
		
		// listen for completion
		http.onreadystatechange = function() {
			if (http.readyState == 4) {
				var response = {
					code: http.status,
					data: http.responseText,
					statusLine: http.statusText,
					xhr: http
				};
				ZeroUpload.inProgress = false;
				if ((response.code >= 200) && (response.code < 400)) {
					// http codes 200 thru 399 are generally considered "successful"
					ZeroUpload.dispatch('complete', response, userData);
				}
				else {
					// http codes out of the 200 - 399 range are generally considered errors
					if (response.code) {
						ZeroUpload.dispatch('error', 'http', "Error uploading files: HTTP " + response.code + " " + response.statusLine);
					}
					else {
						ZeroUpload.dispatch('error', 'ajax', "Error uploading files: Internal Error", userData);
					}
				} // error
			} // readyState 4
		}; // onreadystatechange
		
		var result = this.dispatch('start', files, userData);
		if (false === result) {
			// user code aborted
			this.inProgress = false;
			return false;
		}
		
		// construct url
		var url = '' + this.url;
		if (urlParams) {
			if (typeof(urlParams) == 'string') {
				// string, replace entire url
				url = urlParams;
			}
			else if (jQuery.isPlainObject(urlParams)) {
				// object, add key/value pairs to query string on url
				for (var key in urlParams) {
					url += (url.match(/\?/) ? '&' : '?') + key + '=' + encodeURIComponent(urlParams[key]);
				}
			}
		}
		
		// mark the time (for calculating progress)
		this.timeStart = this.timeNow();
		
		// begin upload
		try {
			http.open('POST', url, true);
			http.send(form);
		}
		catch (e) {
			this.inProgress = false;
			this.dispatch('error', 'ajax', "Error uploading files: " + e.toString(), userData);
		}
		
		// recreate file element for clicks
		this.setupFileElem();
	},
	
	on: function(name, callback) {
		// set callback hook
		name = name.replace(/^on/i, '').toLowerCase();
		
		if (typeof(this.hooks[name]) == 'undefined')
			throw "Event type not supported: " + name;
		
		this.hooks[name] = callback;
	},
	
	dispatch: function() {
		// fire event callback, passing optional values to it
		var name = arguments[0].replace(/^on/i, '').toLowerCase();
		var args = Array.prototype.slice.call(arguments, 1);
		
		if (this.hooks[name]) {
			if (typeof(this.hooks[name]) == 'function') {
				// callback is function reference, call directly
				return this.hooks[name].apply(this, args);
			}
			else if (typeof(this.hooks[name]) == 'array') {
				// callback is PHP-style object instance method
				return this.hooks[name][0][this.hooks[name][1]].apply(this.hooks[name][0], args);
			}
			else if (window[this.hooks[name]]) {
				// callback is global function name
				return window[ this.hooks[name] ].apply(window, args);
			}
			else {
				throw "Event listener not a function: " + name;
			}
		}
		return true; // no hook defined, passthrough
	},
	
	timeNow: function() {
		// return high-res Epoch seconds for the current time
		var now = new Date();
		return ( now.getTime() / 1000 );
	},
	
	getTextFromBytes: function(bytes) {
		// convert raw bytes to english-readable format
		bytes = parseInt(bytes, 10);
		if (bytes >= 1024) {
			bytes = parseInt( (bytes / 1024) * 10, 10 ) / 10;
			if (bytes >= 1024) {
				bytes = parseInt( (bytes / 1024) * 10, 10 ) / 10;
				if (bytes >= 1024) {
					bytes = parseInt( (bytes / 1024) * 10, 10 ) / 10;
					return bytes + ' GB';
				} 
				else return bytes + ' MB';
			}
			else return bytes + ' K';
		}
		else return bytes + ' bytes';
	},
	
	getTextFromSeconds: function(sec, quantize) {
		// convert raw seconds to human-readable relative time
		var neg = '';
		sec = parseInt(sec, 10);
		if (sec < 0) { sec =- sec; neg = '-'; }
		
		var text = "second";
		var amt = sec;
		if (quantize) {
			// optionally quantize to N seconds (for smoothing remaining time)
			var mod = amt % quantize;
			if (mod) amt = (amt - mod) + quantize;
		}
		
		if (sec > 59) {
			var min = parseInt(sec / 60, 10);
			sec = sec % 60;
			text = "minute"; 
			amt = min;
			
			if (min > 59) {
				var hour = parseInt(min / 60, 10);
				min = min % 60;
				text = "hour"; 
				amt = hour;
				
				if (hour > 23) {
					var day = parseInt(hour / 24, 10);
					hour = hour % 24;
					text = "day"; 
					amt = day;
					
					if (day > 29) {
						// Note: month is approximate
						var month = parseInt(day / 30, 10);
						day = day % 30;
						text = "month"; 
						amt = month;
					} // day > 29
				} // hour > 23
			} // min > 59
		} // sec > 59
		
		var output = amt + " " + text;
		if (amt != 1) output += "s";
		return(neg + output);
	},
	
	getUploadProgress: function(e) {
		// calculate upload progress, return various information
		var now = this.timeNow();
		var elapsed = now - this.timeStart;
		var amount = e.loaded / e.total;
		var rate = (elapsed > 0) ? (e.loaded / elapsed) : 0;
		var sec_remain = -1;
		var human_remain = '';
		
		if (amount > 0) {
			sec_remain = parseInt(((1.0 - amount) * elapsed) / amount, 10);
			human_remain = this.getTextFromSeconds( sec_remain, 10 );
		}
		
		return {
			elapsedRaw: elapsed,
			elapsedHuman: this.getTextFromSeconds(elapsed),
			amount: amount,
			percent: '' + Math.floor(amount * 100) + '%',
			dataSentRaw: e.loaded,
			dataSentHuman: this.getTextFromBytes(e.loaded),
			dataTotalRaw: e.total,
			dataTotalHuman: this.getTextFromBytes(e.total),
			dataRateRaw: rate,
			dataRateHuman: this.getTextFromBytes(rate) + '/sec',
			remainingTimeRaw: sec_remain,
			remainingTimeHuman: human_remain,
			originalEvent: e
		};
	}
	
};
