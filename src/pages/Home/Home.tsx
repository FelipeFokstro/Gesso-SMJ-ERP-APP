import Button from '../../components/Button';
import Card from '../../components/Card';
import MainLayout from '../../layouts/MainLayout';

export default function Home() {
  return (
    <MainLayout>
      <h1>Home</h1>

      <Card
        title="Resumo do dia"
        subtitle="Visão geral do sistema"
      >
        <p>Clientes, orçamentos e estoque aparecerão aqui.</p>
      </Card>

      <br />

      <Button>Botão Primário</Button>

      <br />
      <br />

      <Button variant="secondary">
        Botão Secundário
      </Button>

      <br />
      <br />

      <Button variant="danger">
        Botão Perigo
      </Button>

      <br />
      <br />

      <Button variant="outline" fullWidth>
        Botão Outline Full
      </Button>
    </MainLayout>
  );
}