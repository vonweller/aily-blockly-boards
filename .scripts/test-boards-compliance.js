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

const EXPECTED_CYBERCAM_LOCALES = [
  'ar.json',
  'de.json',
  'en.json',
  'es.json',
  'fr.json',
  'ja.json',
  'ko.json',
  'pt.json',
  'ru.json',
  'zh_cn.json',
  'zh_hk.json',
];

const EXPECTED_CYBERCAM_CORE_DEPENDENCIES = {
  '@aily-project/lib-core-io': '1.0.0',
  '@aily-project/lib-core-logic': '0.0.1',
  '@aily-project/lib-core-loop': '0.0.1',
  '@aily-project/lib-core-math': '0.0.1',
  '@aily-project/lib-core-serial': '0.0.1',
  '@aily-project/lib-core-text': '1.0.0',
  '@aily-project/lib-core-time': '0.0.1',
  '@aily-project/lib-core-variables': '1.0.1',
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readWebpDimensions(filePath) {
  const data = fs.readFileSync(filePath);
  assert.strictEqual(data.toString('ascii', 0, 4), 'RIFF', 'board.webp must be a RIFF file');
  assert.strictEqual(data.toString('ascii', 8, 12), 'WEBP', 'board.webp must be a WebP file');

  let offset = 12;
  while (offset + 8 <= data.length) {
    const chunkType = data.toString('ascii', offset, offset + 4);
    const chunkSize = data.readUInt32LE(offset + 4);
    const chunk = offset + 8;

    if (chunkType === 'VP8X' && chunkSize >= 10) {
      return {
        width: data.readUIntLE(chunk + 4, 3) + 1,
        height: data.readUIntLE(chunk + 7, 3) + 1,
      };
    }
    if (chunkType === 'VP8 ' && chunkSize >= 10) {
      return {
        width: data.readUInt16LE(chunk + 6) & 0x3fff,
        height: data.readUInt16LE(chunk + 8) & 0x3fff,
      };
    }
    if (chunkType === 'VP8L' && chunkSize >= 5 && data[chunk] === 0x2f) {
      const dimensions = data.readUInt32LE(chunk + 1);
      return {
        width: (dimensions & 0x3fff) + 1,
        height: ((dimensions >>> 14) & 0x3fff) + 1,
      };
    }

    offset = chunk + chunkSize + (chunkSize % 2);
  }

  assert.fail('board.webp does not contain a supported WebP image chunk');
}

function validateCyberCamPackageContract() {
  const boardRoot = path.resolve(__dirname, '..', 'cybercam');
  const packageJson = readJson(path.join(boardRoot, 'package.json'));
  const boardJson = readJson(path.join(boardRoot, 'board.json'));
  const templateJson = readJson(path.join(boardRoot, 'template', 'package.json'));
  const abi = readJson(path.join(boardRoot, 'template', 'project.abi'));

  assert.strictEqual(packageJson.name, '@aily-project/board-cybercam');
  assert.strictEqual(packageJson.version, '1.1.0');
  assert.strictEqual(packageJson.nickname, 'CyberCAM');
  assert.strictEqual(packageJson.brand, '01Studio');

  assert.deepStrictEqual(boardJson.capabilities, {
    camera: true,
    display: true,
    touch: true,
    audioInput: true,
    audioOutput: true,
    imu: true,
    wifi: true,
    bluetooth: true,
    gpio: true,
    pwm: true,
    uart: true,
    i2c: true,
    spi: true,
  });
  assert.strictEqual(boardJson.usbVid, '1209');
  assert.strictEqual(boardJson.usbPid, 'abd1');
  assert.deepStrictEqual(boardJson.cameraConfig, {
    interface: 'mipi-csi',
    supportedModels: ['gc2093', 'ov5647'],
    pins: {},
  });
  assert.deepStrictEqual(boardJson.displayConfig, {
    controller: 'st7701s',
    interface: 'mipi-dsi',
    width: 640,
    height: 480,
    pins: {},
  });
  assert.deepStrictEqual(boardJson.audioConfig, {
    codec: 'inno',
    pins: {},
  });

  assert.deepStrictEqual(
    boardJson.digitalPins.map(([, value]) => value).sort((a, b) => Number(a) - Number(b)),
    ['11', '12', '14', '15', '16', '17', '21', '46', '47', '52'],
  );
  assert.deepStrictEqual(
    boardJson.pwmPins.map(([, value]) => value).sort((a, b) => Number(a) - Number(b)),
    ['46', '47', '60', '61'],
  );
  assert.deepStrictEqual(boardJson.serialPins, {
    UART2: [['TX', '11'], ['RX', '12']],
  });
  assert.deepStrictEqual(boardJson.i2cPins, {
    I2C2: [['SCL', '11'], ['SDA', '12']],
    I2C1: [['SCL', '40'], ['SDA', '41']],
  });
  assert.deepStrictEqual(boardJson.spiPins, {
    SPI0: [['CS0', '14'], ['SCLK', '15'], ['MOSI', '16'], ['MISO', '17']],
  });
  assert.deepStrictEqual(boardJson.builtinLed, [['LED', '52']]);
  assert.deepStrictEqual(boardJson.builtinButton, [['KEY', '21']]);
  assert.deepStrictEqual(boardJson.specialPins, {
    led: '52',
    key: '21',
    fillLight: { pin: '46', pwm: 'PWM2' },
    buzzer: { pin: '47', pwm: 'PWM3' },
    imu: { bus: 'I2C1', scl: '40', sda: '41' },
  });
  assert(!boardJson.interruptPins.some(([, value]) => value === '60' || value === '61'));

  const locales = fs.readdirSync(path.join(boardRoot, 'i18n'))
    .filter(file => file.endsWith('.json'))
    .sort();
  assert.deepStrictEqual(locales, EXPECTED_CYBERCAM_LOCALES);
  assert.deepStrictEqual(readWebpDimensions(path.join(boardRoot, 'board.webp')), {
    width: 200,
    height: 200,
  });

  const starterBlocks = abi.blocks && abi.blocks.blocks;
  assert(Array.isArray(starterBlocks), 'project.abi must contain blocks.blocks');
  assert.deepStrictEqual(
    starterBlocks.map(({ type, deletable }) => ({ type, deletable })),
    [
      { type: 'cybercam_start', deletable: false },
      { type: 'cybercam_forever', deletable: false },
    ],
  );

  assert.strictEqual(templateJson.devmode, 'python');
  const boardDependencies = Object.entries(templateJson.dependencies)
    .filter(([name]) => name.startsWith('@aily-project/board-'));
  assert.deepStrictEqual(boardDependencies, [['@aily-project/board-cybercam', '1.1.0']]);
  assert.deepStrictEqual(templateJson.dependencies, {
    '@aily-project/board-cybercam': '1.1.0',
    ...EXPECTED_CYBERCAM_CORE_DEPENDENCIES,
    '@aily-project/lib-cybercam': '1.0.0',
  });
}

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

  validateCyberCamPackageContract();

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
