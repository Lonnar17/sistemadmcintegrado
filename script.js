let morte = {
  sucessos: [false, false, false],
  falhas: [false, false, false]
};

let dominio = [false, false, false, false, false, false];
let editandoItem = -1;
let editandoArma = -1;
let editandoPoder = -1;
let editandoAliado = -1;
let vidaAtual = 50;
let vidaTemp = 0;
let inventario = [];
let armas = [];
let poderes = [];
let profs = {};
let saves = {};
let imagemBase64 = "";
let exaustao = 0;
let armaduras = [];
let editandoArmadura = -1;

let personagens = JSON.parse(localStorage.getItem("personagens")) || [];
let personagemAtual = null;

/* ================= DADOS FIXOS ================= */

const pericias = [
  { nome: "Acrobacia", attr: "destreza" },
  { nome: "Arcanismo", attr: "inteligencia" },
  { nome: "Atletismo", attr: "forca" },
  { nome: "Atuação", attr: "carisma" },
  { nome: "Enganação", attr: "carisma" },
  { nome: "Furtividade", attr: "destreza" },
  { nome: "História", attr: "inteligencia" },
  { nome: "Intimidação", attr: "carisma" },
  { nome: "Intuição", attr: "sabedoria" },
  { nome: "Investigação", attr: "inteligencia" },
  { nome: "Lidar com Animais", attr: "sabedoria" },
  { nome: "Medicina", attr: "sabedoria" },
  { nome: "Natureza", attr: "inteligencia" },
  { nome: "Percepção", attr: "sabedoria" },
  { nome: "Persuasão", attr: "carisma" },
  { nome: "Prestidigitação", attr: "destreza" },
  { nome: "Religião", attr: "inteligencia" },
  { nome: "Sobrevivência", attr: "sabedoria" }
];

const efeitosExaustao = [
  "Sem exaustão",
  "Desvantagem em testes de habilidade",
  "Metade da velocidade",
  "Desvantagem em ataques e testes de resistência",
  "Metade do HP máximo",
  "Velocidade = 0",
  "Morte"
];

/* ================= FUNÇÕES BASE ================= */

function mod(v) {
  return Math.floor((v - 10) / 2);
}

function get(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  return parseInt(el.value) || 0;
}

function salvarPersonagens() {
  localStorage.setItem("personagens", JSON.stringify(personagens));
}

