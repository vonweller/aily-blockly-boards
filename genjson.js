const fs = require('fs').promises;
const path = require('path');

// 默认要提取的package.json中的键
const defaultKeysToExtract = [
  'name',
  'nickname',
  'version',
  'description',
  'author',
  'brand',
  'url',
  'compatibility'
];

// 根据配置过滤package.json对象
function filterPackageJson(packageJson, keysToExtract) {
  const filteredJson = {};

  keysToExtract.forEach(key => {
    if (packageJson.hasOwnProperty(key)) {
      filteredJson[key] = packageJson[key];
    } else {
      filteredJson[key] = "";
    }
  });

  return filteredJson;
}

async function main() {
  try {
    // 获取当前目录路径
    const currentDir = __dirname;

    // 设置要提取的键，可以根据需要修改这个数组
    // 如果要提取所有键，可以设置为null
    const keysToExtract = defaultKeysToExtract;

    // 读取当前目录下的所有项
    const dirents = await fs.readdir(currentDir, { withFileTypes: true });

    // 过滤出子目录
    const subdirs = dirents
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    // 存储所有package.json的内容
    const libraries = [];

    // 处理每个子目录
    for (const subdir of subdirs) {
      const packageJsonPath = path.join(currentDir, subdir, 'package.json');

      try {
        // 检查并读取package.json
        await fs.access(packageJsonPath, fs.constants.F_OK);
        const data = await fs.readFile(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(data);

        // 根据配置过滤package.json
        const filteredJson = keysToExtract ? filterPackageJson(packageJson, keysToExtract) : packageJson;

        // 添加目录名称以便识别
        // filteredJson._directory = subdir;

        libraries.push(filteredJson);
        console.log(`成功读取 ${subdir}/package.json`);
      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log(`${subdir}目录下没有找到package.json`);
        } else {
          console.error(`处理${packageJsonPath}时出错:`, error);
        }
      }
    }

    // 写入结果到libraries.json
    const librariesJson = JSON.stringify(libraries, null, 2);
    const outputPath = path.join(currentDir, 'libraries.json');
    await fs.writeFile(outputPath, librariesJson, 'utf8');

    console.log(`成功将${libraries.length}个库的信息写入到${outputPath}`);
  } catch (error) {
    console.error('发生错误:', error);
  }
}

// 执行主函数
main();