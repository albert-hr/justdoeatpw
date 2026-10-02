// Catálogo de restaurantes e cardápios exibidos no site.
// Cada restaurante tem sua view em views/ (campo "view") e o cardápio é carregado daqui pela API.

const IMG = {
  lanche: '/images/icons/lanche_icon.png',
  marmita: '/images/icons/marmita_icon.png',
  bebida: '/images/icons/bebida_icon.png'
};

const RESTAURANTS = [
  {
    slug: 'mcdonalds',
    view: 'mcdonalds.html',
    nome: "McDonald's",
    unidade: 'Ferraz de Vasconcelos',
    categoria: 'comidas',
    tipo: 'Lanches',
    distanciaKm: 1.5,
    tempo: '15-24 min',
    taxaEntrega: 6.99,
    avaliacao: 4.9,
    numAvaliacoes: 159,
    descricao: 'Hambúrgueres icônicos, batatas crocantes e o sabor clássico que todo mundo ama.',
    logo: { texto: 'M', bg: '#E60000', fg: '#FFC72C', tamanho: 'xl' },
    cardapio: [
      {
        secao: 'Combos',
        itens: [
          { id: 'mc-mcoferta-brasil', nome: 'McOferta Brasil', descricao: 'Pão brioche, dois hambúrgueres, molho sabor vinagrete, farofa defumada, cebola, tomate, bacon, molho churrasco, queijo, acompanhamento e bebida.', preco: 54.9, imagem: IMG.lanche },
          { id: 'mc-alemanha-mcflurry', nome: 'McOferta Alemanha + McFlurry Brasil', descricao: 'Sanduíche Alemanha, acompanhamento, bebida de sua preferência e McFlurry Brasil.', preco: 74.8, imagem: IMG.lanche },
          { id: 'mc-combo-galaxy', nome: 'McCombo Galaxy + Sobremesa', descricao: 'McOferta com opções de sanduíche, caixinha com três molhos especiais e sobremesa de sua preferência.', preco: 62.4, imagem: IMG.lanche }
        ]
      },
      {
        secao: 'Bebidas',
        itens: [
          { id: 'mc-refrigerante-500', nome: 'Refrigerante 500 ml', descricao: 'Coca-Cola, Guaraná ou Fanta Laranja bem gelados.', preco: 11.9, imagem: IMG.bebida }
        ]
      }
    ]
  },
  {
    slug: 'burgerking',
    view: 'burgerking.html',
    nome: 'Burger King',
    unidade: 'Centro',
    categoria: 'comidas',
    tipo: 'Lanches',
    distanciaKm: 2.1,
    tempo: '16-25 min',
    taxaEntrega: 5.99,
    avaliacao: 4.8,
    numAvaliacoes: 118,
    descricao: 'Sabor grelhado no fogo de verdade, com combos generosos para matar a fome.',
    logo: { texto: 'BURGER KING', bg: '#F4EBE1', fg: '#D72300', tamanho: 'md' },
    cardapio: [
      {
        secao: 'Combos',
        itens: [
          { id: 'bk-combo-whopper', nome: 'Combo Whopper', descricao: 'Pão com gergelim, carne grelhada, queijo, salada, molho especial, batata e bebida.', preco: 42.9, imagem: IMG.lanche },
          { id: 'bk-mega-stacker', nome: 'Mega Stacker', descricao: 'Camadas de carne, queijo e molho stacker para quem quer um lanche reforçado.', preco: 49.9, imagem: IMG.lanche }
        ]
      },
      {
        secao: 'Acompanhamentos',
        itens: [
          { id: 'bk-refil-batata', nome: 'Refil + Batata Suprema', descricao: 'Bebida gelada e batata com cheddar e bacon para acompanhar seu pedido.', preco: 24.9, imagem: IMG.bebida }
        ]
      }
    ]
  },
  {
    slug: 'starbucks',
    view: 'starbucks.html',
    nome: 'Starbucks',
    unidade: 'Shopping',
    categoria: 'bebidas',
    tipo: 'Cafés',
    distanciaKm: 3.6,
    tempo: '27-37 min',
    taxaEntrega: 8.99,
    avaliacao: 4.7,
    numAvaliacoes: 96,
    descricao: 'Cafés especiais, bebidas quentes, geladas e doces para acompanhar.',
    logo: { texto: 'STARBUCKS', bg: '#006241', fg: '#FFFFFF', tamanho: 'sm' },
    cardapio: [
      {
        secao: 'Bebidas',
        itens: [
          { id: 'sb-caramel-macchiato', nome: 'Caramel Macchiato', descricao: 'Espresso, leite vaporizado, baunilha e calda de caramelo.', preco: 25.9, imagem: IMG.bebida },
          { id: 'sb-frappuccino-chocolate', nome: 'Frappuccino Chocolate', descricao: 'Bebida cremosa gelada com chocolate, chantilly e calda.', preco: 29.9, imagem: IMG.bebida }
        ]
      },
      {
        secao: 'Doces',
        itens: [
          { id: 'sb-cookie-baunilha', nome: 'Cookie Baunilha', descricao: 'Cookie macio com gotas de chocolate para acompanhar seu café.', preco: 12.9, imagem: IMG.marmita }
        ]
      }
    ]
  },
  {
    slug: 'outback',
    view: 'outback.html',
    nome: 'Outback',
    unidade: 'Vila Gourmet',
    categoria: 'comidas',
    tipo: 'Pratos',
    distanciaKm: 3.7,
    tempo: '20-30 min',
    taxaEntrega: 12,
    avaliacao: 4.7,
    numAvaliacoes: 142,
    descricao: 'Carnes suculentas, porções marcantes e pratos inspirados no sabor australiano.',
    logo: { texto: 'OUTBACK', bg: '#F4EBE1', fg: '#8C1D11', tamanho: 'md' },
    cardapio: [
      {
        secao: 'Pratos',
        itens: [
          { id: 'ob-bloomin-onion', nome: "Bloomin' Onion", descricao: 'Cebola gigante empanada com molho especial para dividir.', preco: 59.9, imagem: IMG.marmita },
          { id: 'ob-ribs', nome: 'Ribs on the Barbie', descricao: 'Costela suculenta com molho barbecue e acompanhamento.', preco: 89.9, imagem: IMG.marmita }
        ]
      },
      {
        secao: 'Bebidas',
        itens: [
          { id: 'ob-cha-gelado', nome: 'Chá Gelado Outback', descricao: 'Bebida refrescante para acompanhar os pratos da casa.', preco: 14.9, imagem: IMG.bebida }
        ]
      }
    ]
  },
  {
    slug: 'habibs',
    view: 'habibs.html',
    nome: "Habib's",
    unidade: 'Ferraz',
    categoria: 'comidas',
    tipo: 'Árabe',
    distanciaKm: 8.6,
    tempo: '10-14 min',
    taxaEntrega: 3.99,
    avaliacao: 4.3,
    numAvaliacoes: 203,
    descricao: 'Esfihas, beirutes, kibes e opções para dividir com toda a família.',
    logo: { texto: "HABIB'S", bg: '#E60000', fg: '#FFFFFF', tamanho: 'md' },
    cardapio: [
      {
        secao: 'Árabes',
        itens: [
          { id: 'hb-combo-esfihas', nome: 'Combo Esfihas', descricao: 'Seis esfihas sortidas de carne, queijo e frango para compartilhar.', preco: 34.9, imagem: IMG.marmita },
          { id: 'hb-beirute', nome: 'Beirute Clássico', descricao: 'Pão sírio, rosbife, queijo, alface, tomate e molho especial.', preco: 31.9, imagem: IMG.lanche }
        ]
      },
      {
        secao: 'Bebidas',
        itens: [
          { id: 'hb-suco-natural', nome: 'Suco Natural', descricao: 'Suco gelado de fruta para acompanhar seu pedido.', preco: 11.9, imagem: IMG.bebida }
        ]
      }
    ]
  },
  {
    // Restaurante da conta de demonstração (contato@sabordavila.com.br)
    slug: 'sabor-da-vila',
    view: 'sabordavila.html',
    nome: 'Sabor da Vila',
    unidade: 'Vila Romanópolis',
    categoria: 'comidas',
    tipo: 'Lanches e marmitas',
    distanciaKm: 0.9,
    tempo: '20-30 min',
    taxaEntrega: 4.5,
    avaliacao: 4.6,
    numAvaliacoes: 37,
    descricao: 'Lanches caprichados e marmitas caseiras feitas no bairro, do jeito de casa.',
    logo: { texto: 'SABOR DA VILA', bg: '#333333', fg: '#FFFFFF', tamanho: 'sm' },
    cardapio: [
      {
        secao: 'Lanches',
        itens: [
          { id: 'sv-x-salada', nome: 'X-Salada', descricao: 'Hambúrguer artesanal, queijo, alface, tomate e maionese da casa.', preco: 22, imagem: IMG.lanche },
          { id: 'sv-x-tudo', nome: 'X-Tudo', descricao: 'Hambúrguer, ovo, bacon, presunto, queijo, salada e batata palha.', preco: 29.5, imagem: IMG.lanche },
          { id: 'sv-x-bacon', nome: 'X-Bacon', descricao: 'Hambúrguer artesanal com bastante bacon crocante e queijo.', preco: 26, imagem: IMG.lanche }
        ]
      },
      {
        secao: 'Marmitas',
        itens: [
          { id: 'sv-marmita-frango', nome: 'Marmita de Frango Grelhado', descricao: 'Arroz, feijão, frango grelhado, legumes e salada.', preco: 24.9, imagem: IMG.marmita }
        ]
      },
      {
        secao: 'Bebidas',
        itens: [
          { id: 'sv-refri-lata', nome: 'Refrigerante lata', descricao: 'Lata 350 ml, sabores variados.', preco: 6, imagem: IMG.bebida }
        ]
      }
    ]
  }
];

