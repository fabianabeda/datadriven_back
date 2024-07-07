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

    app.get("/total-licitacoes", async (req: FastifyRequest, reply: FastifyReply) => {
        const biddingQuery = req.query as BiddingQuery;
        const biddingFilter = BuildBiddingFilter(biddingQuery);

        const biddingCollection = db.collection("licitacao");

        const totalLicitacoes = await biddingCollection.countDocuments(biddingFilter);

        return reply.send({ totalLicitacoes });
    });

    app.get("/top-itens-licitados", async (req: FastifyRequest, reply: FastifyReply) => {
        const biddingQuery = req.query as BiddingQuery;
        const biddingFilter = BuildBiddingFilter(biddingQuery);
    
        try {
            const biddingCollection = db.collection("licitacao");
    
            const topItens = await biddingCollection.aggregate([
                {
                    $match: biddingFilter,
                },
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
                    $group: {
                        _id: "$biddingItems.descricao",
                        total: { $sum: "$biddingItems.quantidade" }
                    }
                },
                {
                    $sort: { total: -1 }
                },
                {
                    $limit: 10
                }
            ]).toArray();
    
            if (topItens.length === 0) {
                return reply.status(404).send({ error: "No data found" });
            }
    
            return reply.send(topItens);
        } catch (error) {
            console.error("Error fetching top items:", error);
            return reply.status(500).send({ error: "Internal server error" });
        }
    });

    app.get("/valor-total-licitado", async (req: FastifyRequest, reply: FastifyReply) => {
        const biddingQuery = req.query as BiddingQuery;
        const biddingFilter = BuildBiddingFilter(biddingQuery);
    
        try {
            const biddingCollection = db.collection("licitacao");
    
            const totalValue = await biddingCollection.aggregate([
                {
                    $match: biddingFilter,
                },
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
                    $group: {
                        _id: null,
                        total: { $sum: "$biddingItems.valor" }
                    }
                },
                {
                    $project: {
                        _id: 0, 
                        total: 1 
                    }
                }
            ]).toArray();
    
            if (totalValue.length === 0) {
                return reply.status(404).send({ error: "No data found" });
            }
    
            return reply.send(totalValue[0]);
        } catch (error) {
            console.error("Error fetching total value:", error);
            return reply.status(500).send({ error: "Internal server error" });
        }
    });

}