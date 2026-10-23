/* =====================================================================
   PUENTE — conecta cada sección con la estación (index.html)

   La estación tiene el único reproductor del sitio. Las secciones se
   abren adentro de ella, así la música no se corta al navegar.
   Este archivo, incluido en el <head> de cada sección:

   · si la página se abre suelta, la manda a index.html#seccion
   · convierte los enlaces internos en navegación de la estación
   · le da a la página un "audio" (S7.audio) que en realidad maneja el
     reproductor de la estación, con la misma forma que un <audio>:
     src, play(), pause(), currentTime, paused, duration y sus eventos.
     Así el código de Discos y Letras funciona sin cambios.
   · avisa con el evento "s7-tema" cuando el tema cambió desde afuera
   ===================================================================== */
(function(){
  "use strict";
  var PAGINAS = {
    "index.html":"", "home.html":"", "":"",
    "sueter7.html":"sueter7", "diario.html":"diario", "discos.html":"discos",
    "tienda.html":"tienda", "fechas.html":"fechas", "letras.html":"letras", "compra.html":"compra"
  };
  var archivo = location.pathname.split("/").pop();
  var EMBEBIDA = window.parent !== window;

  if(!EMBEBIDA){
    var propio = PAGINAS[archivo] || "";
    location.replace("index.html" + (propio ? "#" + propio + location.search : ""));
    window.S7 = {embebida:false};
    return;
  }

  document.documentElement.classList.add("embebida");
  var estilo = document.createElement("style");
  estilo.textContent = ".embebida #player,.embebida .player{display:none !important}";
  document.head.appendChild(estilo);

  function alPadre(m){ try{ window.parent.postMessage(m, "*"); }catch(e){} }

  /* ---------- enlaces internos ---------- */
  document.addEventListener("click", function(ev){
    var a = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
    if(!a || a.target === "_blank") return;
    var href = a.getAttribute("href");
    if(!href || href.charAt(0) === "#") return;
    var url;
    try{ url = new URL(href, location.href); }catch(e){ return; }
    if(url.origin !== location.origin) return;
    var destino = url.pathname.split("/").pop();
    if(!(destino in PAGINAS)) return;
    ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
    var nombre = PAGINAS[destino];
    var extra = url.search;
    if(destino === "index.html" && url.hash) { nombre = url.hash.slice(1); extra = ""; }
    alPadre({s7:"ir", a:nombre, q:extra});
  }, true);

  document.addEventListener("keydown", function(ev){
    if(ev.key !== "Escape" || document.documentElement.hasAttribute("data-sin-escape")) return;
    alPadre({s7:"ir", a:""});
  });

  /* ---------- el "audio" que maneja el reproductor de la estación ---------- */
  function numeroDe(src){
    var m = String(src || "").match(/(?:^|\/|- )(\d{2})[\s-]/);
    return m ? +m[1] : 0;
  }
  function AudioPuente(){
    this._et = document.createDocumentFragment();   /* para los eventos */
    this._n = 0; this._t = 0; this._sello = 0; this._pausado = true; this._d = NaN;
    this._src = ""; this._listo = false; this.volume = 1; this.muted = false; this.preload = "none";
  }
  AudioPuente.prototype = {
    addEventListener: function(t, f, o){ this._et.addEventListener(t, f, o); },
    removeEventListener: function(t, f, o){ this._et.removeEventListener(t, f, o); },
    dispatchEvent: function(e){ return this._et.dispatchEvent(e); },
    _avisar: function(t){ this.dispatchEvent(new Event(t)); },
    get paused(){ return this._pausado; },
    get duration(){ return this._d; },
    get currentTime(){
      return this._pausado ? this._t : this._t + (performance.now() - this._sello) / 1000;
    },
    set currentTime(v){
      this._t = +v || 0; this._sello = performance.now();
      alPadre({s7:"buscar", t:this._t});
      var yo = this; setTimeout(function(){ yo._avisar("seeked"); yo._avisar("timeupdate"); }, 0);
    },
    get src(){ return this._src; },
    set src(v){
      this._src = v;
      var n = numeroDe(v);
      if(!n || n === this._n) return;
      this._n = n; this._t = 0; this._d = NaN;
      /* hasta saber qué suena en la estación, no se le pide nada */
      if(this._listo) alPadre({s7:"cargar", n:n});
    },
    play: function(){ alPadre({s7:"play", n:this._n}); return Promise.resolve(); },
    pause: function(){ alPadre({s7:"pausa"}); },
    load: function(){},
    _estado: function(m){
      var primero = !this._listo;
      this._listo = true;
      if(primero && !m.cargado && this._n && this._n !== m.n){
        /* la estación no estaba sonando: manda lo que pidió la página */
        alPadre({s7:"cargar", n:this._n});
        return;
      }
      var cambio = m.n !== this._n;
      this._n = m.n;
      this._t = m.t || 0; this._sello = performance.now();
      if(isFinite(m.d)) this._d = m.d;
      if(cambio){
        window.dispatchEvent(new CustomEvent("s7-tema", {detail:m.n}));
        this._avisar("loadedmetadata");
      }
      var antes = this._pausado;
      this._pausado = !m.sonando;
      if(antes !== this._pausado) this._avisar(this._pausado ? "pause" : "play");
      this._avisar("timeupdate");
    }
  };
  var audio = new AudioPuente();

  window.addEventListener("message", function(ev){
    if(ev.source !== window.parent) return;
    var m = ev.data || {};
    if(m.s7 === "estado") audio._estado(m);
  });

  window.S7 = {embebida:true, audio:audio, alPadre:alPadre};
  /* se saluda cuando ya corrió el código de la página, así está lista
     para enterarse de qué tema suena */
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", function(){ alPadre({s7:"hola"}); });
  }else{
    alPadre({s7:"hola"});
  }
})();
