/**
 * VoxAI, versão da CLÍNICA ESCOLA: coleta opt-in do teste aplicado na clínica.
 *
 * É o mesmo script do site público (voxai/coleta-apps-script.gs), mas roda como um
 * projeto à parte e grava na aba "clinica" da planilha do público. Mudam a planilha
 * (aberta pelo ID), a aba, a pasta dos áudios, a coluna do código do paciente e o
 * doGet, que se identifica e confere a aba.
 *
 * Crie o projeto em script.google.com → Novo projeto, logado na conta dona da planilha.
 * NÃO use Extensões → Apps Script dentro da planilha: esse menu abre o script do site
 * público, e colar este código por cima apagaria o dele.
 *
 * Recebe o POST do voxai-clinica/index.html e grava:
 *   - uma linha na planilha (questionário + 20 medidas + grau), identificada por um ID aleatório;
 *   - o áudio da tarefa (vogal + contagem concatenadas) numa pasta do Drive, como <ID>.wav.
 * O ID é a única ligação entre a linha e o arquivo — não recebemos nome, e-mail nem IP.
 *
 * COMO PUBLICAR
 *   Primeira vez: Implantar → Nova implantação → Tipo: App da Web
 *     Executar como: Eu   ·   Quem tem acesso: Qualquer pessoa
 *   A cada edição: Implantar → Gerenciar implantações → lápis → Versão: Nova versão.
 *     Assim a URL /exec continua a mesma. Sem isso, ela segue rodando a versão antiga,
 *     e uma "Nova implantação" criaria outra URL, que o site não usa.
 *
 * Na primeira execução o Apps Script pede autorização para Planilhas e Drive.
 */

// ID da planilha do site público, onde fica a aba da clínica: o trecho do link entre
// "/d/" e "/edit". Fica vazio aqui porque o repositório é público; preencha só no
// editor do Apps Script.
var PLANILHA_ID = "";
// Aba da clínica, ao lado da aba do público. É criada com o cabeçalho na primeira
// execução. Não use o nome da aba do público. Se as colunas mudarem, apague ou
// renomeie a aba antes: o script não grava numa aba com cabeçalho diferente.
var ABA = "clinica";
// Pasta do Drive onde os áudios são gravados (criada na primeira vez, se não existir).
// A pasta é achada pelo nome. Com o nome do site público ("VoxAI - audios"), os áudios
// da clínica cairiam na mesma pasta dos áudios do público.
var PASTA_AUDIOS = "VoxAI clinica escola - audios";

var FEATURES = [
  "f0media", "f0dp", "f0q1", "f0CV", "jitterLoc", "jitterABS", "jitterPPQ5",
  "shimmerLoc", "shimmerdB", "CPP", "CPPS", "H1A3", "GNE1000HZ", "GNE2000HZ",
  "GNE3000HZ", "Hfno", "HNRmedia", "HNRdp", "HNRD", "SNL100_3000HZ"
];

var COLUNAS = ["data", "codigo_paciente", "id", "genero", "idade", "foraFaixa", "profissaoUsaVoz",
               "queixaVocal", "esforcoVocal", "rouquidao",
               "grau", "grau_rotulo", "score_GG"]
              .concat(FEATURES)
              .concat(["audio_arquivo", "audio_link"]);

