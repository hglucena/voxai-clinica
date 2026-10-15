# VoxAI · clínica escola

Versão do teste do VoxAI usada na clínica escola. Grava numa aba própria da planilha
de coleta, separada da aba do site público, por um script próprio.

Endereço: https://hglucena.github.io/voxai-clinica/

O APK do VoxAI abre só o site público. Na clínica, o teste é feito pelo navegador,
neste endereço.

## Diferenças em relação ao teste público

O `index.html` daqui é uma cópia do `teste.html` do repositório
[voxai](https://github.com/hglucena/voxai), com estas mudanças:

- `COLETA_URL` aponta para o Apps Script da clínica, não para o do site.
- A página roda sempre no modo fechado do app (`data-app`): some o "Voltar ao site" e
  o "Sobre o projeto", e o logo do topo não reinicia o teste.
- Selo "Clínica escola" no topo, para quem aplica o teste conferir que está na versão
  certa.
- `noindex`, para o site não aparecer em buscadores.
- Pergunta obrigatória "Número/código do paciente" no começo do questionário. É por
  esse código que a equipe liga cada teste à avaliação do paciente. O botão de
  continuar só libera com ele preenchido, e o texto do consentimento avisa que o
  código é guardado.

Mudanças no modelo e no extrator chegam aqui sem fazer nada, porque as duas versões
usam as mesmas APIs. Já uma correção no `teste.html` do site público precisa ser
copiada para cá à mão, mantendo as diferenças acima.

## Planilha

Os dados da clínica ficam na aba `clinica` da mesma planilha do site público. Quem
grava nela é um projeto de Apps Script à parte, com o código de
`coleta-apps-script.gs`. O script do site público não é tocado.

Em relação ao script do público, o da clínica muda nestes pontos:

- abre a planilha pelo ID (`PLANILHA_ID`), porque não fica vinculado a ela;
- grava na aba `clinica`;
- grava o código do paciente na coluna B (`codigo_paciente`), como texto, para não
  perder zeros à esquerda;
- guarda os áudios em outra pasta do Drive (`VoxAI clinica escola - audios`);
- o `doGet` responde `voxai-clinica-coleta` e confere a aba sem gravar resposta
  nenhuma. Abrindo a URL no navegador, dá para ver que ela é a da clínica e se a aba
  está pronta (`"aba": "ok"`).

O ID da planilha não está no repositório, que é público. Ele é preenchido só no editor
do Apps Script.

Para publicar:

1. Logado na conta Google dona da planilha, abrir script.google.com → Novo projeto.
   Não usar Extensões → Apps Script dentro da planilha: esse menu abre o script do
   site público, e colar o código por cima apagaria o dele.
2. Apagar o código que vem pronto e colar o conteúdo de `coleta-apps-script.gs`.
3. Preencher `PLANILHA_ID` com o trecho do link da planilha entre `/d/` e `/edit`, e
   salvar.
4. Escolher a função `autorizar` e clicar em Executar. Aceitar as permissões de
   Planilhas e Drive. Se aparecer o aviso de app não verificado, clicar em Avançado e
   depois em "Acessar". A aba `clinica` aparece na planilha nessa hora.
5. Implantar → Nova implantação → App da Web, com "Executar como: Eu" e "Quem tem
   acesso: Qualquer pessoa" (não a opção "Qualquer pessoa com Conta do Google", que
   dá erro 401).
6. Copiar a URL que termina em `/exec` para o `COLETA_URL` do `index.html`.

## Depois de editar o script

Toda edição no script só vale depois de publicar uma nova versão no mesmo endereço:
Implantar → Gerenciar implantações → lápis (Editar) → Versão: Nova versão →
Implantar. "Nova implantação" cria uma URL diferente, e o site continuaria mandando
para a antiga.

Se a edição mudar as colunas, apague ou renomeie a aba `clinica` antes e rode
`autorizar`, que cria a aba de novo com o cabeçalho certo. O script não grava numa aba
com cabeçalho diferente, e o site não percebe a falha. Para conferir, abra a URL `/exec`
no navegador: a resposta precisa ter `"aba": "ok"`.
