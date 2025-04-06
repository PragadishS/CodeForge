const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const { v4: uuidv4 } = require('uuid');
const { exec } = require('child_process');
const execPromise = util.promisify(exec);
const codeRunner = require('../utils/codeRunner');
const verifier = require('../utils/verifier');

// Base directory for temporary code files
const CODE_DIR = process.env.TEMP_CODE_DIR || './temp/code';
const TEST_DIR = process.env.TEMP_TEST_DIR || './temp/testcases';
const EXECUTION_TIMEOUT = parseInt(process.env.CODE_EXECUTION_TIMEOUT) || 5000;

// Creating directories if they don't exist
async function ensureDirectoriesExist() {
  try {
    await fs.mkdir(CODE_DIR, { recursive: true });
    await fs.mkdir(TEST_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
    throw error;
  }
}

// Executing code against test cases
exports.execute = async (code, language, testCases, timeLimit, memoryLimit) => {
  await ensureDirectoriesExist();
  
  const executionId = uuidv4();
  const codeFilePath = path.join(CODE_DIR, `${executionId}.${getFileExtension(language)}`);
  
  try {
    // Writing code to file
    await fs.writeFile(codeFilePath, code);
    
    // Compiling the code if necessary
    if (language === 'c' || language === 'cpp') {
      await compileCode(codeFilePath, language, executionId);
    }
    
    // Running test cases
    const results = await runTestCases(
      codeFilePath,
      language,
      testCases,
      executionId,
      timeLimit
    );
    
    return results;
  } catch (error) {
    console.error('Error executing code:', error);
    
    if (error.message.includes('COMPILATION_ERROR')) {
      return {
        status: 'Compilation Error',
        errorMessage: error.message.replace('COMPILATION_ERROR: ', ''),
        executionTime: 0,
        memoryUsed: 0,
        testCasesPassed: 0,
        totalTestCases: testCases.length
      };
    }
    
    return {
      status: 'Runtime Error',
      errorMessage: error.message,
      executionTime: 0,
      memoryUsed: 0,
      testCasesPassed: 0,
      totalTestCases: testCases.length
    };
  } finally {
    // Cleaning up temporary files
    try {
      await cleanupFiles(codeFilePath, language, executionId);
    } catch (cleanupError) {
      console.error('Error cleaning up files:', cleanupError);
    }
  }
};

// Getting file extension based on language
function getFileExtension(language) {
  switch (language) {
    case 'c': return 'c';
    case 'cpp': return 'cpp';
    case 'python': return 'py';
    default: throw new Error(`Unsupported language: ${language}`);
  }
}

// Compiling code for C/C++
async function compileCode(codeFilePath, language, executionId) {
  const outputPath = path.join(CODE_DIR, executionId);
  
  try {
    if (language === 'c') {
      await execPromise(`gcc ${codeFilePath} -o ${outputPath} -lm`);
    } else if (language === 'cpp') {
      await execPromise(`g++ ${codeFilePath} -o ${outputPath} -std=c++17`);
    }
  } catch (error) {
    throw new Error(`COMPILATION_ERROR: ${error.stderr}`);
  }
}

// Running test cases
async function runTestCases(codeFilePath, language, testCases, executionId, timeLimit) {
  const results = {
    status: 'Accepted',
    executionTime: 0,
    memoryUsed: 0,
    testCasesPassed: 0,
    totalTestCases: testCases.length,
    failedTestCase: null
  };
  
  let maxExecutionTime = 0;
  let maxMemoryUsed = 0;
  
  // Processing each test case
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const inputFilePath = path.join(TEST_DIR, `${executionId}_input_${i}.txt`);
    const outputFilePath = path.join(TEST_DIR, `${executionId}_output_${i}.txt`);
    
    // Writing input to file
    await fs.writeFile(inputFilePath, testCase.input);
    
    // Running code with current test case
    try {
      const runResult = await codeRunner.run(
        codeFilePath,
        language,
        inputFilePath,
        outputFilePath,
        executionId,
        timeLimit || EXECUTION_TIMEOUT
      );
      
      // Updating max execution time and memory
      maxExecutionTime = Math.max(maxExecutionTime, runResult.executionTime);
      maxMemoryUsed = Math.max(maxMemoryUsed, runResult.memoryUsed);
      
      // Reading the output
      const actualOutput = (await fs.readFile(outputFilePath, 'utf8')).trim();
      const expectedOutput = testCase.output.trim();
      
      // Verifing output
      const isCorrect = verifier.verify(actualOutput, expectedOutput);
      
      if (!isCorrect) {
        results.status = 'Wrong Answer';
        results.failedTestCase = {
          input: testCase.input,
          expectedOutput: expectedOutput,
          actualOutput: actualOutput
        };
        break;
      }
      
      results.testCasesPassed++;
    } catch (error) {
      if (error.message.includes('TIMEOUT')) {
        results.status = 'Time Limit Exceeded';
      } else {
        results.status = 'Runtime Error';
        results.errorMessage = error.message;
      }
      
      results.failedTestCase = {
        input: testCase.input,
        expectedOutput: testCase.output,
        actualOutput: error.message
      };
      
      break;
    } finally {
      // Cleaning up test files
      try {
        await fs.unlink(inputFilePath);
        await fs.unlink(outputFilePath);
      } catch (cleanupError) {
        console.error('Error cleaning up test files:', cleanupError);
      }
    }
  }
  
  results.executionTime = maxExecutionTime;
  results.memoryUsed = maxMemoryUsed;
  
  return results;
}

// Cleaning up temporary files
async function cleanupFiles(codeFilePath, language, executionId) {
  try {
    // Removing code file
    await fs.unlink(codeFilePath);
    
    // Removing compiled executable for C/C++
    if (language === 'c' || language === 'cpp') {
      const outputPath = path.join(CODE_DIR, executionId);
      await fs.unlink(outputPath);
    }
  } catch (error) {
    // Ignoring file not found errors
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}