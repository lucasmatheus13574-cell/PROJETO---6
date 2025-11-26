import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Register.css";


function Register() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmpassword, setConfirmPassword] = useState("");
    const [mensagem, setMensagem] = useState("");


const API_URL = import.meta.env.VITE_API_URL;

const registrar = async () => {
    if (!username.trim() || !password.trim() || !confirmpassword.trim()) {
        setMensagem("Todos os campos são obrigatórios!");
        return;
    }

    if (password.length < 6) {
        setMensagem("A senha deve ter pelo menos 6 caracteres!");
        return;
    }

    if (password !== confirmpassword) {
        setMensagem("As senhas não coincidem!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, confirmpassword })
        });

        const contentType = response.headers.get("content-type") || "";
        let data = null;
        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.warn("Resposta não-JSON no register:", text);
        }

        if (data && data.message) setMensagem(data.message);

        if (response.ok) {
            setTimeout(() => {
                navigate("/login");
            }, 1500);
        }
    } catch (err) {
        console.log("Erro no registro:", err);
        setMensagem("Erro ao conectar com o servidor!");
    }
};

    return (
        <div className="auth-container">
            <h2>Cadastro</h2>

            <input type="text" placeholder="Usuário"
                value={username} onChange={(e) => setUsername(e.target.value)} />

            <input type="password" placeholder="Senha"
                value={password} onChange={(e) => setPassword(e.target.value)} />

            <input type="password" placeholder="Confirmar Senha"
                value={confirmpassword} onChange={(e) => setConfirmPassword(e.target.value)} />

            <button onClick={registrar}>Registrar</button>

            {mensagem && <p className="mensagem">{mensagem}</p>}

            <p>Já possui conta?</p>
            <button onClick={() => navigate("/login")}>Ir para Login</button>
        </div>
    );
}

export default Register;
