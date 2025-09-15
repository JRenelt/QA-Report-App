import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Settings, Play, Pause, RotateCcw, Trophy, Volume2, VolumeX } from 'lucide-react';

const EnhancedCatchMouseGame = ({ isOpen, onClose }) => {
  const canvasRef = useRef(null);
  const gameLoopRef = useRef(null);
  const backgroundImageRef = useRef(null);
  
  const [gameState, setGameState] = useState('menu'); // menu, playing, paused, settings, gameOver
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [settings, setSettings] = useState({
    // S-KFZ = Anzahl, Typen
    vehicles: { count: 3, types: 2 },
    // S-Human = Anzahl, Typen  
    humans: { count: 3, types: 2 },
    // S-Animal = Anzahl, Typen
    animals: { count: 3, types: 2 },
    difficulty: 'medium',
    gameTime: 60,
    soundEnabled: true
  });

  // Game objects - 6 Layer System
  const [gameObjects, setGameObjects] = useState({
    // Layer 2: Die Maus
    mouse: { x: 400, y: 300, size: 25, speed: 2, caught: false },
    // Layer 3: Gebäude (statisch - aus Spielteppich)
    buildings: [],
    // Layer 4: Autos auf Straße
    vehicles: [],
    // Layer 5: Personen auf Straße  
    humans: [],
    // Layer 6: Vögel, Bienen
    animals: []
  });

  const [backgroundLoaded, setBackgroundLoaded] = useState(false);

  // Canvas dimensions
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  // Load Spielteppich background image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      backgroundImageRef.current = img;
      setBackgroundLoaded(true);
    };
    img.onerror = () => {
      console.error('Failed to load Spielteppich image');
      setBackgroundLoaded(false);
    };
    // Spielteppich-Bild URL
    img.src = 'https://customer-assets.emergentagent.com/job_bookmark-central/artifacts/tiwm7lbf_Kartenteppich.png';
  }, []);

  // Initialize game objects when game starts
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
    // Layer 2: Initialize mouse at center
    const mouse = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      size: 25,
      speed: 3,
      angle: 0,
      caught: false
    };

    // Layer 3: Static buildings from Spielteppich (these are painted on the background)
    const buildings = [
      { x: 150, y: 100, width: 80, height: 60, type: 'hospital', icon: '🏥' },
      { x: 300, y: 150, width: 60, height: 50, type: 'police', icon: '🚔' },
      { x: 500, y: 200, width: 70, height: 55, type: 'shop', icon: '🏪' },
      { x: 200, y: 300, width: 90, height: 70, type: 'school', icon: '🏫' },
      { x: 600, y: 350, width: 65, height: 45, type: 'gas_station', icon: '⛽' },
      { x: 100, y: 450, width: 100, height: 80, type: 'farm', icon: '🚜' }
    ];

    // Layer 4: Vehicles on roads - based on settings
    const vehicles = [];
    const vehicleTypes = ['🚗', '🚐', '🚛', '🚓', '🚑'];
    for (let i = 0; i < settings.vehicles.count; i++) {
      const roadY = [120, 280, 480][Math.floor(Math.random() * 3)]; // Road positions from Spielteppich
      vehicles.push({
        x: Math.random() * CANVAS_WIDTH,
        y: roadY + Math.random() * 20 - 10, // Slight variation on road
        type: Math.floor(Math.random() * Math.min(settings.vehicles.types, vehicleTypes.length)),
        speed: 1 + Math.random() * 2,
        direction: Math.random() > 0.5 ? 1 : -1,
        size: { width: 40, height: 20 },
        icon: vehicleTypes[Math.floor(Math.random() * Math.min(settings.vehicles.types, vehicleTypes.length))]
      });
    }

    // Layer 5: Humans on sidewalks - based on settings
    const humans = [];
    const humanTypes = ['🚶', '🏃', '👨', '👩', '🧑'];
    for (let i = 0; i < settings.humans.count; i++) {
      humans.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        type: Math.floor(Math.random() * Math.min(settings.humans.types, humanTypes.length)),
        speed: 0.5 + Math.random() * 1,
        direction: Math.random() * Math.PI * 2,
        size: 15,
        icon: humanTypes[Math.floor(Math.random() * Math.min(settings.humans.types, humanTypes.length))]
      });
    }

    // Layer 6: Animals (birds, bees) - based on settings
    const animals = [];
    const animalTypes = ['🐦', '🐝', '🦋', '🐛', '🕊️'];
    for (let i = 0; i < settings.animals.count; i++) {
      animals.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        type: Math.floor(Math.random() * Math.min(settings.animals.types, animalTypes.length)),
        speed: 2 + Math.random() * 3,
        direction: Math.random() * Math.PI * 2,
        size: 12,
        flying: true,
        icon: animalTypes[Math.floor(Math.random() * Math.min(settings.animals.types, animalTypes.length))]
      });
    }

    setGameObjects({
      mouse,
      buildings,
      vehicles,
      humans,
      animals
    });
  };

  const updateGame = () => {
    setGameObjects(prev => {
      const newObjects = { ...prev };

      // Update mouse (slight random movement to make it harder to catch)
      if (!newObjects.mouse.caught) {
        newObjects.mouse.x += (Math.random() - 0.5) * newObjects.mouse.speed;
        newObjects.mouse.y += (Math.random() - 0.5) * newObjects.mouse.speed;
        
        // Keep mouse in bounds
        newObjects.mouse.x = Math.max(25, Math.min(CANVAS_WIDTH - 25, newObjects.mouse.x));
        newObjects.mouse.y = Math.max(25, Math.min(CANVAS_HEIGHT - 25, newObjects.mouse.y));
      }

      // Update vehicles (Layer 4)
      newObjects.vehicles = newObjects.vehicles.map(vehicle => ({
        ...vehicle,
        x: vehicle.x + vehicle.speed * vehicle.direction,
        // Wrap around screen
        x: vehicle.x < -vehicle.size.width ? CANVAS_WIDTH : 
           vehicle.x > CANVAS_WIDTH ? -vehicle.size.width : vehicle.x
      }));

      // Update humans (Layer 5)
      newObjects.humans = newObjects.humans.map(human => ({
        ...human,
        x: human.x + Math.cos(human.direction) * human.speed,
        y: human.y + Math.sin(human.direction) * human.speed,
        // Bounce off edges
        direction: (human.x < 0 || human.x > CANVAS_WIDTH || 
                   human.y < 0 || human.y > CANVAS_HEIGHT) ? 
                   human.direction + Math.PI : human.direction
      }));

      // Update animals (Layer 6)
      newObjects.animals = newObjects.animals.map(animal => ({
        ...animal,
        x: animal.x + Math.cos(animal.direction) * animal.speed,
        y: animal.y + Math.sin(animal.direction) * animal.speed,
        direction: animal.direction + (Math.random() - 0.5) * 0.2, // More erratic movement
        // Wrap around screen
        x: animal.x < 0 ? CANVAS_WIDTH : animal.x > CANVAS_WIDTH ? 0 : animal.x,
        y: animal.y < 0 ? CANVAS_HEIGHT : animal.y > CANVAS_HEIGHT ? 0 : animal.y
      }));

      return newObjects;
    });
  };

  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Layer 1: Draw Spielteppich background
    if (backgroundLoaded && backgroundImageRef.current) {
      ctx.drawImage(backgroundImageRef.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    } else {
      // Fallback pattern if image doesn't load
      drawFallbackBackground(ctx);
    }

    // Layer 2: Draw mouse
    drawMouse(ctx, gameObjects.mouse);

    // Layer 3: Buildings are part of the background image, no need to draw separately

    // Layer 4: Draw vehicles
    gameObjects.vehicles.forEach(vehicle => {
      drawVehicle(ctx, vehicle);
    });

    // Layer 5: Draw humans
    gameObjects.humans.forEach(human => {
      drawHuman(ctx, human);
    });

    // Layer 6: Draw animals
    gameObjects.animals.forEach(animal => {
      drawAnimal(ctx, animal);
    });

    // Draw UI overlay
    drawUI(ctx);
  };

  const drawFallbackBackground = (ctx) => {
    // Simple fallback if Spielteppich image doesn't load
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw some roads
    ctx.fillStyle = '#666666';
    ctx.fillRect(0, 100, CANVAS_WIDTH, 40);
    ctx.fillRect(0, 280, CANVAS_WIDTH, 40);
    ctx.fillRect(0, 460, CANVAS_WIDTH, 40);
    
    ctx.fillRect(200, 0, 40, CANVAS_HEIGHT);
    ctx.fillRect(400, 0, 40, CANVAS_HEIGHT);
    ctx.fillRect(600, 0, 40, CANVAS_HEIGHT);
  };

  const drawMouse = (ctx, mouse) => {
    ctx.save();
    ctx.translate(mouse.x, mouse.y);
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    // Make mouse slightly bigger and more visible
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText('🐭', 0, 8);
    ctx.fillText('🐭', 0, 8);
    ctx.restore();
  };

  const drawVehicle = (ctx, vehicle) => {
    ctx.save();
    ctx.translate(vehicle.x + vehicle.size.width/2, vehicle.y + vehicle.size.height/2);
    if (vehicle.direction < 0) ctx.scale(-1, 1);
    
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(vehicle.icon, 0, 5);
    ctx.restore();
  };

  const drawHuman = (ctx, human) => {
    ctx.save();
    ctx.translate(human.x, human.y);
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(human.icon, 0, 5);
    ctx.restore();
  };

  const drawAnimal = (ctx, animal) => {
    ctx.save();
    ctx.translate(animal.x, animal.y);
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    // Animals flutter/move slightly
    const flutter = Math.sin(Date.now() * 0.01) * 2;
    ctx.translate(0, flutter);
    ctx.fillText(animal.icon, 0, 5);
    ctx.restore();
  };

  const drawUI = (ctx) => {
    // Score and time overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 200, 60);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`Zeit: ${timeLeft}s`, 20, 50);
    
    // Layer info (small)
    ctx.font = '10px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('🐭 Layer 2: Maus | 🚗 Layer 4: Fahrzeuge | 🚶 Layer 5: Personen | 🐦 Layer 6: Tiere', 10, CANVAS_HEIGHT - 10);
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
      
      // Play sound effect if enabled
      if (settings.soundEnabled) {
        // Simple sound effect (could be replaced with actual audio)
        console.log('🎵 Mouse caught sound!');
      }
      
      // Move mouse to new random position (not on roads)
      const newX = Math.random() * (CANVAS_WIDTH - 50) + 25;
      let newY = Math.random() * (CANVAS_HEIGHT - 50) + 25;
      
      // Avoid road areas (where vehicles are)
      const roadAreas = [120, 280, 480];
      while (roadAreas.some(roadY => Math.abs(newY - roadY) < 30)) {
        newY = Math.random() * (CANVAS_HEIGHT - 50) + 25;
      }
      
      setGameObjects(prev => ({
        ...prev,
        mouse: {
          ...prev.mouse,
          x: newX,
          y: newY
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
      <div className="text-sm text-gray-600 space-y-1">
        <p><strong>Multi-Layer Spielfeld basierend auf Spielteppich</strong></p>
        <p>Layer 1: Spielteppich-Hintergrund | Layer 2: Maus 🐭</p>
        <p>Layer 4: Fahrzeuge 🚗 | Layer 5: Personen 🚶 | Layer 6: Tiere 🐦</p>
      </div>
      <div className="game-description space-y-2">
        <p>Klicken Sie auf die Maus, um Punkte zu sammeln!</p>
        <p>Die Maus bewegt sich zufällig und ist schwer zu fangen.</p>
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
    <div className="game-settings space-y-6 max-h-96 overflow-y-auto">
      <h3 className="text-xl font-bold">Spieleinstellungen</h3>
      
      <div className="grid gap-4">
        <div className="space-y-4">
          <h4 className="font-medium text-gray-700">Layer-Element Konfiguration</h4>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="font-medium">🚗 S-KFZ (Layer 4)</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs">Anzahl</Label>
                  <Input
                    type="number"
                    value={settings.vehicles.count}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      vehicles: { ...prev.vehicles, count: parseInt(e.target.value) || 0 }
                    }))}
                    min="0"
                    max="10"
                    className="h-8"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs">Typen</Label>
                  <Input
                    type="number"
                    value={settings.vehicles.types}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      vehicles: { ...prev.vehicles, types: parseInt(e.target.value) || 1 }
                    }))}
                    min="1"
                    max="5"
                    className="h-8"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">Format: {settings.vehicles.count},{settings.vehicles.types}</p>
            </div>

            <div className="space-y-2">
              <Label className="font-medium">🚶 S-Human (Layer 5)</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs">Anzahl</Label>
                  <Input
                    type="number"
                    value={settings.humans.count}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      humans: { ...prev.humans, count: parseInt(e.target.value) || 0 }
                    }))}
                    min="0"
                    max="10"
                    className="h-8"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs">Typen</Label>
                  <Input
                    type="number"
                    value={settings.humans.types}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      humans: { ...prev.humans, types: parseInt(e.target.value) || 1 }
                    }))}
                    min="1"
                    max="5"
                    className="h-8"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">Format: {settings.humans.count},{settings.humans.types}</p>
            </div>

            <div className="space-y-2">
              <Label className="font-medium">🐦 S-Animal (Layer 6)</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs">Anzahl</Label>
                  <Input
                    type="number"
                    value={settings.animals.count}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      animals: { ...prev.animals, count: parseInt(e.target.value) || 0 }
                    }))}
                    min="0"
                    max="10"
                    className="h-8"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs">Typen</Label>
                  <Input
                    type="number"
                    value={settings.animals.types}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      animals: { ...prev.animals, types: parseInt(e.target.value) || 1 }
                    }))}
                    min="1"
                    max="5"
                    className="h-8"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">Format: {settings.animals.count},{settings.animals.types}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
          
          <div className="flex items-center gap-2">
            <Label>Sound-Effekte</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettings(prev => ({...prev, soundEnabled: !prev.soundEnabled}))}
            >
              {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>
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
        <p className="text-sm text-gray-600">
          Konfiguration: S-KFZ {settings.vehicles.count},{settings.vehicles.types} | 
          S-Human {settings.humans.count},{settings.humans.types} | 
          S-Animal {settings.animals.count},{settings.animals.types}
        </p>
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
      <DialogContent className="enhanced-catch-mouse-game max-w-5xl">
        <DialogHeader>
          <DialogTitle>🐭 Fang die Maus - Multi-Layer Spielteppich</DialogTitle>
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
                <div className="game-stats flex gap-4 items-center ml-auto text-sm">
                  <span>Score: <strong>{score}</strong></span>
                  <span>Zeit: <strong>{timeLeft}s</strong></span>
                  <span className="text-xs text-gray-500">
                    KFZ:{settings.vehicles.count},{settings.vehicles.types} | 
                    Human:{settings.humans.count},{settings.humans.types} | 
                    Animal:{settings.animals.count},{settings.animals.types}
                  </span>
                </div>
              </div>
              
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  onClick={handleCanvasClick}
                  className="game-canvas border-2 border-gray-300 cursor-crosshair rounded"
                />
                
                {gameState === 'paused' && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded">
                    <div className="text-white text-2xl font-bold">PAUSE</div>
                  </div>
                )}
                
                {!backgroundLoaded && (
                  <div className="absolute top-2 left-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                    ⚠️ Spielteppich wird geladen...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedCatchMouseGame;