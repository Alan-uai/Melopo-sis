export interface ClasseGramatical {
  id: string;
  nome: string;
  descricao: string;
  exemplos: string[];
  regras: RegraGramatical[];
  observacoes?: string;
}

export interface RegraGramatical {
  id: string;
  descricao: string;
  exemplosCertos: string[];
  exemplosErrados: string[];
}

export const SUBSTANTIVO: ClasseGramatical = {
  id: 'substantivo',
  nome: 'Substantivo',
  descricao: 'Classe de palavras que nomeia seres, objetos, fenômenos, lugares, conceitos, sentimentos e ações. Flexiona-se em gênero (masculino/feminino), número (singular/plural) e grau (normal/aumentativo/diminutivo).',
  exemplos: ['casa', 'amor', 'livro', 'coração', 'alegria', 'Brasil', 'multidão', 'caneta', 'menino', 'liberdade'],
  regras: [
    {
      id: 'subst-classificacao',
      descricao: 'Os substantivos classificam-se em: comum (nome genérico), próprio (nome específico), concreto (seres reais ou imaginários), abstrato (qualidades, ações, sentimentos) e coletivo (conjunto de seres).',
      exemplosCertos: ['cidade (comum)', 'São Paulo (próprio)', 'cadeira (concreto)', 'beijo (abstrato)', 'cardume (coletivo)'],
      exemplosErrados: [],
    },
    {
      id: 'subst-genero',
      descricao: 'Flexão de gênero: substantivos biformes têm forma diferente para masculino e feminino (menino/menina). Substantivos uniformes têm a mesma forma (o/a estudante, o/a artista). Sobrecomuns têm um só gênero (a criança, o indivíduo).',
      exemplosCertos: ['menino/menina', 'gato/gata', 'professor/professora', 'o estudante/a estudante', 'a vítima (sempre feminino)'],
      exemplosErrados: ['menino/meninao', 'professor/professore'],
    },
    {
      id: 'subst-numero',
      descricao: 'Flexão de número: plural regular forma-se com -s (casa/casas). Plural de palavras terminadas em -r, -z, -n: acrescenta -es (mar/mares, raiz/raízes). Plural de palavras terminadas em -m: troca -m por -ns (homem/homens). Plural de oxítonas em -al, -el, -ol, -ul: troca -l por -is (animal/animais). Plural de paroxítonas em -l: troca -l por -is (fácil/fáceis). Plural de palavras em -ão: três formas possíveis.',
      exemplosCertos: ['casa/casas', 'mar/mares', 'raiz/raízes', 'homem/homens', 'animal/animais', 'fácil/fáceis', 'pão/pães', 'mão/mãos', 'coração/corações'],
      exemplosErrados: ['casa/casas (s regular)', 'mar/mars', 'raiz/raizes (falta acento)'],
    },
    {
      id: 'subst-grau',
      descricao: 'Grau do substantivo: normal (casa), aumentativo (casarão, casarola) e diminutivo (casinha, casebre). Os graus podem ser sintéticos (com sufixos) ou analíticos (com adjetivos: casa grande, casa pequena).',
      exemplosCertos: ['casa (normal)', 'casarão (aumentativo)', 'casinha (diminutivo)', 'casa grande (aumentativo analítico)', 'casa pequena (diminutivo analítico)'],
      exemplosErrados: [],
    },
    {
      id: 'subst-coletivos',
      descricao: 'Substantivos coletivos designam conjuntos de seres da mesma espécie. Existem dezenas de coletivos na língua portuguesa.',
      exemplosCertos: [
        'alcateia (lobos)', 'cardume (peixes)', 'multidão (pessoas)',
        'enxame (abelhas)', 'manada (bovinos)', 'matilha (cães)',
        'tropa (animais de carga)', 'ninhada (filhotes)', 'bando (aves)',
        'cáfila (camelos)', 'rebanho (ovelhas)', 'vara (porcos)',
        'frota (navios/veículos)', 'esquadrilha (aeronaves)', 'legião (soldados)',
        'arquipélago (ilhas)', 'constelação (estrelas)', 'resma (papéis)',
        'pilha (objetos empilhados)', 'cacho (uvas/frutas)', 'ramalhete (flores)',
        'choldra (gentalha)', 'corja (malandros)', 'tropa (soldados)',
        'tribo (índios)', 'colônia (imigrantes/formigas)', 'caravana (viajantes)',
        'comitiva (acompanhantes)', 'delegação (representantes)', 'elenco (atores)',
        'equipe (jogadores)', 'júri (jurados)', 'orquestra (músicos)',
        'turma (alunos)', 'geração (descendentes)', 'fila (pessoas em linha)',
        'série (coleção)', 'sequência (eventos)', 'súcia (pessoas desonestas)',
        'cáfila (camelos)', 'coalizão (partidos)', 'congregação (fiéis)',
        'conselho (membros)', 'corporação (profissionais)', 'falange (soldados)',
        'flotilha (navios pequenos)', 'horda (invasores)', 'milícia (civis armados)',
        'pelotão (soldados)', 'plantel (jogadores)', 'praça (soldados)',
        'batalhão (soldados)', 'esquadrão (cavalaria)', 'regimento (soldados)',
      ],
      exemplosErrados: [],
    },
  ],
};

