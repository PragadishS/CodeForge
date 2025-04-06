import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getProblems } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const [recentProblems, setRecentProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchRecentProblems = async () => {
      try {
        const res = await getProblems(1, 6);
        setRecentProblems(res.data.problems);
      } catch (error) {
        console.error('Error fetching recent problems:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentProblems();
  }, []);

  return (
    <Container className="py-4">
      <Row className="mb-5">
        <Col lg={8} className="mx-auto text-center">
          <h1 className="display-4">Welcome to CodeForge</h1>
          <p className="lead mb-4">
            Enhance your coding skills by solving algorithmic problems and get instant feedback on your solutions.
          </p>
          <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
            <Button as={Link} to="/problems" variant="primary" size="lg" className="px-4 me-sm-3">
              Browse Problems
            </Button>
            {isAuthenticated ? (
              <Button as={Link} to="/profile" variant="outline-secondary" size="lg" className="px-4">
                View Profile
              </Button>
            ) : (
              <Button as={Link} to="/register" variant="outline-secondary" size="lg" className="px-4">
                Sign Up
              </Button>
            )}
          </div>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <h2 className="text-center mb-4">Recent Problems</h2>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading problems...</p>
        </div>
      ) : (
        <Row>
          {recentProblems.map((problem) => (
            <Col key={problem._id} md={6} lg={4} className="mb-4">
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>
                    <Link to={`/problems/${problem._id}`} className="text-decoration-none">
                      {problem.title}
                    </Link>
                    <span className={`difficulty-badge difficulty-${problem.difficulty.toLowerCase()}`}>
                      {problem.difficulty}
                    </span>
                  </Card.Title>
                  <div className="mb-3">
                    {problem.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="problem-tag">
                        {tag}
                      </span>
                    ))}
                    {problem.tags.length > 3 && (
                      <span className="problem-tag">+{problem.tags.length - 3}</span>
                    )}
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">By {problem.author.username}</small>
                    <small className="text-muted">
                      {problem.submissions > 0
                        ? ((problem.acceptedSubmissions / problem.submissions) * 100).toFixed(1) + "%"
                        : "No submissions"}
                    </small>
                  </div>
                </Card.Body>
                <Card.Footer className="bg-transparent">
                  <Button as={Link} to={`/problems/${problem._id}`} variant="primary" size="sm" className="w-100">
                    Solve
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Row className="mt-4">
        <Col className="text-center">
          <Button as={Link} to="/problems" variant="primary">
            View All Problems
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default Home;