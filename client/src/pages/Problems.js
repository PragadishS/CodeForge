import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Table, Form, Button, Pagination, Spinner, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { getProblems, getAllTags } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Problems = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1
  });
  const [filters, setFilters] = useState({
    difficulty: '',
    tags: [],
    search: ''
  });
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await getAllTags();
        setAvailableTags(res.data);
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };
    
    fetchTags();
  }, []);
  
  useEffect(() => {
    const fetchProblems = async () => {
      setLoading(true);
      try {
        const res = await getProblems(pagination.page, 10, filters);
        setProblems(res.data.problems);
        setPagination(res.data.pagination);
      } catch (error) {
        console.error('Error fetching problems:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProblems();
  }, [pagination.page, filters]);
  
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, page }));
    window.scrollTo(0, 0);
  };
  
  const handleDifficultyChange = (e) => {
    setFilters(prev => ({ ...prev, difficulty: e.target.value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  const handleTagSelect = (e) => {
    const tag = e.target.value;
    if (tag && !selectedTags.includes(tag)) {
      const newTags = [...selectedTags, tag];
      setSelectedTags(newTags);
      setFilters(prev => ({ ...prev, tags: newTags }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  };
  
  const handleTagRemove = (tagToRemove) => {
    const newTags = selectedTags.filter(tag => tag !== tagToRemove);
    setSelectedTags(newTags);
    setFilters(prev => ({ ...prev, tags: newTags }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: searchInput }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  const handleClearFilters = () => {
    setFilters({
      difficulty: '',
      tags: [],
      search: ''
    });
    setSelectedTags([]);
    setSearchInput('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  // Generating pagination items
  const paginationItems = [];
  for (let i = 1; i <= pagination.pages; i++) {
    paginationItems.push(
      <Pagination.Item
        key={i}
        active={i === pagination.page}
        onClick={() => handlePageChange(i)}
      >
        {i}
      </Pagination.Item>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1>Problems</h1>
          <p>Browse and solve algorithmic programming problems</p>
        </Col>
        {isAuthenticated && (
          <Col xs="auto" className="d-flex align-items-center">
            <Button as={Link} to="/problems/create" variant="primary">
              Create Problem
            </Button>
          </Col>
        )}
      </Row>
      
      <Row className="mb-4">
        <Col md={8}>
          <Form onSubmit={handleSearch} className="d-flex">
            <Form.Control
              type="text"
              placeholder="Search problems..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="me-2"
            />
            <Button type="submit" variant="outline-primary">Search</Button>
          </Form>
        </Col>
        <Col md={4}>
          <div className="d-flex justify-content-end">
            {(filters.difficulty || selectedTags.length > 0 || filters.search) && (
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={handleClearFilters}
                className="me-2"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </Col>
      </Row>
      
      <Row className="mb-4">
        <Col md={4} className="mb-3 mb-md-0">
          <Form.Group>
            <Form.Label>Filter by Difficulty</Form.Label>
            <Form.Select value={filters.difficulty} onChange={handleDifficultyChange}>
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={8}>
          <Form.Group>
            <Form.Label>Filter by Tags</Form.Label>
            <Form.Select value="" onChange={handleTagSelect}>
              <option value="">Select a tag</option>
              {availableTags.map(tag => (
                <option key={tag} value={tag} disabled={selectedTags.includes(tag)}>
                  {tag}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <div className="mt-2">
            {selectedTags.map(tag => (
              <Badge 
                key={tag} 
                bg="secondary" 
                className="me-1 mb-1" 
                style={{ cursor: 'pointer' }}
                onClick={() => handleTagRemove(tag)}
              >
                {tag} &times;
              </Badge>
            ))}
          </div>
        </Col>
      </Row>
      
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading problems...</p>
        </div>
      ) : problems.length === 0 ? (
        <div className="text-center py-5">
          <p>No problems found with the selected filters.</p>
        </div>
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Difficulty</th>
                <th>Tags</th>
                <th>Acceptance</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((problem, index) => (
                <tr key={problem._id}>
                  <td>{(pagination.page - 1) * 10 + index + 1}</td>
                  <td>
                    <Link to={`/problems/${problem._id}`} className="text-decoration-none">
                      {problem.title}
                    </Link>
                  </td>
                  <td>
                    <span className={`difficulty-badge difficulty-${problem.difficulty.toLowerCase()}`}>
                      {problem.difficulty}
                    </span>
                  </td>
                  <td>
                    {problem.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="problem-tag">
                        {tag}
                      </span>
                    ))}
                    {problem.tags.length > 3 && <span>...</span>}
                  </td>
                  <td>
                    {problem.submissions > 0
                      ? ((problem.acceptedSubmissions / problem.submissions) * 100).toFixed(1) + "%"
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          <div className="d-flex justify-content-between align-items-center">
            <div>
              Showing {(pagination.page - 1) * 10 + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} problems
            </div>
            <Pagination>
              <Pagination.First onClick={() => handlePageChange(1)} disabled={pagination.page === 1} />
              <Pagination.Prev onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page === 1} />
              {paginationItems}
              <Pagination.Next onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page === pagination.pages} />
              <Pagination.Last onClick={() => handlePageChange(pagination.pages)} disabled={pagination.page === pagination.pages} />
            </Pagination>
          </div>
        </>
      )}
    </Container>
  );
};

export default Problems;