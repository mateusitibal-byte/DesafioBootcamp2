// script.js — Nomes do Brasil
// Consome a API de Nomes do IBGE (Censo 2010): https://servicodados.ibge.gov.br/api/docs/nomes

const API_BASE = "https://servicodados.ibge.gov.br/api/v2/censos/nomes";

// ===== Supabase (banco de dados dos favoritos) =====
// Cole aqui os dados de Project Settings → API do seu projeto Supabase.
// A chave "publishable" é feita para ficar no frontend; quem protege a tabela são as políticas (RLS).
const SUPABASE_URL = "https://hhrntlmnwtyziaocmgxm.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_kW3C0XYkQ_lSbR2RCpGnYQ_zu55l1zg";

let db = null;
try {
  db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (erro) {
  console.error("Supabase não configurado:", erro);
}

// Guarda o último nome pesquisado, para o botão "Favoritar" saber o que salvar
let ultimoResultado = null;

// Códigos IBGE das unidades da federação -> nome do estado
const ESTADOS = {
  11: "Rondônia", 12: "Acre", 13: "Amazonas", 14: "Roraima", 15: "Pará",
  16: "Amapá", 17: "Tocantins", 21: "Maranhão", 22: "Piauí", 23: "Ceará",
  24: "Rio Grande do Norte", 25: "Paraíba", 26: "Pernambuco", 27: "Alagoas",
  28: "Sergipe", 29: "Bahia", 31: "Minas Gerais", 32: "Espírito Santo",
  33: "Rio de Janeiro", 35: "São Paulo", 41: "Paraná", 42: "Santa Catarina",
  43: "Rio Grande do Sul", 50: "Mato Grosso do Sul", 51: "Mato Grosso",
  52: "Goiás", 53: "Distrito Federal"
};

const formatar = (n) => n.toLocaleString("pt-BR");

// Remove acentos e espaços extras: "  João " -> "joao"
function normalizarNome(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

// Transforma o período da API em um rótulo legível: "[1950,1960[" -> "1950s"
function rotuloPeriodo(periodo) {
  const anos = periodo.match(/\d{4}/g) || [];
  if (anos.length === 1) return "até " + anos[0];
  return anos[0] + "s";
}

// Faz uma requisição e devolve o JSON (lança erro se a resposta não for OK)
async function buscarJSON(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error("Erro HTTP " + resposta.status);
  return resposta.json();
}

// Soma a frequência de todas as décadas de uma resposta da API
function somarFrequencia(dados) {
  if (!Array.isArray(dados) || dados.length === 0) return 0;
  return dados[0].res.reduce((total, item) => total + item.frequencia, 0);
}

async function buscarNome(nomeDigitado) {
  const area = document.getElementById("resultado");
  const botao = document.getElementById("botao-buscar");
  const nome = normalizarNome(nomeDigitado);

  // Validação: a API só aceita um único primeiro nome, só com letras
  if (!/^[a-z]+$/.test(nome)) {
    area.innerHTML = `<div class="mensagem-erro">Digite apenas <strong>um primeiro nome</strong>, só com letras (ex.: "Ana", não "Ana Clara").</div>`;
    return;
  }

  area.innerHTML = `<p class="carregando">Consultando o Censo...</p>`;
  botao.disabled = true;

  try {
    const nomeURL = encodeURIComponent(nome);

    // Quatro requisições em paralelo: total por década, feminino, masculino e por estado
    const [geral, feminino, masculino, porEstado] = await Promise.all([
      buscarJSON(`${API_BASE}/${nomeURL}`),
      buscarJSON(`${API_BASE}/${nomeURL}?sexo=F`),
      buscarJSON(`${API_BASE}/${nomeURL}?sexo=M`),
      buscarJSON(`${API_BASE}/${nomeURL}?groupBy=UF`).catch(() => []) // opcional: se falhar, segue sem
    ]);

    // A API devolve [] quando o nome não existe na base
    if (!Array.isArray(geral) || geral.length === 0) {
      area.innerHTML = `
        <div class="mensagem-erro">
          Não encontramos <strong>"${nomeDigitado.trim()}"</strong> no Censo.<br>
          O IBGE só lista nomes com pelo menos 20 registros no país. Tente outro nome!
        </div>`;
      return;
    }

    mostrarResultado(geral[0], somarFrequencia(feminino), somarFrequencia(masculino), porEstado);
  } catch (erro) {
    console.error(erro);
    area.innerHTML = `
      <div class="mensagem-erro">
        Ops! Não foi possível falar com a API do IBGE agora.<br>
        Verifique sua conexão e tente de novo em instantes.
      </div>`;
  } finally {
    botao.disabled = false;
  }
}

function mostrarResultado(dados, totalFem, totalMasc, porEstado) {
  const area = document.getElementById("resultado");
  const decadas = dados.res;
  const total = decadas.reduce((soma, d) => soma + d.frequencia, 0);
  const pico = decadas.reduce((maior, d) => (d.frequencia > maior.frequencia ? d : maior));
  const nomeExibido = dados.nome.charAt(0) + dados.nome.slice(1).toLowerCase();

  // Gráfico de barras: cada década com largura proporcional ao pico
  const barras = decadas.map((d) => {
    const largura = (d.frequencia / pico.frequencia) * 100;
    const classe = d === pico ? "barra pico" : "barra";
    return `
      <div class="linha-grafico">
        <span>${rotuloPeriodo(d.periodo)}</span>
        <div class="barra-fundo"><div class="${classe}" style="width:${largura}%"></div></div>
        <span class="valor">${formatar(d.frequencia)}</span>
      </div>`;
  }).join("");

  ultimoResultado = {
    nome: nomeExibido,
    extra: `${formatar(total)} pessoas · pico nos ${rotuloPeriodo(pico.periodo)}`
  };

  area.innerHTML = `
    <article class="cartao">
      <div class="cabecalho-resultado">
        <h2>${nomeExibido}</h2>
        <button type="button" id="botao-favoritar" class="botao-favoritar">☆ Favoritar</button>
      </div>
      <p class="subtitulo">Pessoas registradas com esse nome no Censo 2010</p>
      <div class="numeros">
        <div class="numero"><strong>${formatar(total)}</strong><span>pessoas no Brasil</span></div>
        <div class="numero"><strong>${rotuloPeriodo(pico.periodo)}</strong><span>década de maior popularidade</span></div>
        <div class="numero"><strong>${formatar(pico.frequencia)}</strong><span>nascimentos no pico</span></div>
      </div>
    </article>

    <article class="cartao">
      <h3>Nascimentos por década</h3>
      <div class="grafico">${barras}</div>
    </article>

    ${montarCartaoSexo(totalFem, totalMasc)}
    ${montarCartaoEstados(porEstado)}
  `;

  document.getElementById("botao-favoritar").addEventListener("click", salvarFavorito);
}

function montarCartaoSexo(fem, masc) {
  const soma = fem + masc;
  if (soma === 0) return "";
  const pctFem = ((fem / soma) * 100).toFixed(1);
  const pctMasc = ((masc / soma) * 100).toFixed(1);
  return `
    <article class="cartao">
      <h3>Feminino × masculino</h3>
      <div class="divisao">
        <div class="fem" style="width:${pctFem}%"></div>
        <div class="masc" style="width:${pctMasc}%"></div>
      </div>
      <div class="legenda">
        <span class="f">Feminino: ${pctFem}% (${formatar(fem)})</span>
        <span class="m">Masculino: ${pctMasc}% (${formatar(masc)})</span>
      </div>
    </article>`;
}

function montarCartaoEstados(porEstado) {
  // A resposta agrupada por UF traz, para cada estado, a proporção a cada 100 mil habitantes
  if (!Array.isArray(porEstado) || porEstado.length === 0) return "";

  const lista = porEstado
    .map((item) => {
      const info = item.res && item.res[0] ? item.res[0] : item;
      return { codigo: Number(item.localidade), proporcao: info.proporcao };
    })
    .filter((e) => ESTADOS[e.codigo] && typeof e.proporcao === "number")
    .sort((a, b) => b.proporcao - a.proporcao)
    .slice(0, 5);

  if (lista.length === 0) return "";

  const itens = lista.map((e) => `
    <li><span class="uf">${ESTADOS[e.codigo]}</span><span>${formatar(e.proporcao)} por 100 mil hab.</span></li>
  `).join("");

  return `
    <article class="cartao">
      <h3>Onde esse nome é mais comum</h3>
      <ol class="estados">${itens}</ol>
      <p class="nota">Proporção de pessoas com o nome a cada 100 mil habitantes do estado.</p>
    </article>`;
}

// ===== Favoritos: CRUD no Supabase =====

function avisoFavoritos(texto) {
  document.getElementById("aviso-favoritos").textContent = texto;
}

// CREATE — salva o nome pesquisado na tabela "favoritos"
async function salvarFavorito() {
  if (!db || !ultimoResultado) return;
  const botao = document.getElementById("botao-favoritar");
  botao.disabled = true;

  const { error } = await db
    .from("favoritos")
    .insert({ nome_item: ultimoResultado.nome, dados_extra: ultimoResultado.extra });

  if (error) {
    console.error(error);
    // 23505 = violação de "unique": o nome já está salvo
    if (error.code === "23505") {
      botao.textContent = "★ Já está nos favoritos";
    } else {
      botao.disabled = false;
      avisoFavoritos("Não foi possível salvar agora. Tente de novo em instantes.");
    }
    return;
  }

  botao.textContent = "★ Favoritado";
  listarFavoritos();
}

// READ — busca todos os favoritos, do mais recente para o mais antigo
async function listarFavoritos() {
  if (!db) {
    avisoFavoritos("Favoritos indisponíveis: o banco de dados não está configurado.");
    return;
  }

  const { data, error } = await db
    .from("favoritos")
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) {
    console.error(error);
    avisoFavoritos("Não foi possível carregar os favoritos agora.");
    return;
  }

  renderizarFavoritos(data);
}

// DELETE — remove um favorito pelo id
async function removerFavorito(id) {
  const { error } = await db.from("favoritos").delete().eq("id", id);
  if (error) {
    console.error(error);
    avisoFavoritos("Não foi possível excluir agora. Tente de novo.");
    return;
  }
  listarFavoritos();
}

// Desenha a lista na tela. Usa textContent (e não innerHTML) porque os dados vêm
// do banco, que qualquer visitante pode alterar — assim ninguém injeta HTML na página.
function renderizarFavoritos(lista) {
  const ul = document.getElementById("lista-favoritos");
  ul.innerHTML = "";

  if (lista.length === 0) {
    avisoFavoritos("Nenhum favorito ainda. Busque um nome e clique em ☆ Favoritar.");
    return;
  }
  avisoFavoritos("");

  lista.forEach((fav) => {
    const li = document.createElement("li");

    const info = document.createElement("button");
    info.type = "button";
    info.className = "favorito-info";
    info.title = "Ver dados deste nome";
    const nome = document.createElement("strong");
    nome.textContent = fav.nome_item;
    const extra = document.createElement("span");
    extra.textContent = fav.dados_extra || "";
    info.append(nome, extra);
    info.addEventListener("click", () => {
      document.getElementById("campo-busca").value = fav.nome_item;
      buscarNome(fav.nome_item);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.className = "botao-excluir";
    excluir.textContent = "Excluir";
    excluir.addEventListener("click", () => removerFavorito(fav.id));

    li.append(info, excluir);
    ul.appendChild(li);
  });
}

// Carrega os favoritos assim que a página abre
listarFavoritos();

// Eventos: envio do formulário (botão ou Enter) e chips de sugestão
document.getElementById("form-busca").addEventListener("submit", (evento) => {
  evento.preventDefault();
  const termo = document.getElementById("campo-busca").value;
  if (termo.trim()) buscarNome(termo);
});

document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    document.getElementById("campo-busca").value = chip.dataset.nome;
    buscarNome(chip.dataset.nome);
  });
});
