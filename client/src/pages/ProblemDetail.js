import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Tabs, Tab, Badge, Alert, Spinner, Modal } from 'react-bootstrap';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProblemById, deleteProblem, getSubmissionsByProblem } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CodeEditor from '../components/submissions/CodeEditor';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-toastify';

const ProblemDetail = () => {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProblem, setDeletingProblem] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProblemAndSubmissions = async () => {
      setLoading(true);
      try {
        const problemRes = await getProblemById(id);
        setProblem(problemRes.data);

        if (isAuthenticated) {
          const submissionsRes = await getSubmissionsByProblem(id);
          setSubmissions(submissionsRes.data.submissions);
        }
      } catch (error) {
        console.error('Error fetching problem details:', error);
        toast.error('Failed to load problem');
      } finally {
        setLoading(false);
      }
    };

    fetchProblemAndSubmissions();
  }, [id, isAuthenticated]);

  const handleDeleteProblem = async () => {
    setDeletingProblem(true);
    try {
      await deleteProblem(id);
      setShowDeleteModal(false);
      toast.success('Problem deleted successfully');
      navigate('/problems');
    } catch (error) {
      console.error('Error deleting problem:', error);
      toast.error('Failed to delete problem');
    } finally {
      setDeletingProblem(false);
    }
  };

  const isAuthor = problem && user && (problem.author._id === user._id || user.role === 'admin');

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

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading problem...</p>
      </Container>
    );
  }

  if (!problem) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          Problem not found or you don't have permission to view it.
        </Alert>
        <Button
          as={Link}
          to="/problems"
          variant="primary"
        >
          Back to Problems
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <Button
            as={Link}
            to="/problems"
            variant="outline-secondary"
            className="mb-3"
          >
            Back to Problems
          </Button>
          <h1>{problem.title}</h1>
          <div className="d-flex align-items-center mb-2">
            <span className={`difficulty-badge difficulty-${problem.difficulty.toLowerCase()} me-3`}>
              {problem.difficulty}
            </span>
            <span className="text-muted me-3">
              Author: {problem.author.username}
            </span>
            <span className="text-muted">
              Acceptance Rate:{' '}
              {problem.submissions > 0
                ? ((problem.acceptedSubmissions / problem.submissions) * 100).toFixed(1) + '%'
                : 'N/A'}
            </span>
          </div>
          <div className="mb-3">
            {problem.tags.map((tag, index) => (
              <span key={index} className="problem-tag">
                {tag}
              </span>
            ))}
          </div>
        </Col>
        {isAuthor && (
          <Col xs="auto">
            <Button
              as={Link}
              to={`/problems/edit/${id}`}
              variant="outline-primary"
              className="me-2"
            >
              Edit
            </Button>
            <Button
              variant="outline-danger"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete
            </Button>
          </Col>
        )}
      </Row>

      <Row>
        <Col lg={6} className="mb-4">
          <Card>
            <Card.Body>
              <Tabs defaultActiveKey="description" className="mb-3">
                <Tab eventKey="description" title="Description">
                  <div className="problem-section">
                    <ReactMarkdown>{problem.description}</ReactMarkdown>
                  </div>
                </Tab>
                <Tab eventKey="inputFormat" title="Input Format">
                  <div className="problem-section">
                    <ReactMarkdown>{problem.inputFormat}</ReactMarkdown>
                  </div>
                </Tab>
                <Tab eventKey="outputFormat" title="Output Format">
                  <div className="problem-section">
                    <ReactMarkdown>{problem.outputFormat}</ReactMarkdown>
                  </div>
                </Tab>
                <Tab eventKey="constraints" title="Constraints">
                  <div className="problem-section">
                    <ReactMarkdown>{problem.constraints}</ReactMarkdown>
                  </div>
                </Tab>
                <Tab eventKey="examples" title="Examples">
                  {problem.testCases
                    .filter(testCase => testCase.isExample)
                    .map((testCase, index) => (
                      <div key={index} className="test-case">
                        <h5>Example {index + 1}</h5>
                        <div className="mb-3">
                          <strong>Input:</strong>
                          <pre className="bg-light p-2 mt-1 border rounded">
                            {testCase.input}
                          </pre>
                        </div>
                        <div>
                          <strong>Output:</strong>
                          <pre className="bg-light p-2 mt-1 border rounded">
                            {testCase.output}
                          </pre>
                        </div>
                      </div>
                    ))}
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6} className="mb-4">
          <div className="mb-4">
            <h4 className="mb-3">Submit Your Solution</h4>
            {isAuthenticated ? (
              <CodeEditor problemId={id} />
            ) : (
              <Card>
                <Card.Body className="text-center py-4">
                  <h5 className="mb-3">Login Required</h5>
                  <p className="mb-3">
                    You need to login to submit your solution and track your progress.
                  </p>
                  <div className="d-flex justify-content-center gap-2">
                    <Button as={Link} to="/login" variant="primary">
                      Login
                    </Button>
                    <Button as={Link} to="/register" variant="outline-primary">
                      Register
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>

          {isAuthenticated && submissions.length > 0 && (
            <Card>
              <Card.Header>
                <h5 className="mb-0">Your Submissions</h5>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Language</th>
                        <th>Time</th>
                        <th>Submitted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map(submission => (
                        <tr
                          key={submission._id}
                          onClick={() => navigate(`/submissions/${submission._id}`)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>{getStatusBadge(submission.status)}</td>
                          <td>{submission.language === 'cpp' ? 'C++' : submission.language === 'c' ? 'C' : 'Python'}</td>
                          <td>{submission.executionTime} ms</td>
                          <td>
                            {new Date(submission.submittedAt).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>

      {/* Deleting Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to delete this problem?</p>
          <p className="text-danger">This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteProblem}
            disabled={deletingProblem}
          >
            {deletingProblem ? 'Deleting...' : 'Delete Problem'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ProblemDetail;