function normalizarTipo(tipo) {
  return (tipo || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function toggleSecao(id, el) {
  const box = document.getElementById(id);
  if (!box) return;

  const aberta = box.classList.contains("aberto");

  if (aberta) {
    box.style.maxHeight = box.scrollHeight + "px";

    requestAnimationFrame(() => {
      box.style.maxHeight = "0px";
      box.style.opacity = "0";
    });

    box.classList.remove("aberto");
    if (el) el.classList.add("fechado");
    localStorage.setItem("secao_" + id, "fechada");
  } else {
    box.classList.add("aberto");
    box.style.opacity = "1";
    box.style.maxHeight = box.scrollHeight + "px";

    if (el) el.classList.remove("fechado");
    localStorage.setItem("secao_" + id, "aberta");
  }
}

function restaurarSecoes() {
  const secoes = document.querySelectorAll(".conteudo-toggle");

  secoes.forEach(box => {
    const id = box.id;
    if (!id) return;

    const estado = localStorage.getItem("secao_" + id);
    const titulo = document.querySelector(`[onclick*="${id}"]`);

    if (estado === "aberta") {
      box.classList.add("aberto");
      box.style.opacity = "1";
      box.style.maxHeight = box.scrollHeight + "px";
      if (titulo) titulo.classList.remove("fechado");
    } else {
      box.classList.remove("aberto");
      box.style.opacity = "0";
      box.style.maxHeight = "0px";
      if (titulo) titulo.classList.add("fechado");
    }
  });
}

function getIconeTipo(tipo) {
  const t = normalizarTipo(tipo);

  if (t.includes("fogo")) return "🔥";
  if (t.includes("gelo")) return "❄️";
  if (t.includes("raio")) return "⚡";
  if (t.includes("trovej")) return "🌩️";
  if (t.includes("necrot")) return "💀";
  if (t.includes("radiante")) return "✨";
  if (t.includes("veneno")) return "☠️";
  if (t.includes("psiqu")) return "🧠";
  if (t.includes("corte")) return "🗡️";
  if (t.includes("perfur")) return "📌";
  if (t.includes("concuss")) return "💥";
  if (t.includes("fisico")) return "🗡️";

  return "🔮";
}

function getClasseTipo(tipo) {
  const t = normalizarTipo(tipo);

  if (t.includes("fogo")) return "tipo-fogo";
  if (t.includes("gelo")) return "tipo-gelo";
  if (t.includes("raio")) return "tipo-raio";
  if (t.includes("trovej")) return "tipo-trovejante";
  if (t.includes("necrot")) return "tipo-necrotico";
  if (t.includes("radiante")) return "tipo-radiante";
  if (t.includes("veneno")) return "tipo-veneno";
  if (t.includes("psiqu")) return "tipo-psiquico";
  if (t.includes("corte")) return "tipo-corte";
  if (t.includes("perfur")) return "tipo-perfurante";
  if (t.includes("concuss")) return "tipo-concussao";

  return "tipo-padrao";
}

/* ================= POPUP ================= */

function abrirPopup(titulo, conteudo, usarHTML = false, onEditar = null) {
  const popup = document.getElementById("popup");
  const tituloEl = document.getElementById("popup-titulo");
  const textoEl = document.getElementById("popup-texto");
  const btnEditar = document.getElementById("popup-editar");

  if (!popup || !tituloEl || !textoEl) return;

  tituloEl.textContent = titulo || "";

  if (usarHTML) {
    textoEl.innerHTML = conteudo || "";
  } else {
    textoEl.textContent = conteudo || "";
  }

  if (btnEditar) {
    if (onEditar) {
      btnEditar.style.display = "inline-flex";
      btnEditar.onclick = onEditar;
    } else {
      btnEditar.style.display = "none";
      btnEditar.onclick = null;
    }
  }

  popup.style.display = "flex";
}

function editarItem(index) {
  const item = inventario[index];
  if (!item) return;

  const html = `
    <div class="popup-form">
      <label class="popup-label">Nome</label>
      <input id="editItemNome" value="${item.nome || ""}">

      <label class="popup-label">Descrição</label>
      <textarea id="editItemDesc">${item.desc || ""}</textarea>

      <button class="popup-salvar-btn" onclick="salvarEdicaoItem(${index})">
        Salvar
      </button>
    </div>
  `;

  abrirPopup("Editar item", html, true, null);
}

function salvarEdicaoItem(index) {
  const nome = document.getElementById("editItemNome").value.trim();
  const desc = document.getElementById("editItemDesc").value.trim();

  if (!nome) return;

  inventario[index] = {
    nome,
    desc
  };

  renderInv();
  salvarTudo();
  fecharPopup();
}

/* ================= ARMADURAS ================= */

function addArmadura() {
  const nome = document.getElementById("armaduraNome").value.trim();
  const ca = document.getElementById("armaduraCA").value.trim();
  const desc = document.getElementById("armaduraDesc").value.trim();

  if (!nome) return;

  const novaArmadura = {
    nome,
    ca,
    desc
  };

  if (editandoArmadura >= 0) {
    armaduras[editandoArmadura] = novaArmadura;
    editandoArmadura = -1;
  } else {
    armaduras.push(novaArmadura);
  }

  renderArmaduras();
  salvarTudo();

  document.getElementById("armaduraNome").value = "";
  document.getElementById("armaduraCA").value = "";
  document.getElementById("armaduraDesc").value = "";
}

function renderArmaduras() {
  const ul = document.getElementById("listaArmaduras");
  if (!ul) return;

  ul.innerHTML = "";

  armaduras.forEach((armadura, index) => {
    const li = document.createElement("li");
    li.className = "armadura-card";

    li.innerHTML = `
      <div class="armadura-info" onclick="verArmadura(${index})">
        <strong class="armadura-nome">${armadura.nome || "Sem nome"}</strong>
        <p class="armadura-ca-preview">CA: ${armadura.ca || "Sem CA"}</p>
        <p class="armadura-desc-preview">
          ${armadura.desc ? armadura.desc.substring(0, 60) + (armadura.desc.length > 60 ? "..." : "") : "Sem descrição"}
        </p>
      </div>

      <div class="item-acoes">
        <button type="button" class="btn-editar" onclick="event.stopPropagation(); editarArmadura(${index})">✏️</button>
        <button type="button" class="arma-remover" onclick="event.stopPropagation(); removerArmadura(${index})">X</button>
      </div>
    `;

    ul.appendChild(li);
  });
}

function verArmadura(index) {
  const armadura = armaduras[index];
  if (!armadura) return;

  const html = `
    <div class="popup-bloco">
      <div>
        <span class="popup-label">CA</span>
        <div class="popup-descricao">${armadura.ca || "Sem CA"}</div>
      </div>

      <div style="margin-top: 12px;">
        <span class="popup-label">Descrição</span>
        <div class="popup-descricao">${armadura.desc || "Sem descrição"}</div>
      </div>
    </div>
  `;

  abrirPopup(armadura.nome || "Sem nome", html, true, () => editarArmadura(index));
}

function editarArmadura(index) {
  const armadura = armaduras[index];
  if (!armadura) return;

  const html = `
    <div class="popup-form">
      <label class="popup-label">Nome</label>
      <input id="editArmaduraNome" value="${armadura.nome || ""}">

      <label class="popup-label">CA</label>
      <input id="editArmaduraCA" value="${armadura.ca || ""}">

      <label class="popup-label">Descrição</label>
      <textarea id="editArmaduraDesc">${armadura.desc || ""}</textarea>

      <button class="popup-salvar-btn" onclick="salvarEdicaoArmadura(${index})">
        Salvar
      </button>
    </div>
  `;

  abrirPopup("Editar armadura", html, true, null);
}

function salvarEdicaoArmadura(index) {
  const nome = document.getElementById("editArmaduraNome").value.trim();
  const ca = document.getElementById("editArmaduraCA").value.trim();
  const desc = document.getElementById("editArmaduraDesc").value.trim();

  if (!nome) return;

  armaduras[index] = {
    nome,
    ca,
    desc
  };

  renderArmaduras();
  salvarTudo();
  fecharPopup();
}

function removerArmadura(index) {
  const armadura = armaduras[index];
  if (!armadura) return;

  const confirmar = confirm(`Remover "${armadura.nome}"?`);
  if (!confirmar) return;

  armaduras.splice(index, 1);
  renderArmaduras();
  salvarTudo();
}

function editarArma(index) {
  const arma = armas[index];
  if (!arma) return;

  const html = `
    <div class="popup-form">
      <label class="popup-label">Nome</label>
      <input id="editArmaNome" value="${arma.nome || ""}">

      <label class="popup-label">Dano</label>
      <input id="editArmaDano" value="${arma.dano || ""}">

      <label class="popup-label">Descrição</label>
      <textarea id="editArmaDesc">${arma.desc || ""}</textarea>

      <label class="popup-label">
        <input type="checkbox" id="editArmaTemCargas" ${arma.temCargas ? "checked" : ""} onchange="toggleEditCampoCargas()">
        Usa cargas
      </label>

      <input
        id="editArmaMaxCargas"
        type="number"
        min="1"
        max="20"
        placeholder="Qtd. de cargas"
        value="${arma.maxCargas || ""}"
        style="display:${arma.temCargas ? "block" : "none"};"
      >

      <button class="popup-salvar-btn" onclick="salvarEdicaoArma(${index})">
        Salvar
      </button>
    </div>
  `;

  abrirPopup("Editar arma", html, true, null);
}

function toggleEditCampoCargas() {
  const check = document.getElementById("editArmaTemCargas");
  const input = document.getElementById("editArmaMaxCargas");

  if (!check || !input) return;

  if (check.checked) {
    input.style.display = "block";
  } else {
    input.style.display = "none";
    input.value = "";
  }
}

function editarPoder(index) {
  const poder = poderes[index];
  if (!poder) return;

  const html = `
    <div class="popup-form">
      <label class="popup-label">Nome</label>
      <input id="editPoderNome" value="${poder.nome || ""}">

      <label class="popup-label">Tipo</label>
      <input id="editPoderTipo" value="${poder.tipo || ""}">

      <label class="popup-label">Dano</label>
      <input id="editPoderDano" value="${poder.dano || ""}">

      <label class="popup-label">Círculo</label>
      <input id="editPoderCirculo" value="${poder.circulo || ""}">

      <label class="popup-label">Conjuração</label>
      <input id="editPoderTempo" value="${poder.tempo || ""}">

      <label class="popup-label">Alcance</label>
      <input id="editPoderAlcance" value="${poder.alcance || ""}">

      <label class="popup-label">Duração</label>
      <input id="editPoderDuracao" value="${poder.duracao || ""}">

      <label class="popup-label">Descrição</label>
      <textarea id="editPoderDesc">${poder.desc || ""}</textarea>

      <button class="popup-salvar-btn" onclick="salvarEdicaoPoder(${index})">
        Salvar
      </button>
    </div>
  `;

  abrirPopup("Editar poder", html, true, null);
}

function salvarEdicaoPoder(index) {
  const nome = document.getElementById("editPoderNome").value.trim();
  const tipo = document.getElementById("editPoderTipo").value.trim();
  const dano = document.getElementById("editPoderDano").value.trim();
  const circulo = document.getElementById("editPoderCirculo").value.trim();
  const tempo = document.getElementById("editPoderTempo").value.trim();
  const alcance = document.getElementById("editPoderAlcance").value.trim();
  const duracao = document.getElementById("editPoderDuracao").value.trim();
  const desc = document.getElementById("editPoderDesc").value.trim();

  if (!nome) return;

  poderes[index] = {
    nome,
    tipo,
    dano,
    circulo,
    tempo,
    alcance,
    duracao,
    desc
  };

  renderPoderes();
  salvarTudo();
  fecharPopup();
}

function atualizarTextoBotaoEdicao() {
  const btnItem = document.querySelector("#inventario .inv-add-btn");
  const btnArma = document.querySelector("#combate .arma-add .inv-add-btn, #combate .arma-add button");
  const btnPoder = document.querySelector("#poderes .inv-add-btn");

  if (btnItem) btnItem.textContent = editandoItem >= 0 ? "Salvar edição" : "+";
  if (btnArma) btnArma.textContent = editandoArma >= 0 ? "Salvar edição" : "+";
  if (btnPoder) btnPoder.textContent = editandoPoder >= 0 ? "Salvar edição" : "+";
}

function fecharPopup() {
  const popup = document.getElementById("popup");
  if (popup) popup.style.display = "none";
}

function salvarEdicaoArma(index) {
  const nome = document.getElementById("editArmaNome").value.trim();
  const dano = document.getElementById("editArmaDano").value.trim();
  const desc = document.getElementById("editArmaDesc").value.trim();

  const temCargas = !!document.getElementById("editArmaTemCargas")?.checked;
  const maxCargas = temCargas ? (parseInt(document.getElementById("editArmaMaxCargas")?.value) || 0) : 0;

  if (!nome) return;
  if (temCargas && maxCargas <= 0) return;

  const armaAnterior = armas[index];

  let cargasGastas = [];
  if (temCargas) {
    if (
      armaAnterior?.temCargas &&
      armaAnterior.maxCargas === maxCargas &&
      Array.isArray(armaAnterior.cargasGastas)
    ) {
      cargasGastas = armaAnterior.cargasGastas;
    } else {
      cargasGastas = Array(maxCargas).fill(false);
    }
  }

  armas[index] = {
    nome,
    dano,
    desc,
    temCargas,
    maxCargas,
    cargasGastas
  };

  renderArmas();
  salvarTudo();
  fecharPopup();
}

/* ================= ABAS ================= */

function trocarAba(id, btn = null) {
  const abas = document.querySelectorAll(".aba");
  const novaAba = document.getElementById(id);
  const abaAtual = document.querySelector(".aba.active");

  const hud = document.querySelector(".estilo-topo-fixo");
  const botoes = document.querySelector(".botoes-estilo-fixos");

  if (id === "estilo") {
    if (hud) hud.style.display = "block";
    if (botoes) botoes.style.display = "flex";
  } else {
    if (hud) hud.style.display = "none";
    if (botoes) botoes.style.display = "none";
  }

  if (!novaAba) return;

  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));

  if (btn) {
    btn.classList.add("active");
  } else {
    const botao = document.querySelector(`.tab-btn[onclick*="${id}"]`);
    if (botao) botao.classList.add("active");
  }

  if (abaAtual && abaAtual !== novaAba) {
    abaAtual.classList.remove("show");
    abaAtual.classList.add("hiding");

    setTimeout(() => {
      abaAtual.classList.remove("active", "hiding");
      abaAtual.style.display = "none";
    }, 200);
  }

  abas.forEach(aba => {
    if (aba !== novaAba) {
      aba.classList.remove("show", "hiding");
    }
  });

  novaAba.style.display = "block";
  novaAba.classList.add("active");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      novaAba.classList.add("show");
    });
  });
}

