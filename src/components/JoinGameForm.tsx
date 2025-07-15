import { useState } from 'react';
import { socket } from '../../lib/socket';
import { useNavigate } from 'react-router-dom';

interface JoinRoomResponse {
  success: boolean;
  user?: any;
  game?: any;
  error?: string;
}

export function JoinGameForm() {
  const [username, setUsername] = useState('');
  const [joining, setJoining] = useState(false);
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (username.trim() && code.trim()) {
      setJoining(true);
      socket.emit('join_room', { code, username }, (response: JoinRoomResponse) => {
        setJoining(false);
        if (response.success && response.user && response.game) {
          navigate('/game', { state: { user: response.user, game: response.game } });
        }
        else
        {
          console.log(JSON.stringify(response));
        }
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-EerieBlack text-white rounded-xl shadow-lg w-full max-w-lg">
      <h2 className="text-2xl font-bold text-center">Join Game</h2>
      <input
        type="text"
        placeholder="Username"
        className="!my-2 !mx-3 px-2 py-1 rounded bg-BattleShipGrey placeholder-gray-50"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="text"
        placeholder="Game Code"
        className="!mb-2 !mx-3 px-2 py-1 rounded bg-BattleShipGrey placeholder-gray-50"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button
        className="!text-xl bg-Turquoise hover:bg-Jonquil text-black py-1 px-4 rounded"
        onClick={handleSubmit}
      >
        {joining ? 'Joining...' : 'Join'}
      </button>
    </div>
  );
}
