import React, { useEffect, useState } from "react";
import "../styles/Tarefas.css";
import Swal from "sweetalert2";

function Tarefas() {
    const [tarefa, setTarefa] = useState("");
    const [data, setData] = useState("");
    const [prioridade, setPrioridade] = useState("baixa");
    const [lista, setLista] = useState([]);
    const [editId, setEditId] = useState(null);
    const [filtro, setFiltro] = useState("pendentes");
    const [filtroPrioridade, setFiltroPrioridade] = useState("todas");

    const token = localStorage.getItem("token");
    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const carregarTarefas = async () => {
            if (!token) return;
            
                const res = await fetch(`${API_URL}/tarefas`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) {
                    console.error("Erro ao carregar tarefas:", res.status);
                    return;
                }
                const contentType = res.headers.get("content-type") || "";
                if (!contentType.includes("application/json")) {
                    console.warn("Resposta não-JSON ao carregar tarefas");
                    return;
                }
                const data = await res.json();
                setLista(data);
        };

        carregarTarefas();
    }, [token, API_URL]);

    const carregarTarefas = async () => {
        const res = await fetch(`${API_URL}/tarefas`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                console.error("Erro ao carregar tarefas:", res.status);
                return;
            }
            const contentType = res.headers.get("content-type") || "";
            if (!contentType.includes("application/json")) {
                console.warn("Resposta não-JSON ao carregar tarefas");
                return;
            }
            const data = await res.json();
            setLista(data);
    };

    const salvarTarefa = async () => {
        if (!tarefa.trim() || !data) {
            Swal.fire({
                icon: "warning",
                title: "Campos incompletos!",
                text: "Preencha tarefa e data.",
            });
            return;
        }

        const body = { tarefa, data, prioridade };

        const url = editId
            ? `https://projeto-backend-2lg9.onrender.com/api/tarefas/${editId}`
            : `https://projeto-backend-2lg9.onrender.com/api/tarefas`;

        const method = editId ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });
        const contentType = response.headers.get("content-type") || "";
        let result = null;
        if (contentType.includes("application/json")) {
            result = await response.json();
        } else {
            const text = await response.text();
            console.warn("Resposta não-JSON ao salvar tarefa:", text);
        }

        if (response.ok) {
            Swal.fire({
                icon: "success",
                title: editId ? "Tarefa editada!" : "Tarefa adicionada!",
                text: result ? result.message : undefined,
                timer: 2000,
                showConfirmButton: false,
            });

            carregarTarefas();
            setTarefa("");
            setData("");
            setPrioridade("baixa");
            setEditId(null);
        } else {
                Swal.fire({
                icon: "error",
                title: "Erro!",
                text: result ? result.message : `Erro ${response.status}`,
            });
        }
    };

    const removerTarefa = async (id) => {
        Swal.fire({
            title: "Tem certeza?",
            text: "Essa tarefa será apagada definitivamente!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sim, excluir!",
            cancelButtonText: "Cancelar"
        }).then(async (result) => {
            if (result.isConfirmed) {
                const res = await fetch(`${API_URL}/tarefas/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (res.ok) {
                    carregarTarefas();
                    Swal.fire("Deletada!", "Sua tarefa foi removida.", "success");
                } else {
                    const ct = res.headers.get("content-type") || "";
                    let msg = `Erro ${res.status}`;
                    if (ct.includes("application/json")) {
                        const j = await res.json();
                        if (j && j.message) msg = j.message;
                    }
                    Swal.fire("Erro", msg, "error");
                }
            }
        });
    };

    const editarTarefa = (item) => {
        setTarefa(item.tarefa);
        setData(item.data);
        setPrioridade(item.prioridade);
        setEditId(item.id);
    };

const concluirTarefa = async (id) => {
    const res = await fetch(`${API_URL}/tarefas/concluir/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
    });

    const ct = res.headers.get("content-type") || "";
    let result = null;
    if (ct.includes("application/json")) result = await res.json();

    if (res.ok) {
        carregarTarefas();
        Swal.fire({
            icon: "success",
            title: "Tarefa concluída! ✅",
            timer: 1800,
            showConfirmButton: false
        });
    } else {
        Swal.fire({
            icon: "error",
            title: "Erro!",
            text: result ? result.message : `Erro ${res.status}`
        });
    }
};


const logout = () => {
    Swal.fire({
        title: "Deseja sair?",
        text: "Você será desconectado da sua conta!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sim, sair",
        cancelButtonText: "Cancelar"
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem("token"); // remove o token salvo
            Swal.fire({
                icon: "success",
                title: "Sessão encerrada!",
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                // Redireciona para login (ajuste o caminho conforme seu app)
                window.location.href = "/login";
            });
        }
    });
};  




    const listaFiltrada = lista.filter((item) => {
        if (filtro === "pendentes" && item.concluida === 1) return false;
        if (filtro === "concluidas" && item.concluida === 0) return false;
        if (filtroPrioridade !== "todas" && item.prioridade !== filtroPrioridade)
            return false;
        return true;
    });

    return (
        <div className="container">
            <h1>Tarefas</h1>
            <p>Bem-vindo à página de Tarefas!</p>
            <div className="logout-area">
    <button className="logout-btn" onClick={logout}>🚪 Logout</button>
</div>
            <input
                type="text"
                placeholder="Digite sua tarefa:"
                className="input-text"
                value={tarefa}
                onChange={(e) => setTarefa(e.target.value)}
            />

            <input
                type="date"
                className="input-date"
                value={data}
                onChange={(e) => setData(e.target.value)}
            />

            <select
                className="input-select"
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value)}
            >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
            </select>

            <button className="input-btn" onClick={salvarTarefa}>
                {editId ? "Salvar Edição" : "Adicionar Tarefa"}
            </button>

            <h3>Filtros:</h3>
            <div className="filtros">
                <select className="filtro" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                    <option value="pendentes">Pendentes</option>
                    <option value="concluidas">Concluídas</option>
                </select>

                <select
                    className="filtro"
                    value={filtroPrioridade}
                    onChange={(e) => setFiltroPrioridade(e.target.value)}
                >
                    <option value="todas">Todas Prioridades</option>
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                </select>
            </div>

            <h3>Tarefas:</h3>
            <ul>
                {listaFiltrada.map((item) => (
                    <li
                        key={item.id}
                        className={item.concluida ? "concluida" : ""}
                    >
                        ✅ {item.tarefa} — {item.data} — {item.prioridade}
                        <button onClick={() => editarTarefa(item)}>✏️ Editar</button>
                        <button onClick={() => removerTarefa(item.id)}>❌ Excluir</button>
                        {!item.concluida && (
                            <button onClick={() => concluirTarefa(item.id)}>✔ Finalizar</button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Tarefas;