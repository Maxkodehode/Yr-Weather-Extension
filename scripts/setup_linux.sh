#!/usr/bin/env bash
# setup_linux.sh -- Linux setup for Yr Weather Extension
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
NC='\033[0m' # No Color

info()    { echo -e "${CYAN}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC} $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; }
header()  { echo -e "\n${BOLD}$*${NC}\n"; }

# ---- Helper functions (defined before use) ----

install_with_package_manager() {
    echo ""
    info "Detecting package manager..."

    if command -v apt-get &>/dev/null; then
        info "Using apt (Debian/Ubuntu/Mint)"
        echo ""
        echo "Running: sudo apt-get update && sudo apt-get install -y nodejs npm"
        sudo apt-get update && sudo apt-get install -y nodejs npm

    elif command -v dnf &>/dev/null; then
        info "Using dnf (Fedora/RHEL)"
        echo ""
        echo "Running: sudo dnf install -y nodejs npm"
        sudo dnf install -y nodejs npm

    elif command -v pacman &>/dev/null; then
        info "Using pacman (Arch/Manjaro)"
        echo ""
        echo "Running: sudo pacman -S --noconfirm nodejs npm"
        sudo pacman -S --noconfirm nodejs npm

    elif command -v zypper &>/dev/null; then
        info "Using zypper (openSUSE)"
        echo ""
        echo "Running: sudo zypper install -y nodejs npm"
        sudo zypper install -y nodejs npm

    elif command -v apk &>/dev/null; then
        info "Using apk (Alpine)"
        echo ""
        echo "Running: sudo apk add nodejs npm"
        sudo apk add nodejs npm

    else
        error "Could not detect a supported package manager."
        echo ""
        echo "Please install Node.js manually and re-run this script."
        echo "Visit: https://nodejs.org/en/download/"
        exit 1
    fi

    # Verify installation
    if command -v node &>/dev/null; then
        success "Node.js installed: $(node --version)"
    else
        error "Node.js installation may have failed. Please check and re-run."
        exit 1
    fi
}

install_with_nvm() {
    echo ""
    info "Installing nvm (Node Version Manager)..."

    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

    # Source nvm into current shell
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

    # Install latest LTS Node.js
    nvm install --lts
    nvm use --lts

    success "Node.js installed via nvm: $(node --version)"
    echo ""
    info "Note: You may need to restart your terminal after this script finishes"
    info "for nvm to be available in new terminal sessions."
}

# ---- Main script ----

header "============================================"
header "  Yr Weather Extension -- Linux Setup"
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
    echo "  1) Package manager (apt, dnf, pacman, zypper, etc.)"
    echo "  2) nvm (Node Version Manager) -- recommended"
    echo "  3) I will install it manually and re-run this script"
    echo ""

    read -rp "Choose [1/2/3]: " node_choice

    case "$node_choice" in
        1) install_with_package_manager ;;
        2) install_with_nvm ;;
        3)
            echo ""
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

        # Basic validation -- must contain @ and a dot after @
        if [[ "$user_email" =~ ^[^@]+@[^@]+\.[^@]+$ ]]; then
            break
        else
            warn "That does not look like a valid email. Try again."
        fi
    done

    sed -i "s/CONTACT_EMAIL = 'you@example.com'/CONTACT_EMAIL = '$user_email'/" WeatherApp/types.ts
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

        sed -i "s/CONTACT_EMAIL = '.*'/CONTACT_EMAIL = '$user_email'/" WeatherApp/types.ts
        success "Email updated to: $user_email"
    fi
fi

# -----------------------------------------------
# Step 4: Compile TypeScript
# -----------------------------------------------
header "Step 4: Compiling TypeScript"

npx tsc
success "TypeScript compiled successfully."

# Verify output files exist
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
echo "  6) Other Chromium-based browser"
echo ""

read -rp "Which browser are you using? [1-6]: " browser_choice

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
