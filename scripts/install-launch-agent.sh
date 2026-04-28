#!/bin/bash
# Installs a LaunchAgent so the markdown editor's dev server starts on every login.
# Run once: bash scripts/install-launch-agent.sh
# Uninstall: bash scripts/install-launch-agent.sh --uninstall

set -e

LABEL="com.markdowneditor.dev"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INSTALL_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PLIST_SRC="${SCRIPT_DIR}/${LABEL}.plist"
PLIST_DEST="${HOME}/Library/LaunchAgents/${LABEL}.plist"

if [[ "$1" == "--uninstall" ]]; then
  if [[ -f "${PLIST_DEST}" ]]; then
    launchctl unload "${PLIST_DEST}" 2>/dev/null || true
    rm "${PLIST_DEST}"
    echo "Uninstalled: ${PLIST_DEST}"
  else
    echo "Not installed."
  fi
  exit 0
fi

if [[ ! -f "${PLIST_SRC}" ]]; then
  echo "Source plist missing: ${PLIST_SRC}"
  exit 1
fi

mkdir -p "${HOME}/Library/LaunchAgents"
mkdir -p "${HOME}/Library/Logs"

# Substitute placeholders with the user's actual paths so the installed plist is portable.
sed \
  -e "s|__INSTALL_DIR__|${INSTALL_DIR}|g" \
  -e "s|__HOME__|${HOME}|g" \
  "${PLIST_SRC}" > "${PLIST_DEST}"

# Reload if already loaded.
launchctl unload "${PLIST_DEST}" 2>/dev/null || true
launchctl load "${PLIST_DEST}"

echo "Installed: ${PLIST_DEST}"
echo "Server starts automatically on login."
echo "Verify:    launchctl list | grep ${LABEL}"
echo "Logs:      tail -f ~/Library/Logs/markdown-editor.log"
echo "Uninstall: bash $(basename "$0") --uninstall"
