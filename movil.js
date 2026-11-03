/* =====================================================================
   VERSIÓN CELULAR DE LAS SECCIONES
   En pantallas angostas las secciones no se achican como un "cuadro" de
   1920: se acomodan en una columna que se lee y se toca bien (movil.css
   + los estilos html.movil de cada página). Además arma un menú de
   secciones en forma de tira deslizable arriba de todo.
   ===================================================================== */
(function(){
  "use strict";
  var mq = matchMedia("(max-width:760px)");
  window.S7_MOVIL = function(){ return mq.matches; };
  document.documentElement.classList.toggle("movil", mq.matches);
  var antes = mq.matches;
  mq.addEventListener && mq.addEventListener("change", function(){ if(mq.matches !== antes) location.reload(); });

  var SECCIONES = [
    ["index.html","Inicio"], ["sueter7.html","Sueter 7"], ["diario.html","Diario"], ["discos.html","Discos"],
    ["tienda.html","Tienda"], ["fechas.html","Fechas"], ["tu-version/","Tu versión"]
  ];
  document.addEventListener("DOMContentLoaded", function(){
    if(!mq.matches) return;
    var archivo = location.pathname.split("/").pop() || "index.html";
    if(archivo === "checkout.html") archivo = "tienda.html";
    if(archivo === "letras.html") archivo = "discos.html";
    var nav = document.createElement("nav");
    nav.className = "nav-m"; nav.setAttribute("aria-label","Secciones");
    nav.innerHTML = SECCIONES.map(function(s){
      return '<a href="'+s[0]+'"'+(s[0]===archivo?' class="on" aria-current="page"':'')+'>'+s[1]+'</a>';
    }).join("");
    document.body.insertBefore(nav, document.body.firstChild);
    var on = nav.querySelector(".on");
    if(on) nav.scrollLeft = Math.max(0, on.offsetLeft - nav.clientWidth/2 + on.offsetWidth/2);
  });
})();
