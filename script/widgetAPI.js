const fs = require('fs');
const packageJson = require('../package.json');
const JSZip = require('jszip');

const widgetAPIXmlPath = `./src/${packageJson.widgetName}.xml`;
const widgetMpkPath = `tests/testProject/widgets/com.mendix.widget.custom.${packageJson.widgetName}.mpk`;


console.log('开始监听widget api文件变动');

fs.watchFile(widgetAPIXmlPath, () => {
  console.log(`${widgetAPIXmlPath} 变化，同步到测试项目`);
  sync_once()
});


async function sync_once() {
  const widgetMpk = await fs.promises.readFile(widgetMpkPath);
  const zip = await JSZip.loadAsync(widgetMpk);

  const widgetAPIXml = await fs.promises.readFile(widgetAPIXmlPath);
  zip.file(`${packageJson.widgetName}.xml`, widgetAPIXml);

  const newZip = await zip.generateAsync({ type: 'nodebuffer' })
  await fs.promises.writeFile(widgetMpkPath, newZip);
}

