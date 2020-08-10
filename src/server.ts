import express from 'express';
import cors from 'cors';
import routes from './routes';



const app = express();
app.use(cors())

/*
GET: Buscar ou listar uma informação
POST: Criar alguma nova informação,
PUT: Atualizar um informação,
DELETE: Deletar uma informação existente 
*/
//http://localhost:3000(rota)/users(recurso)

//Corpo (Request Body): Dados para a criação ou atualização de um registro.
//Router Params: Identificar qual recurso quero atualizar ou deletar.
//Query Params: Listagem por nome, listar por número, filtros, ordenação
//habilitar a leitura do body e ler como JS.
app.use(express.json());
app.use(routes);



app.listen(8080);