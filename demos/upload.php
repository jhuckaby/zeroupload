<?php

// Example upload handler code for ZeroUpload
// Saves all uploaded files to current directory, preserving original filenames.
// Beware of permissions!

foreach ($_FILES as $key => &$file) {
	if (!move_uploaded_file($file['tmp_name'], basename($file['name']))) {
		die("Failed to save uploaded file '".$file['name']."'. Please check permissions.");
	}
}

// Output debugging information for test page
print_r( $_FILES );

?>