export const ARTIGO: ClasseGramatical = {
  id: 'artigo',
  nome: 'Artigo',
  descricao: 'Palavra que antecede o substantivo para determiná-lo (definido) ou indeterminá-lo (indefinido). Os artigos definidos são o, a, os, as; os indefinidos são um, uma, uns, umas.',
  exemplos: ['o livro', 'a casa', 'os amigos', 'as flores', 'um menino', 'uma ideia', 'uns cadernos', 'umas canetas'],
  regras: [
    {
      id: 'artigo-definido',
      descricao: 'Artigos definidos (o, a, os, as) indicam ser conhecido do interlocutor ou já mencionado no discurso.',
      exemplosCertos: ['O livro está na mesa.', 'A casa é bonita.', 'Os amigos chegaram.', 'As flores murcharam.'],
      exemplosErrados: ['O livro está na mesa. (correto)', 'A casa é bonita. (correto)'],
    },
    {
      id: 'artigo-indefinido',
      descricao: 'Artigos indefinidos (um, uma, uns, umas) indicam ser desconhecido ou mencionado pela primeira vez.',
      exemplosCertos: ['Um menino entrou.', 'Uma ideia surgiu.', 'Uns cadernos sumiram.', 'Umas canetas caíram.'],
      exemplosErrados: [],
    },
    {
      id: 'artigo-contracao',
      descricao: 'Os artigos contraem-se com preposições. As principais contrações são: de+o=do, de+a=da, de+os=dos, de+as=das; em+o=no, em+a=na, em+os=nos, em+as=nas; a+o=ao, a+os=aos, a+a=à (crase), a+as=às; por+o=pelo, por+a=pela, por+os=pelos, por+as=pelas.',
      exemplosCertos: ['Vou ao mercado. (a+o)', 'Estou no quarto. (em+o)', 'O livro do aluno. (de+o)', 'Fui à escola. (a+a crase)', 'Foi pela estrada. (por+a)'],
      exemplosErrados: ['Vou ao mercado. (correto)', 'Estou no quarto. (correto)', 'Fui à escola. (crase correta)'],
    },
    {
      id: 'artigo-contracao-pronome',
      descricao: 'Contrações de preposições com pronomes: de+ele=dele, de+ela=dela, de+eles=deles, de+elas=delas; em+ele=nele, em+ela=nela, em+eles=neles, em+elas=nelas; de+este=deste, de+esta=desta, de+estes=destes, de+estas=destas; em+este=neste, em+esta=nesta, em+estes=nestes, em+estas=nestas; de+esse=desse, de+essa=dessa; em+esse=nesse, em+essa=nessa; de+aquele=daquele, de+aquela=daquela; em+aquele=naquele, em+aquela=naquela; a+aquele=àquele, a+aquela=àquela.',
      exemplosCertos: ['O livro dele está aqui.', 'Neste momento cheguei.', 'Dessa forma faremos.', 'Naquela casa morava.', 'Àquela hora ninguém viu.'],
      exemplosErrados: ['O livro de ele está aqui. (errado)', 'Em este momento cheguei. (errado)'],
    },
    {
      id: 'artigo-uso-crase',
      descricao: 'Crase é a fusão da preposição a com o artigo a/as ou com os pronomes aquele/aquela/aquilo. Usa-se crase antes de palavras femininas determinadas, antes de aquele/aquela/aquilo, e em locuções adverbiais femininas (à noite, à tarde). Não se usa crase antes de palavras masculinas, verbos, pronomes, e expressões de hora com preposição única.',
      exemplosCertos: ['Fui à praia.', 'Vou àquele lugar.', 'Chegarei às cinco horas.', 'À noite voltarei.', 'Comi à moda da casa.'],
      exemplosErrados: ['Fui a praia. (sem crase, sentido genérico)', 'Vou à Brasília. (crase proibida antes de cidade sem artigo)', 'Entreguei à ele. (crase proibida antes de pronome)'],
    },
  ],
};

export const ADJETIVO: ClasseGramatical = {
  id: 'adjetivo',
  nome: 'Adjetivo',
  descricao: 'Classe de palavras que atribui qualidade, característica, estado ou aparência aos substantivos. Flexiona-se em gênero, número e grau para concordar com o substantivo.',
  exemplos: ['bonito', 'inteligente', 'grande', 'alegre', 'triste', 'rápido', 'novo', 'velho', 'feliz', 'poderoso'],
  regras: [
    {
      id: 'adj-concordancia-genero',
      descricao: 'O adjetivo concorda em gênero com o substantivo. Adjetivos biformes têm forma diferente para masculino e feminino (bonito/bonita). Adjetivos uniformes têm a mesma forma (feliz, inteligente, grande).',
      exemplosCertos: ['menino bonito / menina bonita', 'homem inteligente / mulher inteligente', 'cachorro grande / casa grande'],
      exemplosErrados: ['menino bonita', 'menina bonito'],
    },
    {
      id: 'adj-concordancia-numero',
      descricao: 'O adjetivo concorda em número com o substantivo. O plural dos adjetivos segue as mesmas regras dos substantivos.',
      exemplosCertos: ['meninos bonitos', 'meninas bonitas', 'homens felizes', 'casas grandes'],
      exemplosErrados: ['meninos bonito', 'menina bonitas'],
    },
    {
      id: 'adj-comparativo',
      descricao: 'Grau comparativo: igualdade (tão...quanto), superioridade (mais...que/do que), inferioridade (menos...que/do que). Comparativos sintéticos especiais: bom/melhor, mau/pior, grande/maior, pequeno/menor.',
      exemplosCertos: ['Tão bonito quanto.', 'Mais alto que o irmão.', 'Menos rápido do que pensava.', 'Melhor que ontem.', 'Pior do que imaginei.', 'Maior que a casa.'],
      exemplosErrados: ['Mais bom que (errado, usa-se melhor)', 'Mais mau que (errado, usa-se pior)'],
    },
    {
      id: 'adj-superlativo',
      descricao: 'Grau superlativo: absoluto sintético (belíssimo, facílimo, paupérrimo), absoluto analítico (muito belo, muito pobre), relativo de superioridade (o mais belo de todos), relativo de inferioridade (o menos belo de todos).',
      exemplosCertos: ['A menina é belíssima.', 'Ele é muito inteligente.', 'O mais alto da turma.', 'O menos rápido da equipe.', 'Um homem paupérrimo.', 'Uma ideia facílima.'],
      exemplosErrados: ['A menina é muito belíssima. (redundante)', 'Ele é o mais alto de todos. (correto)'],
    },
    {
      id: 'adj-superlativo-irregular',
      descricao: 'Superlativos absolutos sintéticos irregulares: bom/ótimo (boníssimo), mau/péssimo (malíssimo), grande/máximo, pequeno/mínimo, alto/supremo, amigo/amicíssimo, antigo/antiquíssimo, cruel/crudelíssimo, difícil/dificílimo, doce/dulcíssimo, fiel/fidelíssimo, frio/frigidíssimo, geral/generalíssimo, humilde/humílimo, incrível/incredibilíssimo, livre/libérrimo, magnífico/magnificentíssimo, nobre/nobilíssimo, notável/notabilíssimo, pobre/paupérrimo, pulcro/pulquérrimo, sábio/sapientíssimo, sagrado/sacratíssimo, tétrico/tetricíssimo.',
      exemplosCertos: ['ótimo (bom)', 'péssimo (mau)', 'máximo (grande)', 'mínimo (pequeno)', 'libérrimo (livre)', 'nobilíssimo (nobre)', 'paupérrimo (pobre)', 'sapientíssimo (sábio)', 'pulquérrimo (pulcro)'],
      exemplosErrados: ['maiorenhíssimo (inexistente)', 'pequeneneníssimo (coloquial, não erudito)'],
    },
    {
      id: 'adj-locucao-adjetiva',
      descricao: 'Locução adjetiva é a expressão formada por preposição + substantivo que equivale a um adjetivo (de amor=amoroso, de flor=floral, de noite=noturno).',
      exemplosCertos: ['amor de mãe (maternal)', 'luz do sol (solar)', 'noite de lua (lunática/luar)', 'olhos de gato (felinos)', 'coração de pedra (pétreo)'],
      exemplosErrados: [],
    },
  ],
};

