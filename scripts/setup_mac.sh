#!/usr/bin/env bash
# setup_mac.sh -- macOS setup for Yr Weather Extension
# Called by setup.sh with the project directory as argument.

set -euo pipefail

PROJECT_DIR="${1:-.}"
cd "$PROJECT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; }
header()  { echo -e "\n${BOLD}$*${NC}\n"; }

install_with_homebrew() {
    echo ""
    info "Installing Node.js via Homebrew..."
    brew install node
    success "Node.js installed: $(node --version)"
}

install_with_nvm() {
    echo ""
    info "Installing nvm (Node Version Manager)..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

    nvm install --lts
    nvm use --lts

    success "Node.js installed via nvm: $(node --version)"
    echo ""
    info "Note: You may need to restart your terminal after this script finishes"
    info "for nvm to be available in new terminal sessions."
}

# ---- Main script ----

header "============================================"
header "  Yr Weather Extension -- macOS Setup"
header "============================================"

# -----------------------------------------------
# Step 1: Check for Node.js
# -----------------------------------------------
header "Step 1: Checking for Node.js"

if command -v node &>/dev/null; then
    NODE_VERSION=$(node --version)
    success "Node.js found: $NODE_VERSION"
else
    warn "Node.js not found. It is required to compile the extension."
    echo ""
    echo "How would you like to install Node.js?"
    echo ""

    if command -v brew &>/dev/null; then
        echo "  1) Homebrew (recommended) -- brew is already installed"
        echo "  2) nvm (Node Version Manager)"
        echo "  3) I will install it manually and re-run this script"
        echo ""

        read -rp "Choose [1/2/3]: " node_choice

        case "$node_choice" in
            1) install_with_homebrew ;;
            2) install_with_nvm ;;
            3)
                info "Please install Node.js and re-run this script."
                echo "Visit: https://nodejs.org/en/download/"
                exit 0
                ;;
            *)
                error "Invalid choice. Exiting."
                exit 1
                ;;
        esac
    else
        echo "  1) Install Homebrew first, then Node.js"
        echo "  2) nvm (Node Version Manager)"
        echo "  3) I will install it manually and re-run this script"
        echo ""

        read -rp "Choose [1/2/3]: " node_choice

        case "$node_choice" in
            1)
                echo ""
                info "Installing Homebrew..."
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
                install_with_homebrew
                ;;
            2) install_with_nvm ;;
            3)
                info "Please install Node.js and re-run this script."
                echo "Visit: https://nodejs.org/en/download/"
                exit 0
                ;;
            *)
                error "Invalid choice. Exiting."
                exit 1
                ;;
        esac
    fi
fi

# -----------------------------------------------
# Step 2: Install dependencies
# -----------------------------------------------
header "Step 2: Installing dependencies"

if [ -d "node_modules" ]; then
    info "node_modules already exists. Updating..."
else
    info "Installing project dependencies..."
fi

npm install
success "Dependencies installed."

# -----------------------------------------------
# Step 3: Email address for API User-Agent
# -----------------------------------------------
header "Step 3: API contact email"

CURRENT_EMAIL=$(grep "CONTACT_EMAIL" WeatherApp/types.ts | sed "s/.*'\(.*\)'.*/\1/")

if [ "$CURRENT_EMAIL" = "you@example.com" ]; then
    echo "The MET Norway and Nominatim APIs require a contact email in the"
    echo "User-Agent header. This is used only for API identification -- your"
    echo "email is not shared with anyone else."
    echo ""

    while true; do
        read -rp "Enter your email address: " user_email

        if [ -z "$user_email" ]; then
            warn "Email cannot be empty. Please try again."
            continue
        fi

        if [[ "$user_email" =~ ^[^@]+@[^@]+\.[^@]+$ ]]; then
            break
        else
            warn "That does not look like a valid email. Try again."
        fi
    done

    sed -i '' "s/CONTACT_EMAIL = 'you@example.com'/CONTACT_EMAIL = '$user_email'/" WeatherApp/types.ts
    success "Email set to: $user_email"
else
    success "Email already configured: $CURRENT_EMAIL"
    read -rp "Do you want to change it? [y/N]: " change_email
    if [[ "$change_email" =~ ^[Yy]$ ]]; then
        while true; do
            read -rp "Enter your new email address: " user_email

            if [ -z "$user_email" ]; then
                warn "Email cannot be empty. Please try again."
                continue
            fi

            if [[ "$user_email" =~ ^[^@]+@[^@]+\.[^@]+$ ]]; then
                break
            else
                warn "That does not look like a valid email. Try again."
            fi
        done

        sed -i '' "s/CONTACT_EMAIL = '.*'/CONTACT_EMAIL = '$user_email'/" WeatherApp/types.ts
        success "Email updated to: $user_email"
    fi
