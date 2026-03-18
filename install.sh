#!/bin/bash
APP_PATH=$(find /Users/ben/Library/Developer/Xcode/DerivedData/ChefScale-*/Build/Products/Debug-iphonesimulator/ChefScale.app -maxdepth 0 2>/dev/null | head -1)
if [ -z "$APP_PATH" ]; then
  echo "ERROR: ChefScale.app not found in DerivedData"
  exit 1
fi
echo "Installing: $APP_PATH"
xcrun simctl install booted "$APP_PATH"
echo "Launching..."
xcrun simctl launch booted com.alstiginc.chefscale
echo "Done! Check the simulator."
