#!/usr/bin/env node

/**
 * 开发板配置检测测试脚本
 * 用于本地测试和快速验证
 */

const BoardValidator = require('./validate-boards-compliance.js');
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

async function testBoards() {
  const validator = new BoardValidator();
  
  console.log('🧪 开发板配置检测测试\n');

  // 测试几个典型的开发板
  const testBoards = [
    'arduino_uno',
    'esp32',
    'raspberrypi_pico',
    'arduino_nano',
    'cybercam'
  ];

  console.log(`将测试以下开发板: ${testBoards.join(', ')}\n`);

  for (const boardName of testBoards) {
    console.log(`\n${'='.repeat(60)}`);
    try {
      const result = await validator.validateBoard(boardName);
      validator.generateBoardReport(result.boardName, result.issues);
      assert.deepStrictEqual(result.issues, [], `${boardName} should have no compliance issues`);
    } catch (error) {
      console.error(`❌ 测试 ${boardName} 时发生错误:`, error.message);
      throw error;
    }
  }

  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'aily-python-board-'));
  const fixturePath = path.join(fixtureRoot, 'invalid_python_board');
  try {
    fs.mkdirSync(path.join(fixturePath, 'template'), { recursive: true });
    fs.writeFileSync(path.join(fixturePath, 'package.json'), JSON.stringify({
      name: '@aily-project/board-invalid_python_board',
      version: '1.0.0',
      description: 'Invalid Python runtime fixture',
      nickname: 'Invalid Python Board',
      brand: 'Test',
      boardDependencies: {},
    }));
    fs.writeFileSync(path.join(fixturePath, 'board.json'), JSON.stringify({
      name: 'Invalid Python Board',
      version: '1.0.0',
      mode: ['python'],
      runtime: {
        kind: 'python',
        adapter: '',
        entry: 'main.py',
      },
    }));
    fs.writeFileSync(path.join(fixturePath, 'template', 'package.json'), JSON.stringify({
      name: 'project_',
      version: '1.0.0',
      board: 'Invalid Python Board',
      devmode: 'python',
      dependencies: {
        '@aily-project/board-invalid_python_board': '1.0.0',
        '@aily-project/lib-core-logic': '0.0.1',
      },
    }));

    const invalidValidator = new BoardValidator();
    const invalidResult = await invalidValidator.validateBoard(fixturePath);
    assert(
      invalidResult.issues.some(issue => issue.category === 'Python运行时' && issue.type === 'error'),
      'Python-only boards with incomplete runtime metadata should fail validation',
    );
  } finally {
    fs.rmSync(fixtureRoot, { recursive: true, force: true });
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('🏁 测试完成');
}

// 如果直接运行此文件
if (require.main === module) {
  testBoards().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = testBoards;
