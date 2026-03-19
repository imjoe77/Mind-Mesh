import { execSync } from 'child_process';
import fs from 'fs';

try {
  console.log('Starting install...');
  const output = execSync('npm install socket.io-client --no-fund --no-audit', { encoding: 'utf8' });
  fs.writeFileSync('install_result.txt', output);
  console.log('Install finished successfully');
} catch (error) {
  fs.writeFileSync('install_result.txt', error.toString() + '\n' + error.stdout + '\n' + error.stderr);
  console.log('Install failed');
}
