import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { BiddingQuery, BuildBiddingFilter } from "../utils/build-bidding-filter";
import { PageIndex } from "../utils/pageIndex";
import { db } from "../server";

export async function GetBiddings(app: FastifyInstance) {
    app.get("/licitacoes", async (req: FastifyRequest, reply: FastifyReply) => {
        const biddingQuery = req.query as BiddingQuery;
        const biddingFilter = BuildBiddingFilter(biddingQuery);

        const biddingCollection = db.collection("licitacao");

        const { page, limit, skip } = PageIndex(biddingQuery);

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
            return reply.status(404).send({ error: "Bidding not found" });
        };

        const totalBidding = await biddingCollection.countDocuments(biddingFilter);

        const totalPages = Math.ceil(totalBidding / limit);

        return reply.send({ biddings, page, limit, totalBidding, totalPages });
    });

    app.get("/grafico1", async (req: FastifyRequest, reply: FastifyReply) => {
        const biddingQuery = req.query as BiddingQuery;
        const biddingFilter = BuildBiddingFilter(biddingQuery);

        const biddingCollection = db.collection("licitacao");

        const situacaoData = await biddingCollection.aggregate([
            {
                $match: biddingFilter,
            },
            {
                $group: {
                    _id: "$situacaoLicitacao",
                    count: { $sum: 1 }
                }
            },
            {
                $match: { _id: { $ne: null } }
            }
        ]).toArray();

        if (situacaoData.length === 0) {
            return reply.status(404).send({ error: "No data found" });
        }

        return reply.send(situacaoData);
    });

    app.get("/grafico2", async (req: FastifyRequest, reply: FastifyReply) => {
        const biddingQuery = req.query as BiddingQuery;
        const biddingFilter = BuildBiddingFilter(biddingQuery);

        const biddingCollection = db.collection("licitacao");

        const modalidadeData = await biddingCollection.aggregate([
            {
                $match: biddingFilter,
            },
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

        if (modalidadeData.length === 0) {
            return reply.status(404).send({ error: "No data found" });
        }

        return reply.send(modalidadeData);
    });

    app.get("/grafico3", async (req: FastifyRequest, reply: FastifyReply) => {
        const biddingQuery = req.query as BiddingQuery;
        const biddingFilter = BuildBiddingFilter(biddingQuery);

        const biddingCollection = db.collection("licitacao");

        const orgaoData = await biddingCollection.aggregate([
            {
                $match: { ...biddingFilter, "unidadeOrgao.descricao": { $ne: null } }
            },
            {
                $group: {
                    _id: "$unidadeOrgao.descricao",
                    count: { $sum: 1 }
                }
            }
        ]).toArray();

        if (orgaoData.length === 0) {
            return reply.status(404).send({ error: "No data found" });
        }

        return reply.send(orgaoData);
    });

    app.get("/grafico4", async (req: FastifyRequest, reply: FastifyReply) => {
        const biddingQuery = req.query as BiddingQuery;
        const biddingFilter = BuildBiddingFilter(biddingQuery);

        const biddingCollection = db.collection("licitacao");

        const anoData = await biddingCollection.aggregate([
            {
                $match: { ...biddingFilter, "anoCompra": { $ne: null } }
            },
            {
                $group: {
                    _id: "$anoCompra",
                    count: { $sum: 1 }
                }
            }
        ]).toArray();

        if (anoData.length === 0) {
            return reply.status(404).send({ error: "No data found" });
        }

        return reply.send(anoData);
    });
}