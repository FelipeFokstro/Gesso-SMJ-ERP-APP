# Gesso SMJ ERP - v15 PDF Android

Alterações da v15:

- O botão Compartilhar em Orçamentos agora gera PDF real do orçamento.
- O PDF inclui logo, número do orçamento, data, cliente, medições, valores, desconto/acréscimo, total, observações, contatos e endereço da fábrica.
- No Android, o PDF é salvo em Documents/GessoSMJ e depois abre o compartilhamento nativo.
- No navegador, o PDF é baixado automaticamente.
- A geração de imagem PNG ficou como fallback caso o PDF falhe.
- Adicionado `jspdf` para gerar PDF.
- Adicionado `@capacitor/cli` ao package.json.

Comandos recomendados:

```cmd
npm install --registry=https://registry.npmjs.org/
npm run build
npx cap add android
npx cap sync android
```

Se a pasta android já existir, pule o `npx cap add android` e rode somente:

```cmd
npm run build
npx cap sync android
```

No Android Studio, desinstale o app antigo do celular antes de testar novamente.
