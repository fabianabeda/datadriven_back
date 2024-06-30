export type BiddingQuery = {
    modalidade?: string;
    unidade?: string;
    orgao?: string;
    municipio?: string;
    estado?: string;
    
    page: string;
    limit: string;
};

export type BiddingFilter = {
    "modalidadeCompra.id"?: number;
    "unidadeOrgao.codigo"?: string;
    "unidadeOrgao.orgao.codigo"?: string;
    "unidadeOrgao.cidade.nome"?: string | RegExp;
    "unidadeOrgao.cidade.uf.nome"?: string | RegExp;
};

export function BuildBiddingFilter(query: BiddingQuery): BiddingFilter {

    const filter: BiddingFilter = {};

    if (query.modalidade) {
        filter["modalidadeCompra.id"] = Number(query.modalidade)
    };
    
    if (query.estado) {
        filter["unidadeOrgao.cidade.uf.nome"] = new RegExp(query.estado, 'i')
    };

    if (query.municipio) {
        filter["unidadeOrgao.cidade.nome"] = new RegExp(query.municipio, 'i')
    };

    if (query.unidade) {
        filter["unidadeOrgao.codigo"] = query.unidade
    };

    if (query.orgao) {
        filter["unidadeOrgao.orgao.codigo"] = query.orgao
    };

    return filter;
}