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
        video: { width: 300, height: 300 },
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

// Asegurar conexión a IndexedDB
async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("tasklyDB", 1);

    request.onsuccess = (evento) => {
      console.log("Base de datos lista!");
      resolve(evento.target.result);
    };

    request.onupgradeneeded = (evento) => {
      console.log("Base de datos actualizada!");
      const db = evento.target.result;
      if (!db.objectStoreNames.contains("almacen-tareas")) {
        db.createObjectStore("almacen-tareas", { keyPath: "id", autoIncrement: true });
      }
    };

    request.onerror = (error) => {
      console.error("Error al abrir la base de datos:", error);
      reject(error);
    };
  });
}

// Generar la tabla de tareas
const generarTabla = async () => {
  const db = await initDB();
  const transaccion = db.transaction("almacen-tareas", "readonly");
  const almacen = transaccion.objectStore("almacen-tareas");
  const solicitud = almacen.getAll();

  solicitud.onsuccess = () => {
    tareas = solicitud.result;
    tableBody.innerHTML = "";
    tareas.forEach((tarea) => {
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
  };
};

// Generar un nuevo ID para la tarea
const generarId = () => {
  if (tareas.length > 0) {
    const ultimaTarea = tareas[tareas.length - 1];
    return ultimaTarea.id + 1;
  }
  return 1; // Si no hay tareas, empieza en 1
};

// Guardar o actualizar tareas
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const tarea = Object.fromEntries(formData.entries());
  tarea.foto = fotoCapturada; // Agregar la foto capturada
  const tipoFormulario = form.dataset.type;

  if (!tarea.foto) {
    alert("Por favor, tome una foto antes de guardar.");
    return;
  }

  const db = await initDB();
  const transaccion = db.transaction("almacen-tareas", "readwrite");
  const almacen = transaccion.objectStore("almacen-tareas");

  if (tipoFormulario === "add") {
    tarea.id = generarId();
    almacen.add(tarea);
  } else {
    tarea.id = parseInt(form.dataset.id, 10);
    almacen.put(tarea);
  }

  transaccion.oncomplete = generarTabla;
  camara.apagar();
  fotoContenedor.style.display = "none";
  activarCamaraBtn.style.display = "inline-block";
  rehacerFotoBtn.style.display = "none";
  tomarFotoBtn.style.display = "none";
  videoNode.style.display = "none";
});

// Editar una tarea
const editarTarea = async (id) => {
  const db = await initDB();
  const transaccion = db.transaction("almacen-tareas", "readonly");
  const almacen = transaccion.objectStore("almacen-tareas");
  const solicitud = almacen.get(id);

  solicitud.onsuccess = () => {
    const tarea = solicitud.result;
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
  };
};

// Eliminar una tarea
const eliminarTarea = async (id) => {
  const db = await initDB();
  const transaccion = db.transaction("almacen-tareas", "readwrite");
  const almacen = transaccion.objectStore("almacen-tareas");
  almacen.delete(id);

  transaccion.oncomplete = generarTabla;
};

// Botón de cancelar
cancelBtn.addEventListener("click", () => {
  form.reset();
  form.dataset.type = "add";
  form.dataset.id = "";
  fotoContenedor.style.display = "none";
  activarCamaraBtn.style.display = "inline-block";
  rehacerFotoBtn.style.display = "none";
  fotoCapturada = null;
});

// Inicializar la base de datos y cargar tareas al inicio
document.addEventListener("DOMContentLoaded", generarTabla);
