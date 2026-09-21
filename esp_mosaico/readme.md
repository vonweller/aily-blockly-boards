# ESP-Mosaico

基于 ESP32-S31NRV16，适用于 CoreBoard V1.0 + BaseBoard。

- [官方产品文档](https://docs.espressif.com/projects/esp-dev-kits/zh_CN/latest/esp32s31/esp-mosaico/index.html)
- [用户指南与引脚分配](https://docs.espressif.com/projects/esp-dev-kits/zh_CN/latest/esp32s31/esp-mosaico/user_guide.html)
- `board.webp` 基于提供的 ESP-Mosaico 宣传图片，使用 imagegen 提取设备并校正为正视图，保留屏幕内容；最终为 200 × 200 像素、透明背景的 WebP 图片。

## 适配状态

`package.json` 的 `state` 为 `todo`。当前仅建立开发板硬件配置和初始项目模板，相关 SDK 尚未更新，未验证编译、上传或板载外设驱动。

依赖版本沿用仓库 `esp32s31` 包：`sdk-esp32@3.3.10`、`compiler-esp-rv32@14.2.0`、`tool-esptool_py@5.3.0`、`tool-ctags@5.8.0`。包版本和模板依赖版本保持一致，未添加尚未提供的 ESP32-S31 IDF 工具包。

`type` / `compilerParam` 中的 `esp32:esp32:esp32s31` 是沿用通用配置的待验证目标。`menu.json` 暂为空；SDK 更新后需核对实际 `boards.txt` / variant、16 MB flash 与 16 MB PSRAM 配置、分区、USB 模式、串口对象及上传参数，再启用相应菜单。官方现阶段给出的开发流程为 ESP-IDF，目标芯片为 `esp32s31`。

板载设备的 `xxxConfig` 字段仅描述硬件连线，不会自动初始化设备。模板只加载基础积木库；屏幕、触摸、音频、传感器与电源管理需要后续驱动适配。

## 引脚使用

`digitalPins` 包含左右模块接口引出的 30 个不同 GPIO，以及状态灯 GPIO3、功能按键 GPIO7、振动马达 GPIO8。屏幕、NAND 和电源控制等内部专用引脚通过功能配置声明，不列入通用引脚选项。

| 用途 | GPIO / 约束 |
| --- | --- |
| 共享 I2C | SDA=0、SCL=1；连接触摸、音频、传感器、电量计及模块 EEPROM |
| 状态灯 | GPIO3，低电平点亮 |
| 功能按键 | GPIO7，低电平有效 |
| 振动马达 | GPIO8，高电平开启 |
| 左侧 USB Serial/JTAG | D-=33、D+=34，使用该调试接口时不可作为普通 GPIO |
| 右侧 UART0 | TX=58、RX=59 |
| 音频复用 | GPIO37、40、49、52、54 同时引出到右侧模块接口；使用 ES8311 音频时不可占用 |
| 模块 EEPROM 选择 | 左侧 GPIO14，低电平选通；右侧 GPIO39，高电平选通 |
| 扩展电源 | GPIO60 低电平启用扩展 3.3 V / 5 V 输出；BSP 对系统供电执行软启动 |
| Codec 供电 | GPIO56，高电平开启 |
| 关机请求 | GPIO57，正常运行保持高阻；关机时以开漏方式拉低 |

PWM、舵机和中断下拉列表保守排除共享 I2C、音频、EEPROM 选择和调试接口引脚，避免默认占用这些总线。通用数字引脚列表中保留复用脚并标明用途，使用前需释放对应功能。

模拟输入包含左侧 GPIO48、53、55 和右侧 GPIO46、47、49、52、54。官方开发板模块接口表将 GPIO19 标为 ADC，但[ESP-IDF GPIO 参考](https://docs.espressif.com/projects/esp-idf/en/latest/esp32s31/api-reference/peripherals/gpio.html)和[芯片规格书](https://documentation.espressif.com/esp32-s31_datasheet_en.html)将其列为 TOUCH13。本配置保留 GPIO19 的数字功能，暂不将其列入 `analogPins`，待官方澄清或实测确认。

板上未定义独立的外部 SPI 默认引脚，因此通用 SPI 列表暂为空；SPI NAND 的固定 GPIO20～25 单独放在 `nandFlashConfig` 中。不要沿用通用 ESP32-S31 模板的 I2C GPIO7/6、GPIO8/9，这些引脚在本板已用于按键、触摸、马达和屏幕。

QSPI 屏幕、音频等固定引脚见 `board.json`。音频 `din` / `dout` 均以 ESP32-S31 主控方向命名。触摸复位 GPIO 和完整摄像头模块连线未在文档引脚表中列出，本配置暂不填入；摄像头模块是可选扩展。

## USB 下载

板载 Type-C 使用 USB 2.0 High-Speed OTG。ROM 模式下不具备自动烧录和日志输出能力；出厂固件/BSP 提供 USB CDC 控制台与自动下载功能，后续应用需自行保留该功能。首次或无法自动下载时，关机后按住 BOOT 再开机进入下载模式。左侧 USB Serial/JTAG 和右侧 UART0 是另外两种调试连接。
