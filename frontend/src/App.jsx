import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/register";
import Calendario from "./pages/Calendario";
import Lembretes from "./pages/lembretes";
import MainLayout from "./pages/componentes/MainLoyaut";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<MainLayout />}>
          <Route path="/eventos" element={<Calendario />} />
          <Route path="/agenda" element={<Calendario />} />
          <Route path="/lembretes" element={<Lembretes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

