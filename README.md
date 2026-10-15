# VoxAI · clínica escola

Versão do teste do VoxAI usada na clínica escola. Grava numa planilha própria,
separada da coleta do site público.

Endereço: https://hglucena.github.io/voxai-clinica/

O APK do VoxAI abre só o site público. Na clínica, o teste é feito pelo navegador,
neste endereço.

## Diferenças em relação ao teste público

O `index.html` daqui é uma cópia do `teste.html` do repositório
[voxai](https://github.com/hglucena/voxai), com estas mudanças:

- `COLETA_URL` aponta para o Apps Script da planilha da clínica, não para o do site.
- A página roda sempre no modo fechado do app (`data-app`): some o "Voltar ao site" e
  o "Sobre o projeto", e o logo do topo não reinicia o teste.
- Selo "Clínica escola" no topo, para quem aplica o teste conferir que está na versão
  certa.
- `noindex`, para o site não aparecer em buscadores.

Mudanças no modelo e no extrator chegam aqui sem fazer nada, porque as duas versões
usam as mesmas APIs. Já uma correção no `teste.html` do site público precisa ser
copiada para cá à mão, mantendo as diferenças acima.

## Planilha

O script é o `coleta-apps-script.gs`. É o mesmo do site público, com duas diferenças:
os áudios vão para outra pasta do Drive (`VoxAI clinica escola - audios`) e o `doGet`
responde `voxai-clinica-coleta`, o que permite conferir, abrindo a URL no navegador,
que ela é a da clínica.

Para publicar:

1. Criar uma planilha nova no Google Drive e abrir Extensões → Apps Script.
2. Apagar o código que vem pronto, colar o conteúdo de `coleta-apps-script.gs` e salvar.
3. Escolher a função `autorizar` e clicar em Executar. Aceitar as permissões de
   Planilhas e Drive. Se aparecer o aviso de app não verificado, clicar em Avançado e
   depois em "Acessar".
4. Implantar → Nova implantação → App da Web, com "Executar como: Eu" e "Quem tem
   acesso: Qualquer pessoa" (não a opção "Qualquer pessoa com Conta do Google", que
   dá erro 401).
5. Copiar a URL que termina em `/exec` para o `COLETA_URL` do `index.html`.

Toda edição no script exige uma nova implantação. Sem isso, a URL continua rodando a
versão antiga.
