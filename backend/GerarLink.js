// import React from "react";
// const express = require("express");

// app = express();

// function gerarLinkWhatsApp(telefone, mensagem) {
//     const telefoneFormatado = telefone.replace(/\D/g, '');
//     const texto = encodeURIComponent(mensagem);

//     return `https://wa.me/${telefoneFormatado}?text=${texto}`;
// }


// app.post('/lembrete', async (req, res) => {
//     const { titulo, data, hora, telefone } = req.body;

//     const mensagem = `Lembrete: ${titulo} às ${hora} do dia ${data}`;
//     const whatsappLink = gerarLinkWhatsApp(telefone, mensagem);

//     const evento = await Evento.create({
//         titulo,
//         data,
//         hora,
//         telefone,
//         whatsappLink
//     });

//     res.status(201).json(evento);
// });
