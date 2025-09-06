# Installation Guide 📦

This guide provides detailed installation instructions for SIAM across different platforms and use cases.

## 📋 System Requirements

### Minimum Requirements

- **Python**: 3.8 or higher
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB free space
- **Audio**: Microphone or audio input device
- **Network**: Internet connection for AI features

### Recommended Requirements

- **Python**: 3.9 or higher
- **RAM**: 8GB or more
- **Storage**: 1GB free space
- **Audio**: High-quality microphone
- **GPU**: For enhanced performance (optional)

## 🖥️ Platform-Specific Instructions

### macOS

#### Prerequisites

```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python 3.9+
brew install python@3.9

# Install PortAudio (required for PyAudio)
brew install portaudio

# Install Git (if not already installed)
brew install git
```

#### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/siam.git
cd siam

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Test installation
python integrated_siam.py --help
```

#### Troubleshooting macOS

```bash
# If PyAudio installation fails
brew install portaudio
pip install --global-option='build_ext' --global-option='-I/opt/homebrew/include' --global-option='-L/opt/homebrew/lib' pyaudio

# For M1/M2 Macs, you might need
arch -arm64 brew install portaudio
```

### Windows

#### Prerequisites

1. **Install Python 3.9+** from [python.org](https://www.python.org/downloads/)
   - ✅ Check "Add Python to PATH" during installation
   - ✅ Check "Install pip"

2. **Install Git** from [git-scm.com](https://git-scm.com/download/win)

3. **Install Microsoft Visual C++ Build Tools**
   - Download from [Microsoft](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
   - Required for some audio dependencies

#### Installation

```cmd
# Open Command Prompt or PowerShell as Administrator

# Clone the repository
git clone https://github.com/yourusername/siam.git
cd siam

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Test installation
python integrated_siam.py --help
```

#### Troubleshooting Windows

```cmd
# If PyAudio installation fails, try pre-compiled wheel
pip install pipwin
pipwin install pyaudio

# Alternative: Download PyAudio wheel manually
# Visit: https://www.lfd.uci.edu/~gohlke/pythonlibs/#pyaudio
# Download appropriate .whl file and install with:
pip install path\to\PyAudio-0.2.11-cp39-cp39-win_amd64.whl
```

### Linux (Ubuntu/Debian)

#### Prerequisites

```bash
# Update package list
sudo apt update

# Install Python 3.9+ and pip
sudo apt install python3.9 python3.9-pip python3.9-venv

# Install development tools
sudo apt install build-essential python3.9-dev

# Install audio dependencies
sudo apt install portaudio19-dev libasound2-dev

# Install Git
sudo apt install git
```

#### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/siam.git
cd siam

# Create virtual environment
python3.9 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Test installation
python integrated_siam.py --help
```

#### Troubleshooting Linux

```bash
# If audio issues occur
sudo apt install pulseaudio pulseaudio-utils

# For ALSA-related issues
sudo apt install libasound2-dev

# If permission issues with audio devices
sudo usermod -a -G audio $USER
# Log out and back in for changes to take effect
```

### Linux (CentOS/RHEL/Fedora)

#### Prerequisites

```bash
# For CentOS/RHEL
sudo yum install python39 python39-pip python39-devel
sudo yum groupinstall "Development Tools"
sudo yum install portaudio-devel alsa-lib-devel

# For Fedora
sudo dnf install python3.9 python3.9-pip python3.9-devel
sudo dnf groupinstall "Development Tools"
sudo dnf install portaudio-devel alsa-lib-devel
```

## 🐳 Docker Installation

### Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/siam.git
cd siam

# Build and run with Docker Compose
docker-compose up --build

# Run in detached mode
docker-compose up -d --build
```

### Using Docker Directly

```bash
# Build the image
docker build -t siam .

# Run the container
docker run -it --rm \
  --device /dev/snd \
  -v $(pwd)/data:/app/data \
  siam

# For macOS with audio
docker run -it --rm \
  -v /tmp/.X11-unix:/tmp/.X11-unix \
  -e DISPLAY=$DISPLAY \
  -v $(pwd)/data:/app/data \
  siam
```

### Docker Troubleshooting

```bash
# If audio doesn't work in Docker
docker run -it --rm \
  --privileged \
  --device /dev/snd \
  -v /dev/shm:/dev/shm \
  siam

