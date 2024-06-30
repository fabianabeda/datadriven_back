import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { BiddingQuery, BuildBiddingFilter } from "../utils/build-bidding-filter";
import { PageIndex } from "../utils/pageIndex";
import { db } from "../server";

export async function GetBiddings(app: FastifyInstance) {
    app.get("/licitacoes", async (req: FastifyRequest, reply: FastifyReply) => {
        const biddingQuery = req.query as BiddingQuery;
        const biddingFilter = BuildBiddingFilter(biddingQuery);

        const biddingCollectionName = "licitacao";
        const supplierCollectionName = "fornecedor";
        const biddingItemCollectionName = "item_licitacao";

        const biddingCollection = db.collection(biddingCollectionName);

        const { page, limit, skip } = PageIndex(biddingQuery)

        const biddings = await biddingCollection.aggregate([
            {
                $lookup: {
                    from: biddingItemCollectionName,
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
                    from: supplierCollectionName,
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

        // const biddingFiltered = MapBidding(biddings);

        return reply.send({ biddings, page, limit, totalBidding, totalPages });
    });
}