function entrarFicha() {
  const telaInicial = document.getElementById("tela-inicial");
  const ficha = document.getElementById("ficha");

  if (telaInicial) telaInicial.style.display = "none";
  if (ficha) ficha.style.display = "block";

  trocarAba("personagem");
}

function voltarInicio() {
  const telaInicial = document.getElementById("tela-inicial");
  const ficha = document.getElementById("ficha");

  if (telaInicial) telaInicial.style.display = "block";
  if (ficha) ficha.style.display = "none";
}

function toggleDiario() {
  const box = document.getElementById("diario-box");
  if (!box) return;

  if (box.style.display === "none" || box.style.display === "") {
    box.style.display = "block";
  } else {
    box.style.display = "none";
  }
}

/* ================= PERSONAGENS ================= */

function renderPersonagens() {
  const div = document.getElementById("listaPersonagens");
  if (!div) return;

  div.innerHTML = "";

  personagens.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.backgroundImage = `url('${p.imagem || ""}')`;

    card.innerHTML = `
      <div class="card-info">
        <span class="card-nome">${p.nome || "Sem nome"}</span>
        <span class="card-classe">${p.classe || "Sem classe"}</span>
      </div>

      <div class="card-acoes">
        <button
          type="button"
          class="btn-duplicar"
          onclick="duplicarPersonagem(${i}); event.stopPropagation();"
        >⧉</button>

        <button
          type="button"
          class="btn-deletar"
          onclick="deletarPersonagem(${i}); event.stopPropagation();"
        >X</button>
      </div>
    `;

    card.onclick = () => carregarPersonagem(i);
    div.appendChild(card);
  });

  const add = document.createElement("div");
  add.className = "card add";
  add.innerText = "+";
  add.onclick = criarPersonagem;
  div.appendChild(add);
}

function duplicarPersonagem(index) {
  const original = personagens[index];
  if (!original) return;

  const copia = JSON.parse(JSON.stringify(original));
  copia.nome = (original.nome || "Sem nome") + " (Cópia)";

  personagens.push(copia);
  salvarPersonagens();
  renderPersonagens();
}

function criarPersonagem() {
  const novo = {
    nome: "",
    classe: "",
    raca: "",
    idade: "",
    altura: "",
    imagem: "",
    antecedentes: "",
    idiomas: "",
    resistencias: "",
    diario: "",
    proficienciasExtras: "",
    armaduras: [],
resistencias: "",
dominio: [false, false, false, false, false, false],

    vidaMax: 50,
    vidaAtual: 50,
    vidaTemp: 0,
    ca: "",
    deslocamento: 9,

    forca: 10,
    destreza: 10,
    constituicao: 10,
    inteligencia: 10,
    sabedoria: 10,
    carisma: 10,
    bonusProf: 2,

    inventario: [],
    armas: [],
    aliados: [],
    poderes: [],
    profs: {},
    saves: {},
    exaustao: 0,
    inspiracao: 0,
    dtBase: 8,
    dtAtributo: 0,
    dtProf: 2,
    pontosEstilo: 0,
    dominio: [false, false, false, false, false, false],
    morte: {
      sucessos: [false, false, false],
      falhas: [false, false, false]
    }
  };

  personagens.push(novo);
  salvarPersonagens();
  renderPersonagens();
}

function renderAliados() {
  const ul = document.getElementById("listaAliados");
  if (!ul || personagemAtual === null) return;

  ul.innerHTML = "";

  const p = personagens[personagemAtual];
  if (!Array.isArray(p.aliados)) {
    p.aliados = [];
  }

  p.aliados.forEach((aliado, index) => {
    const li = document.createElement("li");
    li.className = "item-card";

    li.innerHTML = `
      <div class="item-info">
        <strong>${aliado.nome}</strong>
        <div class="item-preview">
          ${aliado.desc || ""}
        </div>
      </div>

      <div class="item-acoes">
        <button type="button" class="btn-editar" onclick="event.stopPropagation(); editarAliado(${index})">✏️</button>
        <button type="button" class="item-remover" onclick="event.stopPropagation(); removerAliado(${index})">X</button>
      </div>
    `;

    ul.appendChild(li);
  });
}

function editarAliado(index) {
  const p = personagens[personagemAtual];
  if (!p || !Array.isArray(p.aliados)) return;

  const aliado = p.aliados[index];
  if (!aliado) return;

  const html = `
    <div class="popup-form">
      <label class="popup-label">Nome</label>
      <input id="editAliadoNome" value="${aliado.nome || ""}">

      <label class="popup-label">Descrição</label>
      <textarea id="editAliadoDesc">${aliado.desc || ""}</textarea>

      <button class="popup-salvar-btn" onclick="salvarEdicaoAliado(${index})">
        Salvar
      </button>
    </div>
  `;

  abrirPopup("Editar aliado", html, true, null);
}

function salvarEdicaoAliado(index) {
  const p = personagens[personagemAtual];
  if (!p || !Array.isArray(p.aliados)) return;

  const nome = document.getElementById("editAliadoNome").value.trim();
  const desc = document.getElementById("editAliadoDesc").value.trim();

  if (!nome) return;

  p.aliados[index] = {
    nome,
    desc
  };

  salvarTudo();
  renderAliados();
  fecharPopup();
}

