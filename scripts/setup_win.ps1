# setup_win.ps1 -- Windows setup for Yr Weather Extension
# Run from the project root:
#   powershell -ExecutionPolicy Bypass -File scripts\setup_win.ps1

$PROJECT_DIR = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $PROJECT_DIR

function Write-Info    { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "[OK]    $msg" -ForegroundColor Green }
function Write-Warn    { param($msg) Write-Host "[WARN]  $msg" -ForegroundColor Yellow }
function Write-Error   { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }
function Write-Header  { param($msg) Write-Host "`n$msg`n" -ForegroundColor White }

# ---- Main script ----

Write-Header "============================================"
Write-Header "  Yr Weather Extension -- Windows Setup"
Write-Header "============================================"

# -----------------------------------------------
# Step 1: Check for Node.js
# -----------------------------------------------
Write-Header "Step 1: Checking for Node.js"

$nodeInstalled = $false
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Success "Node.js found: $nodeVersion"
        $nodeInstalled = $true
    }
} catch {}

if (-not $nodeInstalled) {
    Write-Warn "Node.js not found. It is required to compile the extension."
    Write-Host ""
    Write-Host "How would you like to install Node.js?"
    Write-Host ""
    Write-Host "  1) winget (Windows Package Manager)"
    Write-Host "  2) Download from nodejs.org"
    Write-Host "  3) I will install it manually and re-run this script"
    Write-Host ""

    $nodeChoice = Read-Host "Choose [1/2/3]"

    switch ($nodeChoice) {
        "1" {
            Write-Host ""
            Write-Info "Installing Node.js via winget..."
            winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
            # Refresh PATH so node is available in this session
            $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
            try {
                $nodeVersion = node --version 2>$null
                Write-Success "Node.js installed: $nodeVersion"
            } catch {
                Write-Error "Node.js was installed but is not available in this session."
                Write-Host "Please close this terminal, open a new one, and re-run this script."
                exit 0
            }
        }
        "2" {
            Write-Host ""
            Write-Info "Opening nodejs.org download page..."
            Start-Process "https://nodejs.org/en/download/"
            Write-Host ""
            Write-Host "Download and install Node.js LTS, then re-run this script."
            exit 0
        }
        "3" {
            Write-Host ""
            Write-Info "Please install Node.js and re-run this script."
            Write-Host "Visit: https://nodejs.org/en/download/"
            exit 0
        }
        default {
            Write-Error "Invalid choice. Exiting."
            exit 1
        }
    }
}

# -----------------------------------------------
# Step 2: Install dependencies
# -----------------------------------------------
Write-Header "Step 2: Installing dependencies"

if (Test-Path "node_modules") {
    Write-Info "node_modules already exists. Updating..."
} else {
    Write-Info "Installing project dependencies..."
}

npm install
Write-Success "Dependencies installed."

# -----------------------------------------------
# Step 3: Email address for API User-Agent
# -----------------------------------------------
Write-Header "Step 3: API contact email"

$typesFile = "WeatherApp\types.ts"
$currentLine = Select-String -Path $typesFile -Pattern "CONTACT_EMAIL" | Select-Object -First 1
$currentEmail = ""
if ($currentLine -match "'([^']+)'") {
    $currentEmail = $Matches[1]
}

if ($currentEmail -eq "you@example.com") {
    Write-Host "The MET Norway and Nominatim APIs require a contact email in the"
    Write-Host "User-Agent header. This is used only for API identification -- your"
    Write-Host "email is not shared with anyone else."
    Write-Host ""

    do {
        $userEmail = Read-Host "Enter your email address"
        if ([string]::IsNullOrWhiteSpace($userEmail)) {
            Write-Warn "Email cannot be empty. Please try again."
            continue
        }
        if ($userEmail -match '^[^@]+@[^@]+\.[^@]+$') {
            break
        } else {
            Write-Warn "That does not look like a valid email. Try again."
        }
    } while ($true)

    (Get-Content $typesFile) -replace "CONTACT_EMAIL = 'you@example.com'", "CONTACT_EMAIL = '$userEmail'" | Set-Content $typesFile
    Write-Success "Email set to: $userEmail"
} else {
    Write-Success "Email already configured: $currentEmail"
    $changeEmail = Read-Host "Do you want to change it? [y/N]"
    if ($changeEmail -match '^[Yy]$') {
        do {
            $userEmail = Read-Host "Enter your new email address"
            if ([string]::IsNullOrWhiteSpace($userEmail)) {
                Write-Warn "Email cannot be empty. Please try again."
                continue
            }
            if ($userEmail -match '^[^@]+@[^@]+\.[^@]+$') {
                break
            } else {
                Write-Warn "That does not look like a valid email. Try again."
            }
        } while ($true)

        (Get-Content $typesFile) -replace "CONTACT_EMAIL = '.*'", "CONTACT_EMAIL = '$userEmail'" | Set-Content $typesFile
        Write-Success "Email updated to: $userEmail"
    }
}

