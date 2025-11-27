import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";

function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [mensagem, setMensagem] = useState("");

    // Garante que a URL está correta
    const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

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

            const tipo = response.headers.get("content-type") || "";
            let data = null;

            if (tipo.includes("application/json")) {
                data = await response.json();
            } else {
                const text = await response.text();
                console.warn("Resposta não JSON ao logar:", text);
            }

            if (!response.ok) {
                setMensagem(data?.message || `Erro ${response.status}`);
                return;
            }

            if (data?.token) {
                localStorage.setItem("token", data.token);
                navigate("/tarefas");
            }

            if (data?.message) setMensagem(data.message);

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
