import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "../styles/Register.css";
import "../styles/index.css";

function Register() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmpassword, setConfirmPassword] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [loading, setLoading] = useState(false);

    const URL_API = import.meta.env.VITE_API_URL;

    const registrar = async () => {
        if (!username.trim() || !password.trim() || !email.trim()) {
            Swal.fire({
                icon: "warning",
                title: "Campos obrigatórios",
                text: "Preencha usuário, senha e e-mail para continuar.",
            });
            return;
        }
        if (password !== confirmpassword) {
            Swal.fire({
                icon: "error",
                title: "Senhas não conferem",
                text: "A senha e a confirmação devem ser idênticas.",
            });
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${URL_API}/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, confirmpassword, email, phone }),
            });
            const data = await response.json();

            if (response.ok) {
                await Swal.fire({
                    icon: "success",
                    title: "Conta criada!",
                    text: "Seu cadastro foi realizado com sucesso.",
                    confirmButtonText: "Ir para o login",
                });
                navigate("/login");
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Erro ao cadastrar",
                    text: data.message || "Verifique os dados e tente novamente.",
                });
            }
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: "error",
                title: "Erro de conexão",
                text: "Não foi possível conectar ao servidor.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-brand">
                    <div className="auth-brand-icon">✨</div>
                    <h2>Criar <span>conta</span></h2>
                    <p className="auth-subtitle">Preencha os dados para se registrar</p>
                </div>

                <div className="auth-form">
                    <div className="input-group">
                        <label htmlFor="reg-username">Usuário</label>
                        <input
                            id="reg-username"
                            type="text"
                            placeholder="Seu nome de usuário"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="reg-email">E-mail</label>
                        <input
                            id="reg-email"
                            type="email"
                            placeholder="seuemail@exemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="reg-phone">Telefone</label>
                        <input
                            id="reg-phone"
                            type="tel"
                            placeholder="(11) 99999-9999"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="reg-password">Senha</label>
                        <input
                            id="reg-password"
                            type="password"
                            placeholder="Crie uma senha forte"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="reg-confirm">Confirmar senha</label>
                        <input
                            id="reg-confirm"
                            type="password"
                            placeholder="Repita a senha"
                            value={confirmpassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <button
                        className="auth-btn-primary"
                        onClick={registrar}
                        disabled={loading}
                    >
                        {loading ? "Cadastrando…" : "Criar conta"}
                    </button>

                    <div className="auth-divider">
                        <span /><p>já tem conta?</p><span />
                    </div>

                    <button
                        className="auth-btn-secondary"
                        onClick={() => navigate("/login")}
                    >
                        Fazer login
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Register;

