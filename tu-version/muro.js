(function(){
  "use strict";
  var cfg=window.S7_FORO_CONFIG;
  var feed=document.getElementById("feed");
  var estado=document.getElementById("estado");
  var contador=document.getElementById("contador");
  var mas=document.getElementById("cargar-mas");
  var modal=document.getElementById("modal");
  var alias=document.getElementById("alias");
  var mensaje=document.getElementById("mensaje");
  var error=document.getElementById("modal-error");
  var publicar=document.getElementById("publicar");
  var caracteres=document.getElementById("caracteres");
  var pagina=0, limite=18, cargando=false, total=0;

  function headers(extra){
    var h={"apikey":cfg.key};
    Object.keys(extra||{}).forEach(function(k){h[k]=extra[k]});
    return h;
  }
  function api(path,opciones){
    opciones=opciones||{};
    opciones.headers=headers(opciones.headers);
    return fetch(cfg.url+path,opciones).then(function(r){
      if(!r.ok) return r.json().catch(function(){return {}}).then(function(d){
        throw new Error(d.message||d.error_description||d.error||"No pudimos conectar con el muro.");
      });
      return r;
    });
  }
  function urlImagen(path){
    return cfg.url+"/storage/v1/object/public/"+cfg.bucket+"/"+path.split("/").map(encodeURIComponent).join("/");
  }
  function fecha(valor){
    try{
      return new Intl.DateTimeFormat("es-AR",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(valor));
    }catch(e){return ""}
  }
  function crearPost(p){
    var article=document.createElement("article");
    article.className="post";
    var cabeza=document.createElement("header"); cabeza.className="post-cabeza";
    var autor=document.createElement("strong"); autor.className="post-autor"; autor.textContent=p.author_name;
    var cuando=document.createElement("time"); cuando.className="post-fecha"; cuando.dateTime=p.created_at; cuando.textContent=fecha(p.created_at);
    cabeza.appendChild(autor); cabeza.appendChild(cuando); article.appendChild(cabeza);

    if(p.post_type==="image"&&p.image_path){
      var img=document.createElement("img");
      img.className="post-imagen"; img.loading="lazy"; img.decoding="async";
      img.src=urlImagen(p.image_path); img.alt="Versión compartida por "+p.author_name;
      article.appendChild(img);
      var sello=document.createElement("span"); sello.className="post-sello"; sello.textContent="S7"; sello.setAttribute("aria-hidden","true"); article.appendChild(sello);
      if((p.comment||"").trim()) article.classList.add("post-con-texto");
    }else{
      article.classList.add("post-solo-texto","color-"+(Number(p.id)%4));
    }
    var texto=document.createElement("p"); texto.className="post-texto"; texto.textContent=p.comment||"";
    article.appendChild(texto);
    return article;
  }
  function pintarContador(){
    contador.textContent=total===1?"1 publicación del otro lado":total+" publicaciones del otro lado";
  }
  function cargar(reiniciar){
    if(cargando)return;
    cargando=true;
    if(reiniciar){pagina=0;total=0;feed.replaceChildren();estado.hidden=false;estado.textContent="Buscando señales del otro lado…"}
    feed.setAttribute("aria-busy","true");
    mas.disabled=true;
    var offset=pagina*limite;
    var query="/rest/v1/forum_posts?select=id,author_name,comment,image_path,post_type,created_at&order=created_at.desc&limit="+(limite+1)+"&offset="+offset;
    api(query).then(function(r){return r.json()}).then(function(datos){
      var hayMas=datos.length>limite;
      datos.slice(0,limite).forEach(function(p){feed.appendChild(crearPost(p))});
      total+=Math.min(datos.length,limite);
      pagina++;
      estado.hidden=total>0;
      if(!total){estado.hidden=false;estado.textContent="Todavía no hay publicaciones. Podés ser la primera persona en dejar algo."}
      mas.hidden=!hayMas;
      pintarContador();
    }).catch(function(err){
      estado.hidden=false;estado.textContent=err.message||"No pudimos cargar el muro.";
    }).then(function(){
      cargando=false;feed.setAttribute("aria-busy","false");mas.disabled=false;
    });
  }
  function abrir(){
    try{alias.value=localStorage.getItem("s7-foro-alias")||""}catch(e){}
    mensaje.value="";caracteres.textContent="0";error.hidden=true;modal.hidden=false;
    document.body.style.overflow="hidden";
    setTimeout(function(){(alias.value?mensaje:alias).focus()},20);
  }
  function cerrar(){
    modal.hidden=true;document.body.style.overflow="";
  }
  function mostrarError(txt){error.textContent=txt;error.hidden=false}
  function publicarTexto(){
    var nombre=alias.value.trim(), texto=mensaje.value.trim();
    error.hidden=true;
    if(nombre.length<2){mostrarError("El alias tiene que tener al menos 2 caracteres.");alias.focus();return}
    if(texto.length<1){mostrarError("Escribí un mensaje antes de publicar.");mensaje.focus();return}
    publicar.disabled=true;publicar.textContent="Publicando…";
    api("/rest/v1/forum_posts",{
      method:"POST",
      headers:{"Content-Type":"application/json","Prefer":"return=minimal"},
      body:JSON.stringify({author_name:nombre,comment:texto,image_path:null,post_type:"text"})
    }).then(function(){
      try{localStorage.setItem("s7-foro-alias",nombre)}catch(e){}
      cerrar();cargar(true);
    }).catch(function(err){mostrarError(err.message||"No pudimos publicar el mensaje.")})
      .then(function(){publicar.disabled=false;publicar.textContent="Publicar en el muro"});
  }

  document.getElementById("nuevo-texto").addEventListener("click",abrir);
  document.getElementById("cerrar").addEventListener("click",cerrar);
  document.getElementById("cerrar-fondo").addEventListener("click",cerrar);
  document.getElementById("recargar").addEventListener("click",function(){cargar(true)});
  mas.addEventListener("click",function(){cargar(false)});
  publicar.addEventListener("click",publicarTexto);
  mensaje.addEventListener("input",function(){caracteres.textContent=String(mensaje.value.length)});
  document.addEventListener("keydown",function(ev){if(ev.key==="Escape"&&!modal.hidden)cerrar()});
  cargar(true);
})();
