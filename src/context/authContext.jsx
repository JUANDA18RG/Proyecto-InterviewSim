import { createContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import Cookies from "js-cookie";
import {
  verifyTokenRequest,
  LoginRequest,
  registerRequest,
  logoutRequest,
  deleteUserRequest,
} from "../api/auth.js";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  console.log("AuthContext value:", context);
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkLogin = async () => {
      const token = Cookies.get("token");
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      try {
        const res = await verifyTokenRequest(token);
        if (!res.data) {
          setIsAuthenticated(false);
          setUser(null);
          navigate("/login");
        } else {
          setIsAuthenticated(true);
          setUser(res.data);
        }
        setLoading(false);
      } catch (error) {
        setIsAuthenticated(false);
        setLoading(false);
        console.error("Error al verificar el token:", error);
        navigate("/login");
      }
    };
    checkLogin();
  }, [navigate]);

  const signin = async (user) => {
    try {
      const response = await LoginRequest(user);
      console.log("Response from LoginRequest:", response);
      // Guardar el token en las cookies
      Cookies.set("token", response.data.tokenSession, {
        httpOnly: false,
        secure: false,
      });
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error(
        "Error durante el inicio de sesión:",
        error.response ? error.response.data : error.message
      );
    }
  };

  const signup = async (user) => {
    try {
      const response = await registerRequest(user);
      console.log("Response from registerRequest:", response);
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error(
        "Error durante el registro:",
        error.response ? error.response.data : error.message
      );
    }
  };

  const signout = async () => {
    try {
      await logoutRequest();
      Cookies.remove("token");
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error("Error 401: No autorizado. No se pudo cerrar sesión.");
      } else {
        console.error(
          "Error durante el cierre de sesión:",
          error.response ? error.response.data : error.message
        );
      }
    }
  };

  const deleteUser = async (user) => {
    try {
      await deleteUserRequest(user);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error("Error 401: No autorizado. No se pudo cerrar sesión.");
      } else {
        console.error(
          "Error durante la eliminación del usuario:",
          error.response ? error.response.data : error.message
        );
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        signin,
        signup,
        signout,
        deleteUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
