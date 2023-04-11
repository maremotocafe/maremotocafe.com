#!/bin/bash
# Simple script to run the site locally.

set -ex

cmd_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Making sure it's running in the correct directory
cd "$(dirname "${BASH_SOURCE[0]}")"

URL="http://127.0.0.1:1313"

# Opening a tab in the browser with the URL
echo ">> Opening browser at $URL"
if cmd_exists xdg-open; then
    xdg-open "$URL"
elif cmd_exists open; then
    open "$URL"
fi

# Starting the server at the end
echo ">> Starting server"
hugo server --baseURL "$URL"
