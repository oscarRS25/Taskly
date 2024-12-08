self.addEventListener("install", evento => {
    
    const promesaCache = caches.open("CACHE_ESTATICO").then(cache => {
        return cache.addAll([
            "/",
            "index.html",
            "acerca.html",
            "actividades.html",
            "configuracion.html",
            "/js/app.js",
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

            //"https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        ]);
    });

    evento.waitUntil( promesaCache );
});

self.addEventListener("fetch", evento =>{
    const respuesta = caches.match( evento.request )
        .then( cache => {
            if(cache){
                console.log("Cache: ", evento.request.url)
                return cache;
            }
            console.log("Red:", evento.request.url);
            return fetch(evento.request)
                .then(respuestaRed => {
                    return caches.open("CACHE_DINAMICO")
                        .then(cacheDinamico => {
                            if(!evento.request.url.includes("chrome-extenson")){
                                cacheDinamico.put(evento.request, respuestaRed.clone());
                            }
                            return respuestaRed.clone();
                        })
                });
        });
    evento.respondWith(respuesta);
})