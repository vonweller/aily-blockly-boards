# LuatOS ESP32C3 Core 开发板

## 产品简介

LuatOS ESP32C3 Core是由合宙（OpenLuat）出品的基于乐鑫ESP32-C3芯片设计的核心开发板。该开发板尺寸仅有21mm×51mm，板边采用邮票孔设计，方便开发者在不同场景下使用。

## 主要特性

- **芯片**: ESP32-C3 (RISC-V 32位单核处理器)
- **尺寸**: 21mm × 51mm
- **Flash**: 板载4MB SPI Flash，支持最高16MB
- **接口**: 2路UART、1路SPI、1路I2C、5路12位ADC、4路PWM
- **GPIO**: 15个可复用GPIO引脚
- **指示灯**: 2个板载LED (GPIO12/GPIO13)
- **按键**: 1个复位按键 + 1个BOOT按键
- **下载**: USB转TTL下载调试口
- **天线**: 2.4G PCB板载天线

## 引脚配置

### 数字引脚
- GPIO0-GPIO13: 通用数字I/O
- GPIO18-GPIO21: 通用数字I/O（注意：GPIO18/19在USB直连版本中被占用）

### 模拟引脚 (ADC)
- GPIO0 (ADC1_0)
- GPIO1 (ADC1_1) 
- GPIO2 (ADC1_2)
- GPIO3 (ADC1_3)
- GPIO4 (ADC1_4)
- GPIO5 (ADC1_5)

### SPI接口
- MOSI: GPIO3
- MISO: GPIO10
- SCK: GPIO2
- CS: GPIO7 (可配置)

### I2C接口
- SDA: GPIO4
- SCL: GPIO5

### UART接口
- UART0: TX=GPIO21, RX=GPIO20 (下载调试口)
- UART1: TX=GPIO0, RX=GPIO1

### PWM
- 任意GPIO均可作为PWM输出，但同时只能开启4路PWM

### 板载LED
- LED_D4: GPIO12 (高电平点亮)
- LED_D5: GPIO13 (高电平点亮)

### 按键
- BOOT: GPIO9 (低电平有效，按下进入下载模式)
- RESET: 复位按键

## 使用注意事项

1. **经典款**需要安装CH343驱动才能正常下载固件
2. **USB直连款**无需安装驱动，但GPIO18/19被USB占用
3. GPIO9 (BOOT)上电前不能下拉，否则芯片会进入下载模式
4. GPIO8在下载时为低电平，设计时不建议外部直接下拉
5. GPIO12、GPIO13在QIO模式下为SPI信号复用，开发板采用DIO模式释放这两个引脚
6. GPIO11默认为SPI flash的VDD引脚，需要烧录熔丝位才能作为GPIO使用

## 编程环境

- **Arduino IDE**: 选择开发板 "AirM2M CORE ESP32C3"
- **编译工具**: arduino-cli
- **上传波特率**: 921600
- **Flash模式**: DIO
- **Flash大小**: 4MB

## 相关链接

- [官方文档](https://wiki.luatos.com/chips/esp32c3/board.html)
- [开源仓库](https://gitee.com/openLuat/luatos-soc-idf5)
- [示例代码](https://gitee.com/openLuat/LuatOS/tree/master/demo)
- [购买链接](https://luat.taobao.com/)

## 版权信息

本配置文件由aily项目团队基于LuatOS ESP32C3 Core开发板规格制作，遵循开源协议。
开发板由合宙（上海合宙通信科技有限公司）设计制造。