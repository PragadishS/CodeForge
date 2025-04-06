import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tab, Tabs, Table, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getUserSubmissions, getProblemById } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetching user's submissions
        const submissionsRes = await getUserSubmissions();
        const submissionsData = submissionsRes.data.submissions || [];
        setSubmissions(submissionsData);
        
        // Extracting unique solved problems
        const acceptedSubmissions = submissionsData
          .filter(submission => 
            submission.status === 'Accepted' && 
            submission.problem && 
            submission.problem._id
          );
        
        const uniqueProblemIds = new Set();
        const problemsToFetch = [];
        
        // First getting unique problem IDs
        acceptedSubmissions.forEach(submission => {
          if (submission.problem && submission.problem._id && !uniqueProblemIds.has(submission.problem._id)) {
            uniqueProblemIds.add(submission.problem._id);
            problemsToFetch.push(submission.problem._id);
          }
        });
        
        // Fetching full problem details for each solved problem
        const fullProblemDetails = await Promise.all(
          problemsToFetch.map(async (problemId) => {
            try {
              const response = await getProblemById(problemId);
              return response.data;
            } catch (error) {
              console.error(`Error fetching problem ${problemId}:`, error);
              return null;
            }
          })
        );
        
        // Filtering out null responses and setting to state
        setSolvedProblems(fullProblemDetails.filter(problem => problem !== null));
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

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
      case 'Compilation Error':
        className = 'runtime-error compilation-error';
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
      default:
        return language || 'Unknown';
    }
  };

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading profile...</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Body>
              <Row>
                <Col md={8}>
                  <h2>{user?.username || 'User'}</h2>
                  <p className="text-muted">{user?.email || 'No email available'}</p>
                </Col>
                <Col md={4} className="text-md-end">
                  <div className="mb-2">
                    <strong>Problems Solved:</strong> {solvedProblems.length}
                  </div>
                  <div>
                    <strong>Total Submissions:</strong> {submissions.length}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="submissions" className="mb-4">
        <Tab eventKey="submissions" title="Recent Submissions">
          {submissions.length === 0 ? (
            <Card>
              <Card.Body className="text-center py-5">
                <p className="mb-3">You haven't made any submissions yet</p>
                <Link to="/problems" className="btn btn-primary">
                  Solve Problems
                </Link>
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Body>
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Problem</th>
                        <th>Status</th>
                        <th>Language</th>
                        <th>Time</th>
                        <th>Submitted At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.slice(0, 10).map(submission => (
                        <tr
                          key={submission._id}
                          onClick={() => window.location.href = `/submissions/${submission._id}`}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>
                            {submission.problem ? (
                              <Link 
                                to={`/problems/${submission.problem._id}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {submission.problem.title}
                              </Link>
                            ) : (
                              <span className="text-muted">Problem not available</span>
                            )}
                          </td>
                          <td>{getStatusBadge(submission.status)}</td>
                          <td>{getLanguageDisplay(submission.language)}</td>
                          <td>{submission.executionTime} ms</td>
                          <td>{new Date(submission.submittedAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                {submissions.length > 10 && (
                  <div className="text-center mt-3">
                    <span className="text-muted">
                      Showing 10 of {submissions.length} submissions
                    </span>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}
        </Tab>
        
        <Tab eventKey="solved" title="Solved Problems">
          {solvedProblems.length === 0 ? (
            <Card>
              <Card.Body className="text-center py-5">
                <p className="mb-3">You haven't solved any problems yet</p>
                <Link to="/problems" className="btn btn-primary">
                  Solve Problems
                </Link>
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Body>
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Problem</th>
                        <th>Difficulty</th>
                        <th>Tags</th>
                      </tr>
                    </thead>
                    <tbody>
                      {solvedProblems.map(problem => (
                        <tr key={problem._id}>
                          <td>
                            <Link to={`/problems/${problem._id}`}>
                              {problem.title}
                            </Link>
                          </td>
                          <td>
                            <span className={`difficulty-badge difficulty-${(problem.difficulty || 'Medium').toLowerCase()}`}>
                              {problem.difficulty || 'Medium'}
                            </span>
                          </td>
                          <td>
                            {Array.isArray(problem.tags) && problem.tags.length > 0 ? (
                              problem.tags.map((tag, i) => (
                                <span key={i} className="problem-tag">
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted">No tags</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          )}
        </Tab>
      </Tabs>
    </Container>
  );
};

export default Profile;