# 掌控板3.0开发板配置

## 图片文件说明

请在此目录下添加以下图片文件：

1. `board.webp` - 掌控板3.0开发板实物图片 (建议尺寸: 400x300像素)
2. `pinmap.webp` - 掌控板3.0引脚图 (建议尺寸: 800x600像素)

## 硬件特性

- **主控芯片**: ESP32-S3R2 (240MHz双核处理器)
- **内存**: 8MB PSRAM + 16MB Flash
- **显示屏**: 1.3寸TFT LCD (240x240分辨率)
- **传感器**: 
  - 6轴运动传感器 (QMI8658A)
  - 3轴磁场传感器 (MMC5603NJ)
  - 光线传感器 (LTR-308ALS-01)
- **音频**: ES8388音频编解码器 + NS4152X功放
- **RGB LED**: 3个WS2812B可编程LED
- **按键**: A/B按键
- **接口**: USB Type-C、金手指GPIO接口

## 引脚映射

### 数字引脚 (P0-P16)
- P0 = GPIO1, P1 = GPIO2, P2 = GPIO3, P3 = GPIO4
- P4 = GPIO5, P5 = GPIO0, P6 = GPIO7, P7 = GPIO8
- P8 = GPIO15, P9 = GPIO16, P10 = GPIO6, P11 = GPIO46
- P12 = GPIO21, P13 = GPIO17, P14 = GPIO18
- P15 = GPIO48, P16 = GPIO47

### 专用接口
- **I2C**: SDA=GPIO44, SCL=GPIO43
- **显示屏SPI**: SDA=GPIO35, SCK=GPIO36, CS=GPIO34, RS=GPIO33
- **音频I2S**: BCK=GPIO41, LRCK=GPIO42, DIN=GPIO2, DOUT=GPIO1
- **RGB LED**: DATA=GPIO40
- **按键**: A=GPIO0, B=GPIO14
- **传感器中断**: INT=GPIO45

## 编译配置

使用ESP32-S3工具链进行编译：
- 编译器: arduino-cli
- 核心: arduino:esp32
- 类型: arduino:esp32:esp32s3
- 编译参数: `compile -v -b arduino:esp32:esp32s3`
- 上传参数: `upload -v -b arduino:esp32:esp32s3 -p ${serial}`

## 依赖库

默认包含以下功能库：
- 核心IO库、逻辑库、数学库、文本库等基础库
- 掌控板专用显示库、传感器库、音频库、RGB库、按键库
- ESP32 WiFi和蓝牙库

## 版本信息

- 版本: 1.0.0
- 基于: ESP32-S3架构
- 兼容: Arduino IDE编程环境