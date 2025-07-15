import { CreateGameForm } from './CreateGameForm';
import { JoinGameForm } from './JoinGameForm';

function Home() {

  return (
    <div className="min-h-screen steppedGradient">
      <div className="flex flex-col items-center justify-center gap-12 py-20 px-6">
        <CreateGameForm />
        <JoinGameForm/>
      </div>
    </div>
  );
}

export default Home;

