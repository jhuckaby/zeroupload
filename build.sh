#!/bin/bash

# Build Script for ZeroUpload
# Install uglifyjs first: sudo npm install uglify-js -g

uglifyjs zeroupload.js -o zeroupload.min.js --mangle --reserved "ZeroUpload" --preamble "// ZeroUpload v1.0 - http://github.com/jhuckaby/zeroupload - MIT Licensed"