const CATEGORIES = {
  comidas: 'Comidas',
  bebidas: 'Bebidas'
};

function normalizeText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function listRestaurants({ categoria, q } = {}) {
  const query = normalizeText(q).trim();
  return RESTAURANTS.filter((restaurant) => {
    if (categoria && CATEGORIES[categoria] && restaurant.categoria !== categoria) return false;
    if (!query) return true;
    const pratos = restaurant.cardapio.flatMap((secao) => secao.itens.map((item) => item.nome)).join(' ');
    return normalizeText(`${restaurant.nome} ${restaurant.tipo} ${restaurant.descricao} ${pratos}`).includes(query);
  });
}

function findRestaurant(slug) {
  return RESTAURANTS.find((restaurant) => restaurant.slug === slug) || null;
}

// Procura um item do cardápio pelo id e devolve junto o restaurante dono dele.
function findMenuItem(itemId) {
  for (const restaurant of RESTAURANTS) {
    for (const secao of restaurant.cardapio) {
      const item = secao.itens.find((candidate) => candidate.id === itemId);
      if (item) return { item, restaurant };
    }
  }
  return null;
}

function topRestaurants(limit = 4) {
  return [...RESTAURANTS].sort((a, b) => b.avaliacao - a.avaliacao).slice(0, limit);
}

module.exports = { CATEGORIES, findMenuItem, findRestaurant, listRestaurants, RESTAURANTS, topRestaurants };
