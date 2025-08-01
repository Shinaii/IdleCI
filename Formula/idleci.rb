class Idleci < Formula
  desc "Idleon Cheat Injector - extensible tool for injecting cheats into Legends of Idleon"
  homepage "https://github.com/Shinaii/IdleCI"
  version "1.1.1-Legacy"
  
  if Hardware::CPU.intel?
    url "https://github.com/Shinaii/IdleCI/releases/download/v#{version}/IdleCI-macOS-x64.zip"
    sha256 "REPLACE_WITH_ACTUAL_INTEL_SHA256_HASH"
  elsif Hardware::CPU.arm?
    url "https://github.com/Shinaii/IdleCI/releases/download/v#{version}/IdleCI-macOS-arm64.zip"
    sha256 "REPLACE_WITH_ACTUAL_ARM64_SHA256_HASH"
  else
    odie "Unsupported architecture: #{Hardware::CPU.type}. Supported: Intel x64, Apple Silicon ARM64"
  end

  def install
    # Install the main binary (architecture-specific)
    if Hardware::CPU.intel?
      bin.install "IdleCI-macos-x64" => "idleci"
    elsif Hardware::CPU.arm?
      bin.install "IdleCI-macos-arm64" => "idleci"
    end
    
    # Install configuration and cheat files to share directory
    pkgshare.install "cheats.js"
    pkgshare.install "config.custom.example.js"
    
    # Make the binary executable
    chmod 0755, bin/"idleci"
  end

  def post_install
    # Create a symlink for the config file in user's home directory
    config_dir = "#{Dir.home}/.idleci"
    mkdir_p config_dir
    
    # Copy example config if user doesn't have one
    user_config = "#{config_dir}/config.custom.js"
    example_config = "#{pkgshare}/config.custom.example.js"
    
    unless File.exist?(user_config)
      cp example_config, user_config
      puts "Created example config at #{user_config}"
    end
    
    # Copy cheats.js to user directory for easy access
    user_cheats = "#{config_dir}/cheats.js"
    unless File.exist?(user_cheats)
      cp "#{pkgshare}/cheats.js", user_cheats
      puts "Copied cheats file to #{user_cheats}"
    end
  end

  test do
    # Test that the binary runs and shows help
    system "#{bin}/idleci", "--help"
  end

  def caveats
    <<~EOS
      IdleCI has been installed successfully!
      
      Configuration files are located at:
        ~/.idleci/config.custom.js
        ~/.idleci/cheats.js
      
      To get started:
        1. Start Legends of Idleon (Steam version)
        2. Run: idleci
        3. Open http://localhost:8080 in your browser
      
      For debug mode: idleci -d
      For custom config: idleci -c ~/.idleci/config.custom.js
      
      Note: This tool is for educational purposes only.
      Use at your own risk.
    EOS
  end
end