// Registrar el Service Worker
if (navigator.serviceWorker) {
    navigator.serviceWorker.register("/sw.js")
      .then(() => {
        console.log("Service Worker registrado correctamente");
      })
      .catch((error) => {
        console.error("Error al registrar el Service Worker:", error);
      });
  }
  
  // Clase para manejar la cámara
  class Camara {
    constructor(videoNode) {
      this.videoNode = videoNode;
    }
  
    // Método para encender la cámara
    encender() {
      if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { width: 300, height: 300 }
        })
          .then((stream) => {
            this.videoNode.srcObject = stream;
            this.stream = stream;
          })
          .catch((error) => {
            console.error("Error al acceder a la cámara:", error);
          });
      }
    }
  
    // Método para apagar la cámara
    apagar() {
      this.videoNode.pause();
      if (this.stream) {
        this.stream.getTracks()[0].stop();
      }
    }
  
    // Método para tomar una foto
    tomarFoto() {
      let canvas = document.createElement("canvas");
      canvas.setAttribute("width", 300);
      canvas.setAttribute("height", 300);
  
      let context = canvas.getContext("2d");
  
      context.drawImage(this.videoNode, 0, 0, canvas.width, canvas.height);
  
      this.foto = context.canvas.toDataURL();
  
      // Liberar recursos
      canvas = null;
      context = null;
  
      return this.foto;
    }
  }
  
  // Inicializando la cámara
  const videoNode = document.getElementById("player"); // Asegúrate de que tu video tenga este id
  const camara = new Camara(videoNode);
  
  // Botones y eventos
  const activarCamaraBtn = document.getElementById("activarCamara");
  const tomarFotoBtn = document.getElementById("tomarFoto");
  const rehacerFotoBtn = document.getElementById("rehacerFoto");
  const fotoContenedor = document.getElementById("fotoContenedor");
  
  // Inicialmente, ocultamos los botones de tomar foto y rehacer foto
  fotoContenedor.style.display = "none";
  videoNode.style.display = "none";
  
  // Encender la cámara al presionar el botón de activar
  activarCamaraBtn.addEventListener("click", () => {
    videoNode.style.display = "inline-block";
    camara.encender();
    activarCamaraBtn.style.display = "none"; // Ocultar el botón de activar cámara
    tomarFotoBtn.style.display = "inline-block"; // Mostrar el botón de tomar foto
  });
  
  // Tomar foto
  tomarFotoBtn.addEventListener("click", () => {
    const foto = camara.tomarFoto();
    console.log("Foto tomada:", foto);
    camara.apagar(); // Apagar la cámara después de tomar la foto
    videoNode.style.display = "none"; // Ocultar el video
    fotoContenedor.style.display = "inline-block"; // Mostrar la foto
  
    // Mostrar la foto tomada en el contenedor
    fotoContenedor.innerHTML = `<img src="${foto}" class="img-fluid" style="width: 180px; height: 180px;">`;
  
    // Ocultar el botón de "Tomar Foto" y mostrar "Rehacer Foto"
    tomarFotoBtn.style.display = "none";
    rehacerFotoBtn.style.display = "inline-block";
  });
  
  // Rehacer la foto
  rehacerFotoBtn.addEventListener("click", () => {
    fotoContenedor.style.display = "none"; // Ocultar la foto tomada
    rehacerFotoBtn.style.display = "none"; // Ocultar el botón de rehacer foto
    videoNode.style.display = "inline-block"; // Mostrar el video
    camara.encender(); // Reiniciar la cámara
    tomarFotoBtn.style.display = "inline-block"; // Mostrar el botón para tomar la foto nuevamente
  });
  
  // Lógica para detener la cámara si se sale de la página o se realiza otro evento
  window.addEventListener("beforeunload", () => {
    camara.apagar();
  });
  