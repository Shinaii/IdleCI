# Idleon Cheat Injector (IdleCI)

[![GitHub release](https://img.shields.io/github/v/release/Shinaii/IdleCI?style=for-the-badge)](https://github.com/Shinaii/IdleCI/releases)
[![Build Windows](https://img.shields.io/badge/build-windows-blue?style=for-the-badge&logo=windows)](https://github.com/Shinaii/IdleCI/actions)
[![Build Linux](https://img.shields.io/badge/build-linux-yellow?style=for-the-badge&logo=linux)](https://github.com/Shinaii/IdleCI/actions)
[![Build macOS](https://img.shields.io/badge/build-macos-lightgrey?style=for-the-badge&logo=apple)](https://github.com/Shinaii/IdleCI/actions)
[![Downloads](https://img.shields.io/github/downloads/Shinaii/IdleCI/total?style=for-the-badge)](https://github.com/Shinaii/IdleCI/releases)

---

## 🚀 Overview

**Idleon Cheat Injector (IdleCI)** is an extensible tool for injecting cheats and custom modifications into [Legends of Idleon](https://www.legendsofidleon.com/). Built with TypeScript. It leverages the Chrome DevTools Protocol to attach to the game process.

---

## ✨ Features

- 🎯 **Inject cheats into Legends of Idleon** (Steam, Windows/Linux/macOS)
- 🌐 **Web UI** with real-time cheat management and embedded DevTools
- ⚙️ **Highly configurable**: customize cheats, startup actions, and injector behavior
- 📦 **Cross-platform builds**: Windows, Linux, and macOS binaries with all-in-one packages
- 🔒 **Safe config system**: keep your custom settings across updates
- 🐛 **Debug mode**: detailed logging for troubleshooting
- 🔄 **Live updates**: modify cheats and config without restarting

---

## 📦 Installation

### Pre-built Binaries (Recommended)

1. **Download** the latest release for your OS from the [Releases page](https://github.com/Shinaii/IdleCI/releases)
2. **Extract** the zip file:
   - **Windows:** `IdleCI-Windows-x64.zip`
   - **Linux:** `IdleCI-Linux-x64.zip`
   - **macOS (Intel):** `IdleCI-macOS-x64.zip`
   - **macOS (Apple Silicon):** `IdleCI-macOS-arm64.zip`
3. **Run** the executable:
   - **Windows:** `IdleCI-windows-x64.exe`
   - **Linux:** `./IdleCI-linux-x64`
   - **macOS (Intel):** `./IdleCI-macos-x64`
   - **macOS (Apple Silicon):** `./IdleCI-macos-arm64`

### macOS (Homebrew)

For macOS users, you can install IdleCI using Homebrew:

```bash
# Install directly from the Formula
brew install --formula https://raw.githubusercontent.com/Shinaii/IdleCI/main/Formula/idleci.rb

# After installation, run:
idleci
```

The Homebrew installation automatically:
- Creates configuration files at `~/.idleci/`
- Makes the `idleci` command available system-wide
- Handles permissions and setup

### From Source

```bash
# Clone the repository
git clone https://github.com/Shinaii/IdleCI.git
cd IdleCI

# Install dependencies
npm install

# Build for your platform
npm run build:all          # All platforms
npm run build:windows      # Windows
npm run build:linux        # Linux
npm run build:macos        # macOS Intel
npm run build:macos-arm64  # macOS Apple Silicon
```

---

## 🚀 Quick Start

### Basic Usage

1. **Start Legends of Idleon** (Steam version)
2. **Run the injector:**
   ```bash
   # Windows
   IdleCI-windows-x64.exe
   
   # Linux
   ./IdleCI-linux-x64
   
   # macOS Intel (binary)
   ./IdleCI-macos-x64
   
   # macOS Apple Silicon (binary)
   ./IdleCI-macos-arm64
   
   # macOS (Homebrew - auto-detects architecture)
   idleci
   ```
3. **Access the Web UI** at [http://localhost:8080](http://localhost:8080)
4. **Configure cheats** through the web interface or edit `config.custom.example.js`

### Command Line Options

| Option | Description |
|--------|-------------|
| `-d, --debug` | Enable debug logging |
| `-c, --config <path>` | Use custom config file |
| `--help` | Show help information |

**Examples:**
```bash
# Run with debug mode
IdleCI-windows-x64.exe -d     # Windows
./IdleCI-linux-x64 -d        # Linux
./IdleCI-macos-x64 -d        # macOS Intel
./IdleCI-macos-arm64 -d      # macOS Apple Silicon
idleci -d                    # macOS (Homebrew)

# Use custom config
IdleCI-windows-x64.exe -c my-config.js      # Windows
./IdleCI-linux-x64 -c my-config.js         # Linux
./IdleCI-macos-x64 -c my-config.js         # macOS Intel
./IdleCI-macos-arm64 -c my-config.js       # macOS Apple Silicon
idleci -c ~/.idleci/config.custom.js       # macOS (Homebrew)

# Debug with custom config
IdleCI-windows-x64.exe -d -c my-config.js      # Windows
./IdleCI-linux-x64 -d -c my-config.js         # Linux
./IdleCI-macos-x64 -d -c my-config.js         # macOS Intel
./IdleCI-macos-arm64 -d -c my-config.js       # macOS Apple Silicon
idleci -d -c ~/.idleci/config.custom.js       # macOS (Homebrew)
```

---

## ⚙️ Configuration

### Config File

1. **Copy** `config.custom.example.js` to your preferred name
2. **Edit** the file to customize:
   - Startup cheats
   - Cheat configurations
   - Injector settings
   - Web UI port

### Web UI Features

- **Real-time cheat management**
- **Live configuration editing**
- **Embedded Chrome DevTools**
- **Version information**
- **Health status monitoring**

---

## 🛠️ Development

### Prerequisites

- **Node.js 18+**
- **npm** or **bun**
- **TypeScript** (installed via npm)

### Build Commands

```bash
# Build everything at once
npm run build:all                    # Build for all platforms (sequential, safest)
npm run build:all:parallel          # Build for all platforms (parallel - faster)
npm run build:all:parallel:fallback # Fallback if parallel doesn't work

# Platform-specific builds
npm run build:windows      # Windows
npm run build:linux        # Linux  
npm run build:macos        # macOS Intel
npm run build:macos-arm64  # macOS Apple Silicon

# Development mode
npm run dev          # TypeScript
bun run bun:dev      # Bun (faster)
```

### Troubleshooting Build Issues

If you encounter build errors:

1. **Install dependencies first**:
   ```bash
   npm run install:deps
   ```

2. **If parallel build fails**, use sequential:
   ```bash
   npm run build:all
   ```

3. **Dynamic require warnings** are normal and can be ignored - they're handled by the pkg configuration.

4. **On Windows**: If you see `'wait' is not recognized`, make sure `npm-run-all` is installed or use the fallback script.


---

### Debug Mode

Run with `-d` flag for detailed logging:
```bash
IdleCI-windows-x64.exe -d    # Windows
./IdleCI-linux-x64 -d       # Linux
./IdleCI-macos-x64 -d       # macOS Intel
./IdleCI-macos-arm64 -d     # macOS Apple Silicon
idleci -d                   # macOS (Homebrew)
```

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request


---

## ⚠️ Disclaimer

**This tool is for educational and personal use only.** Use at your own risk. The authors are not responsible for any bans, data loss, or other consequences resulting from use of this software. **Legends of Idleon** is property of **Lavaflame2**.

---

## 🙏 Credits

- **iBelg** - Original Developer
- **Creater0822** and **valleymon** - Contributors
- **MrJoiny (Disputate)** - Core functionality 
- **Shinaii** - TypeScript rewrite, full refactor and new WebUI

---
