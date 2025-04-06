import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Badge } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { createProblem } from '../services/api';
import { toast } from 'react-toastify';

const CreateProblem = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    inputFormat: '',
    outputFormat: '',
    constraints: '',
    difficulty: 'Medium',
    tags: [],
    testCases: [
      { input: '', output: '', isExample: true },
      { input: '', output: '', isExample: false }
    ],
    timeLimit: 1000,
    memoryLimit: 256,
    isPublic: true
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  
  const navigate = useNavigate();
  
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
        const response = await createProblem(formData);
        toast.success('Problem created successfully!');
        navigate(`/problems/${response.data._id}`);
      } catch (error) {
        console.error('Error creating problem:', error);
        toast.error('Failed to create problem. Please try again.');
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
  
  return (
    <Container className="py-4">
      <Row className="mb-4">
        <Col>
          <h1>Create New Problem</h1>
          <p className="text-muted">Add a new problem for others to solve</p>
        </Col>
        <Col xs="auto">
          <Button
            as={Link}
            to="/problems"
            variant="outline-secondary"
          >
            Back to Problems
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
                placeholder="Enter a descriptive title for the problem"
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
                  <Form.Text className="text-muted">
                    Between 100ms and 10000ms
                  </Form.Text>
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
                  <Form.Text className="text-muted">
                    Between 16MB and 512MB
                  </Form.Text>
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
              <Form.Text className="text-muted">
                Press Enter to add a tag
              </Form.Text>
              <div className="mt-2">
                {formData.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    bg="secondary"
                    className="me-1 mb-1"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} &times;
                  </Badge>
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
              <Form.Text className="text-muted">
                Public problems will be visible to all users
              </Form.Text>
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
                placeholder="Describe the problem in detail..."
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
                placeholder="Describe the input format..."
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
                placeholder="Describe the output format..."
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
                placeholder="List the constraints..."
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
            <h5 className="mb-0">Test Cases</h5>
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
                      className="me-3"
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
                      placeholder="Input for this test case"
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
                      placeholder="Expected output for this test case"
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
            onClick={() => navigate('/problems')}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Problem'}
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default CreateProblem;