export const PRONOME: ClasseGramatical = {
  id: 'pronome',
  nome: 'Pronome',
  descricao: 'Classe de palavras que substitui ou acompanha o substantivo, indicando a pessoa do discurso, posse, lugar, indefinição, interrogacão ou relacão.',
  exemplos: ['eu', 'tu', 'ele', 'meu', 'teu', 'este', 'esse', 'aquele', 'que', 'quem', 'alguém', 'ninguém', 'tudo', 'nada'],
  regras: [
    {
      id: 'pron-pessoais',
      descricao: 'Pronomes pessoais do caso reto (sujeito): eu, tu, ele/ela, nós, vós, eles/elas. Pronomes pessoais oblíquos átonos (complemento): me, te, se, o/a, lhe, nos, vos, os/as, lhes. Pronomes pessoais oblíquos tônicos: mim, ti, si, ele/ela, nós, vós, eles/elas (sempre precedidos de preposição).',
      exemplosCertos: ['Eu cantei.', 'Ele me viu.', 'Entreguei-lhe o livro.', 'Convidei-os para a festa.', 'Falaram de mim.', 'Não gosto de ti.'],
      exemplosErrados: ['Me viu. (ênclise em início de frase no português padrão)', 'Convidei eles. (errado, usa-se os)'],
    },
    {
      id: 'pron-colocacao',
      descricao: 'Colocação pronominal: ênclise (depois do verbo: chamei-o) é a regra geral no português brasileiro formal. Próclise (antes do verbo: o chamei) é usada com palavras atrativas (não, nunca, que, se, quando, etc.). Mesóclise (no meio do verbo, futuro: chamar-lhe-ei) é usada no futuro do presente e pretérito.',
      exemplosCertos: ['Chamei-o para jantar.', 'Não o vi ontem.', 'Nunca me disseram isso.', 'Que Deus te abençoe.', 'Amar-te-ei para sempre.', 'Far-lhe-ei um favor.'],
      exemplosErrados: ['O chamei (em início de frase padrão literário)', 'Não vi-o (atrativo exige próclise)'],
    },
    {
      id: 'pron-possessivos',
      descricao: 'Pronomes possessivos indicam posse: meu(s)/minha(s), teu(s)/tua(s), seu(s)/sua(s), nosso(s)/nossa(s), vosso(s)/vossa(s). Concordam em gênero e número com a coisa possuída, não com o possuidor.',
      exemplosCertos: ['Meu livro está aqui.', 'Minha casa é grande.', 'Nossos amigos chegaram.', 'Tuas palavras foram sábias.', 'Vossa Excelência disse.'],
      exemplosErrados: ['Menino sua (ordem errada)', 'Nossas livros (concordância errada)'],
    },
    {
      id: 'pron-demonstrativos',
      descricao: 'Pronomes demonstrativos indicam posição no espaço/tempo/discurso: este(s)/esta(s)/isto (1ª pessoa, perto de quem fala), esse(s)/essa(s)/isso (2ª pessoa, perto de quem ouve), aquele(s)/aquela(s)/aquilo (3ª pessoa, longe de ambos ou referente anterior).',
      exemplosCertos: ['Este caderno aqui é meu.', 'Esse caderno aí é teu.', 'Aquele caderno lá é dele.', 'Isto é incrível!', 'Isso que você disse é verdade.', 'Aquilo que vimos foi fantástico.'],
      exemplosErrados: ['Essa caneta aqui é minha. (deveria ser esta)', 'Este livro aí é seu. (deveria ser esse)'],
    },
    {
      id: 'pron-interrogativos',
      descricao: 'Pronomes interrogativos: que, quem, qual, quais, quanto(s), quanta(s). Usados em perguntas diretas ou indiretas.',
      exemplosCertos: ['Que horas são?', 'Quem chegou?', 'Qual é o seu nome?', 'Quantos anos você tem?', 'Perguntei quem era ele.', 'Não sei qual escolher.'],
      exemplosErrados: [],
    },
    {
      id: 'pron-relativos',
      descricao: 'Pronomes relativos retomam um termo anterior: que (coisa/pessoa), quem (pessoa), o qual/a qual/os quais/as quais (formal), onde (lugar), cujo(s)/cuja(s) (posse, sem artigo após), quanto(s)/quanta(s) (após tudo/todos).',
      exemplosCertos: ['A casa que comprei.', 'O homem a quem me referi.', 'A cidade onde nasci.', 'O livro cuja capa rasgou.', 'Tudo quanto disse é verdade.'],
      exemplosErrados: ['O homem que eu gosto (deveria ser de quem)', 'A casa cujo a telhado (cujo já inclui posse, sem artigo)'],
    },
    {
      id: 'pron-indefinidos',
      descricao: 'Pronomes indefinidos indicam quantidade ou identidade vaga: algum, nenhum, todo, muito, pouco, vários, tanto, outro, certo, qualquer, cada, alguém, ninguém, tudo, nada, outrem, algo, mais, menos, bastante.',
      exemplosCertos: ['Alguém chamou.', 'Ninguém respondeu.', 'Tudo está bem.', 'Não vi nada.', 'Qualquer pessoa pode.', 'Cada um tem seu destino.', 'Várias pessoas vieram.'],
      exemplosErrados: [],
    },
    {
      id: 'pron-tratamento',
      descricao: 'Pronomes de tratamento: Você (informal), Senhor/Senhora (formal), Vossa Excelência (autoridades), Vossa Senhoria (funcionários públicos), Vossa Majestade (reis), Vossa Alteza (príncipes), Vossa Santidade (papa), Vossa Eminência (cardeais), Vossa Reverendíssima (sacerdotes), Vossa Magnificência (reitores). O verbo concorda com a 3ª pessoa.',
      exemplosCertos: ['Vossa Excelência chegou.', 'Vossa Senhoria está convocado.', 'O senhor pode me ajudar?', 'Vossa Majestade ordenou.'],
      exemplosErrados: ['Vossa Excelência chegastes. (verbo deve ficar na 3ª pessoa)'],
    },
  ],
};

