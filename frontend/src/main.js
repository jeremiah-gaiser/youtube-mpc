const input = document.getElementById('userInput');
const button = document.getElementById('reverseBtn'); // Consider renaming this to "playBtn" for clarity
const resultPara = document.getElementById('result');
const audioPlayer = document.getElementById('audioPlayer');

button.addEventListener('click', async () => {
  const url = input.value;
  try {
    const response = await fetch('http://localhost:5000/api/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    // Receive the MP3 file as a blob
    const blob = await response.blob();

    // Create a temporary URL for the blob
    const audioUrl = window.URL.createObjectURL(blob);

    // Set the audio element's source to the blob URL and start playback
    audioPlayer.src = audioUrl;
    audioPlayer.play();

    resultPara.textContent = 'Playing audio...';
  } catch (error) {
    console.error('Error fetching MP3 file:', error);
    resultPara.textContent = 'An error occurred.';
  }
});
