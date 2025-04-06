import React, { useState, useEffect } from 'react';
import { Container, Card, Alert, Badge, Row, Col, Button, Spinner } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getSubmissionById } from '../services/api';
import MonacoEditor from '@monaco-editor/react';

const SubmissionResult = () => {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let pollTimer;
    
    const fetchSubmission = async () => {
      try {
        const res = await getSubmissionById(id);
        setSubmission(res.data);
        
        // If status is pending, polling for updates
        if (res.data.status === 'Pending') {
          setPolling(true);
          pollTimer = setTimeout(fetchSubmission, 2000);
        } else {
          setPolling(false);
        }
      } catch (error) {
        console.error('Error fetching submission:', error);
        setError('Failed to load submission details');
        setPolling(false);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubmission();
    
    return () => {
      if (pollTimer) {
        clearTimeout(pollTimer);
      }
    };
  }, [id]);

  const getStatusBadge = (status) => {
    let className = '';
    
    switch (status) {
      case 'Accepted':
        className = 'accepted';
        break;
      case 'Wrong Answer':
        className = 'wrong-answer';
        break;
      case 'Time Limit Exceeded':
        className = 'time-limit-exceeded';
        break;
      case 'Runtime Error':
        className = 'runtime-error';
        break;
      case 'Compilation Error':
        className = 'compilation-error';
        break;
      case 'Pending':
        className = 'pending';
        break;
      default:
        className = 'pending';
    }
    
    return <span className={`status-badge ${className}`}>{status}</span>;
  };
  
  const getLanguageDisplay = (language) => {
    switch (language) {
      case 'cpp':
        return 'C++';
      case 'c':
        return 'C';
      case 'python':
        return 'Python';
      default:
        return language;
    }
  };
  
  const getMonacoLanguage = (language) => {
    switch (language) {
      case 'cpp':
        return 'cpp';
      case 'c':
        return 'c';
      case 'python':
        return 'python';
      default:
        return 'plaintext';
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading submission results...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
        <Button as={Link} to="/problems" variant="primary">
          Back to Problems
        </Button>
      </Container>
    );
  }

  if (!submission) {
    return (
      <Container className="py-5">
        <Alert variant="warning">Submission not found</Alert>
        <Button as={Link} to="/problems" variant="primary">
          Back to Problems
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Card className="mb-4">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Submission Result</h4>
            <div>
              {polling && (
                <span className="me-3">
                  <Spinner animation="border" size="sm" /> Evaluating...
                </span>
              )}
              <Button
                as={Link}
                to={`/problems/${submission.problem._id}`}
                variant="outline-primary"
                size="sm"
              >
                Back to Problem
              </Button>
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={8}>
              <h5>
                Problem:{' '}
                <Link to={`/problems/${submission.problem._id}`}>
                  {submission.problem.title}
                </Link>
              </h5>
            </Col>
            <Col md={4} className="text-md-end">
              <div>
                Submitted: {new Date(submission.submittedAt).toLocaleString()}
              </div>
            </Col>
          </Row>

          <Row className="mb-4">
            <Col md={3}>
              <strong>Status:</strong> {getStatusBadge(submission.status)}
            </Col>
            <Col md={3}>
              <strong>Language:</strong> {getLanguageDisplay(submission.language)}
            </Col>
            <Col md={3}>
              <strong>Execution Time:</strong> {submission.executionTime} ms
            </Col>
            <Col md={3}>
              <strong>Memory Used:</strong> {submission.memoryUsed.toFixed(2)} MB
            </Col>
          </Row>

          {submission.status !== 'Pending' && (
            <Row className="mb-4">
              <Col md={12}>
                <div className="d-flex align-items-center">
                  <strong className="me-2">Test Cases:</strong>
                  <div>
                    {submission.testCasesPassed} / {submission.totalTestCases} passed
                  </div>
                </div>
              </Col>
            </Row>
          )}

          {submission.status === 'Compilation Error' && (
            <Alert variant="danger">
              <Alert.Heading>Compilation Error</Alert.Heading>
              <pre className="mb-0 mt-2">{submission.errorMessage}</pre>
            </Alert>
          )}

          {submission.status === 'Runtime Error' && (
            <Alert variant="danger">
              <Alert.Heading>Runtime Error</Alert.Heading>
              <pre className="mb-0 mt-2">{submission.errorMessage}</pre>
            </Alert>
          )}

          {submission.status === 'Wrong Answer' && submission.failedTestCase && (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Failed Test Case</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <h6>Input</h6>
                    <pre className="bg-light p-2 border rounded">
                      {submission.failedTestCase.input}
                    </pre>
                  </Col>
                  <Col md={6}>
                    <Row>
                      <Col md={12}>
                        <h6>Expected Output</h6>
                        <pre className="bg-light p-2 border rounded">
                          {submission.failedTestCase.expectedOutput}
                        </pre>
                      </Col>
                      <Col md={12} className="mt-3">
                        <h6>Your Output</h6>
                        <pre className="bg-light p-2 border rounded">
                          {submission.failedTestCase.actualOutput}
                        </pre>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          <Card>
            <Card.Header>
              <h5 className="mb-0">Your Code</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <div style={{ height: '400px' }}>
                <MonacoEditor
                  height="400px"
                  language={getMonacoLanguage(submission.language)}
                  value={submission.code}
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    wordWrap: 'on',
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </Card.Body>
      </Card>

      <div className="d-flex justify-content-between">
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
        <Button
          as={Link}
          to={`/problems/${submission.problem._id}`}
          variant="primary"
        >
          Try Again
        </Button>
      </div>
    </Container>
  );
};

export default SubmissionResult;