import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const formatForInput = (date) => {
    const d = new Date(date);
    // convert to local for datetime-local input
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
};

function AddEventModal({ show, onClose, defaultStart, defaultEnd, onCreate }) {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');

    useEffect(() => {
        if (defaultStart) setStart(formatForInput(defaultStart));
        if (defaultEnd) setEnd(formatForInput(defaultEnd));
        setTitle('');
        setDesc('');
    }, [defaultStart, defaultEnd, show]);

    const handleSave = () => {
        if (!title || !start || !end) return alert('Preencha título, início e fim');
        const s = new Date(start);
        const e = new Date(end);
        if (e < s) return alert('A data de fim deve ser igual ou posterior à data de início');

        onCreate({ title, desc, start: s.toISOString(), end: e.toISOString() });
    };

    return (
        <Modal show={show} onHide={onClose}>
            <Modal.Header closeButton>
                <Modal.Title>Novo Evento</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className='mb-2'>
                        <Form.Label>Título</Form.Label>
                        <Form.Control value={title} onChange={(e) => setTitle(e.target.value)} />
                    </Form.Group>

                    <Form.Group className='mb-2'>
                        <Form.Label>Descrição</Form.Label>
                        <Form.Control as='textarea' rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
                    </Form.Group>

                    <Form.Group className='mb-2'>
                        <Form.Label>Início</Form.Label>
                        <Form.Control type='datetime-local' value={start} onChange={(e) => setStart(e.target.value)} />
                    </Form.Group>

                    <Form.Group className='mb-2'>
                        <Form.Label>Fim</Form.Label>
                        <Form.Control type='datetime-local' value={end} onChange={(e) => setEnd(e.target.value)} />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant='secondary' onClick={onClose}>Cancelar</Button>
                <Button variant='primary' onClick={handleSave}>Salvar</Button>
            </Modal.Footer>
        </Modal>
    );
}

export default AddEventModal;
