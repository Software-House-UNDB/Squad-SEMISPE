# Painel administrativo do portal

O painel é a área central de gestão do site do Parque Tecnológico. A gestão de
reservas é seu primeiro módulo operacional, dentro de uma estrutura compartilhada
de autenticação, navegação, identidade visual e permissões administrativas.

## Organização

- `/admin`: visão geral do portal, com as áreas de gestão e sua disponibilidade.
- `/admin/reservas`: módulo operacional de análise de reservas.
- Demais rotas `/admin/:moduleId`: apresentação do escopo planejado para cada área,
  sem formulários ou ações que aparentem uma gestão ainda não implementada.

Áreas previstas:

| Grupo | Módulos |
| --- | --- |
| Operação | Reservas, espaços |
| Conteúdo do portal | Eventos, notícias, parceiros, ecossistema de inovação, editais, oportunidades, conteúdo institucional |
| Participação | Fale conosco, banco de ideias |
| Acesso | Usuários e permissões |

O inventário e a disponibilidade ficam em `frontend/src/models/admin.model.ts`.
O layout e a verificação de acesso pertencem a `AdminPage`; as telas dos módulos
são rotas filhas renderizadas pelo Outlet. O menu marca a área atual e pode ser
recolhido em telas pequenas. O login se refere à gestão do portal inteiro.

## Implementação atual

Reservas já permite consultar pedidos, anexos e histórico, aprovar ou rejeitar
solicitações. Contratos, testes e acesso local estão em
[admin-reservations.md](admin-reservations.md).

Os demais módulos possuem navegação e escopo identificados como **planejados**.
Uma API de domínio já existente não significa que sua interface administrativa
esteja pronta. As próximas implementações devem usar os endpoints e regras de
cada domínio e manter a proteção administrativa no backend.

A correção da estrutura geral não altera as regras nem os endpoints de reservas.
Não exige migration. A implementação funcional dos demais módulos continua para
as próximas etapas.

Validação da estrutura geral em 17/11/2026: 28 testes de frontend passaram, incluindo
acesso restrito, visão geral, navegação entre módulos e indicação de funcionalidades
planejadas. Build aprovado; lint sem novos avisos. A navegação entre visão geral,
Eventos (planejado) e Reservas (operacional) também foi conferida no navegador.