function adicionarAliado() {
  const nome = document.getElementById("aliadoNome").value.trim();
  const desc = document.getElementById("aliadoDesc").value.trim();

  if (!nome) return;

  const p = personagens[personagemAtual];
  if (!Array.isArray(p.aliados)) {
    p.aliados = [];
  }

  p.aliados.push({
    nome,
    desc
  });

  document.getElementById("aliadoNome").value = "";
  document.getElementById("aliadoDesc").value = "";

  salvarTudo();
  renderAliados();
}

function removerAliado(index) {
  const p = personagens[personagemAtual];
  if (!p || !Array.isArray(p.aliados)) return;

  p.aliados.splice(index, 1);

  salvarTudo();
  renderAliados();
}

function deletarPersonagem(index) {
  if (!confirm("Tem certeza que quer excluir?")) return;

  personagens.splice(index, 1);
  salvarPersonagens();
  renderPersonagens();

  if (personagemAtual === index) {
    personagemAtual = null;
    voltarInicio();
  }
}

function carregarPersonagem(index) {
  personagemAtual = index;
  const p = personagens[index];
  if (!p) return;

  document.getElementById("classe").value = p.classe || "";
  document.getElementById("nome").value = p.nome || "";
  document.getElementById("raca").value = p.raca || "";
  document.getElementById("idade").value = p.idade || "";
  document.getElementById("altura").value = p.altura || "";
  document.getElementById("vidaMax").value = p.vidaMax ?? 50;
  document.getElementById("ca").value = p.ca ?? "";
  document.getElementById("deslocamento").value = p.deslocamento ?? 9;
  document.getElementById("antecedentes").value = p.antecedentes || "";
  document.getElementById("idiomas").value = p.idiomas || "";
  document.getElementById("diario").value = p.diario || "";
  const resistenciasEl = document.getElementById("resistencias");
if (resistenciasEl) {
  resistenciasEl.value = p.resistencias || "";
}


  document.getElementById("forca").value = p.forca ?? 10;
  document.getElementById("destreza").value = p.destreza ?? 10;
  document.getElementById("constituicao").value = p.constituicao ?? 10;
  document.getElementById("inteligencia").value = p.inteligencia ?? 10;
  document.getElementById("sabedoria").value = p.sabedoria ?? 10;
  document.getElementById("carisma").value = p.carisma ?? 10;
  document.getElementById("bonusProf").value = p.bonusProf ?? 2;

  const inspiracao = document.getElementById("inspiracao");
  if (inspiracao) inspiracao.value = p.inspiracao ?? 0;

  const dtBase = document.getElementById("dtBase");
  const dtAtributo = document.getElementById("dtAtributo");
  const dtProf = document.getElementById("dtProf");
  const profExtras = document.getElementById("proficienciasExtras");
  if (profExtras) profExtras.value = p.proficienciasExtras || "";

  if (dtBase) dtBase.value = p.dtBase ?? 8;
  if (dtAtributo) dtAtributo.value = p.dtAtributo ?? 0;
  if (dtProf) dtProf.value = p.dtProf ?? 2;

  document.getElementById("preview").src = p.imagem || "";
  imagemBase64 = p.imagem || "";

  const nomeArquivo = document.getElementById("nome-arquivo");
  if (nomeArquivo) {
    nomeArquivo.innerText = p.imagem ? "Imagem carregada" : "Nenhum arquivo escolhido";
  }

  vidaAtual = p.vidaAtual ?? 50;
  vidaTemp = p.vidaTemp ?? 0;
  inventario = p.inventario || [];
  armas = p.armas || [];
  poderes = p.poderes || [];
  profs = p.profs || {};
  saves = p.saves || {};
  exaustao = p.exaustao ?? 0;
  armaduras = p.armaduras || [];
  dominio = p.dominio || [false, false, false, false, false, false];
  pontosEstilo = p.pontosEstilo ?? 0;
  dominio = p.dominio || [false, false, false, false, false, false];
  morte = p.morte || {
    sucessos: [false, false, false],
    falhas: [false, false, false]
  };

  renderInv();
renderArmas();
renderPoderes();
atualizarTudo();
atualizarSaves();
atualizarBadgesSaves();
renderArmaduras();
renderDominio();
atualizarHP();
atualizarTemp();
setExaustao(exaustao);
atualizarMorte();
atualizarDT();
atualizarEstilo();
entrarFicha();
renderAliados();
restaurarSecoes();
}

/* ================= SALVAR ================= */

function salvarTudo() {
  if (personagemAtual === null) return;

  const p = personagens[personagemAtual];
  if (!p) return;

  p.nome = document.getElementById("nome").value;
  p.classe = document.getElementById("classe").value;
  p.raca = document.getElementById("raca").value;
  p.idade = document.getElementById("idade").value;
  p.altura = document.getElementById("altura").value;
  p.antecedentes = document.getElementById("antecedentes")?.value || "";
  p.idiomas = document.getElementById("idiomas")?.value || "";
  p.resistencias = document.getElementById("resistencias")?.value || "";
  p.diario = document.getElementById("diario")?.value || "";
  p.imagem = imagemBase64;
  p.proficienciasExtras = document.getElementById("proficienciasExtras")?.value || "";
  p.aliados = personagens[personagemAtual].aliados || [];
  p.resistencias = document.getElementById("resistencias")?.value || "";
  p.armaduras = armaduras;
  p.dominio = dominio;

  p.vidaMax = get("vidaMax");
  p.vidaAtual = vidaAtual;
  p.vidaTemp = vidaTemp;
  p.ca = document.getElementById("ca").value;
  p.deslocamento = document.getElementById("deslocamento").value;

  p.forca = get("forca");
  p.destreza = get("destreza");
  p.constituicao = get("constituicao");
  p.inteligencia = get("inteligencia");
  p.sabedoria = get("sabedoria");
  p.carisma = get("carisma");
  p.bonusProf = get("bonusProf");

  p.inventario = inventario;
  p.armas = armas;
  p.poderes = poderes;
  p.profs = profs;
  p.saves = saves;
  p.exaustao = exaustao;
  p.pontosEstilo = pontosEstilo;
  p.morte = morte;
  p.dominio = dominio;


  const inspiracao = document.getElementById("inspiracao");
  const dtBase = document.getElementById("dtBase");
  const dtAtributo = document.getElementById("dtAtributo");
  const dtProf = document.getElementById("dtProf");

  p.inspiracao = inspiracao ? inspiracao.value : 0;
  p.dtBase = dtBase ? dtBase.value : 8;
  p.dtAtributo = dtAtributo ? dtAtributo.value : 0;
  p.dtProf = dtProf ? dtProf.value : 2;

  salvarPersonagens();
  renderPersonagens();
}

/* ================= IMAGEM ================= */

function previewImagem() {
  const input = document.getElementById("imagem");
  const preview = document.getElementById("preview");
  const nomeArquivo = document.getElementById("nome-arquivo");

  if (!input || !preview || !input.files || !input.files[0]) return;

  const file = input.files[0];
  if (nomeArquivo) nomeArquivo.innerText = file.name;

  const reader = new FileReader();
  reader.onload = function (e) {
    imagemBase64 = e.target.result;
    preview.src = imagemBase64;
    salvarTudo();
    renderPersonagens();
  };
  reader.readAsDataURL(file);
}

