# CyberCAM

CyberCAM is a Python-only AI camera board from 01Studio based on the 64-bit dual-core RISC-V K230. The board package uses the `canmv-k230` runtime adapter and starts projects from `main.py`.

## Main features

- K230 CPU: 1.6 GHz and 800 MHz RISC-V cores
- KPU with 6 TOPS equivalent AI performance
- 1 GB LPDDR4 memory and MicroSD storage
- GC2093 camera and 2.4-inch 640 × 480 flip touchscreen
- Dual-band Wi-Fi 6 and Bluetooth 5.0
- Dual microphones, 8 Ω / 1 W speaker, passive buzzer, fill light, and QMI8658A six-axis IMU
- USB 2.0 host and USB Type-C development connection
- 3.3 V GPIO logic; 5 V @ 1 A board supply

## Runtime

| Setting | Value |
| --- | --- |
| Development mode | Python |
| Runtime kind | `python` |
| Adapter | `canmv-k230` |
| Entry file | `main.py` |

CyberCAM remains a board package and is not exposed as a separate project type.

## Board capabilities and device detection

`board.json` declares the fixed onboard camera, display, touch, audio input/output, IMU, wireless, GPIO, PWM, UART, I2C, and SPI capabilities. The standard device configuration fields describe the hardware for consumers that support automatic configuration:

- `cameraConfig`: MIPI CSI camera interface; GC2093 and OV5647 are explicitly supported by the official camera documentation.
- `displayConfig`: ST7701S controller over the 2-lane MIPI display interface at 640 × 480.
- `audioConfig`: an empty fixed-pin map for the internal audio path. The official documentation names the ALSA card `K230I2SINNO` and device `Audio 9140e000.inno codec-0`, but does not identify a codec chip model, so `board.json` deliberately does not claim one.

The camera, display, and audio connections are fixed internal interfaces. 01Studio does not publish selectable GPIO mappings for those signals, so their standard `pins` objects are intentionally empty rather than containing guessed values.

The official CyberCAM VS Code extension detects supported CanMV boards through USB serial enumeration using VID/PID `1209:abd1`. These values are recorded as `usbVid` and `usbPid`, field names recognized by the Aily serial-port loader. If automatic discovery is unavailable, the official tool supports manually selecting the serial path (for example `/dev/ttyACM0`) and uses 12,000,000 baud.

## Pin capabilities

| Capability | Assignment |
| --- | --- |
| General GPIO | GPIO11, GPIO12, GPIO14, GPIO15, GPIO16, GPIO17, GPIO60, GPIO61 |
| User LED | GPIO52 |
| User key | GPIO21 |
| Fill light | GPIO46 / PWM2 |
| Passive buzzer | GPIO47 / PWM3 |
| PWM0 | GPIO60 |
| PWM1 | GPIO61 |
| UART2 | TX GPIO11, RX GPIO12 |
| I2C2 | SCL GPIO11, SDA GPIO12 |
| Onboard IMU (I2C1) | SCL GPIO40, SDA GPIO41 |
| SPI0 | CS0 GPIO14, SCLK GPIO15, MOSI GPIO16, MISO GPIO17 |

GPIO11 and GPIO12 are shared by UART2 and I2C2. GPIO14–GPIO17 are shared with SPI0. Configure only one conflicting peripheral function at a time. The onboard IMU bus is listed separately from the exposed I2C2 connector.

The official GPIO documentation states that every IO pin except power and the two ADC pads can be configured for ordinary input/output. GPIO60 and GPIO61 therefore appear in both `digitalPins` and `pwmPins`. They are not included in `interruptPins` because the official documentation does not establish interrupt support for them.

The official documentation identifies ADC0 and ADC1 as 0–3.6 V solder pads but does not assign GPIO numbers to them, so they are intentionally not exposed as selectable analog pins in this package.

## Sources

- [01Studio CyberCAM product documentation](https://github.com/01studio-lab/01studio_wiki/blob/main/docs/cybercam/intro/product.md)
- [01Studio CyberCAM accessory specifications](https://github.com/01studio-lab/01studio_wiki/blob/main/docs/cybercam/intro/module.md)
- [01Studio CyberCAM GPIO documentation](https://github.com/01studio-lab/01studio_wiki/blob/main/docs/cybercam/basic_examples/gpio_intro.md)
- [01Studio CyberCAM camera documentation](https://github.com/01studio-lab/01studio_wiki/blob/main/docs/cybercam/machine_vision/camera.md)
- [01Studio CyberCAM audio documentation](https://github.com/01studio-lab/01studio_wiki/blob/main/docs/cybercam/os_software/audio.md)
- [Official CyberCAM VS Code extension](https://marketplace.visualstudio.com/items?itemName=01Studio.cybercam-vscode)

`board.webp` is cropped and resized from the official CyberCAM product image `docs/cybercam/intro/img/product/intro2.png`. The image is distributed separately under the upstream MIT License; attribution and the complete license text are included in `LICENSE.image.txt`. The package's ISC declaration does not replace that image license.
