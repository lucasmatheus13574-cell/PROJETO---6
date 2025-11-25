import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [mensagem, setMensagem] = useState("");

    const API_URL = import.meta.env.VITE_API_URL;

    const logar = async () => {
        if (!username.trim() || !password.trim()) {
            setMensagem("Usuário e senha são obrigatórios!");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })    
            });

            const data = await response.json();
            setMensagem(data.message);

            if (!response.ok) return;

            // 💡 GARANTE O TOKEN
            if (data.token) {
                localStorage.setItem("token", data.token);
                navigate("/tarefas");
            }
        } catch (err) {
            console.log("Erro no login:", err);
            setMensagem("Erro ao conectar com o servidor!");
        }
    };

    return (
        <div className="auth-container">
            <h2>Login</h2>

            <input
                type="text"
                placeholder="Usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />

            <input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <button onClick={logar}>Entrar</button>

            {mensagem && <p className="mensagem">{mensagem}</p>}

            <p>Ainda não tem conta?</p>
            <button onClick={() => navigate("/register")}>Criar conta</button>
        </div>
    );
}

export default Login;
