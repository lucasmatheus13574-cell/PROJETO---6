import React, { useState, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';

import Swal from 'sweetalert2';

function Adicionar({ onAdicionar, editingEvent, onUpdate, onDelete, onCancelEdit }) {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [tipo, setTipo] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (editingEvent) {
            setTitle(editingEvent.title || '');
            setDesc(editingEvent.desc || '');
            setStart(editingEvent.start ? new Date(editingEvent.start).toISOString().slice(0,16) : '');
            setEnd(editingEvent.end ? new Date(editingEvent.end).toISOString().slice(0,16) : '');
            setTipo(editingEvent.tipo || '');
        } else {
            setTitle('');
            setDesc('');
            setStart('');
            setEnd('');
            setTipo('');
        }
    }, [editingEvent]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !start || !end) return Swal.fire({ icon: 'warning', text: 'Preencha título, início e fim' });
        try {
            setSubmitting(true);
            if (editingEvent) {
                await onUpdate({ id: editingEvent.id, title, desc, tipo, start: new Date(start).toISOString(), end: new Date(end).toISOString() });
                Swal.fire({ icon: 'success', text: 'Evento atualizado!', timer: 1200, showConfirmButton: false });
                if (onCancelEdit) onCancelEdit();
            } else {
                await onAdicionar({ title, desc, tipo, start: new Date(start).toISOString(), end: new Date(end).toISOString() });
                Swal.fire({ icon: 'success', text: 'Evento criado!', timer: 1200, showConfirmButton: false });
            }
            setTitle('');
            setDesc('');
            setStart('');
            setEnd('');
        } catch (err) {
            console.error('Erro ao adicionar/atualizar via lateral:', err);
            Swal.fire({ icon: 'error', text: err?.message || 'Erro ao salvar evento' });
            throw err;
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className='mb-3'>
            <h5>Adicionar evento</h5>
            <Form onSubmit={handleSubmit}>
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
                <div className='d-flex gap-2'>
                    <Button type='submit' className='btn btn-primary' disabled={submitting}>{submitting ? (<><span className='spinner-border spinner-border-sm me-2' role='status'/>Enviando...</>) : (editingEvent ? 'Salvar' : 'Adicionar')}</Button>
                    {editingEvent && (
                        <>
                            <Button variant='outline-danger' onClick={async () => {
                                const res = await Swal.fire({ title: 'Excluir evento?', text: 'Confirma exclusão?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Excluir' });
                                if (res.isConfirmed) {
                                    try {
                                        setSubmitting(true);
                                        await onDelete(editingEvent.id);
                                        Swal.fire({ icon: 'success', text: 'Excluído!', timer: 1000, showConfirmButton: false });
                                        if (onCancelEdit) onCancelEdit();
                                    } catch (err) {
                                        console.error('Erro ao deletar:', err);
                                        Swal.fire({ icon: 'error', text: err?.message || 'Erro ao deletar' });
                                    } finally { setSubmitting(false); }
                                }
                            }}>Excluir</Button>
                            <Button variant='secondary' onClick={() => { if (onCancelEdit) onCancelEdit(); }}>Cancelar</Button>
                        </>
                    )}
                </div>
            </Form>
        </div>
    );
}

export default Adicionar;