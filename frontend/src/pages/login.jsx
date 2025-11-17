import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";


function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [mensagem, setMensagem] = useState("");

    const logar = async () => {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        setMensagem(data.message);

        if (data.token) {
            localStorage.setItem("token", data.token);
            navigate("/tarefas"); 
        }
    };

    return (
        <div className="auth-container">
            <h2>Login</h2>

            <input type="text" placeholder="Usuário"
                value={username} onChange={(e) => setUsername(e.target.value)} />

            <input type="password" placeholder="Senha"
                value={password} onChange={(e) => setPassword(e.target.value)} />

            <button onClick={logar}>Entrar</button>

            {mensagem && <p className="mensagem">{mensagem}</p>}

            <p>Ainda não tem conta?</p>
            <button onClick={() => navigate("/register")}>Criar conta</button>
        </div>
    );
}

export default Login;
