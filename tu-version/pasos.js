/* =====================================================================
   PASO A PASO — Tu versión muestra un paso por pantalla:
   1 Subí la foto → 2 Elegí la escena → 3 Elegí los colores → 4 Generá.
   La guía de arriba (01 Foto · 02 Escena · 03 Color · 04 Generar) marca
   dónde estás y se puede tocar para ir a un paso.
   No toca la lógica de estudio.js: sólo muestra/oculta los paneles.
   ===================================================================== */
(function(){
  "use strict";
  var layout = document.getElementById("layout");
  var paneles = [
    document.querySelector(".collage-panel-photo"),
    document.querySelector(".collage-panel-scenes"),
    document.querySelector(".collage-panel-palette"),
    document.getElementById("resultado")
  ];
  /* la guía de pasos va arriba del paso, grande, a todo el ancho */
  var nav = document.querySelector(".process-nav");
  if(nav){ nav.classList.add("guia-grande"); layout.insertBefore(nav, layout.firstChild); }
  var guia = [].slice.call(document.querySelectorAll(".process-nav span"));
  var actual = 0;
  layout.classList.add("de-a-uno");

  /* barra de "Atrás / Siguiente" en los pasos 1 a 3, "Atrás" en el 4 */
  paneles.forEach(function(p, i){
    var barra = document.createElement("div");
    barra.className = "paso-barra";
    barra.innerHTML =
      (i > 0 ? '<button type="button" class="paso-atras">← Atrás</button>' : '<span></span>') +
      '<span class="paso-cuenta">Paso ' + (i+1) + ' de 4</span>' +
      (i < 3 ? '<button type="button" class="paso-sig">Siguiente →</button>' : '<span></span>');
    p.appendChild(barra);
    var a = barra.querySelector(".paso-atras"), s = barra.querySelector(".paso-sig");
    if(a) a.addEventListener("click", function(){ ir(i-1); });
    if(s) s.addEventListener("click", function(){ if(puede(i)) ir(i+1); });
  });

  /* la guía se puede tocar */
  guia.forEach(function(g, i){
    g.setAttribute("role","button"); g.tabIndex = 0;
    g.addEventListener("click", function(){ if(i <= maxPermitido()) ir(i); });
    g.addEventListener("keydown", function(ev){ if(ev.key==="Enter"||ev.key===" "){ ev.preventDefault(); if(i <= maxPermitido()) ir(i); } });
  });

  function hayFoto(){ var v=document.getElementById("vista"); return v && !v.hidden; }
  function coloresElegidos(){ return document.querySelectorAll("#paleta .activa, #paleta [aria-pressed='true'], #paleta .on").length; }
  function puede(i){
    if(i === 0 && !hayFoto()){ avisar(paneles[0], "Primero subí una foto."); return false; }
    if(i === 2 && coloresElegidos() && coloresElegidos() < 2){ avisar(paneles[2], "Elegí al menos dos colores."); return false; }
    return true;
  }
  function maxPermitido(){ return hayFoto() ? 3 : 0; }
  function avisar(p, txt){
    var c = p.querySelector(".paso-cuenta"); if(!c) return;
    c.textContent = txt; c.classList.add("alerta");
    clearTimeout(c._t); c._t = setTimeout(function(){ c.classList.remove("alerta"); c.textContent = "Paso " + (paneles.indexOf(p)+1) + " de 4"; }, 2200);
  }
  function ir(i){
    actual = Math.max(0, Math.min(3, i));
    paneles.forEach(function(p, k){ p.classList.toggle("paso-visible", k === actual); });
    guia.forEach(function(g, k){
      g.classList.toggle("process-nav-active", k === actual);
      g.classList.toggle("hecho", k < actual);
      g.setAttribute("aria-current", k === actual ? "step" : "false");
    });
    actualizarSig();
    var top = layout.getBoundingClientRect().top + window.scrollY - 16;
    if(window.scrollY > top) window.scrollTo({top: top, behavior: "smooth"});
  }
  function actualizarSig(){
    var s = paneles[0].querySelector(".paso-sig"); if(s) s.disabled = !hayFoto();
  }
  /* cuando se sube la foto, se habilita "Siguiente" y pasa solo al paso 2 */
  var vista = document.getElementById("vista");
  new MutationObserver(function(){
    var antes = paneles[0].querySelector(".paso-sig").disabled;
    actualizarSig();
    if(antes && hayFoto() && actual === 0) setTimeout(function(){ ir(1); }, 650);
  }).observe(vista, {attributes:true, attributeFilter:["hidden","src"]});
  /* elegir una escena lleva al paso de colores */
  document.getElementById("escenas").addEventListener("change", function(){ if(actual===1) setTimeout(function(){ ir(2); }, 450); });
  /* "Crear otra versión" vuelve al paso 1 */
  var otra = document.getElementById("otra");
  if(otra) otra.addEventListener("click", function(){ setTimeout(function(){ ir(0); }, 50); });

  ir(0);
})();
