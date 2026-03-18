#!/bin/bash
cd /Users/ben/Developer/Chef-Scale
xcodebuild -workspace ios/ChefScale.xcworkspace -scheme "ChefScale" -configuration Debug -sdk iphonesimulator -destination "platform=iOS Simulator,name=iPhone 16 Pro Max" ENABLE_USER_SCRIPT_SANDBOXING=NO build 2>&1 | tail -5