# Check audio devices in container
docker run -it --rm siam python -c "import pyaudio; p = pyaudio.PyAudio(); print([p.get_device_info_by_index(i) for i in range(p.get_device_count())])"
```

## 🔧 Development Installation

### For Contributors

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/siam.git
cd siam

# Add upstream remote
git remote add upstream https://github.com/original/siam.git

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install in development mode
pip install -e .

# Install development dependencies
pip install -r requirements-dev.txt

# Install pre-commit hooks
pre-commit install

# Run tests to verify setup
pytest
```

### Development Dependencies

```bash
# Core development tools
pip install pytest pytest-cov black flake8 mypy

# Documentation tools
pip install sphinx sphinx-rtd-theme

# Pre-commit hooks
pip install pre-commit

# Optional: Jupyter for experimentation
pip install jupyter notebook
```

## 🎵 Audio Setup

### Configuring Audio Devices

#### List Available Devices

```python
# Run this script to see available audio devices
python -c "
import pyaudio
p = pyaudio.PyAudio()
print('Available Audio Devices:')
for i in range(p.get_device_count()):
    info = p.get_device_info_by_index(i)
    print(f'{i}: {info[\"name\"]} - {info[\"maxInputChannels\"]} inputs')
p.terminate()
"
```

#### Test Audio Capture

```bash
# Test microphone
python test_pyaudio.py

# Test with specific device
python test_pyaudio.py --device 1
```

### Audio Troubleshooting

#### No Audio Devices Found

```bash
# macOS: Reset audio permissions
sudo killall coreaudiod

# Linux: Check PulseAudio
pulseaudio --check -v
pulseaudio --start

# Windows: Check audio services
# Run as Administrator:
net start "Windows Audio"
net start "Windows Audio Endpoint Builder"
```

#### Poor Audio Quality

1. **Check microphone positioning**
2. **Adjust input levels** in system settings
3. **Use external microphone** for better quality
4. **Reduce background noise**
5. **Check sample rate settings** in config

## 🔑 API Keys Setup

### OpenAI API Key (Optional)

```bash
# Set environment variable
export OPENAI_API_KEY="your-api-key-here"

# Or add to .env file
echo "OPENAI_API_KEY=your-api-key-here" >> .env
```

### Configuration File

```json
{
  "openai": {
    "api_key": "your-api-key-here",
    "model": "whisper-1"
  }
}
```

## ✅ Verification

### Quick Test

```bash
# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run SIAM
python integrated_siam.py

# You should see the SIAM interface load
# Press 'q' to quit
```

### Full Test Suite

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=src

# Test specific functionality
pytest tests/test_audio.py -v
```

### Performance Test

```bash
# Test audio processing performance
python -m src.audio.test_performance

# Test UI rendering performance
python -m src.ui.test_performance
```

## 🚨 Common Issues

### Installation Fails

#### Python Version Issues

```bash
# Check Python version
python --version

# If version is too old, install newer Python
# Then create virtual environment with specific version
python3.9 -m venv venv
```

#### Permission Errors

```bash
# macOS/Linux: Use virtual environment (recommended)
python -m venv venv
source venv/bin/activate

# Windows: Run as Administrator (not recommended)
# Better: Use virtual environment
```

#### Dependency Conflicts

```bash
# Clear pip cache
pip cache purge

# Reinstall in clean environment
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Runtime Issues

#### Audio Not Working

1. **Check device permissions**
2. **Verify audio device selection**
3. **Test with different devices**
4. **Check system audio settings**

#### Performance Issues

1. **Lower FPS limit** in preferences
2. **Reduce audio chunk size**
3. **Close other applications**
4. **Check system resources**

#### UI Display Issues

1. **Update terminal emulator**
2. **Check terminal size**
3. **Verify color support**
4. **Try different terminal**

## 📞 Getting Help

If you encounter issues not covered here:

1. **Check the [Troubleshooting Guide](troubleshooting.md)**
2. **Search [existing issues](https://github.com/yourusername/siam/issues)**
3. **Create a [new issue](https://github.com/yourusername/siam/issues/new)** with:
   - Your operating system and version
   - Python version
   - Complete error message
   - Steps to reproduce

## 🎯 Next Steps

After successful installation:

1. **Read the [User Guide](user_guide.md)**
2. **Check out [Examples](../examples/)**
3. **Configure [Preferences](configuration.md)**
4. **Join the [Community](community.md)**

---

**Happy meeting! 🎉**
