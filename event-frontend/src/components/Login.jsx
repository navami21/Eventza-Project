import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosinterceptor';
import '../css/Login.css';

const Login = () => {
  const navigate = useNavigate();

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Forgot password states
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [usernameForReset, setUsernameForReset] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const { data } = await axiosInstance.post('/users/login', { email, password });
      localStorage.setItem('logintoken', data.token);
      localStorage.setItem('user', JSON.stringify({ role: data.role }));

      if (data.role === 'admin') navigate('/admin-dashboard');
      else if (data.role === 'controller') navigate('/controller-dashboard');
      else navigate('/user-dashboard');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Login failed');
    }
  };

  // Step 1: Enter username/email for reset
  const requestSecurityQuestion = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      // Request security question for the user
      const { data } = await axiosInstance.post('/users/forgot-password/question', { email: usernameForReset });
      setSecurityQuestion(data.question);
      setStep(2);
    } catch (err) {
      setMessage(err.response?.data?.message || 'User not found');
    }
  };

  // Step 2: Verify answer and reset password
  const submitSecurityAnswer = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await axiosInstance.post('/users/forgot-password/verify', {
        email:usernameForReset,
        answer: securityAnswer,
        newPassword,
      });
      setMessage('Password reset successful! You can login now.');
      setStep(1);
      setForgotPasswordMode(false);
      setUsernameForReset('');
      setSecurityAnswer('');
      setNewPassword('');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Verification failed');
    }
  };

  useEffect(() => {
    document.body.classList.add('login-bg');
    return () => {
      document.body.classList.remove('login-bg');
    };
  }, []);

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center login-bg">
      <div className="row w-100">

  <div className="col-md-6 d-flex flex-column justify-content-center align-items-start p-5 text-white left-intro">
  <h1 className="display-4 fw-bold">"Book Moments, Not Just Tickets"</h1>
  <p className="lead mb-4">
    Discover and reserve your seat at exciting concerts, engaging webinars, and unforgettable conferences — all in one seamless platform.
  </p>
  <button className="btn btn1 btn-lg rounded-pill shadow get-started-btn" onClick={() => navigate('/signup')}>
    Get Started
  </button>
</div>
        <div className="col-md-6 d-flex justify-content-center align-items-center">
          <div className="card p-4 shadow login-card" style={{ maxWidth: '400px', width: '100%' }}>

            {!forgotPasswordMode ? (
              <>
              <h3 className='text-center'>Eventza</h3>
                <form onSubmit={handleLogin}>
                  <div className="mb-3">
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {message && <div className="alert alert-danger">{message}</div>}
                  <button type="submit" className="btn-login w-100">Login</button>
                </form>

                <div className="text-center mt-3">
                  <button
                    className="btn-pass btn-link p-0"
                    style={{ color: '#7f55b1' }}
                    onClick={() => {
                      setForgotPasswordMode(true);
                      setMessage('');
                      setStep(1);
                      setUsernameForReset('');
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>

                <div className="text-center mt-3">
                  <Link to="/signup" className="text-decoration-none">
                    Don't have an account? Sign up
                  </Link>
                </div>
              </>
            ) : (
              <>
              <h6 className='text-center'>Reset Password</h6>

                {step === 1 && (
                  <form onSubmit={requestSecurityQuestion}>
                    <div className="mb-3">
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Enter your email"
                        value={usernameForReset}
                        onChange={(e) => setUsernameForReset(e.target.value)}
                        required
                      />
                    </div>
                    {message && <div className="alert alert-danger">{message}</div>}
                    <button type="submit" className="btn btn-primary w-100"  style={{ backgroundColor: '#7f55b1',border:'none' }}>Next</button>
                    <div className="text-center mt-3">
                    {/* <button className="btn btn-link p-0" onClick={() => navigate('/login')}>
                      login
                      </button> */}
                    </div>
                  </form>
                )}

                {step === 2 && (
                  <form onSubmit={submitSecurityAnswer}>
                    <div className="mb-3">
                      <label className="form-label">{securityQuestion}</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Your Answer"
                        value={securityAnswer}
                        onChange={(e) => setSecurityAnswer(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <input
                        type="password"
                        className="form-control"
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    {message && <div className="alert alert-danger">{message}</div>}
                    <button type="submit" className="btn btn-primary w-100"  style={{ backgroundColor: '#7f55b1' }}>Reset Password</button>
                    <div className="text-center mt-3">
                      <button className="btn btn-link p-0" onClick={() => setForgotPasswordMode(false)} style={{ color: '#7f55b1', textDecoration:'none'}}>Back to Login</button>
                    </div>
                  </form>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
