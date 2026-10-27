#!/bin/bash
# Double-click to start Merit on a Mac: installs what it needs the first time, then builds, starts and opens it.
# Close this window to stop Merit.
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo "Merit needs Node.js, which isn't installed on this computer."
  echo "Install it from https://nodejs.org (the LTS version), then double-click this file again."
  read -r -p "Press Enter to close."
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "Getting Merit ready the first time - this takes a minute or two..."
  if ! npm install; then
    echo "Merit could not be installed. Check your internet connection, then try again."
    read -r -p "Press Enter to close."
    exit 1
  fi
fi

echo "Starting Merit..."
MERIT_OPEN_BROWSER=1 npm start
