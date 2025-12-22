# 开发板配置规范检测系统

本系统用于自动检测开发板配置的规范性和一致性，确保开发板的 `package.json` 和 `template/package.json` 文件符合项目规范。

## 🚀 功能特性

### 检测范围
- ✅ **Board依赖唯一性和正确性**: template/package.json 中只能有一个 board 依赖
- ✅ **Board依赖名称匹配**: 依赖名称必须与开发板 package.json 的 name 字段完全一致（必须小写）
- ✅ **Board依赖版本一致性**: 依赖版本必须与开发板 package.json 的 version 字段相同
- ✅ **Board与Nickname字段一致性**: template/package.json 的 board 字段必须与开发板 package.json 的 nickname 字段相同
- ✅ **SDK版本匹配检测**: 确保 `boardDependencies` 中的SDK版本与开发板版本一致  
- ✅ **基础字段完整性**: 检查必需字段 (`name`, `version`, `description`, `nickname`, `brand`) 
- ✅ **Template依赖配置**: 检查template中的依赖配置和board字段

### 自动化检测
- 🤖 **GitHub Actions集成**: PR和Push时自动触发检测
- 💬 **智能PR评论**: 自动在PR中添加检测结果和修复建议
- 🔄 **增量检测**: 只检测变更的开发板，提高效率
- 📊 **详细报告**: 生成完整的检测报告和统计信息

## 📋 使用方法

### 本地使用

#### 1. 检测单个开发板
```bash
node validate-boards-compliance.js arduino_uno
```

#### 2. 检测所有开发板
```bash
node validate-boards-compliance.js --all
```

#### 3. 检测变更的开发板
```bash
node validate-boards-compliance.js --changed
```

#### 4. 快速测试
```bash
node test-boards-compliance.js
```

#### 5. 显示帮助
```bash
node validate-boards-compliance.js --help
```

### GitHub Actions自动化

当你提交包含以下文件变更的PR或Push时，会自动触发检测：
- `*/package.json` 
- `*/template/package.json`
- `*/board.json`
- `*/readme.md`

检测结果会：
- 显示在Actions页面的Summary中
- 自动添加评论到PR（如果是PR触发）
- 设置相应的检查状态
- 生成详细的统计报告（主分支）

配置文件：
- Workflow：`.github/workflows/boards-compliance-check.yml`
- 配置：`.github/boards-compliance-config.yml`

## 🔍 检测规则详解

### 1. Board 依赖检测

template/package.json 中的 dependencies 必须：
- **唯一性**：只能有一个以 `@aily-project/board-` 开头的依赖
- **名称匹配**：依赖名称必须与开发板 package.json 的 `name` 字段完全一致（必须小写）
- **版本一致**：依赖版本必须与开发板 package.json 的 `version` 字段相同

### 2. Board 与 Nickname 字段一致性

template/package.json 的 `board` 字段必须与开发板 package.json 的 `nickname` 字段完全相同。

### 3. SDK 版本一致性

boardDependencies 中的 SDK 版本应与开发板版本一致。

## 📝 检测示例

### 正确的配置示例

**xiao_rp2350/package.json**:
```json
{
  "name": "@aily-project/board-xiao_rp2350",
  "version": "5.1.0",
  "nickname": "XIAO RP2350",
  "description": "XIAO RP2350",
  "brand": "SeeedStudio",
  "boardDependencies": {
    "@aily-project/sdk-rp2040": "5.1.0"  // ✅ 与board版本一致
  }
}
```

**xiao_rp2350/template/package.json**:
```json
{
  "name": "project_",
  "version": "1.0.0",
  "board": "XIAO RP2350",  // ✅ 匹配nickname
  "dependencies": {
    "@aily-project/board-xiao_rp2350": "5.1.0",  // ✅ 匹配board的name和version
    "@aily-project/lib-core-io": "1.0.0"
  }
}
```

### 常见错误和修复

#### 1. Board 依赖版本不匹配
```
❌ 错误: board依赖版本不匹配: "@aily-project/board-xxx"的版本 1.0.0 应为 "1.0.1"
💡 修复: 将template中的版本更新为 "1.0.1"
```

#### 2. Board 字段与 nickname 不一致
```
❌ 错误: board字段不匹配: "Board Name" != "Correct Board Name"
💡 修复: 更新template/package.json中的board字段为 "Correct Board Name"
```

#### 3. 多个 Board 依赖
```
❌ 错误: board依赖数量错误: 发现 2 个，应该只有 1 个
💡 修复: 删除多余的board依赖，只保留当前开发板的依赖
```

