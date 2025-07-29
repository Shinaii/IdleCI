# Idleon Cheat Injector (IdleCI)

[![GitHub release](https://img.shields.io/github/v/release/Shinaii/IdleCI?style=for-the-badge)](https://github.com/Shinaii/IdleCI/releases)
[![Build Windows](https://img.shields.io/badge/build-windows-blue?style=for-the-badge&logo=windows)](https://github.com/Shinaii/IdleCI/actions)
[![Build Linux](https://img.shields.io/badge/build-linux-yellow?style=for-the-badge&logo=linux)](https://github.com/Shinaii/IdleCI/actions)
[![Downloads](https://img.shields.io/github/downloads/Shinaii/IdleCI/total?style=for-the-badge)](https://github.com/Shinaii/IdleCI/releases)
[![License](https://img.shields.io/badge/license-GPL--2.0-red?style=for-the-badge)](LICENSE)

---

## 🚀 Overview

**Idleon Cheat Injector (IdleCI)** is an extensible tool for injecting cheats and custom modifications into [Legends of Idleon](https://www.legendsofidleon.com/). Built with TypeScript. It leverages the Chrome DevTools Protocol to attach to the game process.

---

## ✨ Features

- 🎯 **Inject cheats into Legends of Idleon** (Steam, Windows/Linux)
- 🌐 **Web UI** with real-time cheat management and embedded DevTools
- ⚙️ **Highly configurable**: customize cheats, startup actions, and injector behavior
- 📦 **Cross-platform builds**: Windows and Linux binaries with all-in-one packages
- 🔒 **Safe config system**: keep your custom settings across updates
- 🐛 **Debug mode**: detailed logging for troubleshooting
- 🔄 **Live updates**: modify cheats and config without restarting

---

## 📦 Installation

### Pre-built Binaries (Recommended)

1. **Download** the latest release for your OS from the [Releases page](https://github.com/Shinaii/IdleCI/releases)
2. **Extract** the zip file (`IdleCI-Windows-x64.zip` or `IdleCI-Linux-x64.zip`)
3. **Run** the executable:
   - **Windows:** `IdleCI-windows-x64.exe`
   - **Linux:** `./IdleCI-linux-x64`

### From Source

```bash
# Clone the repository
git clone https://github.com/Shinaii/IdleCI.git
cd IdleCI

# Install dependencies
npm install

# Build for your platform
npm run build:windows    # Windows
npm run build:linux      # Linux
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
IdleCI-windows-x64.exe -d

# Use custom config
IdleCI-windows-x64.exe -c my-config.js

# Debug with custom config
IdleCI-windows-x64.exe -d -c my-config.js
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
# Platform-specific builds
npm run build:windows
npm run build:linux

# Development mode
npm run dev          # TypeScript
bun run bun:dev      # Bun (faster)
```


---

### Debug Mode

Run with `-d` flag for detailed logging:
```bash
IdleCI-windows-x64.exe -d
```

---

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request


---

## 📄 License

This project is licensed under the **GPL-2.0 License**. See [LICENSE](LICENSE) for details.

---

## ⚠️ Disclaimer

**This tool is for educational and personal use only.** Use at your own risk. The authors are not responsible for any bans, data loss, or other consequences resulting from use of this software. **Legends of Idleon** is property of **Lavaflame2**.

---

## 🙏 Credits

- **iBelg** - Original Developer
- **Creater0822** and **valleymon** - Contributors
- **MrJoiny (Disputate)** - Keeping the Project alive
- **Shinaii** - TypeScript rewrite, full refactor and new WebUI

---
