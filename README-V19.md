# Gesso SMJ ERP — v19

Alterações básicas desta versão:

- Adicionada imagem oficial em `resources/icon.png` para usar como ícone do APK.
- Obra aprovada agora pode ser marcada como **Iniciada** e **Finalizada**.
- Tela de Obras permite **ver**, **alterar** e **salvar** a lista de material por obra.
- Lista de material pode ser baixada/compartilhada em arquivo `.txt`.
- Botão para baixar material do estoque continua disponível.

## Para aplicar o ícone no Android

Depois de instalar dependências:

```bash
npm install --registry=https://registry.npmjs.org/
npm run android:icon
npm run build
npx cap sync android
```

Se ainda não tiver a pasta Android:

```bash
npx cap add android
npm run android:icon
npx cap sync android
```
