import { Modal, Button, Form } from 'react-bootstrap';
import { useState, useEffect } from 'react';

function AddEventModal({ show, onClose, defaultStart, defaultEnd, onCreate }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [tipo, setTipo] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useEffect(() => {
    if (defaultStart) setStart(defaultStart.toISOString().slice(0, 16));
    if (defaultEnd) setEnd(defaultEnd.toISOString().slice(0, 16));
  }, [defaultStart, defaultEnd]);

  const handleSave = () => {
    onCreate({
      title,
      desc,
      tipo,
      start: new Date(start).toISOString(),
      end: new Date(end).toISOString(),
    });
  };

  return (
    <Modal show={show} onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>Novo Evento</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Control placeholder="Título" onChange={e => setTitle(e.target.value)} />
          <Form.Control as="textarea" placeholder="Descrição" onChange={e => setDesc(e.target.value)} />
          <Form.Select onChange={e => setTipo(e.target.value)}>
            <option value="">Selecione o tipo</option>
            <option value="Trabalho">Trabalho</option>
            <option value="Pessoal">Pessoal</option>
          </Form.Select>
          <Form.Control type="datetime-local" value={start} onChange={e => setStart(e.target.value)} />
          <Form.Control type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} />
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={handleSave}>Salvar</Button>
      </Modal.Footer>
    </Modal>
  );
}

export default AddEventModal;
