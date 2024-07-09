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

    app.get("/licitacoes-unificadas", async (req: FastifyRequest, reply: FastifyReply) => {
        const biddingQuery = req.query as BiddingQuery;
        const biddingFilter = BuildBiddingFilter(biddingQuery);
    
        const unifiedCollection = db.collection("licitacoes_unificadas");
    
        const { page, limit, skip } = PageIndex(biddingQuery);
    
        const biddings = await unifiedCollection.find(biddingFilter)
                                                .skip(skip)
                                                .limit(limit)
                                                .toArray();
    
        if (biddings.length === 0) {
            return reply.status(404).send({ error: "Bidding not found" });
        }
    
        const totalBidding = await unifiedCollection.countDocuments(biddingFilter);
    
        const totalPages = Math.ceil(totalBidding / limit);
    
        return reply.send({ biddings, page, limit, totalBidding, totalPages });
    });

    app.get("/grafico1", async (req: FastifyRequest, reply: FastifyReply) => {
        const biddingQuery = req.query as BiddingQuery;
        const biddingFilter = BuildBiddingFilter(biddingQuery);
    
        const biddingCollection = db.collection("licitacoes_unificadas");
    
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
    
        const biddingCollection = db.collection("licitacoes_unificadas");
    
        try {
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
        } catch (error) {
            console.error("Error fetching data for chart 2:", error);
            return reply.status(500).send({ error: "Internal server error" });
        }
    });

    app.get("/grafico3", async (req: FastifyRequest, reply: FastifyReply) => {
        const biddingQuery = req.query as BiddingQuery;
        const biddingFilter = BuildBiddingFilter(biddingQuery);
    
        const biddingCollection = db.collection("licitacoes_unificadas");
    
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
    
        const biddingCollection = db.collection("licitacoes_unificadas");
    
        try {
            const anoData = await biddingCollection.aggregate([
                {
                    $match: { 
                        ...biddingFilter, 
                        "anoCompra": { $ne: null } 
                    }
                },
                {
                    $group: {
                        _id: "$anoCompra",
                        count: { $sum: 1 }
                    }
                },
                {
                    $match: {
                        count: { $gt: 5 },
                        _id: { $in: [2023, 2024] } 
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]).toArray();
    
            if (anoData.length === 0) {
                return reply.status(404).send({ error: "No data found" });
            }
    
            return reply.send(anoData);
        } catch (error) {
            console.error("Error fetching data for chart 4:", error);
            return reply.status(500).send({ error: "Internal server error" });
        }
    });

    app.get("/total-licitacoes", async (req: FastifyRequest, reply: FastifyReply) => {
        const biddingQuery = req.query as BiddingQuery;
        const biddingFilter = BuildBiddingFilter(biddingQuery);

        const biddingCollection = db.collection("licitacoes_unificadas");

        const totalLicitacoes = await biddingCollection.countDocuments(biddingFilter);

        return reply.send({ totalLicitacoes });
    });


    app.get("/top-itens-licitados", async (req: FastifyRequest, reply: FastifyReply) => {
        const biddingQuery = req.query as BiddingQuery;
        const biddingFilter = BuildBiddingFilter(biddingQuery);

        try {
            const biddingCollection = db.collection("licitacoes_unificadas");

            const topItens = await biddingCollection.aggregate([
                {
                    $match: biddingFilter,
                },
                {
                    $unwind: "$itens",
                },
                {
                    $group: {
                        _id: "$itens.descricao",
                        total: { $sum: "$itens.quantidade" }
                    }
                },
                {
                    $sort: { total: -1 }
                },
                {
                    $limit: 10
                }
            ], { allowDiskUse: true }).toArray();

            if (topItens.length === 0) {
                return reply.status(404).send({ error: "No data found" } as const);
            }

            return reply.send(topItens);
        } catch (error: any) {
            console.error("Error fetching top items:", error);
            return reply.status(500).send({ error: "Internal server error", details: error.message } as const);
        }
    });

    app.get("/valor-total-licitado", async (req: FastifyRequest, reply: FastifyReply) => {
        const biddingQuery = req.query as BiddingQuery;
        const biddingFilter = BuildBiddingFilter(biddingQuery);
    
        try {
            const biddingCollection = db.collection("licitacoes_unificadas");
    
            const totalValue = await biddingCollection.aggregate([
                {
                    $match: biddingFilter,
                },
                {
                    $unwind: "$itens"
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: "$itens.valor" }
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

    app.get("/tipo-fornecedores", async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const biddingCollection = db.collection("licitacoes_unificadas");

            const countByType = await biddingCollection.aggregate([
                {
                    $unwind: "$itens"
                },
                {
                    $unwind: "$itens.resultado"
                },
                {
                    $group: {
                        _id: "$itens.resultado.fornecedor.porteFornecedorNome",
                        count: { $sum: 1 }
                    }
                }
            ], { allowDiskUse: true }).toArray();

            return reply.send(countByType);
        } catch (error: any) {
            console.error("Erro ao contar fornecedores por tipo:", error);
            return reply.status(500).send({ error: "Erro interno do servidor" });
        }
    });

    app.get("/top-empresas", async (req: FastifyRequest, reply: FastifyReply) => {
        const biddingQuery = req.query as BiddingQuery;
        const biddingFilter = BuildBiddingFilter(biddingQuery);
    
        try {
            const biddingCollection = db.collection("licitacoes_unificadas");
    
            const topEmpresas = await biddingCollection.aggregate([
                {
                    $match: biddingFilter,
                },
                {
                    $unwind: "$itens"
                },
                {
                    $match: { "itens.resultado.fornecedor.nomeRazaoSocialFornecedor": { $exists: true, $ne: "" } }
                },
                {
                    $group: {
                        _id: "$itens.resultado.fornecedor.nomeRazaoSocialFornecedor",
                        totalLicitacoes: { $sum: 1 }
                    }
                },
                {
                    $sort: { totalLicitacoes: -1 }
                },
                {
                    $limit: 5
                },
                {
                    $project: {
                        _id: 0,
                        nomeEmpresa: "$_id",
                        totalLicitacoes: 1
                    }
                }
            ]).toArray();
    
            if (topEmpresas.length === 0) {
                return reply.status(404).send({ error: "No data found" });
            }
    
            return reply.send(topEmpresas);
        } catch (error) {
            console.error("Error fetching top companies data:", error);
            return reply.status(500).send({ error: "Internal server error" });
        }
    });

    app.get("/empresas-participantes", async (req: FastifyRequest, reply: FastifyReply) => {
        const biddingQuery = req.query as BiddingQuery;
        const biddingFilter = BuildBiddingFilter(biddingQuery);
    
        try {
            const biddingCollection = db.collection("licitacoes_unificadas");
    
            const empresasParticipantes = await biddingCollection.aggregate([
                {
                    $match: {
                        ...biddingFilter,
                        anoCompra: { $in: [2023, 2024] } // Certificando que anoCompra é um número
                    }
                },
                {
                    $unwind: "$itens"
                },
                {
                    $match: {
                        "itens.resultado.fornecedor.nomeRazaoSocialFornecedor": { $exists: true, $ne: "" }
                    }
                },
                {
                    $group: {
                        _id: {
                            ano: "$anoCompra",
                            fornecedor_id: "$itens.resultado.fornecedor.cpfCnpj"
                        },
                        nomeEmpresa: { $first: "$itens.resultado.fornecedor.nomeRazaoSocialFornecedor" }
                    }
                },
                {
                    $group: {
                        _id: "$_id.ano",
                        totalFornecedores: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: 1 }
                },
                {
                    $project: {
                        _id: 0,
                        ano: "$_id",
                        totalFornecedores: 1
                    }
                }
            ]).toArray();
    
            if (empresasParticipantes.length === 0) {
                return reply.status(404).send({ error: "No data found" });
            }
    
            const years = ["2023", "2024"]; // Incluindo apenas 2023 e 2024
            const result = years.map(year => {
                const found = empresasParticipantes.find(item => item.ano.toString() === year);
                return found || { ano: year, totalFornecedores: 0 };
            });
    
            return reply.send(result);
        } catch (error) {
            console.error("Error fetching participating companies data:", error);
            return reply.status(500).send({ error: "Internal server error" });
        }
    });


    app.get("/estados", async (req: FastifyRequest, reply: FastifyReply) => {
        const biddingQuery = req.query as BiddingQuery;
        const biddingFilter = BuildBiddingFilter(biddingQuery);
    
        const biddingCollection = db.collection("licitacoes_unificadas");
    
        const estadosData = await biddingCollection.aggregate([
            {
                $match: { ...biddingFilter, "unidadeOrgao.cidade.uf.nome": { $ne: null } }
            },
            {
                $group: {
                    _id: "$unidadeOrgao.cidade.uf.nome",
                }
            }
        ]).toArray();
    
        if (estadosData.length === 0) {
            return reply.status(404).send({ error: "No data found" });
        }
    
        return reply.send(estadosData);
    });
}