import { Form } from 'react-bootstrap';
import { useState, useEffect } from 'react';

function FiltroAtividades({ atividades, onSelecionarAtividades }) {
  const [selecionados, setSelecionados] = useState([]);

  useEffect(() => {
    if (selecionados.length === 0) {
      onSelecionarAtividades(atividades);
    } else {
      onSelecionarAtividades(
        atividades.filter(e => selecionados.includes(e.tipo))
      );
    }
  }, [selecionados, atividades]);

  return (
    <div>
      {['Trabalho', 'Pessoal'].map(tipo => (
        <Form.Check
          key={tipo}
          label={tipo}
          checked={selecionados.includes(tipo)}
          onChange={() =>
            setSelecionados(prev =>
              prev.includes(tipo)
                ? prev.filter(t => t !== tipo)
                : [...prev, tipo]
            )
          }
        />
      ))}
    </div>
  );
}

export default FiltroAtividades;
