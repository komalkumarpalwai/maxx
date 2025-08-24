import React, { useState } from "react";
import api from "../services/api";

const Settings = () => {
  // Only password change state needed
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");

  const validatePassword = (password) => {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    return regex.test(password);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMessage("");
    if (!oldPassword) {
      setPasswordMessage(
        "If you do not know your old password, please meet your admin or mentor."
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("New passwords do not match.");
      return;
    }
    if (!validatePassword(newPassword)) {
      setPasswordMessage(
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
      );
      return;
    }
    try {
      const res = await api.post("/users/change-password", { oldPassword, newPassword });
      if (res.data && res.data.message && res.data.message.toLowerCase().includes("success")) {
        setPasswordMessage("Password has been updated.");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage("An error occurred. Please contact your mentor or admin for further assistance.");
      }
    } catch (err) {
      setPasswordMessage(
        (err.response?.data?.message || "An error occurred. Please contact your mentor or admin for further assistance.")
      );
    }
  };



  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">Change Password</h2>
        <form className="mt-4" onSubmit={handlePasswordChange}>
          <div className="mb-2">
            <label className="block mb-1 font-medium">Old Password</label>
            <input
              type="password"
              className="border rounded px-3 py-2 w-full"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-2">
            <label className="block mb-1 font-medium">New Password</label>
            <input
              type="password"
              className="border rounded px-3 py-2 w-full"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="At least 8 chars, uppercase, lowercase, number, special char"
            />
          </div>
          <div className="mb-2">
            <label className="block mb-1 font-medium">Confirm New Password</label>
            <input
              type="password"
              className="border rounded px-3 py-2 w-full"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {passwordMessage && (
            <div className="mb-2 text-sm text-red-600">{passwordMessage}</div>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Save Password
          </button>
        </form>
      </section>
      <footer className="mt-8 border-t pt-4 text-center text-sm text-gray-600">
        &copy; {new Date().getFullYear()} Maxx Solutions. All rights reserved.
        <br />
        For queries: {" "}
        <a
          href="mailto:komalreddypalwai@gmail.com"
          className="text-blue-600 underline"
        >
          komalreddypalwai@gmail.com
        </a>{" "}
        |{" "}
        <a href="tel:8309897937" className="text-blue-600 underline">
          8309897937
        </a>
      </footer>
    </div>
  );
};

export default Settings;
