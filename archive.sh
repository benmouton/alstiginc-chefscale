#!/bin/bash
cd /Users/ben/Developer/Chef-Scale
chmod -R u+w ~/Library/Developer/Xcode/DerivedData/ChefScale-* 2>/dev/null
xcodebuild -workspace ios/ChefScale.xcworkspace -scheme "ChefScale" -configuration Release -destination "generic/platform=iOS" ENABLE_USER_SCRIPT_SANDBOXING=NO archive -archivePath ~/Desktop/ChefScale.xcarchive 2>&1 | grep -E "error:|ARCHIVE SUCCEEDED|ARCHIVE FAILED" | head -15
