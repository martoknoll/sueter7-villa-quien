/* =====================================================================
   Suéter 7 — Tu versión
   Flujo de app/avatar-studio.tsx (React) pasado a JS sin dependencias:
   foto → escena → colores → autorización → generar → descargar / compartir.
   La generación ocurre en /api/generate (función de Vercel). La key nunca
   pasa por acá.
   ===================================================================== */
(function(){
  "use strict";
  var $ = function(id){ return document.getElementById(id); };

  var scenes = [
    {id:"colectivo", label:"En el colectivo", detail:"Ventana, mochila y ciudad", glyph:"01"},
    {id:"plaza",     label:"En la plaza",     detail:"Árboles, cables y señales", glyph:"02"},
    {id:"recital",   label:"En el recital",   detail:"Luces, público y movimiento", glyph:"03"}
  ];
  var paletteColors = [
    {id:"azul",     label:"Azul",     hex:"#2C61B2", text:"#FFFFFF"},
    {id:"crema",    label:"Crema",    hex:"#E7DFD3", text:"#090909"},
    {id:"rojo",     label:"Rojo",     hex:"#D24426", text:"#FFFFFF"},
    {id:"amarillo", label:"Amarillo", hex:"#E8C229", text:"#090909"},
    {id:"negro",    label:"Negro",    hex:"#090909", text:"#FFFFFF"}
  ];
  var shareCaption = "Ya crucé al otro lado con Suéter 7 ⚡ #Suéter7";
  var loadingMessages = ["Leyendo tu silueta…", "Bajando el realismo…", "Conectando trazos y señales…", "Entrando al universo de Suéter 7…"];
  var ALLOWED = ["image/jpeg", "image/png", "image/webp"];
  var MAX_BYTES = 10 * 1024 * 1024;
  var LADO_MAX = 1600;               // la foto se achica antes de subirla (límite de 4,5 MB de Vercel)
  var DEMO_IMG = "style-reference.jpg";

  /* La API vive en Vercel. Si la página se sirve desde Vercel se usa la ruta
     relativa; desde GitHub Pages se llama al dominio de Vercel. */
  var API = /\.vercel\.app$/.test(location.hostname) || location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "/api/generate"
    : "https://sueter7-villa-quien.vercel.app/api/generate";
  try{ var forzada = new URLSearchParams(location.search).get("api"); if(forzada && /^(\/|http:\/\/localhost)/.test(forzada)) API = forzada; }catch(e){}

  var estado = {
    file: null, previewUrl: null, scene: "colectivo",
    colors: ["azul", "crema", "rojo", "amarillo", "negro"],
    consent: false, configured: null, generating: false, step: 0,
    resultUrl: null, isDemo: false, error: null, shareStatus: null
  };
  var intervalo = null;

  /* ---------------- armado de escenas y paleta ---------------- */
  scenes.forEach(function(s){
    var l = document.createElement("label");
    l.className = "scene-option"; l.dataset.id = s.id;
    l.innerHTML = '<span class="scene-number"></span><span class="scene-texto"><b></b><span></span></span>' +
      '<input type="radio" name="escena">';
    l.querySelector(".scene-number").textContent = s.glyph;
    l.querySelector("b").textContent = s.label;
    l.querySelector(".scene-texto span").textContent = s.detail;
    var r = l.querySelector("input"); r.value = s.id; r.setAttribute("aria-label", s.label);
    r.addEventListener("change", function(){ estado.scene = s.id; estado.resultUrl = null; estado.shareStatus = null; pintar(); });
    $("escenas").appendChild(l);
  });
  paletteColors.forEach(function(c){
    var b = document.createElement("button");
    b.type = "button"; b.className = "palette-option"; b.dataset.id = c.id;
    b.innerHTML = '<span class="palette-swatch"></span><span class="palette-nombre"></span>';
    b.querySelector(".palette-swatch").style.backgroundColor = c.hex;
    b.querySelector(".palette-swatch").style.color = c.text;
    b.querySelector(".palette-nombre").textContent = c.label;
    b.addEventListener("click", function(){ toggleColor(c.id); });
    $("paleta").appendChild(b);
  });

  /* ---------------- ¿hay key configurada? ---------------- */
  fetch(API).then(function(r){ return r.json(); })
    .then(function(d){ estado.configured = !!(d && d.configured); pintar(); })
    .catch(function(){ estado.configured = false; pintar(); });

  /* ---------------- foto ---------------- */
  function acceptFile(candidate){
    if(!candidate) return;
    if(ALLOWED.indexOf(candidate.type) < 0){ estado.error = "Usá una imagen JPG, PNG o WEBP."; pintar(); return; }
    if(candidate.size > MAX_BYTES){ estado.error = "La foto debe pesar menos de 10 MB."; pintar(); return; }
    estado.error = null; estado.resultUrl = null; estado.isDemo = false; estado.shareStatus = null;
    if(estado.previewUrl) URL.revokeObjectURL(estado.previewUrl);
    estado.file = candidate; estado.previewUrl = URL.createObjectURL(candidate);
    pintar();
  }
  function clearFile(){
    if(estado.previewUrl) URL.revokeObjectURL(estado.previewUrl);
    estado.file = null; estado.previewUrl = null; estado.resultUrl = null; estado.isDemo = false; estado.shareStatus = null;
    $("archivo").value = "";
    pintar();
  }
  $("archivo").addEventListener("change", function(e){ acceptFile(e.target.files && e.target.files[0]); });
  var subir = $("subir");
  subir.addEventListener("click", function(){ $("archivo").click(); });
  subir.addEventListener("keydown", function(e){ if(e.key === "Enter" || e.key === " "){ e.preventDefault(); $("archivo").click(); } });
  subir.addEventListener("dragover", function(e){ e.preventDefault(); subir.classList.add("arrastrando"); });
  subir.addEventListener("dragleave", function(){ subir.classList.remove("arrastrando"); });
  subir.addEventListener("drop", function(e){
    e.preventDefault(); subir.classList.remove("arrastrando");
    acceptFile(e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]);
  });
  $("quitar").addEventListener("click", clearFile);

  /* ---------------- colores ---------------- */
  function toggleColor(id){
    estado.error = null; estado.shareStatus = null; estado.resultUrl = null;
    var i = estado.colors.indexOf(id);
    if(i >= 0){
      if(estado.colors.length === 2){ estado.error = "Elegí por lo menos dos colores para la imagen."; pintar(); return; }
      estado.colors.splice(i, 1);
    }else{
      estado.colors.push(id);
    }
    pintar();
  }

  $("consent").addEventListener("change", function(e){ estado.consent = e.target.checked; pintar(); });

  /* ---------------- achicar la foto antes de subirla ---------------- */
  function achicar(file){
    return new Promise(function(resolve){
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function(){
        var w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, LADO_MAX / Math.max(w, h));
        if(k === 1 && file.size < 3.5 * 1024 * 1024){ URL.revokeObjectURL(url); resolve(file); return; }
        var c = document.createElement("canvas");
        c.width = Math.round(w * k); c.height = Math.round(h * k);
        var ctx = c.getContext("2d");
        ctx.fillStyle = "#E7DFD3"; ctx.fillRect(0, 0, c.width, c.height);   // PNG con transparencia
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function(b){
          resolve(b ? new File([b], (file.name || "foto").replace(/\.\w+$/, "") + ".jpg", {type:"image/jpeg"}) : file);
        }, "image/jpeg", 0.9);
      };
      img.onerror = function(){ URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  /* ---------------- generar ---------------- */
  function generate(){
    if(!estado.file || !estado.consent || estado.generating) return;
    estado.error = null; estado.generating = true; estado.step = 0;
    pintar();
    intervalo = setInterval(function(){ estado.step = (estado.step + 1) % loadingMessages.length; pintar(); }, 3200);

    var listo = function(){ clearInterval(intervalo); estado.generating = false; pintar(); };

    if(estado.configured === false){
      setTimeout(function(){
        estado.resultUrl = DEMO_IMG; estado.isDemo = true; listo();
        $("resultado").scrollIntoView({behavior:"smooth", block:"start"});
      }, 1800);
      return;
    }
    achicar(estado.file).then(function(foto){
      var payload = new FormData();
      payload.append("photo", foto);
      payload.append("scene", estado.scene);
      payload.append("palette", estado.colors.join(","));
      return fetch(API, {method:"POST", body:payload});
    }).then(function(r){
      return r.json().catch(function(){ return {}; }).then(function(data){
        if(!r.ok || !data.image){
          throw new Error(data.error || (r.status === 413 ? "La foto es demasiado pesada. Probá con otra." : "No pudimos generar la imagen."));
        }
        estado.resultUrl = data.image; estado.isDemo = false; estado.shareStatus = null;
        $("resultado").scrollIntoView({behavior:"smooth", block:"start"});
      });
    }).catch(function(err){
      estado.error = err && err.message ? err.message : "No pudimos generar la imagen. Probá de nuevo.";
    }).then(listo);
  }
  $("generar").addEventListener("click", generate);

  /* ---------------- descargar, compartir, copiar ---------------- */
  function downloadResult(){
    if(!estado.resultUrl) return;
    var a = document.createElement("a");
    a.href = estado.resultUrl; a.download = "mi-version-sueter7.jpg";
    document.body.appendChild(a); a.click(); a.remove();
  }
  function shareOk(){
    estado.shareStatus = "Listo: abrimos las opciones para compartir.";
    pintar();
  }
  function shareFallback(){
    var texto = encodeURIComponent(shareCaption + " " + location.href);
    var ventana = window.open("https://wa.me/?text=" + texto, "_blank", "noopener,noreferrer");
    downloadResult();
    estado.shareStatus = ventana
      ? "Abrimos WhatsApp y descargamos la imagen para que la adjuntes."
      : "Descargamos la imagen. Elegí WhatsApp o X abajo para compartirla.";
    pintar();
    $("compartir-panel").scrollIntoView({behavior:"smooth", block:"nearest"});
  }
  function fileFromDataUrl(url){
    if(!/^data:/i.test(url)) return null;
    try{
      var partes = url.split(","), meta = partes[0], mime = (meta.match(/^data:([^;]+)/i)||[])[1] || "image/jpeg";
      var bin = meta.indexOf(";base64") >= 0 ? atob(partes[1]) : decodeURIComponent(partes.slice(1).join(","));
      var bytes = new Uint8Array(bin.length);
      for(var i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
      var ext = mime.indexOf("png") >= 0 ? "png" : mime.indexOf("webp") >= 0 ? "webp" : "jpg";
      return new File([bytes], "mi-version-sueter7." + ext, {type:mime});
    }catch(e){ return null; }
  }
  function nativeShare(file){
    var conArchivo = {title:"Mi versión de Suéter 7", text:shareCaption, files:[file]};
    var soloTexto = {title:"Mi versión de Suéter 7", text:shareCaption, url:location.href};
    var datos = file && (!navigator.canShare || navigator.canShare(conArchivo)) ? conArchivo : soloTexto;
    return navigator.share(datos).then(shareOk).catch(function(err){
      if(err && err.name === "AbortError") return;
      downloadResult();
      estado.shareStatus = "El navegador no pudo abrir el panel. Descargamos la imagen y dejamos accesos para compartirla.";
      pintar();
      $("compartir-panel").scrollIntoView({behavior:"smooth", block:"nearest"});
    });
  }
  function shareResult(){
    if(!estado.resultUrl) return;
    if(!navigator.share){ shareFallback(); return; }

    var directo = fileFromDataUrl(estado.resultUrl);
    if(directo){ nativeShare(directo); return; }

    estado.shareStatus = "Preparando la imagen para compartir…"; pintar();
    fetch(estado.resultUrl).then(function(r){
      if(!r.ok) throw new Error("No se pudo preparar la imagen.");
      return r.blob();
    }).then(function(blob){
      var ext = blob.type.indexOf("png") >= 0 ? "png" : blob.type.indexOf("webp") >= 0 ? "webp" : "jpg";
      return nativeShare(new File([blob], "mi-version-sueter7." + ext, {type:blob.type || "image/jpeg"}));
    }).catch(function(){ shareFallback(); });
  }
  function copyCaption(){
    var ok = function(){ estado.shareStatus = "Texto copiado."; pintar(); };
    var mal = function(){ estado.shareStatus = "No pudimos copiar el texto. Podés seleccionarlo manualmente."; pintar(); };
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(shareCaption).then(ok, mal);
    else mal();
  }
  function startAnother(){
    estado.resultUrl = null; estado.isDemo = false; estado.shareStatus = null; estado.error = null;
    pintar();
    window.scrollTo({top:0, behavior:"smooth"});
  }
  /* ---------------- publicar en el muro ---------------- */
  function foroHeaders(extra){
    var cfg=window.S7_FORO_CONFIG, h={"apikey":cfg.key};
    Object.keys(extra||{}).forEach(function(k){h[k]=extra[k]});
    return h;
  }
  function foroFetch(path, opciones){
    var cfg=window.S7_FORO_CONFIG;
    opciones=opciones||{}; opciones.headers=foroHeaders(opciones.headers);
    return fetch(cfg.url+path,opciones).then(function(r){
      if(r.ok)return r;
      return r.json().catch(function(){return {}}).then(function(d){
        throw new Error(d.message||d.error_description||d.error||"No pudimos publicar en el muro.");
      });
    });
  }
  function abrirMuro(){
    if(!estado.resultUrl)return;
    var modal=$("muro-modal"), nombre="";
    try{nombre=localStorage.getItem("s7-foro-alias")||""}catch(e){}
    $("muro-alias").value=nombre;
    $("muro-comentario").value="";
    $("muro-caracteres").textContent="0";
    $("muro-modal-error").hidden=true;
    $("muro-modal-vista").src=estado.resultUrl;
    modal.hidden=false; document.body.style.overflow="hidden";
    setTimeout(function(){(nombre?$("muro-comentario"):$("muro-alias")).focus()},20);
  }
  function cerrarMuro(){
    $("muro-modal").hidden=true; document.body.style.overflow="";
  }
  function errorMuro(txt){
    $("muro-modal-error").textContent=txt; $("muro-modal-error").hidden=false;
  }
  function idMuro(){
    if(window.crypto&&crypto.randomUUID)return crypto.randomUUID().replace(/-/g,"");
    return (Date.now().toString(36)+Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2)).slice(0,32);
  }
  function archivoResultado(){
    var directo=fileFromDataUrl(estado.resultUrl);
    if(directo)return Promise.resolve(directo);
    return fetch(estado.resultUrl).then(function(r){
      if(!r.ok)throw new Error("No pudimos preparar la imagen.");
      return r.blob();
    }).then(function(blob){
      var ext=blob.type.indexOf("png")>=0?"png":blob.type.indexOf("webp")>=0?"webp":"jpg";
      return new File([blob],"mi-version-sueter7."+ext,{type:blob.type||"image/jpeg"});
    });
  }
  function publicarMuro(){
    var cfg=window.S7_FORO_CONFIG;
    var nombre=$("muro-alias").value.trim(), comentario=$("muro-comentario").value.trim();
    $("muro-modal-error").hidden=true;
    if(nombre.length<2){errorMuro("El alias tiene que tener al menos 2 caracteres.");$("muro-alias").focus();return}
    var boton=$("muro-confirmar"); boton.disabled=true; boton.textContent="Publicando…";
    var ruta="";
    archivoResultado().then(function(file){
      if(file.size>5*1024*1024)throw new Error("La imagen supera los 5 MB.");
      var ext=file.type.indexOf("png")>=0?"png":file.type.indexOf("webp")>=0?"webp":"jpg";
      ruta="posts/"+idMuro()+"."+ext;
      return foroFetch("/storage/v1/object/"+cfg.bucket+"/"+ruta,{
        method:"POST",
        headers:{"Content-Type":file.type||"image/jpeg","x-upsert":"false"},
        body:file
      });
    }).then(function(){
      return foroFetch("/rest/v1/forum_posts",{
        method:"POST",
        headers:{"Content-Type":"application/json","Prefer":"return=minimal"},
        body:JSON.stringify({author_name:nombre,comment:comentario,image_path:ruta,post_type:"image"})
      });
    }).then(function(){
      try{localStorage.setItem("s7-foro-alias",nombre)}catch(e){}
      location.href="muro.html";
    }).catch(function(err){
      errorMuro(err.message||"No pudimos publicar la imagen.");
      boton.disabled=false; boton.textContent="Publicar imagen";
    });
  }
  $("publicar-muro").addEventListener("click",abrirMuro);
  $("muro-modal-cerrar").addEventListener("click",cerrarMuro);
  $("muro-modal-fondo").addEventListener("click",cerrarMuro);
  $("muro-confirmar").addEventListener("click",publicarMuro);
  $("muro-comentario").addEventListener("input",function(){
    $("muro-caracteres").textContent=String($("muro-comentario").value.length);
  });
  document.addEventListener("keydown",function(ev){if(ev.key==="Escape"&&!$("muro-modal").hidden)cerrarMuro()});

  $("descargar").addEventListener("click", downloadResult);
  $("compartir").addEventListener("click", shareResult);
  $("copiar").addEventListener("click", copyCaption);
  $("otra").addEventListener("click", startAnother);
  $("sugerido").textContent = shareCaption;
  $("share-whatsapp").href = "https://wa.me/?text=" + encodeURIComponent(shareCaption + " " + location.href);
  $("share-x").href = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(shareCaption + " " + location.href);

  /* ---------------- pintar la interfaz según el estado ---------------- */
  function mostrar(id, v){ $(id).hidden = !v; }
  function pintar(){
    var hay = !!estado.resultUrl;
    $("layout").classList.toggle("con-resultado", hay);

    // foto
    mostrar("subir-vacio", !estado.previewUrl);
    mostrar("vista", !!estado.previewUrl);
    mostrar("cambiar", !!estado.previewUrl);
    subir.classList.toggle("con-foto", !!estado.previewUrl);
    if(estado.previewUrl && $("vista").src !== estado.previewUrl) $("vista").src = estado.previewUrl;
    mostrar("archivo-fila", !!estado.file);
    if(estado.file) $("archivo-nombre").textContent = estado.file.name;

    // escenas
    document.querySelectorAll(".scene-option").forEach(function(l){
      var on = l.dataset.id === estado.scene;
      l.classList.toggle("activa", on); l.querySelector("input").checked = on;
    });
    var sc = scenes.filter(function(s){ return s.id === estado.scene; })[0] || scenes[0];
    $("escena-chip").textContent = sc.label;

    // paleta
    document.querySelectorAll(".palette-option").forEach(function(b){
      var on = estado.colors.indexOf(b.dataset.id) >= 0, c = paletteColors.filter(function(p){ return p.id === b.dataset.id; })[0];
      b.classList.toggle("activa", on);
      b.setAttribute("aria-pressed", String(on));
      b.setAttribute("aria-label", (on ? "Quitar " : "Agregar ") + c.label);
      b.querySelector(".palette-swatch").innerHTML = on ? '<svg class="icono" aria-hidden="true"><use href="#i-check"/></svg>' : "";
    });
    var elegida = $("paleta-elegida"); elegida.innerHTML = "";
    paletteColors.forEach(function(c){
      if(estado.colors.indexOf(c.id) < 0) return;
      var s = document.createElement("span"), i = document.createElement("i");
      i.style.backgroundColor = c.hex; s.appendChild(i); s.appendChild(document.createTextNode(c.label));
      elegida.appendChild(s);
    });

    // resultado
    $("r-paso").textContent = hay ? "Resultado" : "Paso 4";
    $("r-titulo").textContent = hay ? "Ya estás del otro lado" : "Prepará la transformación";
    mostrar("r-bajada", hay);
    mostrar("r-cargando", estado.generating);
    mostrar("r-vacio", !estado.generating && !hay);
    mostrar("r-imagen", !estado.generating && hay);
    mostrar("r-etiqueta", !estado.generating && hay);
    if(hay && $("r-imagen").getAttribute("src") !== estado.resultUrl) $("r-imagen").src = estado.resultUrl;
    $("r-etiqueta").textContent = estado.isDemo ? "Resultado de ejemplo" : "Generado para vos";
    $("r-mensaje").textContent = loadingMessages[estado.step];

    mostrar("aviso-demo", estado.configured === false && !hay);
    mostrar("aviso-error", !!estado.error);
    $("aviso-error").textContent = estado.error || "";
    mostrar("consentimiento", !hay);
    $("consent").checked = estado.consent;

    mostrar("generar", !hay);
    mostrar("compartir", hay);
    mostrar("descargar", hay);
    $("generar").disabled = !estado.file || !estado.consent || estado.generating || estado.configured === null;
    $("generar-txt").textContent = estado.configured === false ? "Ver resultado de ejemplo" : "Generar mi versión";
    $("generar-ico").setAttribute("href", estado.configured === false ? "#i-check" : "#i-sparkles");

    mostrar("compartir-panel", hay);
    mostrar("share-estado", !!estado.shareStatus);
    $("share-estado").textContent = estado.shareStatus || "";
  }
  pintar();
})();
