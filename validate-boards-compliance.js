#!/usr/bin/env node

/**
 * 开发板配置规范检测脚本
 * 
 * 检测范围: 
 * 1. template/package.json中board依赖必须唯一
 * 2. board依赖名称必须与开发板package.json的name完全一致（小写）
 * 3. board依赖版本必须与开发板package.json的version一致
 * 4. template/package.json的board字段必须与开发板package.json的nickname字段相同
 * 5. boardDependencies中SDK版本与board版本一致性
 * 6. 基础字段完整性检测
 * 
 * 使用方法:
 *   node validate-boards-compliance.js [board名]
 *   node validate-boards-compliance.js --all
 *   node validate-boards-compliance.js --changed
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BoardValidator {
  constructor() {
    this.issues = [];
    this.score = 0;
    this.maxScore = 0;
    this.processedBoards = [];
  }

  // 添加检测问题
  addIssue(type, category, board, message, suggestion = '') {
    this.issues.push({ type, category, board, message, suggestion });
  }

  // 检测成功
  addSuccess(points = 1) {
    this.score += points;
    this.maxScore += points;
  }

  // 检测失败
  addFailure(points = 1) {
    this.maxScore += points;
  }

  // 获取变更的开发板（Git模式）
  getChangedBoards() {
    try {
      let changedFiles;
      
      // 检测是否在GitHub Actions环境中
      if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
        // PR模式：比较PR分支与目标分支
        const baseSha = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : 'HEAD~1';
        changedFiles = execSync(`git diff --name-only ${baseSha} HEAD`, { encoding: 'utf8' });
      } else if (process.env.GITHUB_EVENT_NAME === 'push') {
        // Push模式：比较当前提交与上一个提交
        changedFiles = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf8' });
      } else {
        // 本地模式：比较工作区与最后提交
        changedFiles = execSync('git diff --name-only HEAD', { encoding: 'utf8' });
      }
      
      console.log('变更的文件:', changedFiles);
      
      // 提取变更的开发板目录
      const changedBoards = new Set();
      const lines = changedFiles.trim().split('\n').filter(line => line.length > 0);
      
      for (const file of lines) {
        // 匹配 boardName/package.json 或 boardName/template/package.json
        const boardMatch = file.match(/^([^\/]+)\/(package\.json|template\/package\.json)$/);
        if (boardMatch) {
          const boardName = boardMatch[1];
          // 排除根目录和特殊目录
          if (boardName !== 'package.json' && 
              boardName !== '参考' && 
              !boardName.startsWith('.') && 
              boardName !== 'node_modules') {
            changedBoards.add(boardName);
          }
        }
      }
      
      return Array.from(changedBoards);
    } catch (error) {
      console.error('获取变更文件失败:', error.message);
      return [];
    }
  }

  // 检测单个开发板
  async validateBoard(boardPath) {
    const boardName = path.basename(boardPath);
    console.log(`\n🔍 检测开发板: ${boardName}`);
    console.log('='.repeat(50));

    const boardIssues = [];
    let boardScore = 0;
    let boardMaxScore = 0;

    // 检查必需文件存在性
    const boardPackagePath = path.join(boardPath, 'package.json');
    const templatePackagePath = path.join(boardPath, 'template', 'package.json');

    if (!fs.existsSync(boardPackagePath)) {
      this.addFailure();
      this.addIssue('error', '文件结构', boardName, '缺少 package.json 文件', '创建 package.json 文件');
      console.log(`  ❌ 缺少 package.json`);
      return { boardName, issues: this.issues.filter(i => i.board === boardName) };
    }

    if (!fs.existsSync(templatePackagePath)) {
      this.addFailure();
      this.addIssue('error', '文件结构', boardName, '缺少 template/package.json 文件', '创建 template/package.json 文件');
      console.log(`  ❌ 缺少 template/package.json`);
      return { boardName, issues: this.issues.filter(i => i.board === boardName) };
    }

    try {
      const boardPackage = JSON.parse(fs.readFileSync(boardPackagePath, 'utf8'));
      const templatePackage = JSON.parse(fs.readFileSync(templatePackagePath, 'utf8'));

      console.log(`\n📦 开发板信息:`);
      console.log(`  名称: ${boardPackage.name}`);
      console.log(`  版本: ${boardPackage.version}`);
      console.log(`  昵称: ${boardPackage.nickname || 'N/A'}`);

      // 1. 检测SDK版本一致性
      await this.checkSDKVersionConsistency(boardName, boardPackage);

      // 2. 检测基础字段完整性
      await this.checkBasicFields(boardName, boardPackage);

      // 3. 检测template中的dependencies（包括版本一致性检测）
      await this.checkTemplateDependencies(boardName, boardPackage, templatePackage);

    } catch (error) {
      this.addFailure();
      this.addIssue('error', 'JSON格式', boardName, `JSON解析失败: ${error.message}`, '修复JSON语法错误');
      console.log(`  ❌ JSON解析失败: ${error.message}`);
    }

    this.processedBoards.push(boardName);
    return { boardName, issues: this.issues.filter(i => i.board === boardName) };
  }

  // 1. 检测SDK版本一致性
  async checkSDKVersionConsistency(boardName, boardPackage) {
    console.log(`\n🛠️  检测SDK版本一致性...`);
    
    if (!boardPackage.boardDependencies) {
      this.addFailure();
      this.addIssue('warning', 'SDK版本', boardName, '缺少 boardDependencies 字段', '添加 boardDependencies 配置');
      console.log(`  ⚠️  缺少 boardDependencies`);
      return;
    }

    const boardVersion = boardPackage.version;
    const boardDeps = boardPackage.boardDependencies;
    let sdkFound = false;
    
    // 查找SDK依赖（通常以 @aily-project/sdk- 开头）
    for (const [depName, depVersion] of Object.entries(boardDeps)) {
      if (depName.startsWith('@aily-project/sdk-')) {
        sdkFound = true;
        
        if (depVersion === boardVersion) {
          this.addSuccess();
          console.log(`  ✅ SDK版本一致: ${depName}@${depVersion}`);
        } else {
          this.addFailure();
          this.addIssue('warning', 'SDK版本', boardName, 
            `SDK版本不匹配: ${depName} board(${boardVersion}) != sdk(${depVersion})`, 
            `将 ${depName} 版本更新为 "${boardVersion}"`);
          console.log(`  ⚠️  SDK版本不匹配: ${depName} board(${boardVersion}) != sdk(${depVersion})`);
        }
      }
    }
    
    if (!sdkFound) {
      this.addFailure();
      this.addIssue('info', 'SDK版本', boardName, '未找到SDK依赖', '确认是否需要添加对应的SDK依赖');
      console.log(`  💡 未找到SDK依赖`);
    }
  }

  // 3. 检测基础字段完整性
  async checkBasicFields(boardName, boardPackage) {
    console.log(`\n📋 检测基础字段...`);
    
    const requiredFields = [
      { field: 'name', pattern: /^@aily-project\/board-/ },
      { field: 'version', pattern: /^\d+\.\d+\.\d+$/ },
      { field: 'description' },
      { field: 'nickname' },
      { field: 'brand' }
    ];

    for (const { field, pattern } of requiredFields) {
      const value = boardPackage[field];
      
      if (!value) {
        this.addFailure();
        this.addIssue('warning', '基础字段', boardName, `缺少 ${field} 字段`, `添加 ${field} 字段`);
        console.log(`  ⚠️  缺少字段: ${field}`);
      } else if (pattern && !pattern.test(value)) {
        this.addFailure();
        this.addIssue('warning', '基础字段', boardName, `${field} 格式不正确: ${value}`, `修正 ${field} 格式`);
        console.log(`  ⚠️  字段格式错误: ${field}`);
      } else {
        this.addSuccess();
        console.log(`  ✅ ${field}: ${value}`);
      }
    }
  }

  // 4. 检测template依赖
  async checkTemplateDependencies(boardName, boardPackage, templatePackage) {
    console.log(`\n📦 检测template依赖...`);
    
    if (!templatePackage.dependencies) {
      this.addFailure();
      this.addIssue('error', 'Template依赖', boardName, 'template缺少dependencies字段', '添加dependencies配置');
      console.log(`  ❌ template缺少dependencies`);
      return;
    }

    const deps = templatePackage.dependencies;
    
    // 检测board依赖的数量和正确性
    const boardDeps = Object.keys(deps).filter(dep => dep.startsWith('@aily-project/board-'));
    const expectedBoardDep = boardPackage.name; // 开发板package.json中的name
    const expectedVersion = boardPackage.version;
    
    // 检查1: board依赖只能有一项
    if (boardDeps.length === 0) {
      this.addFailure();
      this.addIssue('error', 'Template依赖', boardName, 
        `template/package.json中缺少board依赖`, 
        `在dependencies中添加 "${expectedBoardDep}": "${expectedVersion}"`);
      console.log(`  ❌ 缺少board依赖`);
    } else if (boardDeps.length > 1) {
      this.addFailure();
      this.addIssue('error', 'Template依赖', boardName, 
        `template/package.json中有多个board依赖: ${boardDeps.join(', ')}`, 
        `只保留 "${expectedBoardDep}": "${expectedVersion}"，删除其他board依赖`);
      console.log(`  ❌ board依赖数量错误: 发现 ${boardDeps.length} 个，应该只有 1 个`);
    } else {
      // 有且仅有一个board依赖，检查其正确性
      const actualBoardDep = boardDeps[0];
      const actualVersion = deps[actualBoardDep];
      
      // 检查2: board依赖名称必须与开发板package.json的name相同（且必须为小写）
      if (actualBoardDep !== expectedBoardDep) {
        this.addFailure();
        
        // 检查是否是大小写问题
        if (actualBoardDep.toLowerCase() === expectedBoardDep.toLowerCase()) {
          this.addIssue('error', 'Template依赖', boardName, 
            `board依赖名称大小写不正确: "${actualBoardDep}" 应为 "${expectedBoardDep}" (必须小写)`, 
            `将 "${actualBoardDep}" 改为 "${expectedBoardDep}"`);
          console.log(`  ❌ board依赖名称大小写错误`);
        } else {
          this.addIssue('error', 'Template依赖', boardName, 
            `board依赖名称不匹配: "${actualBoardDep}" 应为 "${expectedBoardDep}"`, 
            `将 "${actualBoardDep}" 改为 "${expectedBoardDep}"`);
          console.log(`  ❌ board依赖名称不匹配`);
        }
      } else {
        this.addSuccess();
        console.log(`  ✅ board依赖名称正确: ${actualBoardDep}`);
      }
      
      // 检查3: 版本号必须与开发板package.json的version相同
      const cleanActualVersion = actualVersion.replace(/^[\^~]/, ''); // 移除 ^ 或 ~ 前缀
      if (cleanActualVersion !== expectedVersion) {
        this.addFailure();
        this.addIssue('error', 'Template依赖', boardName, 
          `board依赖版本不匹配: "${actualBoardDep}"的版本 ${actualVersion} 应为 "${expectedVersion}"`, 
          `将版本更新为 "${expectedVersion}"`);
        console.log(`  ❌ board依赖版本不匹配: ${actualVersion} != ${expectedVersion}`);
      } else {
        this.addSuccess();
        console.log(`  ✅ board依赖版本正确: ${expectedVersion}`);
      }
    }
    
    const coreLibs = Object.keys(deps).filter(dep => dep.startsWith('@aily-project/lib-core-'));
    
    if (coreLibs.length > 0) {
      this.addSuccess();
      console.log(`  ✅ 包含 ${coreLibs.length} 个核心库依赖`);
    } else {
      this.addFailure();
      this.addIssue('warning', 'Template依赖', boardName, '缺少核心库依赖', '添加必要的@aily-project/lib-core-*依赖');
      console.log(`  ⚠️  缺少核心库依赖`);
    }

    // 检测board字段与nickname字段一致性
    if (!boardPackage.nickname) {
      this.addFailure();
      this.addIssue('error', 'Template依赖', boardName, 
        '开发板package.json缺少nickname字段', 
        '添加nickname字段');
      console.log(`  ❌ 开发板缺少nickname字段`);
    } else if (!templatePackage.board) {
      this.addFailure();
      this.addIssue('error', 'Template依赖', boardName, 
        'template/package.json缺少board字段', 
        `添加 "board": "${boardPackage.nickname}"`);
      console.log(`  ❌ template缺少board字段`);
    } else if (templatePackage.board !== boardPackage.nickname) {
      this.addFailure();
      this.addIssue('error', 'Template依赖', boardName, 
        `template的board字段必须与开发板的nickname字段相同: "${templatePackage.board}" 应为 "${boardPackage.nickname}"`, 
        `将template/package.json中的board字段更新为 "${boardPackage.nickname}"`);
      console.log(`  ❌ board字段不匹配: "${templatePackage.board}" != "${boardPackage.nickname}"`);
    } else {
      this.addSuccess();
      console.log(`  ✅ board字段与nickname一致: ${templatePackage.board}`);
    }
  }

  // 扫描所有开发板
  async validateAllBoards() {
    const currentDir = process.cwd();
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    const boards = entries
      .filter(entry => {
        if (!entry.isDirectory()) return false;
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '参考') return false;
        
        // 检查是否包含package.json（开发板标识）
        const packagePath = path.join(currentDir, entry.name, 'package.json');
        return fs.existsSync(packagePath);
      })
      .map(entry => entry.name);

    console.log(`🔍 发现 ${boards.length} 个开发板目录\n`);

    const results = [];
    let passCount = 0;
    let partialCount = 0;
    let failCount = 0;

    for (const board of boards) {
      const boardPath = path.join(currentDir, board);
      const result = await this.validateBoard(boardPath);
      results.push(result);

      const errorCount = result.issues.filter(issue => issue.type === 'error').length;
      const warningCount = result.issues.filter(issue => issue.type === 'warning').length;

      if (errorCount === 0 && warningCount === 0) {
        passCount++;
      } else if (errorCount === 0) {
        partialCount++;
      } else {
        failCount++;
      }
    }

    // 总体统计
    console.log('\n' + '='.repeat(60));
    console.log('🏆 开发板检测统计报告');
    console.log('='.repeat(60));
    console.log(`📊 共检测开发板: ${results.length} 个`);
    console.log(`✅ 完全合规 (无错误无警告): ${passCount} 个 (${Math.round(passCount/results.length*100)}%)`);
    console.log(`⚠️  部分合规 (无错误有警告): ${partialCount} 个 (${Math.round(partialCount/results.length*100)}%)`);
    console.log(`❌ 需要修复 (有错误): ${failCount} 个 (${Math.round(failCount/results.length*100)}%)`);

    // 按问题数量排序显示问题开发板
    const problemBoards = results.filter(r => r.issues.length > 0);
    if (problemBoards.length > 0) {
      problemBoards.sort((a, b) => {
        const aErrors = a.issues.filter(i => i.type === 'error').length;
        const bErrors = b.issues.filter(i => i.type === 'error').length;
        if (aErrors !== bErrors) return bErrors - aErrors; // 错误多的排前面
        return b.issues.length - a.issues.length; // 总问题多的排前面
      });

      console.log('\n📋 需要关注的开发板:');
      for (const result of problemBoards.slice(0, 10)) {
        const errorCount = result.issues.filter(i => i.type === 'error').length;
        const warningCount = result.issues.filter(i => i.type === 'warning').length;
        const icon = errorCount > 0 ? '❌' : '⚠️';
        console.log(`  ${icon} ${result.boardName}: ${errorCount}错误 ${warningCount}警告`);
      }
    }

    return {
      total: results.length,
      pass: passCount,
      partial: partialCount,
      fail: failCount,
      results
    };
  }

  // 生成单板检测报告
  generateBoardReport(boardName, issues) {
    console.log(`\n📊 ${boardName} 检测报告`);
    console.log('='.repeat(30));
    
    if (issues.length === 0) {
      console.log('🎉 所有检测项均通过！');
      return true;
    } else {
      console.log(`\n❗ 发现 ${issues.length} 个问题:`);
      
      const groupedIssues = {};
      for (const issue of issues) {
        if (!groupedIssues[issue.category]) {
          groupedIssues[issue.category] = [];
        }
        groupedIssues[issue.category].push(issue);
      }

      for (const [category, categoryIssues] of Object.entries(groupedIssues)) {
        console.log(`\n📁 ${category}:`);
        for (const issue of categoryIssues) {
          const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : '💡';
          console.log(`  ${icon} ${issue.message}`);
          if (issue.suggestion) {
            console.log(`     💡 建议: ${issue.suggestion}`);
          }
        }
      }
      
      const hasErrors = issues.some(issue => issue.type === 'error');
      return !hasErrors; // 只有警告时返回true，有错误时返回false
    }
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const validator = new BoardValidator();

  if (args.length === 0 || args[0] === '--help') {
    console.log(`
开发板配置规范检测工具

使用方法:
  node validate-boards-compliance.js [开发板名]    检测指定开发板
  node validate-boards-compliance.js --all         检测所有开发板  
  node validate-boards-compliance.js --changed     检测变更的开发板
  node validate-boards-compliance.js --help        显示帮助

检测范围:
  ✅ Board依赖唯一性和正确性
  ✅ Board依赖名称匹配（必须小写）
  ✅ Board依赖版本一致性
  ✅ Board字段与nickname字段一致性
  ✅ SDK版本匹配检测
  ✅ 基础字段完整性
  ✅ Template依赖配置
`);
    return;
  }

  let success = true;

  if (args[0] === '--all') {
    const summary = await validator.validateAllBoards();
    success = summary.fail === 0;
  } else if (args[0] === '--changed') {
    const changedBoards = validator.getChangedBoards();
    
    if (changedBoards.length === 0) {
      console.log('ℹ️ 未检测到开发板配置文件变更');
      return;
    }

    console.log(`🔍 检测到 ${changedBoards.length} 个变更的开发板: ${changedBoards.join(', ')}\n`);
    
    let totalErrors = 0;
    for (const boardName of changedBoards) {
      const boardPath = path.resolve(boardName);
      
      if (!fs.existsSync(boardPath)) {
        console.error(`❌ 开发板目录不存在: ${boardPath}`);
        success = false;
        continue;
      }

      const result = await validator.validateBoard(boardPath);
      const boardSuccess = validator.generateBoardReport(result.boardName, result.issues);
      
      if (!boardSuccess) {
        success = false;
        totalErrors += result.issues.filter(i => i.type === 'error').length;
      }
    }
    
    console.log(`\n🏆 变更检测完成 - ${success ? '✅ 通过' : `❌ 失败 (${totalErrors}个错误)`}`);
  } else {
    const boardName = args[0];
    const boardPath = path.resolve(boardName);
    
    if (!fs.existsSync(boardPath)) {
      console.error(`❌ 开发板目录不存在: ${boardPath}`);
      process.exit(1);
    }

    const result = await validator.validateBoard(boardPath);
    success = validator.generateBoardReport(result.boardName, result.issues);
  }

  // 设置退出码
  process.exit(success ? 0 : 1);
}

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 检测过程中发生错误:', error);
    process.exit(1);
  });
}

module.exports = BoardValidator;