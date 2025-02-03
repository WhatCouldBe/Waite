// runEverything.js
const { execSync, spawn } = require('child_process');
const http = require('http');
const path = require('path');

// Helper function to run a command synchronously.
function runCommand(command, options = {}) {
  try {
    console.log(`Running: ${command} in ${options.cwd || process.cwd()}`);
    execSync(command, { stdio: 'inherit', shell: true, ...options });
  } catch (err) {
    console.error(`Error running command: ${command}`, err);
    process.exit(1);
  }
}

// Helper function to start a long-running process.
function startProcess(command, args, cwd) {
  console.log(`Starting process: ${command} ${args.join(' ')} in ${cwd}`);
  const proc = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    shell: true
  });
  proc.on('error', (err) => {
    console.error(`Error starting process in ${cwd}:`, err);
  });
  return proc;
}

// 1. Run npm install in the root.
runCommand('npm install');

// 2. Build the client.
//    This assumes that the client folder has a valid package.json with a "build" script.
const clientDir = path.join(__dirname, 'client');
console.log('Building client...');
runCommand('npm run build', { cwd: clientDir });

// 3. Start the server.
//    (Your root package.json's "start" script should be something like "node server/server.js")
const serverDir = path.join(__dirname, 'server');
console.log('Starting server from the server directory...');
runCommand('npm install', { cwd: serverDir }); // Optional if your server folder needs dependencies
const serverProcess = startProcess('npm', ['start'], serverDir);

// 4. (Optional) Start a simple HTTP health-check server on a different port.
const healthPort = 6000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is running\n');
}).listen(healthPort, () => {
  console.log(`Health check server started on port ${healthPort}`);
});