export const VERBO: ClasseGramatical = {
  id: 'verbo',
  nome: 'Verbo',
  descricao: 'Classe de palavras que expressa ação, estado, mudança de estado, fenômeno natural ou processo. Flexiona-se em número, pessoa, modo, tempo, aspecto e voz.',
  exemplos: ['cantar', 'comer', 'partir', 'ser', 'estar', 'ter', 'haver', 'fazer', 'dizer', 'poder'],
  regras: [
    {
      id: 'verb-conjugacao',
      descricao: 'Há três conjugações regulares: 1ª (-ar: cantar), 2ª (-er: comer), 3ª (-ir: partir). Verbos irregulares (ser, estar, ter, ir, vir, pôr, dizer, fazer) não seguem os paradigmas regulares.',
      exemplosCertos: ['cantar: canto, cantas, canta, cantamos, cantais, cantam', 'comer: como, comes, come, comemos, comeis, comem', 'partir: parto, partes, parte, partimos, partis, partem', 'ser: sou, és, é, somos, sois, são'],
      exemplosErrados: [],
    },
    {
      id: 'verb-modos',
      descricao: 'Modos verbais: Indicativo (certeza: canto), Subjuntivo (dúvida/possibilidade: que eu cante), Imperativo (ordem/pedido: canta tu). Formas nominais: Infinitivo (cantar), Gerúndio (cantando), Particípio (cantado).',
      exemplosCertos: ['Indicativo: Eu canto todos os dias.', 'Subjuntivo: Espero que ele cante.', 'Imperativo: Cante agora!', 'Infinitivo: Cantar é bom.', 'Gerúndio: Estou cantando.', 'Particípio: Tenho cantado muito.'],
      exemplosErrados: [],
    },
    {
      id: 'verb-tempos-indicativo',
      descricao: 'Tempos do modo Indicativo: Presente (canto), Pretérito Perfeito (cantei), Pretérito Imperfeito (cantava), Pretérito Mais-que-Perfeito (cantara), Futuro do Presente (cantarei), Futuro do Pretérito (cantaria).',
      exemplosCertos: ['Presente: Eu canto agora.', 'Perfeito: Eu cantei ontem.', 'Imperfeito: Eu cantava sempre.', 'Mais-que-perfeito: Eu cantara quando ele chegou.', 'Futuro presente: Eu cantarei amanhã.', 'Futuro pretérito: Eu cantaria se pudesse.'],
      exemplosErrados: [],
    },
    {
      id: 'verb-tempos-subjuntivo',
      descricao: 'Tempos do modo Subjuntivo: Presente (que eu cante), Pretérito Imperfeito (se eu cantasse), Futuro (quando eu cantar).',
      exemplosCertos: ['Presente: Espero que ele cante.', 'Imperfeito: Se eu cantasse melhor...', 'Futuro: Quando eu cantar na festa...'],
      exemplosErrados: [],
    },
    {
      id: 'verb-auxiliares',
      descricao: 'Verbos auxiliares mais comuns: ter, haver, ser, estar (formam tempos compostos e vozes verbais). Exemplos de uso com particípio: tenho cantado, havia escrito, foi construído, está aberto.',
      exemplosCertos: ['Tenho cantado muito ultimamente.', 'Ele havia escrito a carta.', 'A casa foi construída em 1990.', 'A porta está aberta.'],
      exemplosErrados: [],
    },
    {
      id: 'verb-vozes',
      descricao: 'Vozes verbais: Ativa (sujeito agente: O menino quebrou o vidro), Passiva (sujeito paciente: O vidro foi quebrado pelo menino), Reflexiva (sujeito agente e paciente: O menino cortou-se). A voz passiva pode ser analítica (verbo ser + particípio) ou sintética (verbo + se: Quebrou-se o vidro).',
      exemplosCertos: ['Ativa: O vento derrubou a árvore.', 'Passiva analítica: A árvore foi derrubada pelo vento.', 'Passiva sintética: Derrubou-se a árvore.', 'Reflexiva: Ele se feriu com a faca.'],
      exemplosErrados: [],
    },
    {
      id: 'verb-compostos',
      descricao: 'Tempos compostos formam-se com auxiliar + particípio (tenho cantado, tinha cantado) ou com auxiliar + infinitivo/gerúndio (vou cantar, estou cantando, hei de cantar).',
      exemplosCertos: ['Tenho estudado muito.', 'Ele tinha saído quando cheguei.', 'Vou cantar amanhã.', 'Estamos terminando o trabalho.', 'Hão de chegar em breve.'],
      exemplosErrados: [],
    },
  ],
};

export const ADVERBIO: ClasseGramatical = {
  id: 'adverbio',
  nome: 'Advérbio',
  descricao: 'Palavra invariável que modifica o verbo, o adjetivo ou outro advérbio, acrescentando circunstância de tempo, modo, lugar, intensidade, afirmação, negação, dúvida, ordem ou exclusão.',
  exemplos: ['bem', 'mal', 'muito', 'pouco', 'aqui', 'ali', 'ontem', 'hoje', 'não', 'sim', 'talvez', 'sempre', 'nunca', 'depressa', 'devagar'],
  regras: [
    {
      id: 'adv-intensidade',
      descricao: 'Advérbios de intensidade: muito, pouco, tão, bastante, mais, menos, demais, quão, quanto, quase, apenas, extremamente, demasiadamente.',
      exemplosCertos: ['Estudei muito.', 'Ela é bastante inteligente.', 'Falei pouco.', 'Ele é tão alto quanto o pai.', 'Choveu demais ontem.'],
      exemplosErrados: [],
    },
    {
      id: 'adv-lugar',
      descricao: 'Advérbios de lugar: aqui, ali, lá, acolá, cá, aí, além, aquém, dentro, fora, acima, abaixo, adiante, atrás, perto, longe, debaixo, defronte, através, algures, nenhures, alhures.',
      exemplosCertos: ['O livro está aqui.', 'Morei ali por anos.', 'Vamos lá.', 'Ela está perto.', 'O gato está dentro de casa.'],
      exemplosErrados: [],
    },
    {
      id: 'adv-tempo',
      descricao: 'Advérbios de tempo: hoje, ontem, amanhã, agora, já, logo, tarde, cedo, sempre, nunca, jamais, antes, depois, ainda, brevemente, antigamente, atualmente, imediatamente, frequentemente, raramente, outrora.',
      exemplosCertos: ['Chegarei amanhã.', 'Já terminei o trabalho.', 'Sempre estudei muito.', 'Nunca vi isso antes.', 'Antigamente tudo era melhor.', 'Raramente chove aqui.'],
      exemplosErrados: [],
    },
    {
      id: 'adv-modo',
      descricao: 'Advérbios de modo: bem, mal, assim, depressa, devagar, como, conforme, pior, melhor, e a maioria dos advérbios terminados em -mente (felizmente, rapidamente, calmamente, tristemente, infelizmente).',
      exemplosCertos: ['Ela canta bem.', 'Ele dirige mal.', 'Faça assim.', 'Ande depressa!', 'Felizmente, deu tudo certo.', 'Rapidamente, resolveu o problema.'],
      exemplosErrados: [],
    },
    {
      id: 'adv-negacao',
      descricao: 'Advérbios de negação: não, nunca, jamais, tampouco, nem, de modo algum, de forma nenhuma. Em português, a dupla negação é aceita (não...não, nunca...não).',
      exemplosCertos: ['Não quero ir.', 'Nunca mais voltei.', 'Jamais farei isso.', 'Não vi ninguém.', 'Não disse nada. (dupla negação aceita)'],
      exemplosErrados: [],
    },
    {
      id: 'adv-duvida',
      descricao: 'Advérbios de dúvida: talvez, quiçá, acaso, porventura, decerto, certamente, possivelmente, provavelmente, casualmente.',
      exemplosCertos: ['Talvez ele venha.', 'Quiçá chova hoje.', 'Acaso você viu meu livro?', 'Porventura teria outro?', 'Provavelmente chegarei atrasado.'],
      exemplosErrados: [],
    },
    {
      id: 'adv-locucao',
      descricao: 'Locução adverbial é uma expressão com mais de uma palavra que funciona como advérbio. Exemplos: às vezes, de repente, de manhã, à tarde, à noite, em cima, embaixo, de vez em quando, de modo algum, por acaso, ao lado, em breve, à vontade, de cor, em vão, ao pé, à toa, de propósito.',
      exemplosCertos: ['De repente, tudo mudou.', 'Vou à noite.', 'Às vezes chove.', 'De vez em quando viajo.', 'Fique à vontade.', 'Perdeu o tempo em vão.'],
      exemplosErrados: [],
    },
  ],
};

