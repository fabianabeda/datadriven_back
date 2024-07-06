import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { BiddingQuery, BuildBiddingFilter } from "../utils/build-bidding-filter";
import { PageIndex } from "../utils/pageIndex";
import { db } from "../server";

export async function GetBiddings(app: FastifyInstance) {
    app.get("/licitacoes", async (req: FastifyRequest, reply: FastifyReply) => {
        const biddingQuery = req.query as BiddingQuery;
        const biddingFilter = BuildBiddingFilter(biddingQuery);

        const biddingCollection = db.collection("licitacao");

        const { page, limit, skip } = PageIndex(biddingQuery)

        const biddings = await biddingCollection.aggregate([
            {
                $lookup: {
                    from: "item_licitacao",
                    localField: '_id',
                    foreignField: 'licitacao',
                    as: 'biddingItems'
                },
            },
            {
                $unwind: "$biddingItems",
            },
            {
                $unwind: "$biddingItems.resultado"
            },
            {
                $lookup: {
                    from: "fornecedor",
                    localField: 'biddingItems.resultado.fornecedor_id',
                    foreignField: '_id',
                    as: 'biddingItems.resultado.fornecedor'
                },
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            },
            {
                $match: biddingFilter,
            },
        ]).toArray();

        if (biddings.length === 0) {
            throw new Error("Bidding not found");
        };

        const totalBidding = biddings.length;

        const totalPages = Math.ceil(totalBidding / limit)

        return reply.send({ biddings, page, limit, totalBidding, totalPages });
    });

    // Gráfico 1: Situação da licitação x Quantidade
    app.get("/grafico1", async (req: FastifyRequest, reply: FastifyReply) => {
        const biddingCollection = db.collection("licitacao");

        const situacaoData = await biddingCollection.aggregate([
            {
                $group: {
                    _id: "$situacaoLicitacao",
                    count: { $sum: 1 }
                }
            },
            {
                $match: { _id: { $ne: null } } // Adicionado para garantir que o _id não seja nulo
            }
        ]).toArray();

        return reply.send(situacaoData);
    });

    // Gráfico 2: Modalidade de compra x Porcentagem
    app.get("/grafico2", async (req: FastifyRequest, reply: FastifyReply) => {
        const biddingCollection = db.collection("licitacao");

        const modalidadeData = await biddingCollection.aggregate([
            {
                $group: {
                    _id: "$modalidadeCompra.descricao",
                    count: { $sum: 1 }
                }
            },
            {
                $match: { _id: { $ne: null } }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: "$count" },
                    data: { $push: { modalidade: "$_id", count: "$count" } }
                }
            },
            {
                $unwind: "$data"
            },
            {
                $project: {
                    _id: 0,
                    modalidade: "$data.modalidade",
                    porcentagem: { $multiply: [{ $divide: ["$data.count", "$total"] }, 100] }
                }
            }
        ]).toArray();

        return reply.send(modalidadeData);
    });


    // Gráfico 3: Órgão x Quantidade de licitações
    app.get("/grafico3", async (req: FastifyRequest, reply: FastifyReply) => {
        const biddingCollection = db.collection("licitacao");

        const orgaoData = await biddingCollection.aggregate([
            {
                $match: { "unidadeOrgao.descricao": { $ne: null } } // Garantir que o campo não seja nulo
            },
            {
                $group: {
                    _id: "$unidadeOrgao.descricao",
                    count: { $sum: 1 }
                }
            }
        ]).toArray();

        return reply.send(orgaoData);
    });


   // Gráfico 4: Ano x Quantidade de licitações
    app.get("/grafico4", async (req: FastifyRequest, reply: FastifyReply) => {
        const biddingCollection = db.collection("licitacao");

        const anoData = await biddingCollection.aggregate([
            {
                $match: { "anoCompra": { $ne: null } } // Garantir que o campo não seja nulo
            },
            {
                $group: {
                    _id: "$anoCompra",
                    count: { $sum: 1 }
                }
            }
        ]).toArray();

        return reply.send(anoData);
    });
}