#### 4. Board 依赖名称不匹配
```
❌ 错误: board依赖名称不匹配: "@aily-project/board-Wrong_Name" 应为 "@aily-project/board-correct_name"
💡 修复: 确保board依赖名称与开发板package.json的name字段完全一致（注意大小写）
```

#### 2. SDK版本不一致
```
❌ 错误: SDK版本不匹配: @aily-project/sdk-avr board(1.8.6) != sdk(1.8.5) 
💡 修复: 将 @aily-project/sdk-avr 版本更新为 "1.8.6"
```

#### 3. 缺少必需字段
```
❌ 错误: 缺少 nickname 字段
💡 修复: 添加 nickname 字段
```

#### 4. board字段不匹配
```
❌ 错误: board字段不匹配: "Arduino UNO" 应为 "Arduino UNO R3"
💡 修复: 更新board字段为 "Arduino UNO R3"
```

## 🛠️ 部署配置

### GitHub Actions权限设置

确保在仓库设置中配置正确的权限：

1. **仓库设置 → Actions → General → Workflow permissions**
   - 选择: "Read and write permissions"
   - 启用: "Allow GitHub Actions to create and approve pull requests"

2. **分支保护规则**
   - 如有分支保护，确保不会阻止GitHub Actions bot的操作

### 工作流文件

GitHub Actions工作流文件位于: `.github/workflows/board-compliance-check.yml`

触发条件:
- PR提交到 `main` 或 `develop` 分支
- Push到 `main` 或 `develop` 分支
- 变更路径包含: `*/package.json`, `*/template/package.json`

## 📊 检测报告示例

### 成功案例
```
🔍 检测开发板: arduino_uno
==================================================

📦 开发板信息:
  名称: @aily-project/board-arduino_uno
  版本: 1.8.6
  昵称: Arduino UNO R3

🔄 检测版本一致性...
  ✅ 版本一致: 1.8.6

🛠️  检测SDK版本一致性...
  ✅ SDK版本一致: @aily-project/sdk-avr@1.8.6

📋 检测基础字段...
  ✅ name: @aily-project/board-arduino_uno
  ✅ version: 1.8.6
  ✅ description: Arduino UNO R3 是一款基于ATmega328P的开源电子原型平台...
  ✅ nickname: Arduino UNO R3
  ✅ brand: Arduino

📦 检测template依赖...
  ✅ 包含 8 个核心库依赖
  ✅ board字段正确: Arduino UNO R3

📊 arduino_uno 检测报告
==============================
🎉 所有检测项均通过！
```

### 问题案例
```
🔍 检测开发板: esp32_example
==================================================

❗ 发现 3 个问题:

📁 版本一致性:
  ❌ 版本不匹配: board(2.0.5) != template(2.0.4)
     💡 建议: 将template中的版本更新为 "^2.0.5"

📁 SDK版本:
  ⚠️  SDK版本不匹配: @aily-project/sdk-esp32 board(2.0.5) != sdk(2.0.3)
     💡 建议: 将 @aily-project/sdk-esp32 版本更新为 "2.0.5"

📁 Template依赖:
  ⚠️  board字段不匹配: "ESP32" 应为 "ESP32 DevKit"
     💡 建议: 更新board字段为 "ESP32 DevKit"
```

## 📁 文件结构

```
aily-blockly-boards/
├── validate-boards-compliance.js     # 主检测脚本
├── test-boards-compliance.js         # 测试脚本
├── .github/workflows/
│   └── board-compliance-check.yml    # GitHub Actions工作流
├── arduino_uno/
│   ├── package.json                  # 开发板配置
│   └── template/
│       └── package.json              # 模板配置
└── README-BoardsCompliance.md        # 本文档
```

## 🔧 故障排除

### 1. GitHub Actions权限问题
如果PR评论功能不工作，检查：
- 仓库Actions权限设置
- 分支保护规则配置
- Token权限配置

### 2. 本地脚本运行问题
```bash
# 确保Node.js版本 >= 14
node --version

# 确保在正确的目录
pwd  # 应该在aily-blockly-boards根目录

# 检查脚本权限
ls -la validate-boards-compliance.js
```

### 3. 检测结果异常
- 检查JSON文件格式是否正确
- 确认文件路径和命名规范
- 查看详细错误信息和建议

## 📖 相关文档

- [开发板规范.md](./开发板规范.md)
- [开发板适配.md](./开发板适配.md)
- [GitHub Actions文档](https://docs.github.com/en/actions)

## 🤝 贡献

如需改进检测规则或添加新功能，请：
1. 修改 `validate-boards-compliance.js` 脚本
2. 更新相应的测试用例
3. 提交PR并触发自动检测