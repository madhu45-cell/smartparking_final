import React from 'react';

function Footer() {
  return (
    <footer className="bg-dark text-light py-4 mt-5">
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <h5>Smart Parking System</h5>
            <p className="mb-0">Find and book parking slots effortlessly.</p>
          </div>
          <div className="col-md-6 text-md-end">
            <p className="mb-0">&copy; 2024 Smart Parking. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;