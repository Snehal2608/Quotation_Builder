import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const VerifyEmail = () => {
  const { userId, choice } = useParams();
  const [message, setMessage] = useState("Verifying...");

  useEffect(() => {
    axios
      .get(`http://localhost:5000/api/auth/verify-email/${userId}/${choice}`)
      .then((res) => {
        setMessage(res.data.message || "Verification successful.");
      })
      .catch(() => {
        setMessage("Verification failed.");
      });
  }, [userId, choice]);

  return (
    <div className="flex items-center justify-center min-h-screen text-xl font-bold text-teal-900 bg-teal-100">
      {message}
    </div>
  );
};

export default VerifyEmail;
