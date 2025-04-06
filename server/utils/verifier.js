/**
 * Verifing if actual output matches expected output
 * 
 * @param {string} actualOutput - The actual output from user's code
 * @param {string} expectedOutput - The expected output from test case
 * @returns {boolean} - Whether the outputs match
 */
exports.verify = (actualOutput, expectedOutput) => {
    // Normalize whitespace and line endings
    const normalizedActual = normalizeOutput(actualOutput);
    const normalizedExpected = normalizeOutput(expectedOutput);
    
    // Direct comparison
    if (normalizedActual === normalizedExpected) {
      return true;
    }
    
    // Comparing line by line, ignoring trailing whitespace
    const actualLines = normalizedActual.split('\n');
    const expectedLines = normalizedExpected.split('\n');
    
    if (actualLines.length !== expectedLines.length) {
      return false;
    }
    
    for (let i = 0; i < actualLines.length; i++) {
      if (actualLines[i].trim() !== expectedLines[i].trim()) {
        return false;
      }
    }
    
    return true;
  };
  
  /**
   * Normalize output string
   * 
   * @param {string} output - Output string to normalize
   * @returns {string} - Normalized output
   */
  function normalizeOutput(output) {
    if (!output) return '';
    
    // Convertting to string if not already
    output = String(output);
    
    // Normalizing line endings
    output = output.replace(/\r\n/g, '\n');
    
    // Trimming leading/trailing whitespace
    output = output.trim();
    
    return output;
  }