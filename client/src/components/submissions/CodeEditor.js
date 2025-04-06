import React, { useState } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';
import MonacoEditor from '@monaco-editor/react';
import { submitSolution } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const CodeEditor = ({ problemId }) => {
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState(getInitialCode('cpp'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    setCode(getInitialCode(newLanguage));
  };

  const handleCodeChange = (value) => {
    setCode(value);
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('Please write some code before submitting');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const response = await submitSolution(problemId, code, language);
      toast.info('Solution submitted successfully');
      navigate(`/submissions/${response.data.id}`);
    } catch (error) {
      console.error('Error submitting solution:', error);
      toast.error('Failed to submit solution');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="editor-container">
      <div className="editor-header">
        <Form.Select
          style={{ width: '150px' }}
          value={language}
          onChange={handleLanguageChange}
          disabled={isSubmitting}
        >
          <option value="cpp">C++</option>
          <option value="c">C</option>
        </Form.Select>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Submitting...
            </>
          ) : (
            'Submit Solution'
          )}
        </Button>
      </div>
      <MonacoEditor
        height="358px"
        language={getMonacoLanguage(language)}
        value={code}
        onChange={handleCodeChange}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          wordWrap: 'on',
          automaticLayout: true,
        }}
      />
    </div>
  );
};

// Helper functions
function getMonacoLanguage(language) {
  switch (language) {
    case 'cpp':
      return 'cpp';
    case 'c':
      return 'c';
    default:
      return 'cpp';
  }
}

function getInitialCode(language) {
  switch (language) {
    case 'cpp':
      return `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    // Your solution here
    
    return 0;
}`;
    case 'c':
      return `#include <stdio.h>
#include <stdlib.h>

int main() {
    // Your solution here
    
    return 0;
}`;
    default:
      return '';
  }
}

export default CodeEditor;