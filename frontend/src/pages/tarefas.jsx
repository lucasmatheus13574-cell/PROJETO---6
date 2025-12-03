import React, { useEffect, useState, useCallback } from "react";
import "../styles/Tarefas.css";
import Swal from "sweetalert2";

function Tarefas() {
    const [tarefa, setTarefa] = useState("");
    const [data, setData] = useState("");
    const [prioridade, setPrioridade] = useState("baixa");
    const [lista, setLista] = useState([]);
    const [editId, setEditId] = useState(null);
    const [mensagem, ] = useState("");
    const [filtro, setFiltro] = useState("pendentes");
    const [filtroPrioridade, setFiltroPrioridade] = useState("todas");

    const token = localStorage.getItem("token");
    
    const URL_API  =  import.meta.env.VITE_API_URL;   
    
    
    useEffect(() => {
        carregarTarefas();
    }, [carregarTarefas]);
    
    
    const carregarTarefas = useCallback(async () => {
        try {
            const res = await fetch(`${URL_API}/tarefas`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "authorization": `Bearer ${token}` },
            });

            if (res.status === 401) {
                localStorage.removeItem("token");
                window.location.href = "/login";
                return;
            }

            if (!res.ok) return;

            const ct = res.headers.get("content-type") || "";
            const data = ct.includes("application/json") ? await res.json() : [];
            setLista(data);
        } catch (err) {
            console.error("Erro ao carregar tarefas:", err);
        }
    }, [URL_API, token]);

    const salvarTarefa = async () => {
        const body = { tarefa, data, prioridade };

        const url = editId
            ? `${URL_API}/tarefas/${editId}`
            : `${URL_API}/tarefas`;

        const method = editId ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                "authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });

        const ct = response.headers.get("content-type") || "";
        const result = ct.includes("application/json") ? await response.json() : { message: response.statusText };

        if (response.ok) {
            Swal.fire({
                icon: "success",
                title: editId ? "Tarefa editada!" : "Tarefa adicionada!",
                text: result.message,
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
                text: result.message,
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
                const res = await fetch(`${URL_API}/tarefas/${id}`, {
                    method: "DELETE",
                    headers: { "authorization": `Bearer ${token}` },
                });

                if (res.ok) {
                    carregarTarefas();
                    Swal.fire("Deletada!", "Sua tarefa foi removida.", "success");
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
    try {
        const res = await fetch(`${URL_API}/tarefas/concluir/${id}`, {
            method: "PUT",
            headers: {
                "authorization": `Bearer ${token}` },
        });

        const ct = res.headers.get("content-type") || "";
        const result = ct.includes("application/json") ? await res.json() : { message: res.statusText };

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
                text: result.message
            });
        }
    } catch (err) {
        console.error(err);
        Swal.fire({ icon: "error", title: "Erro", text: "Erro de conexão." });
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
            localStorage.removeItem("token");
            Swal.fire({
                icon: "success",
                title: "Sessão encerrada!",
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
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

            {mensagem && <p>{mensagem}</p>}

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