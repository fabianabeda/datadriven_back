import { BiddingQuery } from "./build-bidding-filter";

export function PageIndex(biddingQuery: BiddingQuery) {
    const page = parseInt(biddingQuery.page as string) || 1;
    const limit = parseInt(biddingQuery.limit as string) || 10;
    const skip = (page - 1) * limit;

    return { page, limit, skip }
}