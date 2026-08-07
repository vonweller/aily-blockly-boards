# ESP32P4 Core Board

本配置对应 Arduino-ESP32 3.3.11 中的开发板：

```text
esp32:esp32:esp32p4_core_board
```

板载 ESP32-C6 通过 4-bit SDIO 作为 ESP-Hosted Wi-Fi/蓝牙协处理器，Arduino 程序可直接使用 `WiFi.h`。

## 默认接口

- UART0：TX GPIO37，RX GPIO38
- UART1：TX GPIO10，RX GPIO11
- I2C：SDA GPIO7，SCL GPIO8
- SPI：SS GPIO30，SCK GPIO31，MISO GPIO32，MOSI GPIO33
- RGB LED：GPIO44（使用 `RGB_BUILTIN`）

## 板载 ESP32-C6 保留引脚

以下引脚连接板载 ESP32-C6，未加入通用 GPIO、PWM、舵机和中断引脚列表：

| ESP32-P4 GPIO | ESP32-C6 信号 |
| ---: | --- |
| 47 | SDIO D3 |
| 48 | SDIO D2 |
| 49 | SDIO D1 |
| 50 | SDIO D0 |
| 51 | SDIO CLK |
| 52 | SDIO CMD |
| 53 | BOOT / GPIO9 |
| 54 | CHIP_PU / RESET |

使用板载无线功能时，不要在用户程序中重新配置 GPIO47～54。
