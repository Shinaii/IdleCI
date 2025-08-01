# IdleCI Homebrew Formula

This directory contains the Homebrew Formula for installing IdleCI on macOS.

## Installation Methods

### Method 1: Direct Formula Installation (Recommended)

```bash
# Install directly from this repository
brew install --formula https://raw.githubusercontent.com/Shinaii/IdleCI/main/Formula/idleci.rb
```

### Method 2: Manual Installation

1. Download the Formula file:
```bash
curl -o idleci.rb https://raw.githubusercontent.com/Shinaii/IdleCI/main/Formula/idleci.rb
```

2. Install the Formula:
```bash
brew install --formula ./idleci.rb
```

## Usage After Installation

After installation, you can run IdleCI from anywhere:

```bash
# Basic usage
idleci

# Debug mode
idleci -d

# Custom config
idleci -c ~/.idleci/config.custom.js

# Show help
idleci --help
```

## Configuration

Configuration files are automatically created at:
- `~/.idleci/config.custom.js` - Main configuration
- `~/.idleci/cheats.js` - Cheat definitions

## Uninstalling

```bash
brew uninstall idleci
```

To remove configuration files:
```bash
rm -rf ~/.idleci
```

## Updating

When a new version is released:
```bash
brew reinstall idleci
```

## Architecture Support

The Homebrew Formula automatically detects your Mac's architecture:
- **Intel Macs**: Downloads and installs the x64 binary
- **Apple Silicon Macs**: Downloads and installs the ARM64 binary

## Troubleshooting

If you encounter issues:

1. **Architecture detection**: Check your Mac's architecture:
   ```bash
   uname -m  # Should show "x86_64" for Intel or "arm64" for Apple Silicon
   ```

2. **Permission errors**: Make sure the binary is executable:
   ```bash
   chmod +x $(brew --prefix)/bin/idleci
   ```

3. **File not found**: Verify installation:
   ```bash
   brew list idleci
   ```

## Building from Source

If you prefer to build from source instead of using the pre-built binary:

```bash
git clone https://github.com/Shinaii/IdleCI.git
cd IdleCI
npm install

# Build for your Mac's architecture
npm run build:all          # All platforms (includes both Mac architectures)
npm run build:macos        # Intel Macs only
npm run build:macos-arm64  # Apple Silicon Macs only
```