import { useState } from "react";
import { loginUser } from "../services/authService";

import {
  FaLock,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

function Login({ switchToSignup }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [error, setError] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const handleChange = (e) => {
    const {
      name,
      value,
      checked,
      type,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.email.trim() ||
      !formData.password
    ) {
      return setError(
        "Please fill all fields"
      );
    }

    try {
      const response =
        await loginUser({
          email: formData.email,
          password: formData.password,
        });

      localStorage.setItem(
        "token",
        response.token
      );

      alert(response.message);

      console.log(
        "Logged in user:",
        response.user
      );

    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed"
      );
    }
  };

  return (
    <>
      <h1 className="title">
        Welcome Back
      </h1>

      <p className="subtitle">
        Login to continue
      </p>

      <form
        className="form"
        onSubmit={handleSubmit}
      >
        <div className="input-group">
          <FaEnvelope />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div className="input-group">
          <FaLock />

          <input
            type={
              showPassword
                ? "text"
                : "password"
            }
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
          />

          <span
            className="password-toggle"
            onClick={() =>
              setShowPassword(
                !showPassword
              )
            }
          >
            {showPassword ? (
              <FaEyeSlash />
            ) : (
              <FaEye />
            )}
          </span>
        </div>

        <div className="form-options">
          <label className="remember-me">
            <input
              type="checkbox"
              name="remember"
              checked={formData.remember}
              onChange={handleChange}
            />

            <span>
              Remember me
            </span>
          </label>

          <a
            href="/"
            onClick={(e) =>
              e.preventDefault()
            }
          >
            Forgot Password?
          </a>
        </div>

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        <button
          className="btn"
          type="submit"
        >
          Login
        </button>
      </form>

      <p className="switch">
        Don't have an account?

        <span onClick={switchToSignup}>
          Sign Up
        </span>
      </p>
    </>
  );
}

export default Login;