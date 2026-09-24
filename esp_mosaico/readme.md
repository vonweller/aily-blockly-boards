# ESP-Mosaico

基于 ESP32-S31NRV16，适用于 CoreBoard V1.0 + BaseBoard。

- [官方产品文档](https://docs.espressif.com/projects/esp-dev-kits/zh_CN/latest/esp32s31/esp-mosaico/index.html)
- [用户指南与引脚分配](https://docs.espressif.com/projects/esp-dev-kits/zh_CN/latest/esp32s31/esp-mosaico/user_guide.html)
- `board.webp` 基于提供的 ESP-Mosaico 宣传图片，使用 imagegen 提取设备并校正为正视图，保留屏幕内容；最终为 200 × 200 像素、透明背景的 WebP 图片。

## 适配状态

`package.json` 的 `state` 为 `alpha`。本包已按 Arduino ESP32 4.0.0-RC1 的 `boards.txt`、`platform.txt` 和 `variants/esp32s31/pins_arduino.h` 配置编译目标、工具依赖和菜单。尚未进行实板上传或板载外设验证。

本次核对的本地 SDK 实际目录为 `D:\Git\aily-project\package-download-upload\download\esp32\hardware\esp32@4.0.0`（不是 `hardware\esp32\@4.0.0`）。下载工具将上游版本 `4.0.0-RC1` 规范化为包版本 `4.0.0`，不表示上游已发布 4.0.0 正式版。

| 依赖 | 版本 |
| --- | --- |
| `@aily-project/sdk-esp32` | `4.0.0` |
| `@aily-project/compiler-esp-rv32` | `15.2.0` |
| `@aily-project/tool-esp32s31-libs` | `4.0.0` |
| `@aily-project/tool-esptool_py` | `5.3.1` |
| `@aily-project/tool-ctags` | `5.8.0` |

`type` / `compilerParam` 使用 SDK 实际存在的 `esp32:esp32:esp32s31`。SDK 没有独立的 Mosaico variant；本包通过 `board.json` 声明实际硬件连线。`tool-esp32s31-libs` 提供该芯片的预编译库、头文件和引导程序，不能用其他 ESP32 芯片的 libs 包替代。

板载设备的 `xxxConfig` 字段仅描述硬件连线，不会自动初始化设备。模板只加载基础积木库；屏幕、触摸、音频、传感器与电源管理需要后续驱动适配。

## 默认构建配置

新建项目的 `template/package.json.projectConfig` 默认使用：

| 菜单键 | 选项 ID | 含义 |
| --- | --- | --- |
| `FlashSize` | `16M` | 板载 16 MB NOR flash |
| `PartitionScheme` | `app3M_fat9M_16MB` | 两个 3 MB OTA 应用分区、约 9.9 MB FATFS |
| `USBMode` | `default` | USB-OTG (TinyUSB)，对应板载 Type-C |
| `CDCOnBoot` | `cdc` | 启动 USB CDC，`Serial` 用于 USB 日志 |
| `UploadMode` | `cdc` | USB-OTG CDC 上传，启用 1200 bps touch 和等待上传端口 |
| `UploadSpeed` | `921600` | SDK 上传速度选项 |
| `JTAGAdapter` / `MSCOnBoot` / `DFUOnBoot` / `ZigbeeMode` | `default` | 默认关闭 |
| `DebugLevel` / `EraseFlash` | `none` | 关闭核心调试日志、不全片擦除 |

SDK 的 `esp32s31` 目标固定使用 320 MHz、80 MHz flash、`qio_opi` 内存配置，并定义 `BOARD_HAS_PSRAM`；16 MB OPI PSRAM 沿用该配置。它没有 `PSRAM`、`CPUFreq`、`FlashMode` 或 `FlashFreq` 菜单，因此本包不声明这些无效菜单。`menu.json` 中的 12 个菜单全部从 SDK 动态读取选项，并提供 11 种语言的标题；切换 `CDCOnBoot` 时刷新运行时串口列表。

这些默认值只在新建项目时从模板复制。已有项目升级板包后，应在项目的 `projectConfig` 或开发板菜单中同步上述选项。选择其他分区时必须与 16 MB flash 容量匹配；128 MB SPI NAND 是独立资源存储，不能用于扩大程序分区。

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

模拟输入包含左侧 GPIO48、53、55 和右侧 GPIO46、47、49、52、54。官方开发板模块接口表将 GPIO19 标为 ADC，但本地 `esp32s31-libs@4.0.0/include/soc/esp32s31/include/soc/adc_channel.h` 明确将 ADC1/ADC2 通道映射到 GPIO42～57，通用 variant 也将 GPIO19 定义为 `T13`。本配置依据 SDK 保留 GPIO19 的数字功能，不将其列入 `analogPins`。

板上未定义独立的外部 SPI 默认引脚，因此通用 SPI 列表为空；SPI NAND 的固定 GPIO20～25 单独放在 `nandFlashConfig` 中。SDK 通用 variant 的 SPI 默认值为 SCK=40、MISO=39、MOSI=38、SS=37，会占用本板的音频与模块 EEPROM 信号，使用外部 SPI 时必须显式选择已释放的引脚。

### 通用 variant 的差异

`board.json` 不会改写 Arduino 头文件中的常量。手写代码或第三方库必须使用本板实际引脚：

- I2C 使用 `Wire.begin(0, 1)`；SDK 默认 `SDA=2`、`SCL=3`，分别对应本板传感器中断和状态灯，不能直接使用无参数 `Wire.begin()`。
- 状态灯使用 `pinMode(3, OUTPUT)` 和 `digitalWrite(3, LOW/HIGH)`，低电平亮。SDK 的 `LED_BUILTIN` / `RGB_BUILTIN` 是 GPIO60 的虚拟 RGB LED 引脚，而本板 GPIO60 用于电源控制，不能套用通用 Blink/RGB 示例。本包的 `builtinLed` 已使用实际数值 `3`。
- UART0 使用 TX=58、RX=59。默认开启 CDC 时 `Serial` 是 USB 串口，`Serial0` 是硬件 UART0；关闭 CDC 后 `Serial` 对应 UART0。主程序根据 `cdcSerialPort` 和 `CDCOnBoot` 自动调整列表。
- 不提供具有冲突默认连线的 `Serial1` 等额外串口下拉项；SDK 的 UART1 默认 RX=36、TX=35 已用于屏幕。需要额外串口时显式指定可用 RX/TX 引脚。

最小 I2C 和状态灯初始化示例：

```cpp
#include <Arduino.h>
#include <Wire.h>

void setup() {
  pinMode(3, OUTPUT);
  digitalWrite(3, HIGH);  // 初始关闭橙色状态灯
  pinMode(7, INPUT_PULLUP);
  Serial.begin(115200);   // 默认模板中为 USB CDC
  Wire.begin(0, 1);       // 本板共享 I2C
}

void loop() {
  digitalWrite(3, digitalRead(7));  // 按下功能键时亮灯
  delay(10);
}
```

此示例仅展示 GPIO、USB 串口与 I2C 引脚选择，不包含 GPIO60 电源软启动或板载设备驱动初始化。

QSPI 屏幕、音频等固定引脚见 `board.json`。音频 `din` / `dout` 均以 ESP32-S31 主控方向命名。触摸复位 GPIO 和完整摄像头模块连线未在文档引脚表中列出，本配置暂不填入；摄像头模块是可选扩展。

## USB 下载

板载 Type-C 使用 USB 2.0 High-Speed OTG。ROM 模式下不具备自动烧录和日志输出能力；出厂固件/BSP 提供 USB CDC 控制台与自动下载功能。本模板选择 Arduino TinyUSB CDC 的对应选项，后续应用应保留 CDC 功能。首次或无法自动下载时，关机后按住 BOOT 再开机进入下载模式。左侧 USB Serial/JTAG 和右侧 UART0 是另外两种调试连接。

改用左侧 USB Serial/JTAG 时，选择 `USBMode=hwcdc`、`UploadMode=default`，按需保留 `CDCOnBoot=cdc`。改用右侧 UART0 时，选择 `UploadMode=default`；如需让 `Serial` 输出到 UART0，再设置 `CDCOnBoot=default`。不要把左侧硬件 CDC 与板载 Type-C 的 USB-OTG 混用。

ESP32-S31 的 bootloader 偏移是 `0x2000`，由 SDK 上传配方处理；本包不复制其他 ESP32 型号的固定烧录命令。

## 验证记录

- 仓库规范检查通过：`node .scripts/validate-boards-compliance.js esp_mosaico`。
- 已核对 12 个动态菜单及模板选项与本地 SDK 一致、11 种语言翻译键完整、GPIO 列表无重复、分区不超出 16 MB。
- 使用 Arduino CLI 1.5.1、本地 Arduino ESP32 4.0.0-RC1、RISC-V GCC 15.2.0 和 ESP32-S31 libs 4.0.0，以模板默认选项完成 GPIO / I2C / USB CDC 最小程序编译，生成 16 MB 合并固件，确认 bootloader 偏移为 `0x2000`。
- 此编译验证不覆盖 Aily 界面交互、实板烧录、PSRAM 容量检测及屏幕、触摸、音频、传感器、电源管理等运行行为。