export const PREPOSICAO: ClasseGramatical = {
  id: 'preposicao',
  nome: 'Preposição',
  descricao: 'Palavra invariável que conecta dois termos, estabelecendo relação de dependência entre eles. O termo regido pela preposição chama-se complemento nominal ou adjunto adverbial.',
  exemplos: ['a', 'ante', 'após', 'até', 'com', 'contra', 'de', 'desde', 'em', 'entre', 'para', 'per', 'perante', 'por', 'sem', 'sob', 'sobre', 'trás'],
  regras: [
    {
      id: 'prep-essenciais',
      descricao: 'Preposições essenciais são as que sempre funcionam como preposição: a, ante, após, até, com, contra, de, desde, em, entre, para, per, perante, por, sem, sob, sobre, trás. Destas, per e trás caíram em desuso no português brasileiro contemporâneo.',
      exemplosCertos: ['Vou a São Paulo.', 'Lutei contra a doença.', 'Falei com o professor.', 'O livro está sobre a mesa.', 'Vivo sem medo.', 'Trabalho para viver.'],
      exemplosErrados: [],
    },
    {
      id: 'prep-acidentais',
      descricao: 'Preposições acidentais são palavras de outras classes gramaticais que ocasionalmente funcionam como preposição: como, conforme, consoante, durante, exceto, feito, menos, mediante, salvo, segundo, senão, tirante, afora, além de.',
      exemplosCertos: ['Fiz como você pediu.', 'Durante a aula, silêncio.', 'Todos exceto ele vieram.', 'Segundo o jornal, choveu muito.', 'Menos eu, todos concordaram.', 'Fiz conforme o combinado.'],
      exemplosErrados: [],
    },
    {
      id: 'prep-locucao',
      descricao: 'Locuções prepositivas são expressões de duas ou mais palavras que terminam em preposição essencial: abaixo de, acima de, acerca de, a fim de, além de, ao lado de, ao redor de, apesar de, através de, com respeito a, de acordo com, em baixo de, em cima de, em frente a, em vez de, graças a, junto a/ de, para baixo de, para cima de, perto de, por baixo de, por cima de, por detrás de, por trás de, a respeito de, em meio a.',
      exemplosCertos: ['Apesar da chuva, saí.', 'De acordo com a lei...', 'Através do túnel.', 'Perto de casa.', 'Graças a Deus.', 'Em vez de estudar, jogou.', 'Acima de tudo, a honestidade.'],
      exemplosErrados: [],
    },
    {
      id: 'prep-valor-relacional',
      descricao: 'Uma mesma preposição pode expressar diferentes relações: causa, companhia, meio, instrumento, matéria, modo, finalidade, lugar, origem, posse, assunto, tempo. A preposição de, por exemplo, pode indicar posse (casa de João), origem (sou de Minas), matéria (copo de vidro), assunto (falei de política), causa (morreu de fome).',
      exemplosCertos: ['Casa de João (posse)', 'Sou de Minas (origem)', 'Copo de vidro (matéria)', 'Morreu de fome (causa)', 'Falei de política (assunto)'],
      exemplosErrados: [],
    },
  ],
};

export const CONJUNCAO: ClasseGramatical = {
  id: 'conjuncao',
  nome: 'Conjunção',
  descricao: 'Palavra invariável que conecta orações ou termos de mesma função sintática, estabelecendo entre eles relação de coordenação ou subordinação.',
  exemplos: ['e', 'nem', 'mas', 'porém', 'ou', 'logo', 'portanto', 'que', 'se', 'como', 'quando', 'porque', 'embora', 'contudo', 'entretanto'],
  regras: [
    {
      id: 'conj-coordenativas',
      descricao: 'Conjunções coordenativas conectam orações ou termos independentes: aditivas (e, nem, não só...mas também), adversativas (mas, porém, contudo, todavia, entretanto, no entanto), alternativas (ou, ou...ou, ora...ora, quer...quer, já...já), conclusivas (logo, portanto, por isso, pois (após verbo), então, assim), explicativas (que, porque, pois (antes do verbo), porquanto).',
      exemplosCertos: ['Estudei e passei. (aditiva)', 'Tentei, mas não consegui. (adversativa)', 'Ou saio agora ou perco o ônibus. (alternativa)', 'Estudei, logo passei. (conclusiva)', 'Vá dormir, que já é tarde. (explicativa)'],
      exemplosErrados: [],
    },
    {
      id: 'conj-subordinativas',
      descricao: 'Conjunções subordinativas introduzem oração dependente (subordinada). Integrantes (que, se) iniciam oração com função de substantivo. Causais (porque, pois, já que, visto que, como). Concessivas (embora, conquanto, mesmo que, ainda que, se bem que). Condicionais (se, caso, contanto que, salvo se, desde que). Comparativas (como, tal qual, assim como, mais...que, menos...que). Conformativas (como, conforme, consoante, segundo). Consecutivas (que, de modo que, de forma que, de sorte que). Finais (para que, a fim de que, porque). Proporcionais (à medida que, à proporção que, quanto mais...mais). Temporais (quando, enquanto, logo que, assim que, mal, sempre que, até que, desde que).',
      exemplosCertos: ['Sei que virás. (integrante)', 'Não fui porque choveu. (causal)', 'Embora chova, irei. (concessiva)', 'Se estudar, passará. (condicional)', 'Fez como eu mandei. (conformativa)', 'Falou tanto que ficou rouco. (consecutiva)', 'Estudei para que passe. (final)', 'À medida que o tempo passa, aprendo. (proporcional)', 'Quando cheguei, ela já tinha saído. (temporal)'],
      exemplosErrados: [],
    },
    {
      id: 'conj-locucao',
      descricao: 'Locuções conjuntivas são expressões com mais de uma palavra que funcionam como conjunção: à medida que, à proporção que, a fim de que, antes que, ainda que, assim que, bem que, contanto que, desde que, de modo que, de sorte que, depois que, logo que, nem que, para que, por mais que, por menos que, se bem que, sem que, sempre que, tal qual, tanto que, tão logo que.',
      exemplosCertos: ['À medida que envelhecemos, aprendemos.', 'Assim que chegar, ligue.', 'Ainda que chova, irei.', 'Desde que estude, passará.', 'Tanto que falou, ninguém ouviu.'],
      exemplosErrados: [],
    },
    {
      id: 'conj-uso-pois',
      descricao: 'A conjunção pois pode ser explicativa (antes do verbo: Pois é, saia) ou conclusiva (após o verbo: É tarde, saia pois). Na norma culta, pois explicativo inicia oração; pois conclusivo vem posposto ao verbo.',
      exemplosCertos: ['Saia, pois está tarde. (explicativo)', 'Está tarde; saia, pois. (conclusivo)'],
      exemplosErrados: [],
    },
  ],
};

