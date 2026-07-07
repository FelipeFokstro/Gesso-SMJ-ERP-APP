# Gesso SMJ ERP - v16 orçamento completo

Alterações:
- Aba Orçamentos adicionada ao menu inferior.
- Novo orçamento mantém rascunho salvo automaticamente no localStorage.
- Ao sair e voltar para Orçamentos, o rascunho em andamento volta automaticamente.
- Adicionar serviço ao orçamento.
- Editar serviço já adicionado ao orçamento.
- Remover serviço com confirmação.
- Editar orçamento salvo mantendo numeração.
- Aprovar orçamento abre mini calendário para escolher data/hora.
- Após aprovar, a obra aparece automaticamente em Obras e Agenda por usar os orçamentos aprovados como base.
- Mantidas correções anteriores de PDF, backup, logo, Android e layout mobile.

Comandos sugeridos:

npm install --registry=https://registry.npmjs.org/
npm run build
npx cap add android   # só se a pasta android ainda não existir
npx cap sync android
npx cap open android
