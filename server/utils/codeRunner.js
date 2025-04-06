const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Running code with input and getting output
exports.run = (codeFilePath, language, inputFilePath, outputFilePath, executionId, timeout) => {
  return new Promise((resolve, reject) => {
    const CODE_DIR = process.env.TEMP_CODE_DIR || './temp/code';
    let startTime = Date.now();
    let maxMemory = 0;
    
    // Command and arguments based on language
    let command, args;
    
    switch (language) {
      case 'c':
      case 'cpp':
        command = path.join(CODE_DIR, executionId);
        args = [];
        break;
      case 'python':
        command = 'python';
        args = [codeFilePath];
        break;
      default:
        return reject(new Error(`Unsupported language: ${language}`));
    }
    
    // Open input and output files
    const inputStream = fs.createReadStream(inputFilePath);
    const outputStream = fs.createWriteStream(outputFilePath);
    
    // Spawn process
    const childProcess = spawn(command, args, {
      timeout: timeout // Maximum execution time in ms
    });
    
    // Memory usage monitoring
    const memoryMonitor = setInterval(() => {
      if (childProcess && childProcess.pid) {
        try {
          const memUsage = process.memoryUsage();
          const currentUsage = memUsage.rss / 1024 / 1024; // Convert to MB
          maxMemory = Math.max(maxMemory, currentUsage);
        } catch (err) {
          // Ignoring errors in memory monitoring
        }
      }
    }, 100);
    
    // Handlling timeout
    const timeoutId = setTimeout(() => {
      clearInterval(memoryMonitor);
      
      if (childProcess && !childProcess.killed) {
        childProcess.kill('SIGKILL');
        reject(new Error('TIMEOUT: Code execution exceeded time limit'));
      }
    }, timeout);
    
    // Pipe input to process
    inputStream.pipe(childProcess.stdin);
    
    // Pipe process output to file
    childProcess.stdout.pipe(outputStream);
    
    // Handling stderr
    let stderr = '';
    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    // Handling process exit
    childProcess.on('close', (code) => {
      clearTimeout(timeoutId);
      clearInterval(memoryMonitor);
      
      const executionTime = Date.now() - startTime;
      
      if (code !== 0) {
        outputStream.end();
        reject(new Error(`Runtime Error (exit code ${code}): ${stderr}`));
      } else {
        outputStream.end();
        resolve({
          executionTime,
          memoryUsed: maxMemory
        });
      }
    });
    
    // Handling process error
    childProcess.on('error', (err) => {
      clearTimeout(timeoutId);
      clearInterval(memoryMonitor);
      outputStream.end();
      reject(new Error(`Error spawning process: ${err.message}`));
    });
  });
};