export const INTERJEICAO: ClasseGramatical = {
  id: 'interjeicao',
  nome: 'Interjeição',
  descricao: 'Palavra invariável que expressa emoções, sentimentos, sensações ou apelos de forma abrupta e intensa. Geralmente vem seguida de ponto de exclamação.',
  exemplos: ['Ah!', 'Oh!', 'Puxa!', 'Nossa!', 'Ufa!', 'Psiu!', 'Olá!', 'Tchau!', 'Oba!', 'Ai!', 'Ui!', 'Socorro!'],
  regras: [
    {
      id: 'interj-classificacao',
      descricao: 'As interjeições classificam-se pela emoção que expressam: alegria/ contentamento (Ah!, Oh!, Oba!, Eba!, Viva!), dor (Ai!, Ui!), surpresa/ admiração (Nossa!, Caramba!, Puxa!, Céus!, Virgem!, Nossa Senhora!), medo/ socorro (Socorro!, Fogo!, Alerta!, Silêncio!), alívio (Ufa!, Arre!, Ainda bem!), chamamento/ apelo (Psiu!, Olá!, Alô!, Hei!, Oh!), despedida (Tchau!, Adeus!, Até logo!), silêncio (Silêncio!, Psiu!, Caluda!), impaciência (Xii!, Ih!, Puxa!, Ora bolas!), desejo (Oxalá!, Tomara!, Quem me dera!), dúvida (Hum!, Hã!), concordância (Claro!, É!, Pois sim!), repulsa (Fora!, Abaixo!, Chega!, Basta!, Credo!, Cruzes!, Arre!, Irra!), saudação (Salve!, Viva!, Olá!), estímulo (Ânimo!, Coragem!, Força!, Avante!, Adiante!).',
      exemplosCertos: ['Oba! Vamos à praia. (alegria)', 'Ai! Machuquei o dedo. (dor)', 'Nossa! Que susto! (surpresa)', 'Ufa! Finalmente terminei. (alívio)', 'Psiu! A prova vai começar. (chamado)', 'Adeus! Até breve. (despedida)', 'Tomara! Que dê certo. (desejo)', 'Credo! Que nojo. (repulsa)'],
      exemplosErrados: [],
    },
    {
      id: 'interj-locucao',
      descricao: 'Locução interjetiva é a expressão com mais de uma palavra que funciona como interjeição: Meu Deus!, Minha Nossa!, Quem me dera!, Ora bolas!, Pelo amor de Deus!, Valha-me Deus!, Pois é!, É mesmo!, Até que enfim!, Viva a..., Fora daqui!, De jeito nenhum!, Sem falta!',
      exemplosCertos: ['Meu Deus! Que medo.', 'Quem me dera! Poder viajar.', 'Ora bolas! De novo isso?', 'Pelo amor de Deus! Cuidado!', 'Até que enfim! Você chegou.'],
      exemplosErrados: [],
    },
    {
      id: 'interj-onomatopeia',
      descricao: 'Onomatopeias são palavras que imitam sons, frequentemente usadas como interjeições: Tique-taque (relógio), Miau (gato), Au-au (cachorro), Cócóricó (galo), Piu-piu (passarinho), Buá (choro), Nhac (mordida), Tum-tum (batida), Zás (golpe rápido), Pluft (queda leve), Cataploft (queda pesada), Atchim (espirro), Bum (explosão), Ding-dong (campainha), Snif (fungado), Tchibum (mergulho), Vrum (motor).',
      exemplosCertos: ['Tique-taque do relógio.', 'Miau do gato no telhado.', 'Bum! A porta bateu.', 'Atchim! Peguei um resfriado.', 'Tchibum! Ele pulou na piscina.'],
      exemplosErrados: [],
    },
  ],
};

export const NUMERAL: ClasseGramatical = {
  id: 'numeral',
  nome: 'Numeral',
  descricao: 'Palavra que indica quantidade exata, ordem, múltiplo ou fração dos seres. Pode ser substantivado ou funcionar como adjunto adnominal.',
  exemplos: ['um', 'dois', 'primeiro', 'segundo', 'dobro', 'triplo', 'metade', 'terço', 'décimo', 'centésimo'],
  regras: [
    {
      id: 'num-cardinais',
      descricao: 'Cardinais indicam quantidade exata: um, dois, três, quatro, cinco, seis, sete, oito, nove, dez, cem, duzentos, trezentos, mil, milhão. Concordam em gênero com o substantivo apenas um/uma e os compostos de cento (duzentos/duzentas, trezentos/trezentas).',
      exemplosCertos: ['um menino / uma menina', 'duzentos reais / duzentas páginas', 'mil pessoas', 'um milhão de estrelas'],
      exemplosErrados: ['duzentos páginas (deveria ser duzentas)', 'um milhões (plural incorreto do numeral)'],
    },
    {
      id: 'num-ordinais',
      descricao: 'Ordinais indicam ordem ou posição: primeiro, segundo, terceiro, quarto, quinto, sexto, sétimo, oitavo, nono, décimo, centésimo, milésimo. Podem ser abreviados: 1º, 2ª.',
      exemplosCertos: ['primeiro lugar', 'segunda colocada', 'décima vez', '1º andar', '2ª série'],
      exemplosErrados: [],
    },
    {
      id: 'num-multiplicativos',
      descricao: 'Multiplicativos indicam proporção: dobro, triplo, quádruplo, quíntuplo, sêxtuplo, sétuplo, óctuplo, nônuplo, décuplo, cêntuplo. Usam-se tanto como substantivos quanto adjetivos.',
      exemplosCertos: ['Ganhei o dobro.', 'Pagou o triplo do valor.', 'Teve força quíntupla.'],
      exemplosErrados: [],
    },
    {
      id: 'num-fracionarios',
      descricao: 'Fracionários indicam parte de um todo: meio, metade, terço, quarto, quinto, sexto, sétimo, oitavo, nono, décimo, centésimo, milésimo, doze avos, quinze avos. A partir de onze, usam-se numerais cardinais seguidos de avos.',
      exemplosCertos: ['um quarto da população', 'três quintos do total', 'sete doze avos', 'meio litro', 'metade do caminho'],
      exemplosErrados: [],
    },
    {
      id: 'num-coletivos',
      descricao: 'Numerais coletivos indicam conjunto de número exato: dezena (10), dúzia (12), vintena (20), centena (100), cento (100), milhar (1000), milheiro (1000), dezena de milhar (10000).',
      exemplosCertos: ['uma dúzia de ovos', 'uma dezena de pessoas', 'duas centenas de livros', 'um milheiro de tijolos'],
      exemplosErrados: [],
    },
    {
      id: 'num-flexao-genero',
      descricao: 'Flexão de gênero nos numerais: mil/mil (invariável), um/uma, dois/duas, trezentos/trezentas, quatrocentos/ quatrocentas, etc. Os numerais ordinais concordam em gênero e número com o substantivo.',
      exemplosCertos: ['um real / uma moeda', 'duzentos homens / duzentas mulheres', 'o primeiro lugar / a primeira vez', 'os terceiros colocados'],
      exemplosErrados: ['dois mulheres (deveria ser duas)', 'terceira colocados (gênero errado)'],
    },
  ],
};

