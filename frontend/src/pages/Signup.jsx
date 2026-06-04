import { useState } from "react";
import { signupUser } from "../services/authService";

import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";

function Signup({ switchToLogin }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const [error, setError] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

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
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      return setError(
        "All fields are required"
      );
    }

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      return setError(
        "Passwords do not match"
      );
    }

    if (!formData.terms) {
      return setError(
        "Please accept the Terms & Conditions"
      );
    }

    try {
      const response =
        await signupUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });

      alert(response.message);

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        terms: false,
      });

      setError("");

    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Signup failed"
      );
    }
  };

  return (
    <>
      <h1 className="title">
        Create Account
      </h1>

      <form
        className="form"
        onSubmit={handleSubmit}
      >
        <div className="input-group">
          <FaUser />

          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

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

        <div className="input-group">
          <FaLock />

          <input
            type={
              showConfirmPassword
                ? "text"
                : "password"
            }
            name="confirmPassword"
            placeholder="Confirm Password"
            value={
              formData.confirmPassword
            }
            onChange={handleChange}
          />

          <span
            className="password-toggle"
            onClick={() =>
              setShowConfirmPassword(
                !showConfirmPassword
              )
            }
          >
            {showConfirmPassword ? (
              <FaEyeSlash />
            ) : (
              <FaEye />
            )}
          </span>
        </div>

        <label className="terms">
          <input
            type="checkbox"
            name="terms"
            checked={formData.terms}
            onChange={handleChange}
          />

          <span>
            I agree to Terms &
            Conditions
          </span>
        </label>

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        <button
          className="btn"
          type="submit"
        >
          Create Account
        </button>
      </form>

      <p className="switch">
        Already have an account?

        <span onClick={switchToLogin}>
          Login
        </span>
      </p>
    </>
  );
}

export default Signup;