# Gesso SMJ ERP — v18

Alterações:

- Orçamentos: opção `+ Cadastrar novo serviço` dentro da seleção de serviços.
- Novo serviço fica salvo na tabela de preços do app via localStorage.
- Editar serviço lançado no orçamento agora abre em modal/balão.
- Mantidas as funções da v17: dashboard central, PDF, backup, agenda, obras e auto-salvamento do orçamento.

Como atualizar Android:

```cmd
npm install --registry=https://registry.npmjs.org/
npm run build
npx cap sync android
```

Se ainda não tiver a pasta Android:

```cmd
npx cap add android
npx cap sync android
```