export const ORACOES: ClasseGramatical = {
  id: 'oracoes',
  nome: 'Orações',
  descricao: 'A oração é a unidade sintática que contém um verbo (explícito ou implícito). As orações podem ser coordenadas (independentes entre si) ou subordinadas (dependentes de outra oração).',
  exemplos: ['O sol nasceu. (oração absoluta)', 'Acordei e tomei café. (coordenadas)', 'Estudo porque quero aprender. (subordinada)'],
  regras: [
    {
      id: 'orac-coordenadas',
      descricao: 'Orações coordenadas são sintaticamente independentes. Classificam-se em: assindéticas (justapostas sem conjunção: Acordei, levantei, saí) e sindéticas (com conjunção coordenativa: aditivas, adversativas, alternativas, conclusivas, explicativas).',
      exemplosCertos: ['Acordei, tomei banho, comi, saí. (assindéticas)', 'Estudei e passei. (aditiva sindética)', 'Tentei, mas não consegui. (adversativa)', 'Ou estudas ou trabalhas. (alternativa)', 'Estudei, logo passei. (conclusiva)', 'Vai dormir, que já é tarde. (explicativa)'],
      exemplosErrados: [],
    },
    {
      id: 'orac-subordinadas-substantivas',
      descricao: 'Orações subordinadas substantivas exercem função de substantivo: subjetiva (sujeito: É importante que estude), objetiva direta (objeto direto: Quero que venhas), objetiva indireta (objeto indireto: Lembro-me de que estudávamos), completiva nominal (complemento nominal: Tenho medo de que chova), predicativa (predicativo: Meu desejo é que passes), apositiva (aposto: Só quero isto: que sejas feliz).',
      exemplosCertos: ['É necessário que você estude. (subjetiva)', 'Quero que você venha. (objetiva direta)', 'Lembrei-me de que é tarde. (objetiva indireta)', 'Tenho medo de que não volte. (completiva nominal)', 'Meu sonho é que sejas feliz. (predicativa)', 'Desejo apenas isto: que passes. (apositiva)'],
      exemplosErrados: [],
    },
    {
      id: 'orac-subordinadas-adjetivas',
      descricao: 'Orações subordinadas adjetivas exercem função de adjetivo (adjunto adnominal). Podem ser restritivas (restringem o sentido: Os alunos que estudam passam) ou explicativas (explicam/ acrescentam: Os alunos, que estudam, passarão).',
      exemplosCertos: ['O livro que li é ótimo. (restritiva)', 'Meu pai, que é médico, chegou. (explicativa)', 'Conheço a cidade onde nasci. (restritiva)', 'Deus, que é misericordioso, perdoa. (explicativa)'],
      exemplosErrados: [],
    },
    {
      id: 'orac-subordinadas-adverbiais',
      descricao: 'Orações subordinadas adverbiais exercem função de adjunto adverbial. Classificam-se em: causais (porque, já que, como), consecutivas (que, de modo que, tão...que), condicionais (se, caso), concessivas (embora, ainda que), comparativas (como, tal qual, mais...que), conformativas (como, conforme, segundo), finais (para que, a fim de que), proporcionais (à medida que, quanto mais...mais), temporais (quando, enquanto, logo que).',
      exemplosCertos: ['Não fui porque chovia. (causal)', 'Falou tanto que ficou rouco. (consecutiva)', 'Se estudar, passará. (condicional)', 'Embora chova, irei. (concessiva)', 'Faz como o pai faz. (comparativa)', 'Conforme disse, farei. (conformativa)', 'Estudo para que aprenda. (final)', 'À medida que envelheço, aprendo. (proporcional)', 'Quando cheguei, ela saiu. (temporal)'],
      exemplosErrados: [],
    },
    {
      id: 'orac-reduzidas',
      descricao: 'Orações reduzidas são as que não são introduzidas por conjunção e têm o verbo numa forma nominal (infinitivo, gerúndio, particípio): Ao chegar em casa, dormi. (infinitivo reduzida temporal), Andando pela rua, encontrei-a. (gerúndio reduzida temporal), Terminada a aula, fomos embora. (particípio reduzida temporal).',
      exemplosCertos: ['Ao sair, feche a porta. (infinitivo reduzida temporal)', 'Chegando o verão, viajaremos. (gerúndio reduzida condicional)', 'Feito o trabalho, descansamos. (particípio reduzida temporal)', 'Tenho de estudar. (infinitivo reduzida objetiva direta)'],
      exemplosErrados: [],
    },
  ],
};

