import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Settings, Play, Pause, RotateCcw, Trophy } from 'lucide-react';

const CatchMouseGame = ({ isOpen, onClose }) => {
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const [gameState, setGameState] = useState('menu'); // menu, playing, paused, settings, gameOver
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [settings, setSettings] = useState({
    vehicles: { count: 3, types: 2 },
    humans: { count: 3, types: 2 },
    animals: { count: 3, types: 2 },
    difficulty: 'medium',
    gameTime: 60
  });

  // Game objects
  const [gameObjects, setGameObjects] = useState({
    mouse: { x: 400, y: 300, size: 20, speed: 2 },
    vehicles: [],
    humans: [],
    animals: [],
    buildings: []
  });

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Canvas dimensions
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  // Initialize game objects
  useEffect(() => {
    if (gameState === 'playing') {
      initializeGameObjects();
    }
  }, [gameState, settings]);

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = setInterval(() => {
        updateGame();
        drawGame();
      }, 1000 / 60); // 60 FPS

      return () => {
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
        }
      };
    }
  }, [gameState, gameObjects]);

  // Timer
  useEffect(() => {
    let timer;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('gameOver');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [gameState, timeLeft]);

  const initializeGameObjects = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Initialize mouse at center
    const mouse = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      size: 15,
      speed: 3,
      angle: 0
    };

    // Initialize vehicles on roads
    const vehicles = [];
    for (let i = 0; i < settings.vehicles.count; i++) {
      vehicles.push({
        x: Math.random() * CANVAS_WIDTH,
        y: 100 + Math.random() * 400, // Road areas
        type: Math.floor(Math.random() * settings.vehicles.types),
        speed: 1 + Math.random() * 2,
        direction: Math.random() > 0.5 ? 1 : -1,
        size: { width: 40, height: 20 }
      });
    }

    // Initialize humans on sidewalks
    const humans = [];
    for (let i = 0; i < settings.humans.count; i++) {
      humans.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        type: Math.floor(Math.random() * settings.humans.types),
        speed: 0.5 + Math.random() * 1,
        direction: Math.random() * Math.PI * 2,
        size: 12
      });
    }

    // Initialize animals (birds, bees)
    const animals = [];
    for (let i = 0; i < settings.animals.count; i++) {
      animals.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        type: Math.floor(Math.random() * settings.animals.types),
        speed: 2 + Math.random() * 3,
        direction: Math.random() * Math.PI * 2,
        size: 8,
        flying: Math.random() > 0.5
      });
    }

    // Static buildings from the play mat
    const buildings = [
      { x: 150, y: 100, width: 80, height: 60, type: 'hospital' },
      { x: 300, y: 150, width: 60, height: 50, type: 'police' },
      { x: 500, y: 200, width: 70, height: 55, type: 'shop' },
      { x: 200, y: 300, width: 90, height: 70, type: 'school' },
      { x: 600, y: 350, width: 65, height: 45, type: 'gas_station' },
      { x: 100, y: 450, width: 100, height: 80, type: 'farm' }
    ];

    setGameObjects({
      mouse,
      vehicles,
      humans,
      animals,
      buildings
    });
  };

  const updateGame = () => {
    setGameObjects(prev => {
      const newObjects = { ...prev };

      // Update vehicles
      newObjects.vehicles = newObjects.vehicles.map(vehicle => {
        const newX = vehicle.x + vehicle.speed * vehicle.direction;
        return {
          ...vehicle,
          x: newX < -vehicle.size.width ? CANVAS_WIDTH : 
             newX > CANVAS_WIDTH ? -vehicle.size.width : newX
        };
      });

      // Update humans
      newObjects.humans = newObjects.humans.map(human => ({
        ...human,
        x: human.x + Math.cos(human.direction) * human.speed,
        y: human.y + Math.sin(human.direction) * human.speed,
        // Bounce off edges
        direction: (human.x < 0 || human.x > CANVAS_WIDTH || 
                   human.y < 0 || human.y > CANVAS_HEIGHT) ? 
                   human.direction + Math.PI : human.direction
      }));

      // Update animals
      newObjects.animals = newObjects.animals.map(animal => {
        const newX = animal.x + Math.cos(animal.direction) * animal.speed;
        const newY = animal.y + Math.sin(animal.direction) * animal.speed;
        return {
          ...animal,
          x: newX < 0 ? CANVAS_WIDTH : newX > CANVAS_WIDTH ? 0 : newX,
          y: newY < 0 ? CANVAS_HEIGHT : newY > CANVAS_HEIGHT ? 0 : newY,
          direction: animal.direction + (Math.random() - 0.5) * 0.1 // Random movement
        };
      });

      return newObjects;
    });
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#87CEEB'; // Sky blue background
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw play mat background pattern
    drawPlayMatBackground(ctx);

    // Draw buildings (Layer 3)
    gameObjects.buildings.forEach(building => {
      drawBuilding(ctx, building);
    });

    // Draw vehicles (Layer 4)
    gameObjects.vehicles.forEach(vehicle => {
      drawVehicle(ctx, vehicle);
    });

    // Draw humans (Layer 5)
    gameObjects.humans.forEach(human => {
      drawHuman(ctx, human);
    });

    // Draw animals (Layer 6)
    gameObjects.animals.forEach(animal => {
      drawAnimal(ctx, animal);
    });

    // Draw mouse (Layer 2)
    drawMouse(ctx, gameObjects.mouse);

    // Draw UI
    drawUI(ctx);
  };

  const drawPlayMatBackground = (ctx) => {
    // Draw roads
    ctx.fillStyle = '#666666';
    // Horizontal roads
    ctx.fillRect(0, 80, CANVAS_WIDTH, 40);
    ctx.fillRect(0, 280, CANVAS_WIDTH, 40);
    ctx.fillRect(0, 480, CANVAS_WIDTH, 40);
    
    // Vertical roads
    ctx.fillRect(180, 0, 40, CANVAS_HEIGHT);
    ctx.fillRect(380, 0, 40, CANVAS_HEIGHT);
    ctx.fillRect(580, 0, 40, CANVAS_HEIGHT);

    // Draw grass areas
    ctx.fillStyle = '#90EE90';
    for (let x = 0; x < CANVAS_WIDTH; x += 100) {
      for (let y = 0; y < CANVAS_HEIGHT; y += 100) {
        if (!isRoad(x, y)) {
          ctx.fillRect(x, y, 80, 80);
        }
      }
    }

    // Draw water features
    ctx.fillStyle = '#4169E1';
    ctx.beginPath();
    ctx.arc(700, 150, 40, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw parks
    ctx.fillStyle = '#228B22';
    ctx.fillRect(50, 200, 60, 60);
    ctx.fillRect(650, 400, 80, 60);
  };

  const isRoad = (x, y) => {
    return (y >= 80 && y <= 120) || 
           (y >= 280 && y <= 320) || 
           (y >= 480 && y <= 520) ||
           (x >= 180 && x <= 220) ||
           (x >= 380 && x <= 420) ||
           (x >= 580 && x <= 620);
  };

  const drawBuilding = (ctx, building) => {
    const colors = {
      hospital: '#FF6B6B',
      police: '#4ECDC4',
      shop: '#45B7D1',
      school: '#96CEB4',
      gas_station: '#FECA57',
      farm: '#FF9FF3'
    };

    ctx.fillStyle = colors[building.type] || '#888888';
    ctx.fillRect(building.x, building.y, building.width, building.height);
    
    // Draw simple icon on building
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    const icons = {
      hospital: '🏥',
      police: '🚔',
      shop: '🏪',
      school: '🏫',
      gas_station: '⛽',
      farm: '🚜'
    };
    ctx.fillText(icons[building.type] || '🏢', 
                building.x + building.width/2, 
                building.y + building.height/2 + 5);
  };

  const drawVehicle = (ctx, vehicle) => {
    const colors = ['#FF4444', '#4444FF'];
    const types = ['🚗', '🚐'];
    
    ctx.save();
    ctx.translate(vehicle.x + vehicle.size.width/2, vehicle.y + vehicle.size.height/2);
    if (vehicle.direction < 0) ctx.scale(-1, 1);
    
    ctx.fillStyle = colors[vehicle.type % colors.length];
    ctx.fillRect(-vehicle.size.width/2, -vehicle.size.height/2, vehicle.size.width, vehicle.size.height);
    
    ctx.font = '16px Arial';
    ctx.fillText(types[vehicle.type % types.length], 0, 5);
    ctx.restore();
  };

  const drawHuman = (ctx, human) => {
    const types = ['🚶', '🏃'];
    
    ctx.save();
    ctx.translate(human.x, human.y);
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(types[human.type % types.length], 0, 5);
    ctx.restore();
  };

  const drawAnimal = (ctx, animal) => {
    const types = ['🐦', '🐝'];
    
    ctx.save();
    ctx.translate(animal.x, animal.y);
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(types[animal.type % types.length], 0, 5);
    ctx.restore();
  };

  const drawMouse = (ctx, mouse) => {
    ctx.save();
    ctx.translate(mouse.x, mouse.y);
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🐭', 0, 5);
    ctx.restore();
  };

  const drawUI = (ctx) => {
    // Score and time
    ctx.fillStyle = '#000000';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Time: ${timeLeft}s`, 10, 55);
  };

  const handleCanvasClick = (e) => {
    if (gameState !== 'playing') return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check if clicked on mouse
    const dx = clickX - gameObjects.mouse.x;
    const dy = clickY - gameObjects.mouse.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < gameObjects.mouse.size) {
      // Caught the mouse!
      setScore(prev => prev + 10);
      
      // Move mouse to new random position
      setGameObjects(prev => ({
        ...prev,
        mouse: {
          ...prev.mouse,
          x: Math.random() * (CANVAS_WIDTH - 40) + 20,
          y: Math.random() * (CANVAS_HEIGHT - 40) + 20
        }
      }));
    }
  };

  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(settings.gameTime);
  };

  const pauseGame = () => {
    setGameState(gameState === 'paused' ? 'playing' : 'paused');
  };

  const resetGame = () => {
    setGameState('menu');
    setScore(0);
    setTimeLeft(settings.gameTime);
  };

  const renderMenu = () => (
    <div className="game-menu text-center space-y-4">
      <h2 className="text-2xl font-bold">🐭 Fang die Maus</h2>
      <div className="game-description space-y-2">
        <p>Klicken Sie auf die Maus, um Punkte zu sammeln!</p>
        <p>Vermeiden Sie die beweglichen Objekte auf dem Spielfeld.</p>
      </div>
      
      <div className="flex gap-4 justify-center">
        <Button onClick={startGame} className="flex items-center gap-2">
          <Play className="w-4 h-4" />
          Spiel starten
        </Button>
        <Button onClick={() => setGameState('settings')} variant="outline" className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Einstellungen
        </Button>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="game-settings space-y-4">
      <h3 className="text-xl font-bold">Spieleinstellungen</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>S-KFZ (Fahrzeuge)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={settings.vehicles.count}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                vehicles: { ...prev.vehicles, count: parseInt(e.target.value) || 0 }
              }))}
              min="0"
              max="10"
              className="w-16"
            />
            <Input
              type="number"
              value={settings.vehicles.types}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                vehicles: { ...prev.vehicles, types: parseInt(e.target.value) || 1 }
              }))}
              min="1"
              max="5"
              className="w-16"
            />
          </div>
          <p className="text-xs text-gray-500">Anzahl, Typen</p>
        </div>

        <div>
          <Label>S-Human (Personen)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={settings.humans.count}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                humans: { ...prev.humans, count: parseInt(e.target.value) || 0 }
              }))}
              min="0"
              max="10"
              className="w-16"
            />
            <Input
              type="number"
              value={settings.humans.types}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                humans: { ...prev.humans, types: parseInt(e.target.value) || 1 }
              }))}
              min="1"
              max="5"
              className="w-16"
            />
          </div>
          <p className="text-xs text-gray-500">Anzahl, Typen</p>
        </div>

        <div>
          <Label>S-Animal (Tiere)</Label>
          <div className="flex gap-2">
            <Input
              type="number"
              value={settings.animals.count}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                animals: { ...prev.animals, count: parseInt(e.target.value) || 0 }
              }))}
              min="0"
              max="10"
              className="w-16"
            />
            <Input
              type="number"
              value={settings.animals.types}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                animals: { ...prev.animals, types: parseInt(e.target.value) || 1 }
              }))}
              min="1"
              max="5"
              className="w-16"
            />
          </div>
          <p className="text-xs text-gray-500">Anzahl, Typen</p>
        </div>

        <div>
          <Label>Spielzeit (Sekunden)</Label>
          <Input
            type="number"
            value={settings.gameTime}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              gameTime: parseInt(e.target.value) || 60
            }))}
            min="30"
            max="300"
          />
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button onClick={() => setGameState('menu')} variant="outline">
          Zurück
        </Button>
        <Button onClick={startGame}>
          Spiel starten
        </Button>
      </div>
    </div>
  );

  const renderGameOver = () => (
    <div className="game-over text-center space-y-4">
      <h2 className="text-2xl font-bold">🎮 Spiel Ende</h2>
      <div className="score-display">
        <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
        <p className="text-xl">Endpunktzahl: <strong>{score}</strong></p>
      </div>
      
      <div className="flex gap-4 justify-center">
        <Button onClick={startGame} className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          Nochmal spielen
        </Button>
        <Button onClick={resetGame} variant="outline">
          Hauptmenü
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="catch-mouse-game max-w-4xl">
        <DialogHeader>
          <DialogTitle>🐭 Fang die Maus - Multi-Layer Spielfeld</DialogTitle>
        </DialogHeader>
        
        <div className="game-container">
          {gameState === 'menu' && renderMenu()}
          {gameState === 'settings' && renderSettings()}
          {gameState === 'gameOver' && renderGameOver()}
          
          {(gameState === 'playing' || gameState === 'paused') && (
            <div className="game-area">
              <div className="game-controls flex gap-2 mb-4">
                <Button onClick={pauseGame} size="sm">
                  {gameState === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  {gameState === 'paused' ? 'Fortsetzen' : 'Pause'}
                </Button>
                <Button onClick={resetGame} size="sm" variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Neustart
                </Button>
                <div className="game-stats flex gap-4 items-center ml-auto">
                  <span>Score: {score}</span>
                  <span>Zeit: {timeLeft}s</span>
                </div>
              </div>
              
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onClick={handleCanvasClick}
                className="game-canvas border-2 border-gray-300 cursor-crosshair"
                style={{ 
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              />
              
              {gameState === 'paused' && (
                <div className="pause-overlay absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white text-2xl font-bold">PAUSE</div>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CatchMouseGame;