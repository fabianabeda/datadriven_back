import { WithId, Document } from "mongodb";

type BiddingTypes = WithId<Document>[];

export function MapBidding(biddings: BiddingTypes) {
    return biddings.map((bidding) => ({
        id: bidding._id,
    }));
}