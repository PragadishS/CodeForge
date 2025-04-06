import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="footer">
      <Container>
        <Row>
          <Col className="text-center">
            <p className="mb-0">
              &copy; {new Date().getFullYear()} CodeForge - An Online Judge System
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;