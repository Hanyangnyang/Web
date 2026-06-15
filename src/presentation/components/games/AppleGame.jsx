import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Trophy, Clock, Zap, ArrowLeft, HelpCircle } from 'lucide-react';

const ROWS = 12;
const COLS = 8;
const GAME_DURATION = 120; // 2 minutes

// Generate a random number between 1 and 9
const getRandomApple = () => Math.floor(Math.random() * 9) + 1;

// Initialize grid with random numbers
const generateInitialGrid = () => {
  const grid = [];
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      row.push(getRandomApple());
    }
    grid.push(row);
  }
  return grid;
};

// Apple shape vector component
function AppleShape({ val, isSelected }) {
  // All apples are red
  const appleColor = '#ef4444';
  const appleBorder = '#dc2626';

  return (
    <div className={`w-full h-full relative flex items-center justify-center transition-all duration-75 ${isSelected ? 'scale-105' : ''}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full select-none pointer-events-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.12)]">
        {/* Stem */}
        <path d="M50 20 C 52 10, 58 5, 62 10 C 58 12, 54 16, 50 20 Z" fill="#78350f" />
        {/* Leaf */}
        <path d="M50 15 C 40 5, 28 8, 25 15 C 32 18, 45 18, 50 15 Z" fill="#15803d" />
        {/* Apple body */}
        <path 
          d="M50 22 C 35 22, 20 30, 20 50 C 20 70, 35 85, 48 85 C 49 85, 49.5 84, 50 84 C 50.5 84, 51 85, 52 85 C 65 85, 80 70, 80 50 C 80 30, 65 22, 50 22 Z" 
          fill={appleColor} 
          stroke={isSelected ? '#3b82f6' : appleBorder} 
          strokeWidth={isSelected ? '6' : '1.5'}
          className="transition-all duration-75"
        />
        {/* Highlight/Gloss */}
        <ellipse cx="35" cy="38" rx="6" ry="10" transform="rotate(-30 35 38)" fill="#ffffff" opacity="0.4" />
        {/* Number */}
        <text 
          x="50" 
          y="62" 
          fontFamily="HakgyoansimDunggeunmiso, Pretendard, sans-serif" 
          fontWeight="900" 
          fontSize="36" 
          fill="#ffffff" 
          textAnchor="middle"
        >
          {val}
        </text>
      </svg>
    </div>
  );
}

export function AppleGame({ onBack }) {
  const [gameState, setGameState] = useState('lobby'); // 'lobby' | 'playing' | 'gameover'
  const [grid, setGrid] = useState([]);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('apple_game_highscore') || '0', 10);
  });
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  
  // Drag states
  const [isDragging, setIsDragging] = useState(false);
  const [startCell, setStartCell] = useState(null); // { row, col }
  const [currentCell, setCurrentCell] = useState(null); // { row, col }
  
  // Particles / animations
  const [particles, setParticles] = useState([]);
  const [justClearedCells, setJustClearedCells] = useState([]); // Array of {row, col}
  
  const gridRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize high score
  useEffect(() => {
    const saved = localStorage.getItem('apple_game_highscore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Timer hook
  useEffect(() => {
    if (gameState === 'playing') {
      setTimeLeft(GAME_DURATION);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setGameState('gameover');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  // Update high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('apple_game_highscore', score.toString());
    }
  }, [score, highScore]);

  // Start the game
  const startGame = () => {
    setGrid(generateInitialGrid());
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setGameState('playing');
    setJustClearedCells([]);
    setParticles([]);
  };

  // Get selection rectangle boundaries
  const getSelectionBounds = () => {
    if (!startCell || !currentCell) return null;
    return {
      minRow: Math.min(startCell.row, currentCell.row),
      maxRow: Math.max(startCell.row, currentCell.row),
      minCol: Math.min(startCell.col, currentCell.col),
      maxCol: Math.max(startCell.col, currentCell.col),
    };
  };

  // Check if a cell is inside the selection bounds
  const isCellSelected = (row, col) => {
    const bounds = getSelectionBounds();
    if (!bounds) return false;
    return (
      row >= bounds.minRow &&
      row <= bounds.maxRow &&
      col >= bounds.minCol &&
      col <= bounds.maxCol
    );
  };

  // Calculate the sum of the currently selected apples
  const getSelectedSum = () => {
    const bounds = getSelectionBounds();
    if (!bounds) return 0;
    let sum = 0;
    for (let r = bounds.minRow; r <= bounds.maxRow; r++) {
      for (let c = bounds.minCol; c <= bounds.maxCol; c++) {
        if (grid[r] && grid[r][c] !== null) {
          sum += grid[r][c];
        }
      }
    }
    return sum;
  };

  // Handle Drag Start
  const handleDragStart = (row, col) => {
    if (gameState !== 'playing' || grid[row][col] === null) return;
    setIsDragging(true);
    setStartCell({ row, col });
    setCurrentCell({ row, col });
  };

  // Handle Mouse Hover (Desktop)
  const handleMouseEnter = (row, col) => {
    if (!isDragging) return;
    setCurrentCell({ row, col });
  };

  // Touch Move Handler (Mobile)
  const handleTouchMove = (e) => {
    if (!isDragging || !gridRef.current) return;
    const touch = e.touches[0];
    const rect = gridRef.current.getBoundingClientRect();
    
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    // Bounds check
    if (x < 0 || x > rect.width || y < 0 || y > rect.height) return;
    
    const cellWidth = rect.width / COLS;
    const cellHeight = rect.height / ROWS;
    
    const col = Math.floor(x / cellWidth);
    const row = Math.floor(y / cellHeight);
    
    if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
      setCurrentCell({ row, col });
    }
  };

  // Trigger Apple Particle Burst Effect
  const createBurstEffect = (bounds, rect) => {
    const newParticles = [];
    const cellWidth = rect.width / COLS;
    const cellHeight = rect.height / ROWS;

    for (let r = bounds.minRow; r <= bounds.maxRow; r++) {
      for (let c = bounds.minCol; c <= bounds.maxCol; c++) {
        if (grid[r] && grid[r][c] !== null) {
          // Center of the cell relative to grid
          const centerX = c * cellWidth + cellWidth / 2;
          const centerY = r * cellHeight + cellHeight / 2;

          // Create 4 particles per apple
          for (let i = 0; i < 4; i++) {
            newParticles.push({
              id: Math.random(),
              x: centerX,
              y: centerY,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8 - 3, // eject upwards slightly
              color: '#ef4444', // red apple color
              alpha: 1,
              size: Math.random() * 6 + 4,
            });
          }
        }
      }
    }

    setParticles((prev) => [...prev, ...newParticles]);
  };

  // Handle Drag End
  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const bounds = getSelectionBounds();
    if (!bounds) {
      setStartCell(null);
      setCurrentCell(null);
      return;
    }

    const sum = getSelectedSum();

    if (sum === 10) {
      // Valid selection! Clear apples and add points
      let clearedCount = 0;
      const clearedList = [];
      const newGrid = grid.map((r, rIdx) => 
        r.map((cVal, cIdx) => {
          if (
            rIdx >= bounds.minRow &&
            rIdx <= bounds.maxRow &&
            cIdx >= bounds.minCol &&
            cIdx <= bounds.maxCol &&
            cVal !== null
          ) {
            clearedCount++;
            clearedList.push({ row: rIdx, col: cIdx });
            return null;
          }
          return cVal;
        })
      );

      // Animation & particle effect
      if (gridRef.current) {
        const rect = gridRef.current.getBoundingClientRect();
        createBurstEffect(bounds, rect);
      }

      setJustClearedCells(clearedList);
      setTimeout(() => setJustClearedCells([]), 400);

      setGrid(newGrid);
      setScore((prev) => prev + clearedCount);
    }

    setStartCell(null);
    setCurrentCell(null);
  };

  // Particles animation update loop
  useEffect(() => {
    if (particles.length === 0) return;

    const frame = requestAnimationFrame(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.25, // gravity
            alpha: p.alpha - 0.04,
          }))
          .filter((p) => p.alpha > 0)
      );
    });

    return () => cancelAnimationFrame(frame);
  }, [particles]);

  const progressPercent = (timeLeft / GAME_DURATION) * 100;
  const isTimeCritical = timeLeft <= 20;

  return (
    <div className="w-full flex flex-col select-none font-sans" onMouseUp={handleDragEnd}>
      {/* Header Panel */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer text-text-main"
        >
          <ArrowLeft size={24} />
        </button>
        
        {gameState === 'playing' ? (
          <div className="flex items-center gap-1.5">
            {/* Score Badge */}
            <div className="flex items-center gap-1 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full shadow-sm">
              <span className="text-xs leading-none">🍎</span>
              <span className="text-[12px] font-black text-red-600 leading-none">{score}</span>
            </div>
            {/* Timer Badge */}
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full shadow-sm border transition-colors ${isTimeCritical ? 'bg-red-100 border-red-200 animate-pulse' : 'bg-slate-50 border-slate-200'}`}>
              <Clock size={12} className={isTimeCritical ? 'text-red-500' : 'text-slate-500'} />
              <span className={`text-[12px] font-black leading-none ${isTimeCritical ? 'text-red-600' : 'text-slate-600'}`}>{timeLeft}s</span>
            </div>
            {/* Best Badge */}
            <div className="flex items-center gap-1 bg-[#f1f5f9] border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
              <Trophy size={12} className="text-[#eab308] fill-[#eab308]" />
              <span className="text-[12px] font-extrabold text-slate-700 leading-none">{highScore}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1 bg-[#f1f5f9] px-3.5 py-1.5 rounded-full shadow-sm">
            <Trophy size={16} className="text-[#eab308] fill-[#eab308]" />
            <span className="text-[13px] font-extrabold text-slate-700">Best: {highScore}</span>
          </div>
        )}
      </div>

      {gameState === 'lobby' && (
        <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 bg-white border border-[#e2e8f0] rounded-3xl shadow-lg [animation:popIn_0.35s_ease-out]">
          <div className="relative w-24 h-24 mb-6 flex items-center justify-center bg-red-50 rounded-full border border-red-100 animate-bounce">
            <span className="text-6xl">🍎</span>
          </div>

          <h1 className="text-2xl font-extrabold text-text-main mb-2 tracking-tight">사과게임 (Fruit Box)</h1>
          <p className="text-xs text-[#64748b] font-medium text-center leading-relaxed max-w-[260px] mb-8">
            마우스나 터치 드래그로 사과 상자를 만들어 합이 정확히 <strong className="text-red-500">10</strong>이 되는 사과들을 지워보세요!
          </p>

          <button
            onClick={startGame}
            className="w-full max-w-[200px] h-12 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center gap-2 font-extrabold shadow-md active:scale-95 transition-all select-none cursor-pointer"
          >
            <Play size={18} fill="currentColor" />
            게임 시작
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="flex-grow flex flex-col [animation:fadeIn_0.3s_ease]">
          {/* Time Progress Bar */}
          <div className="w-full h-1 bg-slate-100 rounded-full mb-3.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-linear rounded-full ${isTimeCritical ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Interactive Game Grid Container */}
          <div className="relative w-full flex justify-center bg-slate-50 border border-[#e2e8f0] rounded-3xl p-3.5 shadow-inner select-none touch-none overflow-hidden">
            <div
              ref={gridRef}
              className="grid grid-cols-8 gap-1.5 w-full max-w-[360px] aspect-[8/12] select-none touch-none relative"
              onTouchMove={handleTouchMove}
              onTouchEnd={handleDragEnd}
            >
              {grid.map((row, rIdx) =>
                row.map((val, cIdx) => {
                  const isSelected = isCellSelected(rIdx, cIdx);
                  const isCleared = val === null;
                  const isJustCleared = justClearedCells.some(
                    (cell) => cell.row === rIdx && cell.col === cIdx
                  );

                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      onMouseDown={() => handleDragStart(rIdx, cIdx)}
                      onMouseEnter={() => handleMouseEnter(rIdx, cIdx)}
                      onTouchStart={() => handleDragStart(rIdx, cIdx)}
                      className={`
                        aspect-square w-full flex items-center justify-center relative transition-all select-none cursor-pointer duration-700
                        ${isCleared ? 'bg-transparent border border-dashed border-slate-200/10' : ''}
                        ${isSelected && !isCleared ? 'scale-90 z-10' : ''}
                        ${isJustCleared ? 'scale-110 z-10 animate-ping' : ''}
                      `}
                      style={{
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {!isCleared && (
                        <AppleShape val={val} isSelected={isSelected} />
                      )}
                    </div>
                  );
                })
              )}

              {/* Particle Overlay canvas/elements */}
              {particles.map((p) => (
                <div
                  key={p.id}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: `${p.x}px`,
                    top: `${p.y}px`,
                    width: `${p.size}px`,
                    height: `${p.size}px`,
                    backgroundColor: p.color,
                    opacity: p.alpha,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 30,
                  }}
                />
              ))}
            </div>

            {/* Sum indicator overlay removed as requested */}
          </div>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="flex-grow flex flex-col items-center justify-center py-10 px-4 bg-white border border-[#e2e8f0] rounded-3xl shadow-lg [animation:popIn_0.35s_ease-out]">
          <span className="text-6xl mb-4 animate-bounce">🏆</span>
          <h1 className="text-2xl font-black text-text-main mb-1">Time's Up!</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Game Over</p>

          <div className="w-full bg-[#f8fafc] border border-slate-100 p-6 rounded-2xl flex flex-col items-center gap-2 max-w-[280px] mb-8">
            <span className="text-sm font-semibold text-slate-500">얻은 점수</span>
            <span className="text-4xl font-extrabold text-red-500">{score}</span>
            {score >= highScore && score > 0 && (
              <span className="text-[10px] font-black bg-yellow-100 text-yellow-700 px-2.5 py-0.5 rounded-full mt-1 animate-pulse">
                NEW RECORD!
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3 w-full max-w-[200px]">
            <button
              onClick={startGame}
              className="h-12 bg-red-500 hover:bg-red-600 text-white font-extrabold rounded-full flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all select-none cursor-pointer"
            >
              <RotateCcw size={16} />
              다시 하기
            </button>
            <button
              onClick={() => setGameState('lobby')}
              className="h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-all select-none cursor-pointer"
            >
              대기실로
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
