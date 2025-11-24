import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Tarefas.css";

function Tarefas() {
  const [tarefas, setTarefas] = useState([]);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [editId, setEditId] = useState(null);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    carregarTarefas();
  }, []);

  const carregarTarefas = async () => {
    try {
      const response = await fetch(`${API_URL}/tarefas`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      if (!response.ok) return;

      const data = await response.json();
      setTarefas(data);
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
    }
  };

  const salvarTarefa = async () => {
    if (!nome || !descricao) return alert("Preencha todos os campos!");

    const novaTarefa = {
      tarefa: nome,
      data: descricao,
      prioridade: "normal"
    };

    const url = editId
      ? `${API_URL}/tarefas/${editId}`
      : `${API_URL}/tarefas`;

    const method = editId ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(novaTarefa),
      });

      if (!response.ok) {
        const erro = await response.json();
        return alert(erro.message);
      }

      setNome("");
      setDescricao("");
      setEditId(null);
      carregarTarefas();
    } catch (error) {
      console.error("Erro ao salvar tarefa:", error);
    }
  };

  const removerTarefa = async (id) => {
    try {
      const response = await fetch(`${API_URL}/tarefas/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) return;

      carregarTarefas();
    } catch (error) {
      console.error("Erro ao deletar tarefa:", error);
    }
  };

  const concluirTarefa = async (id) => {
    try {
      const response = await fetch(`${API_URL}/tarefas/concluir/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) return;

      carregarTarefas();
    } catch (error) {
      console.error("Erro ao concluir tarefa:", error);
    }
  };

  const sair = () => {
    navigate("/login");
  };

  return (
    <div className="container">
      <h1>Gerenciador de Tarefas</h1>

      <div className="form">
        <input
          type="text"
          placeholder="Nome da tarefa"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />
        <textarea
          placeholder="Descrição"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        ></textarea>

        <button onClick={salvarTarefa}>
          {editId ? "Atualizar" : "Adicionar"}
        </button>

        {editId && (
          <button onClick={() => setEditId(null)}>Cancelar edição</button>
        )}
      </div>

      <ul className="tarefas-lista">
        {tarefas.map((tarefa) => (
          <li key={tarefa.id} className={tarefa.concluida ? "concluida" : ""}>
            <h3>{tarefa.tarefa}</h3>
            <p>{tarefa.data}</p>

            <div className="acoes">
              <button onClick={() => concluirTarefa(tarefa.id)}>
                {tarefa.concluida ? "Desmarcar" : "Concluir"}
              </button>

              <button
                onClick={() => {
                  setEditId(tarefa.id);
                  setNome(tarefa.tarefa);
                  setDescricao(tarefa.data);
                }}
              >
                Editar
              </button>

              <button onClick={() => removerTarefa(tarefa.id)}>Excluir</button>
            </div>
          </li>
        ))}
      </ul>

      <button className="logout" onClick={sair}>
        Sair
      </button>
    </div>
  );
}

export default Tarefas;
