# ZeroUpload

*Summary: HTML5 drag n' drop and click-to-select multi-file uploading library with "zero interface".*

ZeroUpload is a small (~2.2K gzipped and minified) HTML5 / JavaScript library for uploading files.  It has an easy API to integrate with your web app, providing both drag & drop and click-to-select functionality.  You can also limit the file types, total size and number of files you allow.  The library handles all the details behind the scenes, emitting progress and completion events to your code, but it has no user interface at all.  The UI of your app is yours to design -- we just provide the hooks.

[Check out a live demo here!](http://pixlcore.com/demos/zeroupload/)

## Open Source

ZeroUpload is open source, MIT licensed, and available on GitHub:

https://github.com/jhuckaby/zeroupload

## QuickStart Guide

Grab the `zeroupload.js` file and host it on your server.  Here is a minimal example implementation:

```html
	<script src="//code.jquery.com/jquery-2.0.3.min.js"></script>
	<script src="zeroupload.js"></script>
	
	<div id="mydrop" onClick="ZeroUpload.chooseFiles()">
		Drop files here!  Or click to select!
	</div>
	
	<script>
		$(document).ready( function() {
			ZeroUpload.setURL( 'upload.php' );
			
			ZeroUpload.on('complete', function(response) {
				$('#results').html( '<h2>Upload Complete!</h2><pre>' + response.data + '</pre>' );
			} );
			
			ZeroUpload.init();
			ZeroUpload.addDropTarget( '#mydrop' );
		} );
	</script>
```

The library works by attaching to a DIV to provide a "drop zone" for drag n' drop upload, but you can also explicitly call `ZeroUpload.chooseFiles()` to pop up the standard OS file selection dialog.  You can then register event listeners for things such as upload progress, upload complete, etc.

In your server-side code, the file(s) will arrive as standard HTTP POST file uploads with names `file1`, `file2`, ... `fileN`.  For example, here is how to save the uploaded files to your server using PHP:

```php
	foreach ($_FILES as $key => &$file) {
		if (!move_uploaded_file($file['tmp_name'], basename($file['name']))) {
			die("Failed to save uploaded file '".$file['name']."'. Please check permissions.");
		}
	}
```

## Prerequisites

ZeroUpload relies on jQuery.  You can get it for free from [jQuery.com](http://jquery.com).  Any modern version should work fine, v1.6 or later.

If you are already using another library that conflicts with jQuery (i.e. one that reserves the global `$` variable), you may call `jQuery.noConflict()` and ZeroUpload will still work fine.

## Setting the URL

The first thing you'll want to do is set the target URL for your uploads.  Note that you can customize this per drop zone or per click, which is described below.  But if all your uploads will go to one common URL, you can set it once by calling `ZeroUpload.setURL()`.  Example:

```javascript
	ZeroUpload.setURL( "/path/to/myscript.php" );
```

If you are uploading to a URL on a different domain than the current page, make sure your server script sends back a proper [Access-Control-Allow-Origin](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing) HTTP header.

## Setting a Max File Limit

By default ZeroUpload will allow any number of files to be uploaded at one time.  To enforce a limit, call the `ZeroUpload.setMaxFiles()` function, and pass in an integer.  Example:

```javascript
	ZeroUpload.setMaxFiles( 1 );
```

If a limit is set and the user drops too many files, an error is generated (see [Error Event](#handling-errors) below).  If `chooseFiles()` is called (see [Manually Choosing Files](#manually-choosing-files) below), the selection is limited in the OS file select dialog box itself.

## Setting a Max Upload Size

By default ZeroUpload allows files of any size to be uploaded.  To enforce a size limit, call the `ZeroUpload.setMaxBytes()` function, and pass in an integer representing the maximum number of bytes to allow.  Note that this is measured as all files together, and is not a per-file limit.  Example:

```javascript
	ZeroUpload.setMaxBytes( 8 * 1024 * 1024 ); // 8 MB
```

**Note:** Do not rely on a client-side max file size limitation to protect your server from attacks.  Such limits can easily be overridden via JavaScript bookmarklets, etc. Please make sure to always enforce file upload size limits in your server-side code.

## Setting Allowed File Types

By default ZeroClipboard allows any file types to be selected for upload.  To limit which types of files you want to accept, or which categories (such as images only), call the `ZeroUpload.setFileTypes()` function and pass in one or more [MIME Type](http://en.wikipedia.org/wiki/Internet_media_type) specifiers.  Wildcards are accepted too.  Example:

```javascript
	ZeroUpload.setFileTypes( "image/*", "audio/mpeg" );
```

This would allow *all* image formats, and MPEG / MP3 audio files to be uploaded.  If the user drops a file which doesn't meet your accepted types, an error is generated (see [Error Event](#handling-errors) below).  If `chooseFiles()` is called (see [Manually Choosing Files](#manually-choosing-files) below), the selection is limited to the desired types in the OS file select dialog box itself.

## Initializing

After setting your options (see above), you should initialize the ZeroUpload library by calling `ZeroUpload.init()`.  This should be done after the DOM is ready.  Example:

```javascript
	ZeroUpload.init();
```

## Specifying Drop Targets

To use ZeroUpload for drag n' drop style file uploads, you have to declare one or more drop targets.  These are areas of your page that accept user file drops.  You can activate drops on any block element such as a DIV, or your entire body element.  Either way, the function to call is `ZeroUpload.addDropTarget()`.  Pass in any CSS selector or DOM element (anything jQuery can grok).  Example:

```javascript
	ZeroUpload.addDropTarget( "#mydroparea" );
```

This would activate file drops on the DOM element with ID `#mydroparea`.  To enable a CSS effect as the user is hovering over the element with files in hand, see the [Styling the Drag Hover](#styling-the-drag-hover) section below.

Each drop target may have a customized target URL, query params, and/or a "user data" element for passing arbitrary data to your callback functions.  For more details, see the [URL Params and User Data](#url-params-and-user-data) section below.

## Removing Drop Targets

To detach ZeroUpload from a previously added drop target, i.e. restoring it to its original condition, you should call `ZeroUpload.removeDropTarget()`.  Pass in any CSS selector or DOM element (anything jQuery can grok).  Example:

```javascript
	ZeroUpload.removeDropTarget( "#mydroparea" );
```

## Manually Choosing Files

In addition to drag n' drop, you can also manually pop up the OS file selection dialog for users to choose files for upload, such as in response to a click event.  To do this, call the `ZeroUpload.chooseFiles()` function.  Example:

```javascript
	ZeroUpload.chooseFiles();
```

A typical use of this is to attach it to a click event on a DOM element, so you can style your "Upload" button however you like.  Example:

```html
	<div class="button" onClick="ZeroUpload.chooseFiles();"> Upload Files </div>
```

The selected files are uploaded immediately, and your maximum file limit and file type restrictions are enforced.

Each time you call `chooseFiles()`, you may specify a customized target URL, query params, and/or a "user data" element for passing arbitrary data to your callback functions.  For more details, see the next section.

## URL Params and User Data

ZeroUpload is implemented as a singleton, meaning there can only be one instance per web page.  However, you can customize the target URL, query params, and/or include user data for each drop target, and each call to `chooseFiles()`.

For customizing via drop targets, the `addDropTarget()` function accepts two additional arguments after the CSS selector.  The first one can be a string, which overrides the target URL for uploads, or a hash, which gets serialized into query params on the existing URL set via `setURL()`.  Here are examples of these:

```javascript
	// first, set a default target URL
	ZeroUpload.setURL( "/path/to/default.php" );
	
	// drop target has no additional args, so just use the default URL
	ZeroUpload.addDropTarget( "#droparea1" );
	
	// target specifies a hash, which gets serialized and appended to the URL, e.g.
	//   /path/to/default.php?mykey=My%20Value
	ZeroUpload.addDropTarget( "#droparea2", { mykey: "My Value" } );
	
	// target specifies a string, which completely replaces the target URL
	ZeroUpload.addDropTarget( "#droparea3", "/path/to/different.php" );
```

The URL may also be modified in the same way when calling `chooseFiles()`.  Examples:

```javascript
	ZeroUpload.chooseFiles();
	ZeroUpload.chooseFiles( { mykey: "My Value" } );
	ZeroUpload.chooseFiles( "/path/to/different.php" );
```

In addition to mucking with the URL, these functions also accept an additional, optional argument which is defined as "user data".  It can be any data type you want (number, string, object, etc.), which is then passed to all your callback functions (see [Events](#events) below).  Example:

```javascript
	ZeroUpload.addDropTarget( "#mydroparea", "", { myuploadtype: "drop" } );
	ZeroUpload.chooseFiles( "", { myuploadtype: "click" } );
```

This way you can provide your callback functions with information as to how the files were uploaded (which drop area was used, which click event, etc.).  The two empty strings in the example denote that we aren't modifying the URL, and only specifying user data (but you can do both of course).

## Styling the Drag Hover

You can provide visual feedback when the user is hovering files over your drop zones, via CSS.  ZeroUpload will add a `dragover` class to any drop zone DOM elements where the mouse is hovering with files in tow.  To take advantage of this, simply define a `dragover` CSS class which contains the effects you want.  Here is an example:

```css
	.dragover {
		box-shadow: #00f 0px 0px 8px 2px;
	}
```

This will make all drop zones glow blue when files are hovered over them.  This is the same effect used in the [demo test page](http://pixlcore.com/demos/zeroupload/).

## Events

ZeroUpload fires a number of events in response to various actions taking place.  You can catch these events and execute custom code, such as displaying an upload progress indicator, a completion notice, and/or an error dialog.  To hook events, use the `ZeroUpload.on()` function, and pass in an event name, and a callback function.  Here are all the events you can listen in on:

### Start Event

The `start` event is fired when an upload is started, either from a drag n' drop operation, or from a click event.  You could use this to display an upload progress dialog, letting the user know what is happening.  Example:

```javascript
	ZeroUpload.on( 'start', function(files, userData) {
		// Upload has started!
		// `files` is an array of files queued for upload
		// `userData` is your user data value, if applicable
	} );
```

The `files` argument is a pseudo-array (technically a [FileList](https://developer.mozilla.org/en-US/docs/Web/API/FileList) but can be iterated over like a real array), which contains metadata about each file queued for upload: A `name` property with the file's name (no path), a `size` with the file's size in bytes, a `type` with the file's MIME type, and a `lastModifiedDate` with the file's mod date.

The start event is the one event where you can abort the upload process by returning `false` from your callback function.  This cancels the upload operation before it actually starts.  This can be used, for example, if you wanted to enforce a per-file size limit, or more granular / exact file type requirements.  You could implement the checks inside your start callback, and if the user's files don't match your specifications, simply return `false` (and display your own error message).

### Progress Event

Once the upload starts, ZeroUpload will emit progress events repeatedly (many times per second), which you can catch and update a progress indicator, for example.  An object is passed to your callback function which contains a plethora of properties for you to use, which detail the upload operation currently in progress.  Here is an example:

```javascript
	ZeroUpload.on( 'progress', function(progress, userData) {
		// Upload is in progress.
		// `progress.amount` is the upload progress from 0.0 to 1.0
		// `progress.percent` is the textual percentage, e.g. "50%"
		// 'userData' is your user data value, if applicable.
	} );
```

Here is a list of all the properties available in the `progress` object:

| Property | Type | Notes |
|----------|------|-------|
| `amount` | Number | A floating-point decimal representing the total upload progress, from `0.0` to `1.0`. |
| `percent` | String | A string representing the upload progress, e.g. "45%". |
| `elapsedRaw` | Number | The elapsed time for the upload, in high-res seconds. |
| `elapsedHuman` | String | The elapsed time for the upload, as a human-readable string, e.g. "48 seconds" or "2 minutes". |
| `dataSentRaw` | Number | The number of bytes sent so far, e.g. `4718592`. |
| `dataSentHuman` | String | The amount of data sent so far, as a human-readable string, e.g. "4.5 MB". |
| `dataTotalRaw` | Number | The total number of bytes in the upload, e.g. `10485760`. |
| `dataTotalHuman` | String | The total amount of data in the upload, as a human-readable string, e.g. "10 MB". |
| `dataRateRaw` | Number | The average data rate in bytes sent per second. |
| `dataRateHuman` | String | The average data rate as a human-readable string, e.g. "150 K/sec". |
| `remainingTimeRaw` | Number | Estimated time remaining, represented as a number of seconds. |
| `remainingTimeHuman` | String | Estimated time remaining, as a human-readable string, e.g. "4 minutes". |
| `originalEvent` | Object | A reference to the original AJAX progress event, generated by the browser. |

Hopefully the table is self-explanatory.  Here is a more complete progress example, using more of the properties.  This assumes your page has a DOM element with ID `#progress`.

```javascript
	ZeroUpload.on( 'progress', function(progress, userData) {
		$('#progress').html(
			'<div><strong>Progress:</strong> ' + progress.percent + ', ' + 
				progress.elapsedHuman + ' elapsed</div>' + 
			'<div><strong>Sent:</strong> ' + progress.dataSentHuman + ' of ' + 
				progress.dataTotalHuman + '(' + progress.dataRateHuman + ')</div>' + 
			'<div><strong>Remaining:</strong> ' + progress.remainingTimeHuman + '</div>'
		);
	} );
```

This would produce output like the following:

```
	Progress: 45%, 2 minutes elapsed
	Sent: 4.5 MB of 10 MB (150 K/sec)
	Remaining: 4 minutes
```

A common use for the `amount` property (which will be a number from 0.0 to 1.0) is to render a graphical progress bar, updating the width each time the progress event is fired.  You can do this with CSS.  For example, let's say you have a container element that is 200px wide, and an inner element (with a different background color) that you want to "grow" from left to right.  Here is one way you can implement this:

```javascript
	ZeroUpload.on( 'progress', function(progress, userData) {
		var bar_width = Math.floor( progress.amount * 200 );
		$('#myprogressbar').css( 'width', bar_width + 'px' ); 
	} );
```

Note that you can only register one event listener for each event (the latter prevails), so make sure that you handle all your progress related updates in one call to `ZeroUpload.on()`.

### Complete Event

When the upload is complete, *and we receive a successful HTTP code from the server*, a completion event is fired.  Your callback function is passed an object containing the actual HTTP response code (e.g. 200), the actual raw data from the server (e.g. JSON), and some other properties which are described below.  Here is an example:

```javascript
	ZeroUpload.on( 'complete', function(response, userData) {
		// Upload is complete!
		// `response.code` is the HTTP response code, e.g. 200
		// `response.data` is the raw data from the server
		// 'userData' is your user data value, if applicable.
	} );
```

If your server-side code sends back a JSON response, for example, you'll have to parse it yourself like this:

```javascript
	ZeroUpload.on( 'complete', function(response, userData) {
		// Upload is complete!
		var obj = JSON.parse( response.data );
	} );
```

Here is a list of all the properties available in the `response` object passed to your completion handler:

| Property | Type | Notes |
|----------|------|-------|
| `code` | Number | The HTTP response code from the server, e.g. 200.
| `data` | String | The raw data sent back from the server.
| `statusLine` | String | The HTTP status string, e.g. "OK".
| `xhr` | Object | A reference to the original XHR (AJAX) object.

Note that ZeroUpload decides if the upload operation was "successful" based on the HTTP code sent back from the server.  Successful HTTP response codes are between 200 and 399 inclusive.  Any other number is considered an error, **in which case the completion handler is not called**.  Instead, the `error` event is fired (see next section).

### Error Event

When an error occurs, which can happen before, during or after upload, ZeroUpload throws an `error` event.  Your callback function is passed a unique error identifier string (see below), and a description of the error.  It is highly recommended you include a listener for this event, because the default behavior is to show a JavaScript alert dialog.  Example:

```javascript
	ZeroUpload.on( 'error', function(type, message, userData) {
		// An error occurred!
		// 'type' will be one of the error IDs shown below.
		// 'message' is the error description string.
		// 'userData' is your user data value, if applicable.
		alert("Upload Error: " + message);
	} );
```

An error `type` is provided so you can identify the unique error and provide your own description string, if you want (perhaps in other languages).  Here is a table showing all the possible error types, with example English descriptions:

| Error Type | Example Description |
|------------|---------------------|
| `unsupported` | Your browser is unsupported. |
| `maxfiles` | Too many files were selected. Please only select N. |
| `maxbytes` | File size too large: N bytes |
| `filetype` | File type not accepted: FILENAME (TYPE) |
| `http` | Error uploading files: HTTP 403 Forbidden |
| `ajax` | Error uploading files: Internal Error |

The `http` error type is thrown when a non-successful HTTP response code is sent back from the server, such as 404 (File Not Found), 500 (Internal Server Error), etc.  The `ajax` error type is a internal AJAX error, which is probably either a DNS lookup failure on your target URL, or a cross-domain error.

## User Data on the Server

Here's an advanced tip.  If your user data is a plain object with one or more keys & values, they become HTTP POST parameters sent to your server script.  Meaning, along with the file upload data in `file1`, `file2`, ... `fileN` parameters, all your user data keys and values are included as well.  So for example, if the user drops a file onto a target initialized thusly...

```javascript
	ZeroUpload.addDropTarget( "#mydroparea", "", { myuploadtype: "drop" } );
```

...your server-side script would be passed a `myuploadtype` HTTP POST parameter set to `drop`, along with the binary file upload data.  These values can be accessed using code such as the following (PHP shown here):

```php
	$myuploadtype = $_POST['myuploadtype']; // "drop"
```

This can be useful to store things such as Session IDs or other sensitive data that you don't want visible on the URL query string.

## Browser Support

ZeroUpload should work fine in Safari 5+, Chrome 7+, Firefox 4+, and IE 10+.  For more details, see [XHR2 at CanIUse.com](http://caniuse.com/#feat=xhr2).

## License

The MIT License (MIT)

Copyright (c) 2011 - 2014 Joseph Huckaby

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
