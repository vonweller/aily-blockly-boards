#!/usr/bin/env node

/**
 * 开发板配置检测测试脚本
 * 用于本地测试和快速验证
 */

const BoardValidator = require('./validate-boards-compliance.js');
const { validateCyberCamPackageContract } = require('./validate-cybercam-package-contract.js');
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

async function testBoards() {
  const validator = new BoardValidator();

  console.log('🧪 开发板配置检测测试\n');

  const testBoards = [
    'arduino_uno',
    'esp32',
    'raspberrypi_pico',
    'arduino_nano',
    'cybercam',
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

  validateCyberCamPackageContract();

  const automaticPathValidator = new BoardValidator();
  let cyberCamContractInvoked = false;
  automaticPathValidator.checkCyberCamPackageContract = async (boardName, boardPath) => {
    cyberCamContractInvoked = true;
    validateCyberCamPackageContract(path.resolve(boardPath));
  };
  const automaticPathResult = await automaticPathValidator.validateBoard('cybercam');
  assert.deepStrictEqual(automaticPathResult.issues, []);
  assert(cyberCamContractInvoked, 'generic validator must invoke the CyberCAM package contract');

  assert.deepStrictEqual(
    new BoardValidator().extractBoardsFromChangedFiles([
      '.scripts/validate-cybercam-package-contract.js',
    ]),
    ['cybercam'],
    'changing the CyberCAM contract must select CyberCAM in --changed mode',
  );
  const workflow = fs.readFileSync(
    path.resolve(__dirname, '..', '.github', 'workflows', 'boards-compliance-check.yml'),
    'utf8',
  );
  assert.match(workflow, /- '\*\/board\.webp'/);
  assert.match(workflow, /- '\*\/LICENSE\.image\.txt'/);
  assert.match(workflow, /- '\.scripts\/validate-cybercam-package-contract\.js'/);
  assert.match(workflow, /node \.scripts\/validate-boards-compliance\.js --changed/);

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

if (require.main === module) {
  testBoards().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = testBoards;
