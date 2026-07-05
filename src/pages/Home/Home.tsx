import Button from '../../components/Button';
import MainLayout from '../../layouts/MainLayout';

export default function Home() {
  return (
    <MainLayout>
      <h1>Home</h1>

      <Button>Botão Primário</Button>

      <br />
      <br />

      <Button variant="secondary">Botão Secundário</Button>

      <br />
      <br />

      <Button variant="danger">Botão Perigo</Button>

      <br />
      <br />

      <Button variant="outline" fullWidth>
        Botão Outline Full
      </Button>
    </MainLayout>
  );
}