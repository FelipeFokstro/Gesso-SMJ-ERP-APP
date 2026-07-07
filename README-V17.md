# Gesso SMJ ERP - v17 Dashboard Central

Alterações:
- Removidos os botões duplicados do Dashboard.
- Dashboard virou central de comando: Hoje, Financeiro, Orçamentos, Estoque e Resumo do mês.
- Adicionado botão flutuante + com ações rápidas.
- Mantidas as funções da v16.1.

Para atualizar no Android:

```cmd
npm install --registry=https://registry.npmjs.org/
npm install jspdf @capacitor/core @capacitor/android @capacitor/filesystem @capacitor/share
npm install -D @capacitor/cli
npm run build
npx cap sync android
```

Se ainda não existir pasta android:

```cmd
npx cap add android
npx cap sync android
```
