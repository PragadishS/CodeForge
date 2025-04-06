import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getProblemById, updateProblem } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const EditProblem = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    inputFormat: '',
    outputFormat: '',
    constraints: '',
    difficulty: 'Medium',
    tags: [],
    testCases: [
      { input: '', output: '', isExample: true }
    ],
    timeLimit: 1000,
    memoryLimit: 256,
    isPublic: true
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tagInput, setTagInput] = useState('');
  
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await getProblemById(id);
        
        // Checking if user is author or admin
        if (
          !isAdmin() && 
          res.data.author._id !== user._id
        ) {
          toast.error('You are not authorized to edit this problem');
          navigate(`/problems/${id}`);
          return;
        }
        
        setFormData({
          title: res.data.title,
          description: res.data.description,
          inputFormat: res.data.inputFormat,
          outputFormat: res.data.outputFormat,
          constraints: res.data.constraints,
          difficulty: res.data.difficulty,
          tags: res.data.tags,
          testCases: res.data.testCases,
          timeLimit: res.data.timeLimit,
          memoryLimit: res.data.memoryLimit,
          isPublic: res.data.isPublic
        });
      } catch (error) {
        console.error('Error fetching problem:', error);
        toast.error('Failed to load problem');
        navigate('/problems');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProblem();
  }, [id, navigate, user, isAdmin]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clearing error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  const handleTagInputChange = (e) => {
    setTagInput(e.target.value);
  };
  
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };
  
  const handleRemoveTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };
  
  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...formData.testCases];
    newTestCases[index] = { ...newTestCases[index], [field]: value };
    
    setFormData({
      ...formData,
      testCases: newTestCases
    });
    
    // Clearing error
    if (errors[`testCases.${index}.${field}`]) {
      setErrors({
        ...errors,
        [`testCases.${index}.${field}`]: ''
      });
    }
  };
  
  const handleAddTestCase = () => {
    setFormData({
      ...formData,
      testCases: [...formData.testCases, { input: '', output: '', isExample: false }]
    });
  };
  
  const handleRemoveTestCase = (index) => {
    if (formData.testCases.length > 1) {
      const newTestCases = formData.testCases.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        testCases: newTestCases
      });
    }
  };
  
  const handleToggleExample = (index) => {
    const newTestCases = [...formData.testCases];
    newTestCases[index] = {
      ...newTestCases[index],
      isExample: !newTestCases[index].isExample
    };
    
    setFormData({
      ...formData,
      testCases: newTestCases
    });
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.inputFormat.trim()) {
      newErrors.inputFormat = 'Input format is required';
    }
    
    if (!formData.outputFormat.trim()) {
      newErrors.outputFormat = 'Output format is required';
    }
    
    if (!formData.constraints.trim()) {
      newErrors.constraints = 'Constraints are required';
    }
    
    // Validating test cases
    formData.testCases.forEach((testCase, index) => {
      if (!testCase.input.trim()) {
        newErrors[`testCases.${index}.input`] = 'Input is required';
      }
      
      if (!testCase.output.trim()) {
        newErrors[`testCases.${index}.output`] = 'Output is required';
      }
    });
    
    // Ensuring at least one example test case
    const hasExample = formData.testCases.some(tc => tc.isExample);
    if (!hasExample) {
      newErrors.testCases = 'At least one test case must be marked as an example';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        await updateProblem(id, formData);
        toast.success('Problem updated successfully!');
        navigate(`/problems/${id}`);
      } catch (error) {
        console.error('Error updating problem:', error);
        toast.error('Failed to update problem. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Scrolling to first error
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.getElementsByName(firstErrorField)[0];
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };
  
  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Loading problem...</p>
      </Container>
    );
  }
  
  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1>Edit Problem</h1>
          <p className="text-muted">Update problem details</p>
        </Col>
        <Col xs="auto">
          <Button
            as={Link}
            to={`/problems/${id}`}
            variant="outline-secondary"
          >
            Back to Problem
          </Button>
        </Col>
      </Row>
      
      <Form onSubmit={handleSubmit}>
        <Card className="mb-4">
          <Card.Header>Basic Information</Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                isInvalid={!!errors.title}
              />
              <Form.Control.Feedback type="invalid">
                {errors.title}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Difficulty</Form.Label>
                  <Form.Select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleChange}
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Time Limit (ms)</Form.Label>
                  <Form.Control
                    type="number"
                    name="timeLimit"
                    value={formData.timeLimit}
                    onChange={handleChange}
                    min="100"
                    max="10000"
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Memory Limit (MB)</Form.Label>
                  <Form.Control
                    type="number"
                    name="memoryLimit"
                    value={formData.memoryLimit}
                    onChange={handleChange}
                    min="16"
                    max="512"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Tags</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="text"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Add relevant tags (e.g., arrays, dynamic-programming)"
                  className="me-2"
                />
                <Button onClick={handleAddTag} variant="outline-primary">
                  Add
                </Button>
              </div>
              <div className="mt-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="problem-tag"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} &times;
                  </span>
                ))}
              </div>
            </Form.Group>
            
            <Form.Group className="mb-0">
              <Form.Check
                type="checkbox"
                label="Make problem public"
                name="isPublic"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              />
            </Form.Group>
          </Card.Body>
        </Card>
        
        <Card className="mb-4">
          <Card.Header>Problem Description</Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                isInvalid={!!errors.description}
              />
              <Form.Text className="text-muted">
                You can use Markdown syntax for formatting.
              </Form.Text>
              <Form.Control.Feedback type="invalid">
                {errors.description}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Input Format</Form.Label>
              <Form.Control
                as="textarea"
                name="inputFormat"
                value={formData.inputFormat}
                onChange={handleChange}
                rows={3}
                isInvalid={!!errors.inputFormat}
              />
              <Form.Control.Feedback type="invalid">
                {errors.inputFormat}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Output Format</Form.Label>
              <Form.Control
                as="textarea"
                name="outputFormat"
                value={formData.outputFormat}
                onChange={handleChange}
                rows={3}
                isInvalid={!!errors.outputFormat}
              />
              <Form.Control.Feedback type="invalid">
                {errors.outputFormat}
              </Form.Control.Feedback>
            </Form.Group>
            
            <Form.Group className="mb-0">
              <Form.Label>Constraints</Form.Label>
              <Form.Control
                as="textarea"
                name="constraints"
                value={formData.constraints}
                onChange={handleChange}
                rows={3}
                isInvalid={!!errors.constraints}
              />
              <Form.Control.Feedback type="invalid">
                {errors.constraints}
              </Form.Control.Feedback>
            </Form.Group>
          </Card.Body>
        </Card>
        
        <Card className="mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <span>Test Cases</span>
            <Button onClick={handleAddTestCase} variant="outline-primary" size="sm">
              Add Test Case
            </Button>
          </Card.Header>
          <Card.Body>
            {errors.testCases && (
              <Alert variant="danger" className="mb-4">
                {errors.testCases}
              </Alert>
            )}
            
            {formData.testCases.map((testCase, index) => (
              <Card key={index} className="mb-4 border">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Test Case #{index + 1}</h6>
                  <div className="d-flex align-items-center">
                    <Form.Check
                      type="checkbox"
                      label="Example"
                      checked={testCase.isExample}
                      onChange={() => handleToggleExample(index)}
                      inline
                    />
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleRemoveTestCase(index)}
                      disabled={formData.testCases.length <= 1}
                    >
                      Remove
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  <Form.Group className="mb-3">
                    <Form.Label>Input</Form.Label>
                    <Form.Control
                      as="textarea"
                      value={testCase.input}
                      onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                      rows={3}
                      isInvalid={!!errors[`testCases.${index}.input`]}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors[`testCases.${index}.input`]}
                    </Form.Control.Feedback>
                  </Form.Group>
                  
                  <Form.Group className="mb-0">
                    <Form.Label>Expected Output</Form.Label>
                    <Form.Control
                      as="textarea"
                      value={testCase.output}
                      onChange={(e) => handleTestCaseChange(index, 'output', e.target.value)}
                      rows={3}
                      isInvalid={!!errors[`testCases.${index}.output`]}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors[`testCases.${index}.output`]}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Card.Body>
              </Card>
            ))}
          </Card.Body>
        </Card>
        
        <div className="d-flex justify-content-between">
          <Button
            variant="outline-secondary"
            onClick={() => navigate(`/problems/${id}`)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default EditProblem;