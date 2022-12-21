const fs = require('fs');
const path = require('path');

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
// strips leading >=v
const nodeVersionNumber = packageJson.engines.node.replace(/^>=v/, '');

module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: nodeVersionNumber } }],
    '@babel/preset-typescript',
  ],
};
