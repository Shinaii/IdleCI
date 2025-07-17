# Idleon Cheat Injector (IdleCI)

[![GitHub release](https://img.shields.io/github/v/release/Shinaii/IdleCI?style=for-the-badge)](https://github.com/Shinaii/IdleCI/releases)
[![Build Windows](https://img.shields.io/badge/build-windows-blue?style=for-the-badge&logo=windows)](https://github.com/Shinaii/IdleCI/actions)
[![Build Linux](https://img.shields.io/badge/build-linux-yellow?style=for-the-badge&logo=linux)](https://github.com/Shinaii/IdleCI/actions)
[![Downloads](https://img.shields.io/github/downloads/Shinaii/IdleCI/total?style=for-the-badge)](https://github.com/Shinaii/IdleCI/releases)
[![License](https://img.shields.io/github/license/Shinaii/IdleCI?style=for-the-badge)](LICENSE)

---

## Overview

**Idleon Cheat Injector (IdleCI)** is a powerful, extensible tool for injecting cheats and custom modifications into the game [Legends of Idleon](https://www.legendsofidleon.com/). It leverages the Chrome DevTools Protocol to attach to the game process, enabling advanced cheat configuration, automation, and a modern web UI for easy management.

---

## Features

- 🚀 **Inject cheats into Legends of Idleon** (Steam, Windows/Linux)
- 🛠️ **Modern Web UI** for managing cheats, configuration, and embedded DevTools
- ⚙️ **Highly configurable**: customize cheats, startup actions, and injector behavior
- 📝 **Cross-platform builds**: Windows and Linux binaries
- 🔒 **Safe config system**: keep your custom settings across updates

---

## Installation

### Pre-built Binaries

1. Download the latest release for your OS from the [Releases page](https://github.com/Shinaii/IdleCI/releases).
2. Extract the archive and run the executable (`IdleCI-windows-x64` or `IdleCI-linux-x64`).

### From Source

1. Clone the repository:
   ```sh
   git clone https://github.com/Shinaii/IdleCI.git
   cd IdleCI
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Build for your platform:
   - **Windows:**
     ```sh
     npm run build-windows
     ```
   - **Linux:**
     ```sh
     npm run build-linux
     ```

---

## Usage

### Quick Start

- **Run the injector:**
  ```sh
  ./IdleCI-windows-x64   # or ./IdleCI-linux-x64
  ```
- The injector will automatically attach to Legends of Idleon (Steam) and inject the configured cheats.
- Access the **Web UI** at [http://localhost:8080](http://localhost:8080) (if enabled in config).

### Command Line Options

- `-d, --debug` : Enable debug logging
- `-c, --config <path>` : Path to custom config file

---

## Configuration

- Rename `config.custom.example.js` to whatever you like and edit to customize startup cheats, cheat config, and injector settings.
- Cheats and config can be updated live via the Web UI or by editing the config file.
- use `-c or --config <path>` when starting the binary to use a custom config.

---

## Web UI

- Modern, responsive interface for managing cheats, configuration, and embedded DevTools.
- Access at [http://localhost:8080](http://localhost:8080) (default port, configurable).

---

## Building

- **TypeScript build:**
  ```sh
  npm run build-tsc
  ```
- **Package for Windows:**
  ```sh
  npm run build-windows
  ```
- **Package for Linux:**
  ```sh
  npm run build-linux
  ```

---

## Credits

- **Contributors:** 
- iBelg (Original Developer)
- Creater0822 and valleymon
- MrJoiny (Disputate) - Keeping the Project alive
---

## License

This project is licensed under the GPL-2.0 License. See [LICENSE](LICENSE) for details.

---

## Disclaimer

This tool is intended for educational and personal use only. Use at your own risk. The authors are not responsible for any bans, data loss, or other consequences resulting from use of this software. Legends of Idleon is property of Lavaflame2. 
