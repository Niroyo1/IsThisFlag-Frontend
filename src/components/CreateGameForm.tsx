import { useState } from 'react';
import { socket } from '../../lib/socket';
import { useNavigate } from 'react-router-dom';

interface CreateRoomResponse {
  success: boolean;
  user?: any;
  game?: any;
  error?: string;
}

export function CreateGameForm() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = () => {
    setError('');
    if (username.trim()) {
      setLoading(true);
      socket.emit('create_room', { username }, (response: CreateRoomResponse) => {
        setLoading(false);
        if (response.success && response.user && response.game) {
          navigate('/game', { state: { user: response.user, game: response.game } });
        } else {
          setError(response.error || 'Error creating room');
        }
      });
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-EerieBlack text-white rounded-2xl shadow-lg w-full max-w-lg">
      <h2 className="text-2xl font-bold text-center">Create Game</h2>
      <input
        type="text"
        placeholder="Username"
        className="!my-2 !mx-3 px-2 py-1 rounded bg-BattleShipGrey placeholder-gray-50"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={loading}
      />
      <button
        className="!text-xl rounded bg-Turquoise hover:bg-Jonquil text-black py-1 !m-0"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create'}
      </button>
      {error && <div className="text-white text-center">{error}</div>}
    </div>
  );
}
