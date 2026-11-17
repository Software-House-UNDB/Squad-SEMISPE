export type AdminGroup = 'Operação' | 'Conteúdo do portal' | 'Participação' | 'Acesso';

export interface AdminModule {
  id: string;
  title: string;
  group: AdminGroup;
  description: string;
  capabilities: readonly string[];
  available: boolean;
}

/** Áreas do painel geral. A disponibilidade indica o que já pode ser operado. */
export const ADMIN_MODULES: readonly AdminModule[] = [
  {
    id: 'reservas',
    title: 'Reservas',
    group: 'Operação',
    description: 'Analise solicitações e acompanhe a ocupação dos espaços.',
    capabilities: [
      'Consultar solicitações e documentos',
      'Aprovar ou rejeitar pedidos',
      'Consultar o histórico de análise',
    ],
    available: true,
  },
  {
    id: 'espacos',
    title: 'Espaços',
    group: 'Operação',
    description: 'Gerencie salas, capacidade, equipamentos e imagens.',
    capabilities: [
      'Cadastrar e editar espaços',
      'Atualizar fotos, capacidade e equipamentos',
      'Ativar ou desativar espaços',
    ],
    available: false,
  },
  {
    id: 'eventos',
    title: 'Eventos',
    group: 'Conteúdo do portal',
    description: 'Organize os eventos e as informações divulgadas no portal.',
    capabilities: [
      'Adicionar e editar eventos',
      'Gerenciar datas, local e programação',
      'Controlar a divulgação no portal',
    ],
    available: false,
  },
  {
    id: 'noticias',
    title: 'Notícias',
    group: 'Conteúdo do portal',
    description: 'Gerencie as notícias e sua publicação.',
    capabilities: [
      'Criar e editar notícias',
      'Gerenciar categorias e imagens',
      'Publicar e retirar notícias de publicação',
    ],
    available: false,
  },
  {
    id: 'parceiros',
    title: 'Parceiros',
    group: 'Conteúdo do portal',
    description: 'Mantenha os parceiros e suas informações atualizados.',
    capabilities: [
      'Cadastrar e editar parceiros',
      'Gerenciar logotipos, links e categorias',
      'Remover cadastros conforme as regras do sistema',
    ],
    available: false,
  },
  {
    id: 'ecossistema',
    title: 'Ecossistema de inovação',
    group: 'Conteúdo do portal',
    description: 'Gerencie os participantes do ecossistema de São Luís.',
    capabilities: [
      'Cadastrar e editar atores do ecossistema',
      'Organizar tipos de participantes e informações de contato',
      'Atualizar informações de localização e apresentação',
    ],
    available: false,
  },
  {
    id: 'editais',
    title: 'Editais',
    group: 'Conteúdo do portal',
    description: 'Organize editais, documentos e prazos de participação.',
    capabilities: ['Adicionar e editar editais', 'Gerenciar documentos e prazos', 'Atualizar a situação dos editais'],
    available: false,
  },
  {
    id: 'oportunidades',
    title: 'Oportunidades',
    group: 'Conteúdo do portal',
    description: 'Divulgue oportunidades para a comunidade de inovação.',
    capabilities: [
      'Cadastrar e editar oportunidades',
      'Organizar categorias e prazos',
      'Atualizar a disponibilidade das oportunidades',
    ],
    available: false,
  },
  {
    id: 'institucional',
    title: 'Conteúdo institucional',
    group: 'Conteúdo do portal',
    description: 'Mantenha a apresentação e as informações institucionais do portal.',
    capabilities: [
      'Gerenciar informações institucionais',
      'Atualizar textos e imagens das páginas',
      'Manter informações públicas do Parque atualizadas',
    ],
    available: false,
  },
  {
    id: 'contatos',
    title: 'Fale conosco',
    group: 'Participação',
    description: 'Acompanhe as mensagens enviadas pelo público.',
    capabilities: [
      'Consultar mensagens e dados de contato',
      'Organizar o acompanhamento dos atendimentos',
      'Acompanhar o envio de notificações conforme a configuração disponível',
    ],
    available: false,
  },
  {
    id: 'ideias',
    title: 'Banco de ideias',
    group: 'Participação',
    description: 'Acompanhe e avalie as propostas enviadas pela comunidade.',
    capabilities: [
      'Consultar propostas',
      'Registrar a avaliação e atualizar a situação',
      'Preservar o histórico das ideias',
    ],
    available: false,
  },
  {
    id: 'usuarios',
    title: 'Usuários e permissões',
    group: 'Acesso',
    description: 'Administre contas e níveis de acesso da plataforma.',
    capabilities: [
      'Consultar e gerenciar usuários',
      'Gerenciar permissões de acesso',
      'Aplicar as regras de preservação de histórico',
    ],
    available: false,
  },
];

export const ADMIN_GROUPS: readonly AdminGroup[] = ['Operação', 'Conteúdo do portal', 'Participação', 'Acesso'];