fi

# -----------------------------------------------
# Step 4: Compile TypeScript
# -----------------------------------------------
header "Step 4: Compiling TypeScript"

npx tsc
success "TypeScript compiled successfully."

MISSING=0
for f in WeatherApp/popup.js WeatherApp/background.js WeatherApp/types.js; do
    if [ ! -f "$f" ]; then
        error "Missing output file: $f"
        MISSING=1
    fi
done

if [ "$MISSING" -eq 1 ]; then
    error "Compilation may have failed. Check the output above."
    exit 1
fi

success "All output files verified."

# -----------------------------------------------
# Step 5: Browser instructions
# -----------------------------------------------
header "Step 5: Load the extension in your browser"

echo "This extension works with Chromium-based browsers:"
echo ""
echo "  1) Google Chrome"
echo "  2) Brave"
echo "  3) Microsoft Edge"
echo "  4) Opera"
echo "  5) Vivaldi"
echo "  6) Arc"
echo "  7) Other Chromium-based browser"
echo ""

read -rp "Which browser are you using? [1-7]: " browser_choice

echo ""
echo "--------------------------------------------"

case "$browser_choice" in
    1)
        echo "Google Chrome:"
        echo ""
        echo "  1. Open Chrome"
        echo "  2. Navigate to:  chrome://extensions"
        echo "  3. Enable 'Developer mode' (toggle in the top-right corner)"
        echo "  4. Click 'Load unpacked'"
        echo "  5. Select this folder: $PROJECT_DIR/WeatherApp"
        echo "  6. The Yr Weather icon should appear in your toolbar"
        ;;
    2)
        echo "Brave:"
        echo ""
        echo "  1. Open Brave"
        echo "  2. Navigate to:  brave://extensions"
        echo "  3. Enable 'Developer mode' (toggle in the top-right corner)"
        echo "  4. Click 'Load unpacked'"
        echo "  5. Select this folder: $PROJECT_DIR/WeatherApp"
        echo "  6. The Yr Weather icon should appear in your toolbar"
        ;;
    3)
        echo "Microsoft Edge:"
        echo ""
        echo "  1. Open Edge"
        echo "  2. Navigate to:  edge://extensions"
        echo "  3. Enable 'Developer mode' (toggle in the bottom-left corner)"
        echo "  4. Click 'Load unpacked'"
        echo "  5. Select this folder: $PROJECT_DIR/WeatherApp"
        echo "  6. The Yr Weather icon should appear in your toolbar"
        ;;
    4)
        echo "Opera:"
        echo ""
        echo "  1. Open Opera"
        echo "  2. Navigate to:  opera://extensions"
        echo "  3. Enable 'Developer mode' (toggle in the top-right corner)"
        echo "  4. Click 'Load unpacked'"
        echo "  5. Select this folder: $PROJECT_DIR/WeatherApp"
        echo "  6. The Yr Weather icon should appear in your toolbar"
        ;;
    5)
        echo "Vivaldi:"
        echo ""
        echo "  1. Open Vivaldi"
        echo "  2. Navigate to:  vivaldi://extensions"
        echo "  3. Enable 'Developer mode' (toggle in the top-left corner)"
        echo "  4. Click 'Load unpacked'"
        echo "  5. Select this folder: $PROJECT_DIR/WeatherApp"
        echo "  6. The Yr Weather icon should appear in your toolbar"
        ;;
    6)
        echo "Arc:"
        echo ""
        echo "  1. Open Arc"
        echo "  2. Navigate to:  arc://extensions"
        echo "  3. Enable 'Developer mode' if available"
        echo "  4. Click 'Load unpacked' or drag the folder in"
        echo "  5. Select this folder: $PROJECT_DIR/WeatherApp"
        echo "  6. The Yr Weather icon should appear in your toolbar"
        ;;
    7)
        echo "General Chromium browser instructions:"
        echo ""
        echo "  1. Open your browser"
        echo "  2. Navigate to the extensions page"
        echo "     (usually browsername://extensions)"
        echo "  3. Enable 'Developer mode' (look for a toggle switch)"
        echo "  4. Click 'Load unpacked' or 'Load extension'"
        echo "  5. Select this folder: $PROJECT_DIR/WeatherApp"
        echo "  6. The Yr Weather icon should appear in your toolbar"
        ;;
    *)
        warn "Invalid choice. See README.md for browser instructions."
        ;;
esac

echo ""
echo "--------------------------------------------"

# -----------------------------------------------
# Done
# -----------------------------------------------
header "Setup complete!"

echo "To refresh the extension after making code changes:"
echo "  1. Run: npx tsc"
echo "  2. Go to your browser's extensions page"
echo "  3. Click the refresh icon on the Yr Weather Extension card"
echo ""
echo "Enjoy the weather!"
echo ""
