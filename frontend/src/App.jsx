import React from "react";
import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
import Tarefas from "./pages/tarefas.jsx";
import Calendario from "./pages/Calendario.jsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>''
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/tarefas" element={<Tarefas />} />
        <Route path="/eventos" element={<Calendario />} />
      </Routes>
    </BrowserRouter>
  );
}


export default App;

