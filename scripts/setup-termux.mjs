import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (process.platform !== 'android' || !process.env.PREFIX) {
  console.error('This setup command is for Android / Termux. On other systems use npm install.');
  process.exit(1);
}
const cwd = fileURLToPath(new URL('../', import.meta.url));
const env = {
  ...process.env,
  // sharp 0.33 uses C++11 by default; node-addon-api 8 needs C++17.
  CXXFLAGS: `${process.env.CXXFLAGS || ''} -std=c++17`.trim(),
  SHARP_FORCE_GLOBAL_LIBVIPS: '1',
  npm_package_config_node_gyp_nodedir: process.env.PREFIX,
};
function run(command, args) {
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit' });
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) process.exit(result.status || 1);
}
for (const command of ['clang++', 'make', 'python', 'pkg-config']) {
  if (spawnSync(command, ['--version'], { env, stdio:'ignore' }).status !== 0) {
    console.error('Install prerequisites: pkg install python make clang pkg-config libvips');
    process.exit(1);
  }
}
if (spawnSync('pkg-config', ['--atleast-version=8.15.3', 'vips-cpp'], {env, stdio:'ignore'}).status !== 0) {
  console.error('libvips >= 8.15.3 is required. Run: pkg update && pkg install libvips');
  process.exit(1);
}
run('npm', ['install', '--include=dev', '--foreground-scripts']);
// npm can consider an earlier incomplete sharp installation up to date.
const probe = "const sharp=require(require.resolve('sharp',{paths:['./backend']})); sharp({create:{width:8,height:8,channels:3,background:'red'}}).jpeg().toBuffer().then(()=>console.log('sharp Android JPEG check passed')).catch(e=>{console.error(e.message);process.exitCode=1});";
if (spawnSync(process.execPath, ['-e', probe], {cwd,env,stdio:'ignore'}).status !== 0) {
  run('npm', ['rebuild', 'sharp', '--foreground-scripts']);
}
run(process.execPath, ['-e', probe]);
console.log('Termux setup complete. Start with npm run dev or npm start.');