function toggleCampoCargas() {
  const check = document.getElementById("armaTemCargas");
  const input = document.getElementById("armaMaxCargas");

  if (!check || !input) return;

  if (check.checked) {
    input.style.display = "block";
  } else {
    input.style.display = "none";
    input.value = "";
  }
}

function toggleDominio(index) {
  dominio[index] = !dominio[index];
  renderDominio();
  salvarTudo();
}

function renderDominio() {
  const checks = document.querySelectorAll(".dominio-check");
  if (!checks.length) return;

  checks.forEach((check, i) => {
    check.classList.toggle("ativo", !!dominio[i]);
  });
}

/* ================= INVENTÁRIO ================= */

function addItem() {
  const nome = document.getElementById("item").value.trim();
  const desc = document.getElementById("itemDesc").value.trim();

  if (!nome) return;

  const novoItem = {
    nome,
    desc
  };

  if (editandoItem >= 0) {
    inventario[editandoItem] = novoItem;
    editandoItem = -1;
  } else {
    inventario.push(novoItem);
  }

  renderInv();
  salvarTudo();

  document.getElementById("item").value = "";
  document.getElementById("itemDesc").value = "";
}

function renderInv() {
  const ul = document.getElementById("lista");
  if (!ul) return;

  ul.innerHTML = "";

  inventario.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "item-card";

    li.innerHTML = `
      <div class="item-info" onclick="verItem(${index})">
        <strong class="item-nome">${item.nome || "Sem nome"}</strong>
        <p class="item-preview">
          ${item.desc ? item.desc.substring(0, 60) + (item.desc.length > 60 ? "..." : "") : "Sem descrição"}
        </p>
      </div>

      <div class="item-acoes">
        <button type="button" class="btn-editar" onclick="editarItem(${index})">✏️</button>
        <button type="button" class="item-remover" onclick="removerItem(${index})">X</button>
      </div>
    `;

    ul.appendChild(li);
  });
}

function verItem(index) {
  const item = inventario[index];
  if (!item) return;

  const html = `
    <div class="popup-bloco">
      <div>
        <span class="popup-label">Descrição</span>
        <div class="popup-descricao">
          ${item.desc || "Sem descrição"}
        </div>
      </div>
    </div>
  `;

  abrirPopup(item.nome || "Sem nome", html, true, () => editarItem(index));
}

function removerItem(index) {
  const item = inventario[index];
  if (!item) return;

  const confirmar = confirm(`Remover "${item.nome}"?`);
  if (!confirmar) return;

  inventario.splice(index, 1);
  renderInv();
  salvarTudo();
}

/* ================= ARMAS ================= */

function addArma() {
  const nome = document.getElementById("armaNome").value.trim();
  const dano = document.getElementById("armaDano").value.trim();
  const descEl = document.getElementById("armaDesc");
  const desc = descEl ? descEl.value.trim() : "";

  const temCargasEl = document.getElementById("armaTemCargas");
  const maxCargasEl = document.getElementById("armaMaxCargas");

  const temCargas = !!temCargasEl?.checked;
  const maxCargas = temCargas ? (parseInt(maxCargasEl?.value) || 0) : 0;

  if (!nome) return;
  if (temCargas && maxCargas <= 0) return;

  const novaArma = {
    nome,
    dano,
    desc,
    temCargas,
    maxCargas,
    cargasGastas: temCargas ? Array(maxCargas).fill(false) : []
  };

  if (editandoArma >= 0) {
    const armaAnterior = armas[editandoArma];

    if (
      armaAnterior?.temCargas &&
      temCargas &&
      armaAnterior.maxCargas === maxCargas &&
      Array.isArray(armaAnterior.cargasGastas)
    ) {
      novaArma.cargasGastas = armaAnterior.cargasGastas;
    }

    armas[editandoArma] = novaArma;
    editandoArma = -1;
  } else {
    armas.push(novaArma);
  }

  renderArmas();
  salvarTudo();

  document.getElementById("armaNome").value = "";
  document.getElementById("armaDano").value = "";
  if (descEl) descEl.value = "";

  if (temCargasEl) temCargasEl.checked = false;
  if (maxCargasEl) {
    maxCargasEl.value = "";
    maxCargasEl.style.display = "none";
  }
}

function renderArmas() {
  const ul = document.getElementById("listaArmas");
  if (!ul) return;

  ul.innerHTML = "";

  armas.forEach((arma, index) => {
    const li = document.createElement("li");
    li.className = "arma-card";

    const cargasHTML = arma.temCargas && arma.maxCargas > 0
      ? `
        <div class="arma-cargas-box">
          <span class="arma-cargas-label">Cargas</span>
          <div class="arma-cargas-checks">
            ${Array.from({ length: arma.maxCargas }, (_, i) => `
              <div
                class="arma-carga-check ${arma.cargasGastas?.[i] ? "ativo" : ""}"
                onclick="event.stopPropagation(); toggleCargaArma(${index}, ${i})"
              ></div>
            `).join("")}
          </div>
        </div>
      `
      : "";

    li.innerHTML = `
      <div class="arma-info" onclick="verArma(${index})">
        <strong class="arma-nome">${arma.nome || "Sem nome"}</strong>
        <p class="arma-dano-preview">${arma.dano || "Sem dano"}</p>
        <p class="arma-desc-preview">
          ${arma.desc ? arma.desc.substring(0, 60) + (arma.desc.length > 60 ? "..." : "") : "Sem descrição"}
        </p>
        ${cargasHTML}
      </div>

      <div class="item-acoes">
        <button type="button" class="btn-editar" onclick="editarArma(${index})">✏️</button>
        <button type="button" class="arma-remover" onclick="removerArma(${index})">X</button>
      </div>
    `;

    ul.appendChild(li);
  });
}

function toggleCargaArma(indexArma, indexCarga) {
  const arma = armas[indexArma];
  if (!arma || !arma.temCargas || !Array.isArray(arma.cargasGastas)) return;

  arma.cargasGastas[indexCarga] = !arma.cargasGastas[indexCarga];
  renderArmas();
  salvarTudo();
}

function verArma(index) {
  const arma = armas[index];
  if (!arma) return;

  const html = `
    <div class="popup-bloco">
      <div>
        <span class="popup-label">Dano</span>
        <div class="popup-tags">
  <span class="tag-dano">${arma.dano || "—"}</span>
</div>
        </div>
      </div>

      <div style="margin-top: 12px;">
        <span class="popup-label">Descrição</span>
        <div class="popup-descricao">
          ${arma.desc || "Sem descrição"}
        </div>
      </div>
    </div>
  `;

  abrirPopup(arma.nome || "Sem nome", html, true, () => editarArma(index));
}

function removerArma(index) {
  const arma = armas[index];
  if (!arma) return;

  const confirmar = confirm(`Remover "${arma.nome}"?`);
  if (!confirmar) return;

  armas.splice(index, 1);
  renderArmas();
  salvarTudo();
}

/* ================= PODERES ================= */

