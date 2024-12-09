const abrirBaseDatos = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("tasklyDB", 1);

    request.onsuccess = (evento) => {
      console.log("Base de datos lista!");
      resolve(evento.target.result);
    };

    request.onupgradeneeded = (evento) => {
      console.log("Base de datos actualizada!");
      const db = evento.target.result;
      db.createObjectStore("almacen-tareas", { keyPath: "id", autoIncrement: true });
    };

    request.onerror = (evento) => {
      console.error("Error al abrir la base de datos:", evento.target.error);
      reject(evento.target.error);
    };
  });
};

let db = null;

(async () => {
  try {
    db = await abrirBaseDatos();
    console.log("Base de datos inicializada correctamente.");
  } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
  }
})();

// Función para obtener un almacén de objetos
const obtenerAlmacen = (modoTransaccion) => {
  if (!db) throw new Error("Base de datos no inicializada.");
  const transaccion = db.transaction("almacen-tareas", modoTransaccion);
  return transaccion.objectStore("almacen-tareas");
};

// Función para guardar datos en la base de datos
const guardar = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const almacen = obtenerAlmacen("readwrite");
      const request = almacen.add(data);

      request.onsuccess = () => {
        console.log("Datos guardados correctamente.");
        resolve(request.result);
      };

      request.onerror = (evento) => {
        console.error("Error al guardar los datos:", evento.target.error);
        reject(evento.target.error);
      };
    } catch (error) {
      reject(error);
    }
  });
};

// Función para listar todos los datos
const listar = () => {
  return new Promise((resolve, reject) => {
    try {
      const almacen = obtenerAlmacen("readonly");
      const request = almacen.getAll();

      request.onsuccess = (evento) => {
        resolve(evento.target.result);
      };

      request.onerror = (evento) => {
        console.error("Error al listar los datos:", evento.target.error);
        reject(evento.target.error);
      };
    } catch (error) {
      reject(error);
    }
  });
};

// Función para listar datos por ID
const listarPorId = (id) => {
  return new Promise((resolve, reject) => {
    try {
      const almacen = obtenerAlmacen("readonly");
      const request = almacen.get(id);

      request.onsuccess = (evento) => {
        resolve(evento.target.result);
      };

      request.onerror = (evento) => {
        console.error("Error al obtener los datos por ID:", evento.target.error);
        reject(evento.target.error);
      };
    } catch (error) {
      reject(error);
    }
  });
};

// Función para actualizar datos
const actualizar = (datosActualizados) => {
  return new Promise((resolve, reject) => {
    try {
      const almacen = obtenerAlmacen("readwrite");
      const request = almacen.put(datosActualizados);

      request.onsuccess = () => {
        console.log("Datos actualizados correctamente.");
        resolve(request.result);
      };

      request.onerror = (evento) => {
        console.error("Error al actualizar los datos:", evento.target.error);
        reject(evento.target.error);
      };
    } catch (error) {
      reject(error);
    }
  });
};

// Función para eliminar datos
const eliminar = (id) => {
  return new Promise((resolve, reject) => {
    try {
      const almacen = obtenerAlmacen("readwrite");
      const request = almacen.delete(id);

      request.onsuccess = () => {
        console.log("Datos eliminados correctamente.");
        resolve(request.result);
      };

      request.onerror = (evento) => {
        console.error("Error al eliminar los datos:", evento.target.error);
        reject(evento.target.error);
      };
    } catch (error) {
      reject(error);
    }
  });
};