export const CONCORDANCIA: ClasseGramatical = {
  id: 'concordancia',
  nome: 'Concordância',
  descricao: 'A concordância é a harmonia flexional entre termos da oração. Divide-se em concordância nominal (artigo, adjetivo, numeral, pronome com o substantivo) e verbal (verbo com o sujeito).',
  exemplos: ['As casas bonitas (nominal)', 'Os meninos estudam (verbal)', 'A maioria dos alunos estudou (verbal)'],
  regras: [
    {
      id: 'conc-nominal-artigo',
      descricao: 'O artigo concorda em gênero e número com o substantivo que acompanha.',
      exemplosCertos: ['o menino', 'a menina', 'os livros', 'as casas', 'um carro', 'umas flores'],
      exemplosErrados: ['o menina', 'a menino', 'os livro', 'as casa'],
    },
    {
      id: 'conc-nominal-adjetivo',
      descricao: 'O adjetivo concorda em gênero e número com o substantivo a que se refere. Quando o adjetivo se refere a dois ou mais substantivos, pode concordar com o mais próximo ou ir para o plural masculino (se houver masculino).',
      exemplosCertos: ['casa bonita', 'meninos estudiosos', 'casa e apartamento novo (ou novos)', 'homem e mulher bonitos', 'roupa e sapato caros'],
      exemplosErrados: ['casa bonito', 'meninos estudiosas', 'homem e mulher bonitos (plural masculino)'],
    },
    {
      id: 'conc-nominal-numeral',
      descricao: 'Os numerais cardinais um/uma concordam com o substantivo. Os ordinais e fracionários também concordam.',
      exemplosCertos: ['um livro / uma caneta', 'primeiro lugar / primeira vez', 'dois terços da população / duas terças partes'],
      exemplosErrados: ['uma livro', 'um caneta'],
    },
    {
      id: 'conc-verbal-simples',
      descricao: 'O verbo concorda com o sujeito simples em número e pessoa.',
      exemplosCertos: ['O menino estuda.', 'Os meninos estudam.', 'Eu canto.', 'Nós cantamos.', 'A casa foi vendida.', 'As casas foram vendidas.'],
      exemplosErrados: ['O menino estudam.', 'Os meninos estuda.'],
    },
    {
      id: 'conc-verbal-composto',
      descricao: 'Com sujeito composto anteposto ao verbo, o verbo vai para o plural. Com sujeito composto posposto, o verbo pode concordar com o mais próximo ou ir para o plural.',
      exemplosCertos: ['O pai e a mãe chegaram.', 'Chegou o pai e a mãe. (ou chegaram)', 'O amor e a dor andam juntos.', 'O menino, a menina e o cão saíram.'],
      exemplosErrados: ['O pai e a mãe chegou. (plural obrigatório)'],
    },
    {
      id: 'conc-verbal-coletivo',
      descricao: 'Com sujeito coletivo (multidão, grupo, maioria) no singular, o verbo fica no singular. Pode-se usar o plural se o especificador estiver no plural (a maioria dos alunos estudou ou estudaram).',
      exemplosCertos: ['A multidão gritou.', 'O grupo saiu.', 'A maioria dos alunos estudou. (ou estudaram)', 'Grande parte das pessoas veio. (ou vieram)'],
      exemplosErrados: ['A multidão gritaram. (singular é preferível)'],
    },
    {
      id: 'conc-verbal-porcentagem',
      descricao: 'Com sujeito expresso por porcentagem seguida de especificador, o verbo concorda com o numeral ou com o especificador (20% dos alunos aprovaram ou 20% dos alunos aprovou). Sem especificador, o verbo fica no singular (20% aprova).',
      exemplosCertos: ['20% dos alunos aprovaram. (ou aprovou)', '1% dos candidatos desistiu.', '50% da população sofre.', 'Aprova 20% da turma.'],
      exemplosErrados: [],
    },
    {
      id: 'conc-verbal-que',
      descricao: 'Com o pronome relativo que, o verbo concorda com o antecedente do pronome.',
      exemplosCertos: ['Fui eu que fiz.', 'Foste tu que fizeste.', 'Fomos nós que fizemos.', 'São eles que fazem.'],
      exemplosErrados: ['Fui eu que fizeste. (verbo deve concordar com eu)'],
    },
    {
      id: 'conc-verbal-um-dos-que',
      descricao: 'Na expressão um dos que, o verbo pode ficar no singular ou no plural (um dos alunos que estudou ou um dos alunos que estudaram). O plural é mais aceito formalmente.',
      exemplosCertos: ['Ele é um dos que mais estudaram. (ou estudou)', 'Foi um dos que chegaram cedo.'],
      exemplosErrados: [],
    },
    {
      id: 'conc-verbal-haver',
      descricao: 'O verbo haver no sentido de existir ou ocorrer é impessoal (fica no singular). O verbo haver como auxiliar flexiona-se normalmente.',
      exemplosCertos: ['Há pessoas na sala.', 'Houve muitos problemas.', 'Havia três opções.', 'Haverá festas amanhã.', 'Ele havia saído. (auxiliar)'],
      exemplosErrados: ['Haviam pessoas na sala. (impessoal)', 'Houve muitos problemas. (correto)'],
    },
    {
      id: 'conc-verbal-fazer',
      descricao: 'O verbo fazer indicando tempo decorrido ou fenômeno climático é impessoal (fica sempre no singular).',
      exemplosCertos: ['Faz dois anos que estudo.', 'Fazia muito calor ontem.', 'Fez dez dias que viajei.', 'Vai fazer três meses.'],
      exemplosErrados: ['Fazem dois anos que estudo. (impessoal)'],
    },
    {
      id: 'conc-casos-especiais',
      descricao: 'Casos especiais de concordância nominal: "É proibido entrada" (invariável sem artigo, variável com artigo: "É proibida a entrada"), "É necessário paciência" (invariável), "É bom cerveja gelada" (invariável), "Seguem anexos os documentos" (variável, exceto "em anexo" que é invariável), "Menos" é invariável (menos pessoas), "Alerta" é invariável (eles estão alerta), "Quite" é variável (ele está quite/ela está quite), "Obrigado" concorda com o emissor (homem: obrigado / mulher: obrigada), "Muito obrigado" segue mesma regra, "Mesmo" e "próprio" concordam com o sujeito (elas mesmas viram / elas próprias disseram).',
      exemplosCertos: ['É proibido entrada. / É proibida a entrada.', 'É necessário paciência.', 'É bom cerveja gelada.', 'Seguem anexos os documentos. / Segue em anexo o documento.', 'Há menos pessoas hoje.', 'Eles estão alerta.', 'Obrigado disse o homem. / Obrigada disse a mulher.', 'Elas mesmas fizeram.'],
      exemplosErrados: ['É proibido a entrada. (com artigo, exige concordância)', 'Seguem anexo os documentos. (anexo deve concordar)'],
    },
    {
      id: 'conc-verbal-sujeito-oracional',
      descricao: 'Quando o sujeito é uma oração subordinada substantiva, o verbo fica na 3ª pessoa do singular.',
      exemplosCertos: ['É necessário que estudes.', 'Importa que venhas cedo.', 'Acontece que todos foram.'],
      exemplosErrados: ['São necessário que estudes. (verbo no singular)'],
    },
    {
      id: 'conc-nominal-adjetivo-composto',
      descricao: 'Nos adjetivos compostos, apenas o último elemento concorda em gênero e número com o substantivo (camisas verde-claras, olhos castanho-escuros). Exceção: os adjetivos compostos de cor com elemento invariável (blusas azul-marinho, paredes amarelo-ouro) são invariáveis.',
      exemplosCertos: ['camisas verde-claras', 'olhos castanho-escuros', 'blusas azul-marinho', 'paredes amarelo-ouro', 'crianças surdas-mudas'],
      exemplosErrados: ['camisas verdes-claras (só o último flexiona)', 'blusas azuis-marinho (elemento invariável)'],
    },
  ],
};

export const CLASSES_GRAMATICAIS: ClasseGramatical[] = [
  SUBSTANTIVO,
  ARTIGO,
  ADJETIVO,
  PRONOME,
  VERBO,
  ADVERBIO,
  PREPOSICAO,
  CONJUNCAO,
  INTERJEICAO,
  NUMERAL,
  ORACOES,
  CONCORDANCIA,
];