# -----------------------------------------------
# Step 4: Compile TypeScript
# -----------------------------------------------
Write-Header "Step 4: Compiling TypeScript"

npx tsc
Write-Success "TypeScript compiled successfully."

$missing = $false
foreach ($f in @("WeatherApp\popup.js", "WeatherApp\background.js", "WeatherApp\types.js")) {
    if (-not (Test-Path $f)) {
        Write-Error "Missing output file: $f"
        $missing = $true
    }
}

if ($missing) {
    Write-Error "Compilation may have failed. Check the output above."
    exit 1
}

Write-Success "All output files verified."

# -----------------------------------------------
# Step 5: Browser instructions
# -----------------------------------------------
Write-Header "Step 5: Load the extension in your browser"

Write-Host "This extension works with Chromium-based browsers:"
Write-Host ""
Write-Host "  1) Google Chrome"
Write-Host "  2) Brave"
Write-Host "  3) Microsoft Edge"
Write-Host "  4) Opera"
Write-Host "  5) Vivaldi"
Write-Host "  6) Other Chromium-based browser"
Write-Host ""

$browserChoice = Read-Host "Which browser are you using? [1-6]"

Write-Host ""
Write-Host "--------------------------------------------"

switch ($browserChoice) {
    "1" {
        Write-Host "Google Chrome:"
        Write-Host ""
        Write-Host "  1. Open Chrome"
        Write-Host "  2. Navigate to:  chrome://extensions"
        Write-Host "  3. Enable 'Developer mode' (toggle in the top-right corner)"
        Write-Host "  4. Click 'Load unpacked'"
        Write-Host "  5. Select this folder: $PROJECT_DIR\WeatherApp"
        Write-Host "  6. The Yr Weather icon should appear in your toolbar"
    }
    "2" {
        Write-Host "Brave:"
        Write-Host ""
        Write-Host "  1. Open Brave"
        Write-Host "  2. Navigate to:  brave://extensions"
        Write-Host "  3. Enable 'Developer mode' (toggle in the top-right corner)"
        Write-Host "  4. Click 'Load unpacked'"
        Write-Host "  5. Select this folder: $PROJECT_DIR\WeatherApp"
        Write-Host "  6. The Yr Weather icon should appear in your toolbar"
    }
    "3" {
        Write-Host "Microsoft Edge:"
        Write-Host ""
        Write-Host "  1. Open Edge"
        Write-Host "  2. Navigate to:  edge://extensions"
        Write-Host "  3. Enable 'Developer mode' (toggle in the bottom-left corner)"
        Write-Host "  4. Click 'Load unpacked'"
        Write-Host "  5. Select this folder: $PROJECT_DIR\WeatherApp"
        Write-Host "  6. The Yr Weather icon should appear in your toolbar"
    }
    "4" {
        Write-Host "Opera:"
        Write-Host ""
        Write-Host "  1. Open Opera"
        Write-Host "  2. Navigate to:  opera://extensions"
        Write-Host "  3. Enable 'Developer mode' (toggle in the top-right corner)"
        Write-Host "  4. Click 'Load unpacked'"
        Write-Host "  5. Select this folder: $PROJECT_DIR\WeatherApp"
        Write-Host "  6. The Yr Weather icon should appear in your toolbar"
    }
    "5" {
        Write-Host "Vivaldi:"
        Write-Host ""
        Write-Host "  1. Open Vivaldi"
        Write-Host "  2. Navigate to:  vivaldi://extensions"
        Write-Host "  3. Enable 'Developer mode' (toggle in the top-left corner)"
        Write-Host "  4. Click 'Load unpacked'"
        Write-Host "  5. Select this folder: $PROJECT_DIR\WeatherApp"
        Write-Host "  6. The Yr Weather icon should appear in your toolbar"
    }
    "6" {
        Write-Host "General Chromium browser instructions:"
        Write-Host ""
        Write-Host "  1. Open your browser"
        Write-Host "  2. Navigate to the extensions page"
        Write-Host "     (usually browsername://extensions)"
        Write-Host "  3. Enable 'Developer mode' (look for a toggle switch)"
        Write-Host "  4. Click 'Load unpacked' or 'Load extension'"
        Write-Host "  5. Select this folder: $PROJECT_DIR\WeatherApp"
        Write-Host "  6. The Yr Weather icon should appear in your toolbar"
    }
    default {
        Write-Warn "Invalid choice. See README.md for browser instructions."
    }
}

Write-Host ""
Write-Host "--------------------------------------------"

# -----------------------------------------------
# Done
# -----------------------------------------------
Write-Header "Setup complete!"

Write-Host "To refresh the extension after making code changes:"
Write-Host "  1. Run: npx tsc"
Write-Host "  2. Go to your browser's extensions page"
Write-Host "  3. Click the refresh icon on the Yr Weather Extension card"
Write-Host ""
Write-Host "Enjoy the weather!"
Write-Host ""
