# Native Audio Capture Setup

This guide explains how to set up SIAM with native audio capture, without relying on external applications like Audio Hijack.

## Prerequisites

1. **Python 3.11 or higher**

2. **PyAudio**
   - This requires PortAudio library to be installed on your system
   - On macOS: `brew install portaudio`
   - On Linux: `sudo apt-get install portaudio19-dev`
   - On Windows: No additional steps required

3. **Virtual Audio Device**
   - For macOS: [BlackHole](https://github.com/ExistentialAudio/BlackHole)
   - For Windows: [Virtual Audio Cable](https://vac.muzychenko.net/)
   - For Linux: [PulseAudio](https://www.freedesktop.org/wiki/Software/PulseAudio/)

## Installation Steps

1. **Install Python Dependencies**

   ```bash
   pip install -r requirements.txt
   ```

2. **Install Virtual Audio Device**

   ### macOS (BlackHole)

   ```bash
   brew install blackhole-2ch
   ```

   ### Windows (Virtual Audio Cable)
   - Download and install from [https://vac.muzychenko.net/](https://vac.muzychenko.net/)

   ### Linux (PulseAudio)

   ```bash
   sudo apt-get install pulseaudio
   ```

3. **Configure Audio Routing**

   ### macOS
   1. Open "Audio MIDI Setup" application
   2. Create a Multi-Output Device:
      - Click the "+" button in the lower left corner
      - Select "Create Multi-Output Device"
      - Check both "BlackHole 2ch" and your speakers/headphones
      - Set sample rate to 48000 Hz
   3. Set the Multi-Output Device as your default output device:
      - Open System Settings > Sound
      - Select the Multi-Output Device as output

   ### Windows
   1. Set Virtual Audio Cable as your default playback device
   2. Use the "Listen to this device" feature to route audio to your speakers/headphones:
      - Open Sound Control Panel
      - Go to Recording tab
      - Select the Virtual Audio Cable input
      - Open Properties
      - Go to the Listen tab
      - Check "Listen to this device"
      - Select your speakers/headphones as the device

   ### Linux
   1. Use PulseAudio to create a virtual sink:
      ```bash
      pactl load-module module-null-sink sink_name=virtual_speaker
      pactl load-module module-loopback source=virtual_speaker.monitor
      ```
   2. Use pavucontrol to route applications to the virtual sink

## Running the Application with Native Audio Capture

1. Configure your API keys in config.json
2. Run the application:
   ```bash
   python run_native_capture.py
   ```
3. Speak or play audio through your system
4. The application will automatically transcribe the audio and generate insights

## Troubleshooting

### No Audio Detected

- Make sure your virtual audio device is correctly installed
- Check that audio is being routed to the virtual device
- Try increasing the system volume

### PyAudio Installation Issues

- On macOS, if brew installation fails, try: `pip install --global-option='build_ext' --global-option='-I/opt/homebrew/include' --global-option='-L/opt/homebrew/lib' pyaudio`
- On Linux, install the development packages: `sudo apt-get install python3-dev libasound2-dev`

### Audio Quality Issues

- Try adjusting the sample rate and format in the NativeAudioCapture class
- Make sure your virtual audio device is set to the same sample rate

## Advanced Configuration

The native audio capture can be customized by editing the `src/audio/native_capture.py` file:

- Change `self.rate` to adjust the sample rate (default: 16000 Hz)
- Modify `self.channels` to use stereo (2) instead of mono (1)
- Adjust `self.chunk_duration` to change how often files are created