function doPost(e) {
  try {
    var dados = JSON.parse(e.postData.contents);
    var aba = pegaAba_();
    var id = String(dados.id || Utilities.getUuid()).replace(/[^A-Za-z0-9_-]/g, "");

    var audioNome = "";
    var audioLink = "";
    if (dados.audio_wav_b64) {
      var arquivo = salvaAudio_(id, dados.audio_wav_b64);
      audioNome = arquivo.getName();
      audioLink = arquivo.getUrl();
    }

    // O código do paciente entra como texto (o apóstrofo não aparece na célula). Sem ele,
    // a planilha transformaria "000452" em 452 e um código começado por "=" em fórmula.
    var codigo = String(dados.codigo_paciente || "").trim().slice(0, 40);

    var feats = dados.features || {};
    var linha = [
      new Date(), codigo ? "'" + codigo : "", id, dados.genero || "", dados.idade,
      dados.foraFaixa ? "sim" : "nao",
      dados.profissaoUsaVoz || "", dados.queixaVocal || "",
      dados.esforcoVocal || "", dados.rouquidao || "",
      dados.grau, dados.grau_rotulo || "", dados.score_GG
    ];
    FEATURES.forEach(function (k) {
      var v = feats[k];
      linha.push(v === null || v === undefined ? "" : v);
    });
    linha.push(audioNome, audioLink);

    aba.appendRow(linha);
    return json_({ ok: true, id: id, audio: audioNome });
  } catch (err) {
    return json_({ ok: false, erro: String(err) });
  }
}

function doGet() {
  // Nome próprio para dar para conferir, abrindo a URL, que ela é a da clínica. Também
  // confere a aba, sem gravar resposta nenhuma: com o cabeçalho errado os envios falham,
  // e o site não percebe, porque não lê a resposta do POST.
  var resp = { ok: true, servico: "voxai-clinica-coleta", colunas: COLUNAS.length, aba: "ok" };
  try {
    pegaAba_();
  } catch (err) {
    resp.ok = false;
    resp.aba = String(err);
  }
  return json_(resp);
}

/**
 * Rode esta função UMA VEZ no editor (botão Executar) depois de colar o código.
 * Ela dispara o pedido de autorização do Drive — que o deploy sozinho não faz — e
 * confirma no log que dá para criar a pasta e gravar arquivo. Apaga o que criou.
 */
function autorizar() {
  var pasta = pegaPasta_(PASTA_AUDIOS);
  var arq = pasta.createFile(Utilities.newBlob("teste", "text/plain", "_teste_permissao.txt"));
  arq.setTrashed(true);
  Logger.log("Drive OK — pasta '%s' pronta em %s", pasta.getName(), pasta.getUrl());
  Logger.log("Planilha OK — aba '%s'", pegaAba_().getName());
}

/**
 * Aba de respostas, criando o cabeçalho na primeira vez.
 * Se a aba já existir com outro cabeçalho, para com erro em vez de anexar linhas
 * desalinhadas (foi o que aconteceria ao reaproveitar a aba antiga).
 */
function pegaAba_() {
  // Sem o ID não há planilha vinculada a que recorrer: o projeto da clínica é avulso.
  if (!PLANILHA_ID) {
    throw new Error("Preencha PLANILHA_ID com o ID da planilha (o trecho do link entre /d/ e /edit).");
  }
  var ss = SpreadsheetApp.openById(PLANILHA_ID);
  var aba = ss.getSheetByName(ABA) || ss.insertSheet(ABA);
  if (aba.getLastRow() === 0) {
    aba.appendRow(COLUNAS);
    aba.setFrozenRows(1);
    return aba;
  }
  var atual = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0];
  if (atual.join("|") !== COLUNAS.join("|")) {
    throw new Error("A aba '" + ABA + "' tem um cabecalho diferente do esperado. "
                  + "Renomeie-a ou troque a constante ABA, para nao misturar formatos.");
  }
  return aba;
}

/** Grava o WAV recebido em base64 na pasta de áudios e devolve o arquivo. */
function salvaAudio_(id, b64) {
  var pasta = pegaPasta_(PASTA_AUDIOS);
  var bytes = Utilities.base64Decode(b64);
  var blob = Utilities.newBlob(bytes, "audio/wav", id + ".wav");
  return pasta.createFile(blob);
}

function pegaPasta_(nome) {
  var it = DriveApp.getFoldersByName(nome);
  return it.hasNext() ? it.next() : DriveApp.createFolder(nome);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
                       .setMimeType(ContentService.MimeType.JSON);
}
