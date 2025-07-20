import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { socket } from '../../lib/socket';

function GameScreen() {

  //#region Consts
  const location = useLocation();
  const { user, game: initialGame } = location.state || {};
  const [game, setGame] = useState(initialGame);
  const [gameReady, setGameReady] = useState(true);
  const [question, setQuestion] = useState('');
  const [guessedCountry, setGuessedCountry] = useState('');
  const [lastResponse, setLastResponse] = useState<null | boolean>(null);
  const [countdown, setCountdown] = useState(10);
  const [winner, setWinner] = useState<string | null>(null);
  const [gameStatus, setGameStatus] = useState<'waiting' | 'asking' | 'answering' | 'showing_answer' | 'failed_guessing' | 'end'>(initialGame?.status || 'waiting');
  
  const opponent = game.players.find((p: any) => (p._id || p.id) !== user._id);
  const myCountry = user && user.country ? user.country : '';
  //#endregion

  useEffect(() => {
    if (!user) return;

    const updateHandler = (updatedGame: any) => {

      setGameReady(false);
      setGame(updatedGame);

      requestAnimationFrame(() => {
        setGameStatus(updatedGame.status);
        setGameReady(true);
      });
      
      if (updatedGame.winner) {
        setGuessedCountry(updatedGame.lastGuessedResponse);
        
        const winnerPlayer = updatedGame.players.find((p: any) => p._id === updatedGame.winner || p.id === updatedGame.winner);
        setWinner(winnerPlayer ? winnerPlayer.username : '');
      }

      const currentQuestion = updatedGame.questions.length === updatedGame.round
        ? updatedGame.questions[updatedGame.questions.length - 1]
        : null;

      if(updatedGame.lastGuessedFailed)
      {
        setGuessedCountry(updatedGame.guessedResponse);

        const interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setTimeout(() => {
          setCountdown(10);
          socket.emit('change_turn', { game_id: game._id });
        }, 10000);
      }

      if (currentQuestion && currentQuestion.hasResponse) {
        setLastResponse(currentQuestion.response);
        setCountdown(10);
        const interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setTimeout(() => {
          setCountdown(10);
          setLastResponse(null);
        }, 10000);
      }
      
    };

    socket.on('game_updated', updateHandler);

    return () => {
      socket.off('game_updated');
    };

  }, [user]);

  //#region Arrows
  const isMyTurn = () => {
    if(user.isHost && game.hostTurn)
      return true;

    if(!user.isHost && !game.hostTurn)
      return true;

    return false;
  };

  const currentQuestion = () =>{
    if (game.questions.length === game.round)
      return game.questions[game.questions.length - 1];

    return null;
  }

  const currentQuestionText = () => {
    const lastQ = currentQuestion();
    if(lastQ !== null)
      return lastQ.text;

    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(game.code);
    } catch {
      alert('Failed to copy');
    }
  };

  const handleAsk = () => {
    if (question.trim()) {
      socket.emit('ask_question', { game_id: game._id, question: question, author: user._id, });
      setQuestion('');
      setLastResponse(null);
    }
  };

  const handleAnswer = (answer: boolean) => {
    socket.emit('answer_question', {
      game_id: game._id,
      response: answer,
    });
    setTimeout(() => {
      socket.emit('change_turn', { game_id: game._id });
    }, 10000);
  };

  const normalize = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
  };

  const handleGuessedCountry = () => {
    if (guessedCountry.trim()) {
      const guessNorm = normalize(guessedCountry);
      const countryNorm = normalize(opponent.country.name);
      let match = guessNorm === countryNorm;

      if (!match && opponent.country.nameVariants && Array.isArray(opponent.country.nameVariants)) {
        for (const variant of opponent.country.nameVariants) {
          if (normalize(variant) === guessNorm) {
            match = true;
            break;
          }
        }
      }

      if (match) {
        socket.emit('flag_guessed', {
          game_id: game._id,
          win: true,
          winner: user._id,
          lastGuessedResponse: guessedCountry,
        });
      } else {
        socket.emit('flag_guessed', {
          game_id: game._id,
          win: false,
          lastGuessedResponse: guessedCountry,
        });
      }
    }
  };
  //#endregion

  //#region Conditions 
  const showAskAndGuess = gameReady && isMyTurn() && gameStatus === 'asking';
  const waitingForAnswer = gameReady && isMyTurn() && gameStatus === 'answering';
  const showQuestion = gameReady && !isMyTurn() && (gameStatus === 'answering' || gameStatus === 'asking');
  const showAnswerResult = gameReady && gameStatus === 'showing_answer';
  const failedGuess = gameReady && isMyTurn() && gameStatus === 'failed_guessing';
  const enemyFailedGuess = gameReady && !isMyTurn() && gameStatus === 'failed_guessing';
  const showWinner = gameReady && gameStatus === 'end';
  //#endregion

  return (
    <div className="min-h-screen !overflow-auto steppedGradient text-white flex flex-col items-center py-8 px-6 gap-5">

      {/*Waiting for rival*/}
      {gameStatus === 'waiting' ? (
        <div className="text-center flex flex-col items-center py-4 bg-EerieBlack rounded-2xl shadow-lg ">
          <h2 className="text-2xl py-5 px-4 font-bold">Waiting for opponent...</h2>
          <div className="flex flex-col gap-2 items-center pt-2">
            <p className="text-lg text-gray-50">Game Code:</p>
            <span className="italic text-lg rounded bg-BattleShipGrey px-3 py-1 text-gray-50">{game.code}</span>
            <button
              onClick={handleCopy}
              className="bg-Turquoise hover:bg-Jonquil !mt-4 !mb-2 px-30 py-1 rounded !text-lg text-black "
            >
              Copy
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-2xl text-center flex flex-col items-center">
          {myCountry && (
            <>
              <p className="text-2xl font-bold mb-2">{myCountry.name}</p>
              <img src={myCountry.flagUrl} className="w-full max-w-2xs mb-14 px-4 rounded " />
            </>
          )}
          {showAskAndGuess && (
            <>
              <p className="text-lg text-white">It's your turn! Ask a (y/n) question or guess the flag country.</p>
              <div className="flex flex-col items-center mt-4 gap-6 px-6 py-8 rounded-2xl bg-EerieBlack">
                <textarea
                  placeholder="Does this..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="px-2 py-1.5 !mx-4 rounded bg-BattleShipGrey placeholder-gray-50 resize-none overflow-hidden"
                  rows={1}
                  onInput={(e) => {
                    e.currentTarget.style.height = "auto";
                    e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                  }}
                />
                <button
                  onClick={handleAsk}
                  className="bg-Turquoise hover:bg-Jonquil text-EerieBlack rounded hover:brightness-150 px-4 py-1 !text-lg !w-full"
                >
                  Ask
                </button>

                <textarea
                  placeholder="Is this flag..."
                  value={guessedCountry}
                  onChange={(e) => setGuessedCountry(e.target.value)}
                  className="!mt-6 px-2 py-1.5 !mx-4 rounded bg-BattleShipGrey placeholder-gray-50 resize-none overflow-hidden"
                  rows={1}
                  onInput={(e) => {
                    e.currentTarget.style.height = "auto";
                    e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
                  }}
                />
                <button
                  onClick={handleGuessedCountry}
                  className="bg-Turquoise hover:bg-Jonquil text-EerieBlack rounded hover:brightness-150 px-4 py-1 !text-lg !w-full"
                >
                  Guess
                </button>
              </div>
            </>
          )}
          {waitingForAnswer &&(
            <div className="flex flex-col gap-4">
              <p className="text-lg font-semibold px-4 text-white">Waiting for {opponent.username} answer...</p>
            </div>
          )}
          {showWinner && (
            <div className="flex flex-col gap-4 text-white p-2">
              <p className="text-lg font-bold">{winner} wins!</p>
              <p className="text-lg font-bold">The country's flag is {guessedCountry}</p>
            </div>
          )}
          {failedGuess && (
            <div className="flex flex-col gap-4 text-white bg-EerieBlack rounded-2xl p-2 mx-2">
              <p className="text-lg font-bold">Nope!</p>
              <p className="text-lg font-bold">The country's flag is not {guessedCountry}</p>
              <p className="text-md italic text-gray-50">next turn in: {countdown}</p>
            </div>
          )}
          {enemyFailedGuess && (
            <div className="flex flex-col gap-4 text-white bg-EerieBlack rounded-2xl p-2 mx-2">
              <p className="text-lg font-bold">The opponent thought it was {guessedCountry} and failed miserably.</p>
              <p className="text-md italic text-gray-50">next turn in: {countdown}</p>
            </div>
          )}
          {showAnswerResult && (
            <div className="flex flex-col gap-4 text-white rounded-2xl p-2 mx-2">
              <p className="text-lg font-semibold">{isMyTurn() ? `${user.username} asked:` : `${opponent.username} asked:`}</p>
              <p className="text-lg px-4">{currentQuestionText()}</p>
              <p className="text-xl font-bold">{lastResponse ? 'Yes' : 'No'}</p>
              <p className="text-md mt-4 italic text-gray-50">next turn in: {countdown}</p>
            </div>
          )}
          {showQuestion &&(
            <div className="flex flex-col gap-4 text-EerieBlack">
              {currentQuestionText() && (
                <p className="text-lg font-semibold px-4 text-white">{opponent.username} asks:</p>
              )}
              <p className="text-lg font-semibold px-4 text-white"> { currentQuestionText() || `Waiting for ${opponent.username}...`}</p>
              {currentQuestionText() && (
                <>
                  <div className="flex flex-col items-center mt-4 gap-6 px-6 py-8 rounded-2xl bg-EerieBlack !min-w-xs">
                    <button
                      onClick={() => handleAnswer(true)}
                      className="bg-Turquoise rounded hover:bg-Jonquil px-4 py-1 !text-lg !w-full"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => handleAnswer(false)}
                      className="bg-Turquoise rounded hover:bg-Jonquil px-4 py-1 !text-lg !w-full"
                    >
                      No
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
);
}

export default GameScreen;