function addPoder() {
  const nome = document.getElementById("poderNome").value.trim();
  const tipo = document.getElementById("poderTipo").value.trim();
  const dano = document.getElementById("poderDano").value.trim();
  const circulo = document.getElementById("poderCirculo").value.trim();
  const tempo = document.getElementById("poderTempo").value.trim();
  const alcance = document.getElementById("poderAlcance").value.trim();
  const duracao = document.getElementById("poderDuracao").value.trim();
  const desc = document.getElementById("poderDesc").value.trim();

  if (!nome) return;

  const novoPoder = {
    nome,
    tipo,
    dano,
    circulo,
    tempo,
    alcance,
    duracao,
    desc
  };

  if (editandoPoder >= 0) {
    poderes[editandoPoder] = novoPoder;
    editandoPoder = -1;
  } else {
    poderes.push(novoPoder);
  }

  renderPoderes();
  salvarTudo();

  document.getElementById("poderNome").value = "";
  document.getElementById("poderTipo").value = "";
  document.getElementById("poderDano").value = "";
  document.getElementById("poderCirculo").value = "";
  document.getElementById("poderTempo").value = "";
  document.getElementById("poderAlcance").value = "";
  document.getElementById("poderDuracao").value = "";
  document.getElementById("poderDesc").value = "";
}

function moverPoder(index, direcao) {
  const lista = document.querySelectorAll(".poder-card");

  if (!lista[index]) return;

  // anima o item atual
  lista[index].classList.add("animando");

  const novoIndex = index + direcao;

  if (novoIndex < 0 || novoIndex >= poderes.length) {
    lista[index].classList.remove("animando");
    return;
  }

  setTimeout(() => {
    // troca no array
    [poderes[index], poderes[novoIndex]] = [poderes[novoIndex], poderes[index]];

    renderPoderes();
    salvarTudo();
  }, 150);
}

function renderPoderes() {
  const ul = document.getElementById("listaPoderes");
  if (!ul) return;

  ul.innerHTML = "";

  poderes.forEach((poder, index) => {
    const icone = getIconeTipo(poder.tipo);

    const li = document.createElement("li");
    li.className = "poder-card";

    li.innerHTML = `
      <div class="poder-info" onclick="verPoder(${index})">
        <strong class="poder-nome">${icone} ${poder.nome || "Sem nome"}</strong>
        ${poder.dano ? `<div class="poder-tags" style="margin-top:6px;"><span class="tag-dano">${poder.dano}</span></div>` : ""}
        <p class="poder-preview">
          ${
            poder.desc
              ? poder.desc.split("\n")[0].substring(0, 60) +
                (poder.desc.split("\n")[0].length > 60 ? "." : "")
              : "Sem descrição"
          }
        </p>
      </div>

      <div class="item-acoes">
        <div class="acoes-topo">
          <button type="button" class="btn-mover" onclick="event.stopPropagation(); moverPoderCima(${index})">↑</button>
          <button type="button" class="btn-mover" onclick="event.stopPropagation(); moverPoderBaixo(${index})">↓</button>
          <button type="button" class="btn-editar" onclick="event.stopPropagation(); editarPoder(${index})">✏️</button>
        </div>

        <button type="button" class="poder-remover" onclick="event.stopPropagation(); removerPoder(${index})">X</button>
      </div>
    `;

    ul.appendChild(li);
  });
}



function moverPoderCima(index) {
  moverPoder(index, -1);
}

function moverPoderBaixo(index) {
  moverPoder(index, 1);
}

function verPoder(index) {
  const poder = poderes[index];
  if (!poder) return;

  const tipoTexto = poder.tipo || "Sem tipo";
  const icone = getIconeTipo(tipoTexto);

  const tags = [
    poder.dano ? `<span class="tag-dano">${poder.dano}</span>` : "",
    poder.circulo ? `<span class="popup-tag">Círculo: ${poder.circulo}</span>` : "",
    poder.tempo ? `<span class="popup-tag">Conjuração: ${poder.tempo}</span>` : "",
    poder.alcance ? `<span class="popup-tag">Alcance: ${poder.alcance}</span>` : "",
    poder.duracao ? `<span class="popup-tag">Duração: ${poder.duracao}</span>` : ""
  ].join("");

  const html = `
    <div class="popup-bloco">
      ${tags ? `<div class="popup-tags">${tags}</div>` : ""}

      <div style="margin-top: 12px;">
        <span class="popup-label">Descrição</span>
        <div class="popup-descricao">
          ${poder.desc || "Sem descrição"}
        </div>
      </div>
    </div>
  `;

  abrirPopup(`${icone} ${poder.nome}`, html, true, null);
}

function removerPoder(index) {
  const poder = poderes[index];
  if (!poder) return;

  const confirmar = confirm(`Remover "${poder.nome}"?`);
  if (!confirmar) return;

  poderes.splice(index, 1);
  renderPoderes();
  salvarTudo();
}

function ativarDragVida() {
  const barra = document.getElementById("hpBar");
  if (!barra) return;

  let arrastando = false;

  function atualizarPorPosicao(clientX) {
    const rect = barra.getBoundingClientRect();
    const max = get("vidaMax");

    let pos = clientX - rect.left;
    pos = Math.max(0, Math.min(pos, rect.width));

    const porcentagem = pos / rect.width;
    vidaAtual = Math.round(porcentagem * max);

    atualizarHP();
    salvarTudo();
  }

  // CLICK normal (desktop e toque rápido)
  barra.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") return;
    atualizarPorPosicao(e.clientX);
  });

  // TOUCH (celular)
  barra.addEventListener("touchstart", (e) => {
    if (e.target.tagName === "BUTTON") return;

    arrastando = true;
    atualizarPorPosicao(e.touches[0].clientX);
  }, { passive: true });

  barra.addEventListener("touchmove", (e) => {
    if (!arrastando) return;

    atualizarPorPosicao(e.touches[0].clientX);
  }, { passive: true });

  barra.addEventListener("touchend", () => {
    arrastando = false;
  });

  // MOUSE DRAG (PC também fica bom)
  barra.addEventListener("mousedown", (e) => {
    if (e.target.tagName === "BUTTON") return;

    arrastando = true;
    atualizarPorPosicao(e.clientX);
  });

  document.addEventListener("mousemove", (e) => {
    if (!arrastando) return;

    atualizarPorPosicao(e.clientX);
  });

  document.addEventListener("mouseup", () => {
    arrastando = false;
  });
}
/* ================= DT ================= */

function atualizarDT() {
  const base = parseInt(document.getElementById("dtBase")?.value) || 0;
  const atributo = parseInt(document.getElementById("dtAtributo")?.value) || 0;
  const prof = parseInt(document.getElementById("dtProf")?.value) || 0;

  const total = base + atributo + prof;
  const dtTotal = document.getElementById("dtTotal");

  if (dtTotal) dtTotal.textContent = total;
}

/* ================= VIDA ================= */

function atualizarHP() {
  const max = get("vidaMax");
  const porcentagem = max > 0 ? (vidaAtual / max) * 100 : 0;

  const fill = document.getElementById("hp-fill");
  const texto = document.getElementById("vida-texto");

  if (fill) fill.style.width = `${porcentagem}%`;
  if (texto) texto.innerText = `${vidaAtual}/${max}`;

  atualizarTotal();
}

function atualizarTemp() {
  const max = get("vidaMax");
  const porcentagem = max > 0 ? (vidaTemp / max) * 100 : 0;

  const fill = document.getElementById("temp-fill");
  const texto = document.getElementById("temp-texto");

  if (fill) fill.style.width = `${porcentagem}%`;
  if (texto) texto.innerText = vidaTemp;

  atualizarTotal();
}

function atualizarTotal() {
  const max = get("vidaMax");
  const total = vidaAtual + vidaTemp;
  const totalBox = document.querySelector(".hp-total");
  const totalEl = document.getElementById("vida-total");

  if (!totalBox || !totalEl) return;

  if (vidaTemp > 0) {
    totalBox.style.display = "block";
    totalEl.innerText = `${total}/${max}`;
  } else {
    totalBox.style.display = "none";
  }
}

