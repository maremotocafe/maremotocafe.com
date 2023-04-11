#!/bin/bash
# Simple script to run the site in the local network.

set -ex

cmd_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Making sure it's running in the correct directory
cd "$(dirname "${BASH_SOURCE[0]}")"

# Obtaining the IP with `ip`, or in case it's not installed, `ifconfig`.
if cmd_exists ip; then
    PRIVATE_IP=$(ip route get 1 | awk '{print $(NF-2);exit}')
else
    PRIVATE_IP=$(ifconfig | sed -En 's/127.0.0.1//;s/.*inet (addr:)?(([0-9]*\.){3}[0-9]*).*/\2/p')
fi
URL="http://$PRIVATE_IP:1313"

# Opening a tab in the browser with the URL
echo ">> Opening browser at $URL"
if cmd_exists xdg-open; then
    xdg-open "$URL"
elif cmd_exists open; then
    open "$URL"
fi

# Starting the server at the end
echo ">> Starting server"
hugo server --bind "$PRIVATE_IP" --baseURL "$URL"
