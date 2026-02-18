import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../styles/Login.css";
import "../styles/index.css";

function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const URL_API = import.meta.env.VITE_API_URL;

    const logar = async () => {
        if (!username.trim() || !password.trim()) {
            Swal.fire({
                icon: "warning",
                title: "Campos obrigatórios",
                text: "Preencha usuário e senha para continuar.",
                confirmButtonText: "Ok",
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${URL_API}/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (data.token) {
                localStorage.setItem("token", data.token);
                if (data.events) localStorage.setItem("events", JSON.stringify(data.events));
                if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
                navigate("/eventos");
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Falha no login",
                    text: data.message || "Usuário ou senha inválidos.",
                    confirmButtonText: "Tentar novamente",
                });
            }
        } catch (err) {
            console.error("Erro de conexão:", err);
            Swal.fire({
                icon: "error",
                title: "Erro de conexão",
                text: "Não foi possível conectar ao servidor. Tente novamente.",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") logar();
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-brand">
                    <div className="auth-brand-icon">📅</div>
                    <h2>Bem-vindo de <span>volta</span></h2>
                    <p className="auth-subtitle">Entre na sua conta para continuar</p>
                </div>

                <div className="auth-form">
                    <div className="input-group">
                        <label htmlFor="username">Usuário</label>
                        <input
                            id="username"
                            type="text"
                            placeholder="Seu nome de usuário"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoComplete="username"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Senha</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="Sua senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoComplete="current-password"
                        />
                    </div>

                    <button
                        className="auth-btn-primary"
                        onClick={logar}
                        disabled={loading}
                    >
                        {loading ? "Entrando…" : "Entrar"}
                    </button>

                    <div className="auth-divider">
                        <span /><p>ou</p><span />
                    </div>

                    <button
                        className="auth-btn-secondary"
                        onClick={() => navigate("/register")}
                    >
                        Criar nova conta
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Login;

