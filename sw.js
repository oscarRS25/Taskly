self.addEventListener("install", (evento) => {
    const promesaCache = caches.open("CACHE_ESTATICO").then((cache) => {
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

self.addEventListener("fetch", (evento) => {
    const respuesta = caches.match(evento.request)
        .then((cache) => {
            if (cache) {
                console.log("Cache: ", evento.request.url);
                return cache;
            }
            console.log("Red:", evento.request.url);
            return fetch(evento.request)
                .then((respuestaRed) => {
                    return caches.open("CACHE_DINAMICO").then((cacheDinamico) => {
                        if (!evento.request.url.includes("chrome-extension")) {
                            cacheDinamico.put(evento.request, respuestaRed.clone());
                        }
                        return respuestaRed.clone();
                    });
                });
        })
        .catch((error) => {
            console.error("Error en fetch:", error);
            return caches.match("/offline.html"); // Página para mostrar si todo falla
        });

    evento.respondWith(respuesta);
});

// Escuchar el evento de sincronización en segundo plano
self.addEventListener("sync", (evento) => {
    if (evento.tag === "sync-tareas") {
        console.log("Sincronización en segundo plano iniciada.");
        evento.waitUntil(enviarDatosNoSincronizados());
    }
});

// Función para enviar tareas que están en IndexedDB cuando se recupere la conexión
async function enviarDatosNoSincronizados() {
    try {
        const tareas = await obtenerTareasNoSincronizadas();
        console.log("Tareas no sincronizadas:", tareas);

        for (const tarea of tareas) {
            try {
                const response = await fetch("/api/sincronizar-tareas", {
                    method: "POST",
                    body: JSON.stringify(tarea),
                    headers: { "Content-Type": "application/json" },
                });

                if (response.ok) {
                    console.log(`Tarea sincronizada correctamente: ${tarea.id}`);
                    await eliminarTareaSincronizada(tarea.id);
                } else {
                    console.error(`Error al sincronizar la tarea: ${tarea.id}`);
                }
            } catch (error) {
                console.error("Error al enviar tarea:", tarea.id, error);
            }
        }
    } catch (error) {
        console.error("Error al obtener tareas no sincronizadas:", error);
    }
}

// Función para obtener tareas no sincronizadas de IndexedDB
async function obtenerTareasNoSincronizadas() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("tasklyDB", 1);

        request.onsuccess = (evento) => {
            const db = evento.target.result;
            const transaccion = db.transaction("almacen-tareas", "readonly");
            const almacen = transaccion.objectStore("almacen-tareas");
            const solicitud = almacen.getAll();

            solicitud.onsuccess = () => {
                const tareasNoSincronizadas = solicitud.result.filter((tarea) => !tarea.sincronizada);
                resolve(tareasNoSincronizadas);
            };

            solicitud.onerror = (error) => {
                reject(error);
            };
        };

        request.onerror = (error) => {
            reject(error);
        };
    });
}

// Función para eliminar tareas sincronizadas de IndexedDB
async function eliminarTareaSincronizada(id) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("tasklyDB", 1);

        request.onsuccess = (evento) => {
            const db = evento.target.result;
            const transaccion = db.transaction("almacen-tareas", "readwrite");
            const almacen = transaccion.objectStore("almacen-tareas");
            const solicitud = almacen.delete(id);

            solicitud.onsuccess = () => {
                console.log(`Tarea eliminada de IndexedDB: ${id}`);
                resolve();
            };

            solicitud.onerror = (error) => {
                reject(error);
            };
        };

        request.onerror = (error) => {
            reject(error);
        };
    });
}

// Agregar la sincronización de datos al intentar guardar tareas cuando no haya conexión
self.addEventListener("message", (event) => {
    if (event.data && event.data.action === "sync-tareas") {
        self.registration.sync.register("sync-tareas")
            .then(() => console.log("Sincronización de tareas registrada."))
            .catch((error) => console.error("Error al registrar la sincronización de tareas:", error));
    }
});