function alterarVida(v) {
  const max = get("vidaMax");
  vidaAtual += v;

  if (vidaAtual > max) vidaAtual = max;
  if (vidaAtual < 0) vidaAtual = 0;

  atualizarHP();
  salvarTudo();
}

function alterarTemp(v) {
  vidaTemp += v;
  if (vidaTemp < 0) vidaTemp = 0;

  atualizarTemp();
  salvarTudo();
}

/* ================= EXAUSTÃO ================= */

function setExaustao(nivel) {
  exaustao = nivel;

  const checks = document.querySelectorAll(".exaustao-check");
  checks.forEach((el, i) => {
    el.classList.toggle("ativo", i === nivel);
  });

  const desc = document.getElementById("exaustao-desc");
  if (desc) desc.innerText = efeitosExaustao[nivel] || "Sem exaustão";

  salvarTudo();
}

/* ================= MORTE ================= */

function toggleMorte(tipo, index) {
  morte[tipo][index] = !morte[tipo][index];
  atualizarMorte();
  salvarTudo();
}

function atualizarMorte() {
  const checksSucesso = document.querySelectorAll(".morte-linha:nth-of-type(1) .morte-check");
  const checksFalha = document.querySelectorAll(".morte-linha:nth-of-type(2) .morte-check");

  checksSucesso.forEach((check, i) => {
    check.classList.toggle("ativo", !!morte.sucessos[i]);
  });

  checksFalha.forEach((check, i) => {
    check.classList.toggle("ativo", !!morte.falhas[i]);
  });
}

/* ================= SAVES ================= */

function toggleSave(attr) {
  saves[attr] = !saves[attr];
  atualizarSaves();
  atualizarBadgesSaves();
  salvarTudo();
}

function atualizarSaves() {
  ["forca", "destreza", "constituicao", "inteligencia", "sabedoria", "carisma"].forEach(attr => {
    const check = document.querySelector(`.save-check[onclick="toggleSave('${attr}')"]`);
    if (check) check.classList.toggle("ativo", !!saves[attr]);
  });
}

function atualizarBadgesSaves() {
  const bonus = get("bonusProf");
  const attrs = ["forca", "destreza", "constituicao", "inteligencia", "sabedoria", "carisma"];

  attrs.forEach(attr => {
    const badge = document.getElementById(`save_${attr}`);
    if (!badge) return;

    const valor = mod(get(attr)) + (saves[attr] ? bonus : 0);

    if (saves[attr]) {
      badge.style.display = "flex";
      badge.textContent = valor >= 0 ? `+${valor}` : `${valor}`;
    } else {
      badge.style.display = "none";
      badge.textContent = "";
    }
  });
}

/* ================= PERÍCIAS ================= */

function atualizarTudo() {
  const bonus = get("bonusProf");

  const mods = {
    forca: mod(get("forca")),
    destreza: mod(get("destreza")),
    constituicao: mod(get("constituicao")),
    inteligencia: mod(get("inteligencia")),
    sabedoria: mod(get("sabedoria")),
    carisma: mod(get("carisma"))
  };

  document.getElementById("mod_forca").innerText = mods.forca >= 0 ? `+${mods.forca}` : mods.forca;
  document.getElementById("mod_destreza").innerText = mods.destreza >= 0 ? `+${mods.destreza}` : mods.destreza;
  document.getElementById("mod_constituicao").innerText = mods.constituicao >= 0 ? `+${mods.constituicao}` : mods.constituicao;
  document.getElementById("mod_inteligencia").innerText = mods.inteligencia >= 0 ? `+${mods.inteligencia}` : mods.inteligencia;
  document.getElementById("mod_sabedoria").innerText = mods.sabedoria >= 0 ? `+${mods.sabedoria}` : mods.sabedoria;
  document.getElementById("mod_carisma").innerText = mods.carisma >= 0 ? `+${mods.carisma}` : mods.carisma;

  const lista = document.getElementById("pericias");
  if (lista) {
    lista.innerHTML = "";

    pericias.forEach(pericia => {
      let bonusFinal = 0;

      if (profs[pericia.nome] === 1) {
          bonusFinal = bonus;
      } else if (profs[pericia.nome] === 2) {
          bonusFinal = bonus * 2;
      }

const valor = mods[pericia.attr] + bonusFinal;

      const div = document.createElement("div");
      div.className = "pericia";
      div.innerHTML = `
        <label>
          <div class="check 
  ${profs[pericia.nome] === 1 ? "ativo" : ""} 
  ${profs[pericia.nome] === 2 ? "expertise" : ""}" onclick="toggleProf('${pericia.nome}', event)"></div>
          ${pericia.nome}
        </label>
        <span>${valor >= 0 ? `+${valor}` : valor}</span>
      `;
      lista.appendChild(div);
    });
  }

  atualizarBadgesSaves();
}

function toggleProf(nome, event) {
  if (event) event.stopPropagation();

  // 0 = nada | 1 = prof | 2 = expertise
  if (!profs[nome]) {
    profs[nome] = 1;
  } else if (profs[nome] === 1) {
    profs[nome] = 2;
  } else {
    profs[nome] = 0;
  }

  atualizarTudo();
  salvarTudo();
}

function limparFocoBotoesVida() {
  const botoes = document.querySelectorAll(".hp-overlay button");

  botoes.forEach(botao => {
    botao.addEventListener("click", () => {
      botao.blur();
    });

    botao.addEventListener("touchend", () => {
      botao.blur();
    }, { passive: true });

    botao.addEventListener("mouseup", () => {
      botao.blur();
    });
  });
}



function ativarDragTemp() {
  const barra = document.getElementById("tempBar");
  if (!barra) return;

  let arrastando = false;

  function atualizarPorPosicao(clientX) {
    const rect = barra.getBoundingClientRect();
    const max = get("vidaMax");

    if (max <= 0) return;

    let pos = clientX - rect.left;
    pos = Math.max(0, Math.min(pos, rect.width));

    const porcentagem = pos / rect.width;
    vidaTemp = Math.round(porcentagem * max);

    atualizarTemp();
    salvarTudo();
  }

  barra.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") return;
    atualizarPorPosicao(e.clientX);
  });

  barra.addEventListener("touchstart", (e) => {
    if (e.target.tagName === "BUTTON") return;

    arrastando = true;
    atualizarPorPosicao(e.touches[0].clientX);
  }, { passive: true });

  barra.addEventListener("touchmove", (e) => {
    if (!arrastando) return;
    atualizarPorPosicao(e.touches[0].clientX);
  }, { passive: true });

  barra.addEventListener("touchend", () => {
    arrastando = false;
  });

  barra.addEventListener("mousedown", (e) => {
    if (e.target.tagName === "BUTTON") return;

    arrastando = true;
    atualizarPorPosicao(e.clientX);
  });

  document.addEventListener("mousemove", (e) => {
    if (!arrastando) return;
    atualizarPorPosicao(e.clientX);
  });

  document.addEventListener("mouseup", () => {
    arrastando = false;
  });
}

/* ================= INIT ================= */

