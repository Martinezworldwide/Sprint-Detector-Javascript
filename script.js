let detector, video, canvas, ctx, clips = [];
let lastY = null, lastTime = null, isSprinting = false;
let startTime = 0;

window.onload = async () => {
  video = document.getElementById('video');
  canvas = document.getElementById('overlay');
  ctx = canvas.getContext('2d');

  document.getElementById('videoUpload').addEventListener('change', handleVideo);

  const model = poseDetection.SupportedModels.MoveNet;
  detector = await poseDetection.createDetector(model);
};

function handleVideo(e) {
  const file = e.target.files[0];
  if (file) {
    video.src = URL.createObjectURL(file);
    video.addEventListener('play', processVideo);
  }
}

async function processVideo() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  function detect() {
    if (video.paused || video.ended) return;

    detector.estimatePoses(video).then(poses => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (poses.length > 0 && poses[0].keypoints) {
        const nose = poses[0].keypoints.find(k => k.name === "nose");
        if (nose && nose.score > 0.4) {
          const y = nose.y;
          const now = video.currentTime;
          if (lastY !== null && lastTime !== null) {
            const speed = (lastY - y) / (now - lastTime); // sprint toward = negative speed
            if (speed < -200 && !isSprinting) {
              isSprinting = true;
              startTime = now;
              document.getElementById('status').innerText = 'Sprint detected!';
            } else if (speed > -100 && isSprinting) {
              isSprinting = false;
              const endTime = now;
              const li = document.createElement('li');
              li.textContent = `Sprint: ${startTime.toFixed(2)}s to ${endTime.toFixed(2)}s`;
              document.getElementById('clips').appendChild(li);
            }
          }
          lastY = y;
          lastTime = now;
        }
      }
      requestAnimationFrame(detect);
    });
  }

  detect();
}
