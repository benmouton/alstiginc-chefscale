#!/bin/bash
cd /Users/ben/Developer/Chef-Scale
xcodebuild -workspace ios/ChefScale.xcworkspace -scheme "ChefScale" -configuration Debug -destination "generic/platform=iOS" ENABLE_USER_SCRIPT_SANDBOXING=NO CODE_SIGN_IDENTITY="Apple Development" build 2>&1 | tail -5
