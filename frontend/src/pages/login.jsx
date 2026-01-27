import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";


function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [mensagem, setMensagem] = useState("");



    const URL_API  =  import.meta.env.VITE_API_URL;          

    


    const logar = async ()  => {
        if (!username.trim() || !password.trim()) {
            setMensagem("Preencha todos os campos");
            return;
        }

        try {
            const response = await fetch(`${URL_API}/login`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            setMensagem(data.message);

            if (data.token) {
                localStorage.setItem("token", data.token);
                if (data.events) localStorage.setItem("events", JSON.stringify(data.events));
                if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
                navigate("/eventos");
            }
        } catch (err) {
            console.error("Erro de conexão:", err);
            setMensagem("Erro ao conectar com servidor");
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
