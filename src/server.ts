import fastify from "fastify";
import { Db, MongoClient } from "mongodb";
import { config } from "dotenv";
import { GetBiddings } from "./routes/get-biddings";

const app = fastify();

const dbName = 'licitacao_db';
export let db: Db;

config();
const mongoURL = process.env.MONGODB_URL as string;

MongoClient.connect(mongoURL)
    .then(client => {
        db = client.db(dbName);
        console.log("Connected to database");
    })
    .catch(error => {
        console.log(`Error: ${error}`);
    });

app.register(GetBiddings);

app.listen({ port: 3333 }).then(() => {
    console.log("Server Running...");
});