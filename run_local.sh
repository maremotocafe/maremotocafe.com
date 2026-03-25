#!/bin/zsh
# Simple script to run the site locally.

set -ex

# Load nvm (Finder/.command files don't source .zshrc)
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

cmd_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Making sure it's running in the correct directory
cd "$(dirname "${0}")"

URL="http://localhost:4321"

# Opening a tab in the browser with the URL
echo ">> Opening browser at $URL"
if cmd_exists xdg-open; then
    xdg-open "$URL"
elif cmd_exists open; then
    open "$URL"
fi

# Starting the server at the end
echo ">> Starting server"
npm run dev
