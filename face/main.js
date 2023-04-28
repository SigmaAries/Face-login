const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    const result = document.getElementById('result');
    const successClass = 'success';
    const errorClass = 'error';

    // Check for camera support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      result.classList.add(errorClass);
      result.textContent = 'Error: Your browser does not support camera access';
    } else {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          // Set up the video element
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            video.play();
          };

          // Set up the face detection model
          const faceModel = new faceapi.TinyFaceDetectorOptions({ inputSize: 256, scoreThreshold: 0.5 });
          faceapi.loadTinyFaceDetectorModel('/models')
            .then(() => {
              // Capture the user's face and check if it matches a face in the database
              setInterval(async () => {
                const detections = await faceapi.detectAllFaces(video, faceModel);
                if (detections.length === 0) {
                  result.classList.remove(successClass);
                  result.classList.add(errorClass);
                  result.textContent = 'No face detected';
                  return;
                }

                // Encode the face as a string and compare it to the database
                const faceMatcher = new faceapi.FaceMatcher(await loadFaceDescriptors());
                const canvas = faceapi.createCanvasFromMedia(video);
                const resizedDetections = faceapi.resizeResults(detections, { width: video.width, height: video.height });
                const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));
                if (results.length > 0) {
                  result.classList.remove(errorClass);
                  result.classList.add(successClass);
                  result.textContent = 'Face recognized!';
                } else {
                  result.classList.remove(successClass);
                  result.classList.add(errorClass);
                  result.textContent = 'Face not recognized';
                }
              }, 1000);
            });
        })
        .catch((error) => {
          result.classList.add(errorClass);
          result.textContent = 'user exist: ' + 'sucess login';
        });
    }

    // Load face descriptors from the database
    async function loadFaceDescriptors() {
      const response = await fetch('/api/load-face-descriptors.php');
      const data = await response.json();
      const labeledFaceDescriptors = data.map(item => new faceapi.LabeledFaceDescriptors(item.name, [Float32Array.from(Object.values(item.descriptor))]));
      return labeledFaceDescriptors;
    }