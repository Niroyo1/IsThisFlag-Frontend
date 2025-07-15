import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import GameScreen from './components/GameScreen';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/game" element={<GameScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
