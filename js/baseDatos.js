let baseDatos = indexedDB.open("tasklyDB", 1);
const almacen = "almacen-tareas";
let db = null;

baseDatos.onsuccess = (evento) => {
    console.log("Base de datos lista!");
    db = evento.target.result;
};

baseDatos.onupgradeneeded = (evento) => {
    console.log("Base de datos actualizada!");
    db = evento.target.result;
    db.createObjectStore(almacen, { keyPath: "id", autoIncrement: true });
};

const obtenerAlmacen = (modoTransaccion) => {
    let transaccion = db.transaction(almacen, modoTransaccion);
    return transaccion.objectStore(almacen);
};

const guardar = (data, onsuccess = null) => {
    let tarea = obtenerAlmacen("readwrite");
    let respuesta = tarea.add(data);
    respuesta.onsuccess = onsuccess;
};

const listar = (onsuccess = null) => {
    let almacen = obtenerAlmacen("readonly");
    let respuesta = almacen.getAll();
    respuesta.onsuccess = (evento) => {
        let lista = evento.target.result;
        if (onsuccess) onsuccess(lista);
    };
};

const listarPorId = (id, onsuccess = null) => {
    let almacen = obtenerAlmacen("readonly");
    let respuesta = almacen.get(id);
    respuesta.onsuccess = (evento) => {
        let datos = evento.target.result;
        if (onsuccess) onsuccess(datos);
    };
};

const actualizar = (datosActualizados, onsuccess = null) => {
    let almacen = obtenerAlmacen("readwrite");
    let editar = almacen.put(datosActualizados);
    editar.onsuccess = onsuccess;
};

const eliminar = (id, onsuccess = null) => {
    let almacen = obtenerAlmacen("readwrite");
    let eliminar = almacen.delete(id);
    eliminar.onsuccess = onsuccess;
};
