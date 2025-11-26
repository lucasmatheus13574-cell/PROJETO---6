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
                const response = await fetch(`${API_URL}/api/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })    
                });

                const contentType = response.headers.get("content-type") || "";
                let data = null;
                if (contentType.includes("application/json")) {
                    data = await response.json();
                } else {
                    const text = await response.text();
                    console.warn("Resposta não-JSON ao logar:", text);
                }

                if (data && data.message) setMensagem(data.message);

                if (!response.ok) {
                    setMensagem(data && data.message ? data.message : `Erro ${response.status}`);
                    return;
                }

                if (data && data.token) {
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
