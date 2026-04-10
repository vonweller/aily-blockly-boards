# nRF52840 Dongle

The nRF52840 Dongle (PCA10059) is a small, low-cost USB dongle that supports Bluetooth 5.4, Bluetooth mesh, Thread, Zigbee, 802.15.4, ANT and 2.4 GHz proprietary protocols.

## Features

- nRF52840 SoC: 64 MHz Arm Cortex-M4 with FPU, 1 MB Flash, 256 KB RAM
- Bluetooth 5.4, Bluetooth mesh, Thread, Zigbee, 802.15.4, ANT, 2.4 GHz
- USB 2.0 (USB-A connector)
- 15 GPIOs on castellated edges + 9 test points on back side
- User programmable RGB LED (LD2) and green LED (LD1)
- User configurable button (SW1) and reset button (SW2)
- USB-powered, no external supply needed
- SWD interface on back side for programming/debugging

## Pin Assignments

### LEDs
| LED | Color | GPIO |
|-----|-------|------|
| LD1 | Green | P0.06 |
| LD2 | Red   | P0.08 |
| LD2 | Green | P1.09 |
| LD2 | Blue  | P0.12 |

### Buttons
| Button | Function | GPIO |
|--------|----------|------|
| SW1 | User Button | P1.06 |
| SW2 | Reset | P0.18 |

### Castellated Edge GPIOs
**Top edge:** GND, P0.13, P0.15, P0.17, P0.20, P0.22, P0.24, VDD OUT, GND

**Bottom edge:** P0.31/AIN7, P0.29/AIN5, P0.02/AIN0, P1.15, P1.13, P1.10, GND

### Back Side Test Points
P0.09/NFC1, P0.10/NFC2, P0.03/AIN1, P0.04/AIN2, P0.26, P0.28/AIN4, P0.30/AIN6, P1.11, P1.14

## Links

- [Product Page](https://www.nordicsemi.com/Products/Development-hardware/nRF52840-Dongle)
- [User Guide](https://docs.nordicsemi.com/bundle/ug_nrf52840_dongle/page/UG/nrf52840_Dongle/intro.html)
