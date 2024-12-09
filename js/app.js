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

  apagar() {
    this.videoNode.pause();
    if (this.stream) {
      this.stream.getTracks()[0].stop();
    }
  }

  tomarFoto() {
    let canvas = document.createElement("canvas");
    canvas.setAttribute("width", 300);
    canvas.setAttribute("height", 300);

    let context = canvas.getContext("2d");
    context.drawImage(this.videoNode, 0, 0, canvas.width, canvas.height);

    const foto = context.canvas.toDataURL();
    canvas = null;
    context = null;

    return foto;
  }
}

// Inicializando la cámara
const videoNode = document.getElementById("player");
const camara = new Camara(videoNode);

// Botones y eventos de la cámara
const activarCamaraBtn = document.getElementById("activarCamara");
const tomarFotoBtn = document.getElementById("tomarFoto");
const rehacerFotoBtn = document.getElementById("rehacerFoto");
const fotoContenedor = document.getElementById("fotoContenedor");

let fotoCapturada = null; // Variable para almacenar la foto

fotoContenedor.style.display = "none";
videoNode.style.display = "none";

activarCamaraBtn.addEventListener("click", () => {
  videoNode.style.display = "inline-block";
  camara.encender();
  activarCamaraBtn.style.display = "none";
  tomarFotoBtn.style.display = "inline-block";
});

tomarFotoBtn.addEventListener("click", () => {
  fotoCapturada = camara.tomarFoto();
  console.log("Foto tomada:", fotoCapturada);
  camara.apagar();
  videoNode.style.display = "none";
  fotoContenedor.style.display = "inline-block";
  fotoContenedor.innerHTML = `<img src="${fotoCapturada}" class="img-fluid" style="width: 180px; height: 180px;">`;
  tomarFotoBtn.style.display = "none";
  rehacerFotoBtn.style.display = "inline-block";
});

rehacerFotoBtn.addEventListener("click", () => {
  fotoContenedor.style.display = "none";
  rehacerFotoBtn.style.display = "none";
  videoNode.style.display = "inline-block";
  camara.encender();
  tomarFotoBtn.style.display = "inline-block";
});

window.addEventListener("beforeunload", () => {
  camara.apagar();
});

// Gestión de tareas con IndexedDB
const form = document.getElementById("tarea-form");
const cancelBtn = document.getElementById("cancelBtn");
const tableBody = document.querySelector(".custom-table tbody");
let tareas = [];

// Generar un nuevo ID para la tarea
const generarId = () => {
  const ultimaTarea = tareas[tareas.length - 1];
  return ultimaTarea ? ultimaTarea.id + 1 : 1;
};

// Generar la tabla de tareas
const generarTabla = () => {
  listar((datos) => {
    tareas = datos;
    tableBody.innerHTML = "";
    datos.forEach((tarea) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${tarea.titulo}</td>
        <td>${tarea.descripcion}</td>
        <td>${tarea.fecha}</td>
        <td><img src="${tarea.foto}" alt="Foto" class="img-thumbnail" style="width: 50px; height: 50px;"></td>
        <td>
          <button class="btn btn-success btn-sm me-2" onclick="editarTarea(${tarea.id})">Editar</button>
          <button class="btn btn-danger btn-sm" onclick="eliminarTarea(${tarea.id})">Eliminar</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
    form.reset();
    form.dataset.type = "add";
    fotoContenedor.style.display = "none";
    activarCamaraBtn.style.display = "inline-block";
    rehacerFotoBtn.style.display = "none";
    fotoCapturada = null; // Reiniciar la foto
  });
};

// Guardar o actualizar tareas
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const tarea = Object.fromEntries(formData.entries());
  tarea.foto = fotoCapturada; // Agregar la foto capturada
  const tipoFormulario = form.dataset.type;

  if (!tarea.foto) {
    alert("Por favor, tome una foto antes de guardar.");
    return;
  }

  if (tipoFormulario === "add") {
    tarea.id = generarId();
    guardar(tarea, generarTabla);
  } else {
    tarea.id = parseInt(form.dataset.id, 10);
    actualizar(tarea, generarTabla);
    fotoContenedor.style.display = "none";
    fotoContenedor.innerHTML = "";
    fotoCapturada = null;
    videoNode.style.display = "none";
    activarCamaraBtn.style.display = "inline-block";
    tomarFotoBtn.style.display = "none";
    rehacerFotoBtn.style.display = "none";
  }
  camara.apagar();
});


// Editar una tarea
const editarTarea = (id) => {
  listarPorId(id, (tarea) => {
    form.dataset.type = "update";
    form.dataset.id = id;
    form.titulo.value = tarea.titulo;
    form.descripcion.value = tarea.descripcion;
    form.fecha.value = tarea.fecha;

    fotoCapturada = tarea.foto;
    fotoContenedor.style.display = "inline-block";
    videoNode.style.display = "none";
    fotoContenedor.innerHTML = `<img src="${tarea.foto}" class="img-fluid" style="width: 180px; height: 180px;">`;
    activarCamaraBtn.style.display = "none";
    tomarFotoBtn.style.display = "none";
    rehacerFotoBtn.style.display = "inline-block";
  });
};

// Eliminar una tarea
const eliminarTarea = (id) => {
  eliminar(id, generarTabla);
};

// Botón de cancelar
cancelBtn.addEventListener("click", () => {
  // Restablece el formulario
  form.reset();
  form.dataset.type = "add"; // Cambia el estado a "add"
  form.dataset.id = ""; // Elimina el ID almacenado
  form.querySelector("#saveChangesBtn").textContent = "Guardar";

  // Reinicia el contenedor de la foto
  camara.apagar();
  fotoContenedor.style.display = "none";
  fotoContenedor.innerHTML = "";
  videoNode.style.display = "none";
  activarCamaraBtn.style.display = "inline-block";
  tomarFotoBtn.style.display = "none";
  rehacerFotoBtn.style.display = "none";
  fotoCapturada = null;
});

// Sincronizar tareas cuando haya conexión
navigator.serviceWorker.ready.then(registration => {
  registration.sync.register('sync-tareas')
    .then(() => {
      console.log("Sincronización de tareas registrada.");
    })
    .catch((error) => {
      console.error("Error al registrar la sincronización de tareas:", error);
    });
});

// Inicializar la base de datos y cargar tareas al inicio
document.addEventListener("DOMContentLoaded", () => {
  generarTabla();
});
