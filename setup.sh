#!/usr/bin/env bash
# setup.sh -- OS detection launcher for Yr Weather Extension
# Run this script from the project root:
#   chmod +x setup.sh && ./setup.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

detect_os() {
    case "$(uname -s)" in
        Linux*)   echo "linux";;
        Darwin*)  echo "mac";;
        CYGWIN*|MINGW*|MSYS*) echo "win";;
        *)        echo "unknown";;
    esac
}

OS="$(detect_os)"

echo "============================================"
echo "  Yr Weather Extension -- Setup"
echo "============================================"
echo ""
echo "Detected OS: $OS"
echo ""

case "$OS" in
    linux)
        echo "Starting Linux setup..."
        echo ""
        exec bash "$SCRIPT_DIR/setup_linux.sh" "$PROJECT_DIR"
        ;;
    mac)
        echo "Starting macOS setup..."
        echo ""
        exec bash "$SCRIPT_DIR/setup_mac.sh" "$PROJECT_DIR"
        ;;
    win)
        echo "Starting Windows setup..."
        echo ""
        echo "Please run the following in PowerShell:"
        echo "  powershell -ExecutionPolicy Bypass -File scripts\\setup_win.ps1"
        echo ""
        echo "Or right-click scripts/setup_win.ps1 and select 'Run with PowerShell'."
        exit 0
        ;;
    *)
        echo "Unsupported operating system: $(uname -s)"
        echo ""
        echo "Please install Node.js manually, then run:"
        echo "  npm install"
        echo "  npx tsc"
        echo ""
        echo "See README.md for full instructions."
        exit 1
        ;;
esac