function init() {
  atualizarTudo();
  renderPersonagens();
  atualizarHP();
  atualizarTemp();
  atualizarMorte();
  atualizarDT();
  atualizarEstilo();
  atualizarSaves();
  atualizarBadgesSaves();
  ativarDragVida();
  ativarDragTemp();
  limparFocoBotoesVida();

  const nome = document.getElementById("nome");
  const raca = document.getElementById("raca");
  const classe = document.getElementById("classe");
  const ca = document.getElementById("ca");
  const deslocamento = document.getElementById("deslocamento");
  const idade = document.getElementById("idade");
  const altura = document.getElementById("altura");
  const vidaMax = document.getElementById("vidaMax");

  [nome, raca, classe, ca, deslocamento, idade, altura].forEach(el => {
    if (el) el.addEventListener("input", salvarTudo);
  });

  if (vidaMax) {
    vidaMax.addEventListener("input", () => {
      const max = get("vidaMax");
      if (vidaAtual > max) vidaAtual = max;
      atualizarHP();
      atualizarTemp();
      salvarTudo();
    });
  }

  const camposAutoSave = [
    "classe",
    "forca",
    "destreza",
    "constituicao",
    "inteligencia",
    "sabedoria",
    "carisma",
    "bonusProf",
    "ca",
    "deslocamento",
    "idade",
    "altura",
    "inspiracao",
    "dtBase",
    "dtAtributo",
    "dtProf"
  ];

  camposAutoSave.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener("input", () => {
      atualizarTudo();
      atualizarDT();
      salvarTudo();
    });
  });

  const popup = document.getElementById("popup");
  if (popup) {
    popup.addEventListener("click", (e) => {
      if (e.target.id === "popup") fecharPopup();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") fecharPopup();
  });

  trocarAba("personagem");
}

document.addEventListener("DOMContentLoaded", init);

/* ================= ESTILO ================= */

let pontosEstilo = 0;
const maxEstilo = 10;
let bloqueioDevilEstilo = false;

const habilidadesPorRankEstilo = {
  D: {
  nome: "Impulso Inicial",
  efeito: () => `Ao atingir seu primeiro golpe, soma ${Math.floor(get("bonusProf") / 2)} no acerto.`
},
  C: {
    nome: "Golpe Preciso",
    efeito: "Você soma sua proficiência no dano."
  },
  B: {
    nome: "Armas Aprimoradas",
    efeito: "Suas armas favoritas se tornam +1, caso já não sejam mágicas, e contam como dano mágico para superar resistências."
  },
  A: {
    nome: "Investida Brutal",
    efeito: "Seu deslocamento aumenta em 3 metros, e se você se deslocar o máximo de seu deslocamento antes de realizar um ataque, pode abdicar de um ataque para derrubar o alvo com teste de força. A DT é 8 + proficiência + sua Força."
  },
  S: {
    nome: "Esquiva Reativa",
    efeito: "Você pode gastar sua reação para usar a ação Esquiva ao ser alvo de um ataque. Se evitar algum ataque por esse efeito, pode se mover até 3 metros sem causar ataques de oportunidade."
  },
  SS: {
    nome: "Crítico Aprimorado",
    efeito: "Sua margem de crítico é reduzida em -1, e caso acerte um golpe crítico com esse efeito ativo, adiciona mais 1 dado do dano da arma e quaisquer efeitos que aumentem dano."
  },
  SSS: {
    nome: "Estilo Supremo",
    efeito: "Você alcançou o estilo máximo. Sua margem de crítico é reduzida em -2, você causa o dano máximo dos dados adicionais do crítico e, se matar um inimigo com esse efeito ativo, pode realizar um ataque adicional."
  }
};

const ordemRanksEstilo = ["D", "C", "B", "A", "S", "SS", "SSS"];

function getRankEstilo(pontos) {
  if (pontos >= 10) return "SSS";
  if (pontos >= 7) return "SS";
  if (pontos >= 5) return "S";
  if (pontos >= 4) return "A";
  if (pontos >= 3) return "B";
  if (pontos >= 2) return "C";
  if (pontos >= 1) return "D";
  return null;
}

function getDanoBaseEstilo() {
  return 5;
}

function calcularDanoEstilo() {
  const danoEl = document.getElementById("danoTotal");
  const tipoEl = document.getElementById("tipoDano");
  if (!danoEl || !tipoEl) return;

  let dano = getDanoBaseEstilo();
  let tipo = "Físico";
  const rank = getRankEstilo(pontosEstilo);
  const prof = get("bonusProf");

  // dano recebe proficiência inteira só a partir do rank C
  if (["C", "B", "A", "S", "SS", "SSS"].includes(rank)) {
    dano += prof;
  }

  if (["B", "A", "S", "SS", "SSS"].includes(rank)) {
    dano += 1;
    tipo = "Mágico";
  }

  danoEl.textContent = dano;
  tipoEl.textContent = tipo;
}

function getMetadeProf() {
  const prof = parseInt(document.getElementById("bonusProf")?.value) || 0;
  return Math.floor(prof / 2);
}

function renderHabilidadesEstilo() {
  const container = document.getElementById("habilidadesEstilo");
  if (!container) return;

  container.innerHTML = "";

  const rankAtual = getRankEstilo(pontosEstilo);
  const indexAtual = rankAtual ? ordemRanksEstilo.indexOf(rankAtual) : -1;

  ordemRanksEstilo.forEach((rank, i) => {
    const habilidade = habilidadesPorRankEstilo[rank];
    if (!habilidade) return;

    const ativo = rankAtual !== null && i <= indexAtual;

    const card = document.createElement("div");
    card.className = `habilidade-estilo-card ${ativo ? "ativo" : "bloqueado"}`;
    card.innerHTML = `
      <div class="habilidade-estilo-topo">
        <h4>${habilidade.nome}</h4>
        <span class="rank-tag-estilo">${rank}</span>
      </div>
      <p>${typeof habilidade.efeito === "function" ? habilidade.efeito() : habilidade.efeito}</p>
      ${!ativo ? `<span class="lock-estilo">🔒 Desbloqueia no rank ${rank}</span>` : ""}
    `;

    container.appendChild(card);
  });
}

function atualizarEstilo() {
  const pontosEl = document.getElementById("pontosEstilo");
  const rankEl = document.getElementById("rankEstilo");
  const barraEl = document.getElementById("progressoEstilo");

  if (!pontosEl || !rankEl || !barraEl) return;

  const rank = getRankEstilo(pontosEstilo);

  pontosEl.textContent = pontosEstilo;
  barraEl.style.width = `${(pontosEstilo / maxEstilo) * 100}%`;

  // limpa classes antigas
  rankEl.className = "";

  if (!rank) {
    rankEl.textContent = "-";
    rankEl.classList.add("sem-rank");
  } else {
    rankEl.textContent = rank;
    rankEl.classList.add(rank);
  }

  renderHabilidadesEstilo();
  calcularDanoEstilo();
}

function setPontosEstilo(valor) {
  pontosEstilo = Math.max(0, Math.min(maxEstilo, valor));
  atualizarEstilo();
  salvarTudo();
}

function acertoEstilo() {
  setPontosEstilo(pontosEstilo + 1);
}

function erroEstilo() {
  const rank = getRankEstilo(pontosEstilo);
  if (!rank) return;

  if (["D", "C", "B", "A"].includes(rank)) {
    setPontosEstilo(pontosEstilo - 1);
  } else if (["S", "SS"].includes(rank)) {
    setPontosEstilo(pontosEstilo - 2);
  } else if (rank === "SSS") {
    setPontosEstilo(pontosEstilo - 3);
  }
}

function devilEstilo() {
  if (bloqueioDevilEstilo) return;
  bloqueioDevilEstilo = true;
  setPontosEstilo(pontosEstilo + 3);
  setTimeout(() => {
    bloqueioDevilEstilo = false;
  }, 100);
}
