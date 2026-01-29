import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Register.css";


function Register() {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmpassword, setConfirmPassword] = useState("");
    const [mensagem, setMensagem] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    
    const URL_API  =  import.meta.env.VITE_API_URL;   

    const registrar = async () => {
        const response = await fetch(`${URL_API}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, confirmpassword, email, phone })
        });

        const data = await response.json();
        setMensagem(data.message);

        
        if (response.ok) {
            setTimeout(() => {
                navigate("/login");
            }, 1500);
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

            <input type="email" placeholder="Email"
                value={email} onChange={(e) => setEmail(e.target.value)} />

            <input type="tel" placeholder="Telefone"
                value={phone} onChange={(e) => setPhone(e.target.value)} />

            <button onClick={registrar}>Registrar</button>

            {mensagem && <p className="mensagem">{mensagem}</p>}

            <p>Já possui conta?</p>
            <button onClick={() => navigate("/login")}>Ir para Login</button>
        </div>
    );
}



export default Register;
