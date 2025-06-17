# LicitTrack – Monitoramento de Licitações Públicas

LicitTrack é um sistema para consolidar, padronizar e analisar dados públicos de licitações, oferecendo um painel interativo com indicadores estratégicos, táticos e operacionais. Desenvolvido no Mestrado Profissional em Tecnologia da Informação (IFPB).
---

## Contexto
A análise das licitações públicas era fragmentada e lenta devido a dados inconsistentes e dispersos no Portal Nacional de Contratações Públicas (PNCP).
---

## Desafio
Criar um sistema automatizado e escalável para coletar, padronizar, consolidar e visualizar dados de licitações via API, facilitando a tomada de decisões.
---

## Abordagem
- Extração paralela de dados da API do PNCP com Python.  
- Transformação e armazenamento em MongoDB para consultas analíticas.  
- Dashboard interativo em React com KPIs estratégicos, táticos e operacionais.  
- Aplicação de boas práticas de governança de dados.  
- Software registrado no INPI.
---

## Resultado
- Redução do tempo para análise de licitações.  
- Dashboard acessível para gestores, pesquisadores e estudantes.  
- Projeto reconhecido como iniciativa de dados abertos e base para pesquisas.
---

## Tecnologias
Python, JavaScript (React), MongoDB, REST APIs, Tailwind CSS.
---

## Como usar
### Backend
API disponível em: http://localhost:3000
---

## Frontend
Código disponível em:
https://github.com/fabianabeda/data-driven-frontend

```bash
git clone https://github.com/fabianabeda/datadriven_back.git
cd datadriven_back
npm install
npm run dev


