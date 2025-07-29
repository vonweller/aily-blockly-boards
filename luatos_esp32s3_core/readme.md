# LuatOS ESP32S3 Core 开发板

## 产品描述

LuatOS ESP32S3 Core是基于乐鑫ESP32-S3芯片设计的核心开发板，由合宙OpenLuat出品。

## 硬件特性

- **处理器**: ESP32-S3 Xtensa® 32位 LX7 双核处理器，主频高达240MHz
- **内存**: 内置512KB SRAM + 8MB PSRAM
- **存储**: 16MB Flash
- **尺寸**: 21mm × 51mm，采用邮票孔设计
- **无线**: 支持2.4GHz WiFi和蓝牙
- **USB**: 支持USB OTG和USB Serial/JTAG控制器

## 引脚配置

### 板载LED
- LEDA: GPIO10 (高电平有效)
- LEDB: GPIO11 (高电平有效)

### 按键
- BOOT: GPIO0 (低电平有效，按下进入下载模式)
- RST: 复位按键 (低电平有效)

### 通信接口

#### SPI2 (默认SPI)
- MOSI: GPIO17
- MISO: GPIO16
- SCK: GPIO18
- CS: GPIO14

#### SPI3
- MOSI: GPIO47
- MISO: GPIO33
- SCK: GPIO48

#### I2C
- SDA: GPIO11
- SCL: GPIO12

#### UART2
- RX: GPIO7
- TX: GPIO6

### GPIO引脚
支持GPIO0-GPIO48（除GPIO19/20用于USB功能外）

## 编程支持
- 支持Arduino IDE开发
- 支持LuatOS Lua脚本开发
- 日志波特率: 921600

## 特别注意
1. 通过USB转串口烧录需要安装CH343驱动
2. 支持USB直连下载（Win8及以上系统免驱）
3. GPIO19/20在USB下载模式时被占用，应避免使用
4. 任意GPIO均可作为PWM引脚，但同时只能开启8路PWM

## 相关链接
- [官方文档](https://wiki.luatos.com/chips/esp32s3/board.html)
- [开源仓库](https://gitee.com/openLuat/luatos-soc-idf5)
- [示例代码](https://gitee.com/openLuat/LuatOS/tree/master/demo)