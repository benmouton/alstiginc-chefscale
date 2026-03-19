#!/bin/bash
APP_PATH=$(find /Users/ben/Library/Developer/Xcode/DerivedData/ChefScale-*/Build/Products/Debug-iphoneos/ChefScale.app -maxdepth 0 2>/dev/null | head -1)
if [ -z "$APP_PATH" ]; then
  echo "ERROR: ChefScale.app not found for device build"
  exit 1
fi
echo "Installing on device: $APP_PATH"
xcrun devicectl device install app --device "BC6E8E24-B604-533D-A2E6-6EC562DBAF8D" "$APP_PATH"
echo "Launching..."
xcrun devicectl device process launch --device "BC6E8E24-B604-533D-A2E6-6EC562DBAF8D" com.alstiginc.chefscale
echo "Done! Check your iPhone."
