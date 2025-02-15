// Elements
const loadButton = document.getElementById('loadTrack');
const randomizeButton = document.getElementById('randomizeSlices');
const trackUrlInput = document.getElementById('trackUrl');
const statusEl = document.getElementById('status');
const gridCells = document.querySelectorAll('.cell');

// Keys used in our sampler
const keys = ['Q','W','E','R','T','A','S','D','F','G','Z','X','C','V','B'];

// Mapping from key to slice info: { start: number, duration: number }
const keySlices = {};

// Mapping from key to currently playing AudioBufferSourceNode
const activeSources = {};

let audioBuffer = null;
const sliceDuration = 1.0; // slice length in seconds

// Create an AudioContext
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Load track from backend and decode it
loadButton.addEventListener('click', async () => {
  const url = trackUrlInput.value.trim();
  if (!url) {
    statusEl.textContent = 'Please enter a URL.';
    return;
  }
  statusEl.textContent = 'Loading track...';
  try {
    const response = await fetch('http://localhost:5000/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    if (!response.ok) throw new Error('Failed to load track');
    
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Assign a random slice to each key.
    assignRandomSlices();
    statusEl.textContent = 'Track loaded. Use your keyboard or click a cell to play slices.';
  } catch (error) {
    console.error('Error loading track:', error);
    statusEl.textContent = 'Error loading track.';
  }
});

// Function to assign random slices to all keys
function assignRandomSlices() {
  keys.forEach(key => {
    const maxStart = audioBuffer.duration > sliceDuration ? audioBuffer.duration - sliceDuration : 0;
    const randomStart = Math.random() * maxStart;
    keySlices[key] = {
      start: randomStart,
      duration: sliceDuration
    };
  });
}

// Handler for randomize button
randomizeButton.addEventListener('click', () => {
  if (!audioBuffer) {
    statusEl.textContent = 'Please load a track first.';
    return;
  }
  assignRandomSlices();
  statusEl.textContent = 'Slices randomized!';
});

// Function to play a slice for a given key.
function playSlice(key) {
  if (!audioBuffer || !keySlices[key]) return;
  // Avoid retriggering if already playing.
  if (activeSources[key]) return;
  
  const slice = keySlices[key];
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  // Start playing at the assigned slice (slice.start) for slice.duration seconds.
  source.start(0, slice.start, slice.duration);
  activeSources[key] = source;
}

// Function to stop playing the slice for a given key.
function stopSlice(key) {
  const source = activeSources[key];
  if (source) {
    try {
      source.stop();
    } catch (e) {
      console.error(`Error stopping key ${key}:`, e);
    }
    delete activeSources[key];
  }
}

// Keyboard event handlers
document.addEventListener('keydown', (event) => {
  const key = event.key.toUpperCase();
  if (keys.includes(key)) {
    playSlice(key);
    // Optionally, add a visual highlight to the cell.
    const cell = document.querySelector(`.cell[data-key="${key}"]`);
    if (cell) cell.style.backgroundColor = '#ddd';
  }
});

document.addEventListener('keyup', (event) => {
  const key = event.key.toUpperCase();
  if (keys.includes(key)) {
    stopSlice(key);
    const cell = document.querySelector(`.cell[data-key="${key}"]`);
    if (cell) cell.style.backgroundColor = '';
  }
});

// Optional: allow clicking on cells to trigger sound.
gridCells.forEach(cell => {
  cell.addEventListener('mousedown', () => {
    const key = cell.getAttribute('data-key');
    playSlice(key);
    cell.style.backgroundColor = '#ddd';
  });
  cell.addEventListener('mouseup', () => {
    const key = cell.getAttribute('data-key');
    stopSlice(key);
    cell.style.backgroundColor = '';
  });
  cell.addEventListener('mouseleave', () => {
    const key = cell.getAttribute('data-key');
    stopSlice(key);
    cell.style.backgroundColor = '';
  });
});
