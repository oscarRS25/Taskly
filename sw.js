self.addEventListener("install", evento => {
    const promesaCache = caches.open("CACHE_ESTATICO").then(cache => {
        return cache.addAll([
            "/",
            "index.html",
            "acerca.html",
            "actividades.html",
            "configuracion.html",
            "/js/app.js",
            "/js/baseDatos.js",
            "/css/style.css",
            "/img/logo.png",
            "img/accesibilidad.png",
            "img/facilidad-uso.png",
            "img/favicon.ico",
            "img/hero.jpg",
            "img/hero2.jpg",
            "img/maiky.png",
            "img/notificacion.png",
            "img/organizacion.png",
            "img/oscar.png",
            "img/productividad.png",
            "img/reduccion-de-estres.png",
            "img/saul.png",
        ]);
    });

    evento.waitUntil(promesaCache);
});

self.addEventListener("fetch", evento => {
    const respuesta = caches.match(evento.request)
        .then(cache => {
            if (cache) {
                console.log("Cache: ", evento.request.url);
                return cache;
            }
            console.log("Red:", evento.request.url);
            return fetch(evento.request)
                .then(respuestaRed => {
                    return caches.open("CACHE_DINAMICO")
                        .then(cacheDinamico => {
                            if (!evento.request.url.includes("chrome-extension")) {
                                cacheDinamico.put(evento.request, respuestaRed.clone());
                            }
                            return respuestaRed.clone();
                        });
                });
        });
    evento.respondWith(respuesta);
});

// Escuchar el evento de sincronización en segundo plano
self.addEventListener('sync', function(event) {
    if (event.tag === 'sync-tareas') {
        event.waitUntil(enviarDatosNoSincronizados());
    }
});

// Función para enviar tareas que están en IndexedDB cuando se recupere la conexión
async function enviarDatosNoSincronizados() {
    const tareas = await obtenerTareasNoSincronizadas();
    tareas.forEach(tarea => {
        // Aquí simulas el envío de la tarea al servidor (puede ser una llamada fetch)
        fetch('/api/sincronizar-tareas', {
            method: 'POST',
            body: JSON.stringify(tarea),
            headers: { 'Content-Type': 'application/json' },
        })
        .then(response => {
            if (response.ok) {
                eliminarTareaSincronizada(tarea.id);  // Elimina de IndexedDB las tareas sincronizadas
            }
        });
    });
}

// Función para obtener tareas no sincronizadas de IndexedDB
async function obtenerTareasNoSincronizadas() {
    // Aquí puedes consultar la IndexedDB para obtener las tareas que aún no se han sincronizado
    // Retorna las tareas de la base de datos que no han sido sincronizadas
    const transaccion = db.transaction("almacen-tareas", "readonly");
    const almacen = transaccion.objectStore("almacen-tareas");
    const solicitud = almacen.getAll();

    return new Promise((resolve, reject) => {
        solicitud.onsuccess = (evento) => {
            resolve(evento.target.result.filter(tarea => !tarea.sincronizada));
        };
        solicitud.onerror = reject;
    });
}

// Función para eliminar tareas sincronizadas de IndexedDB
async function eliminarTareaSincronizada(id) {
    const transaccion = db.transaction("almacen-tareas", "readwrite");
    const almacen = transaccion.objectStore("almacen-tareas");
    await almacen.delete(id);
}

// Agregar la sincronización de datos al intentar guardar tareas cuando no haya conexión
self.addEventListener('message', function(event) {
    if (event.data && event.data.action === 'sync-tareas') {
        self.registration.sync.register('sync-tareas');
    }
});
