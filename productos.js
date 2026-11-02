/* =====================================================================
   PRODUCTOS DE LA TIENDA — lo usan tienda.html y checkout.html.
   Editá acá nombres, precios, fotos y descripciones.
   talles: si el producto tiene talles, se eligen al finalizar la compra.
   OJO: los precios que cobra Mercado Pago los define la función de Vercel;
   si cambiás precios o sumás productos, hay que cargarlos allá también.
   ===================================================================== */
window.S7_PRODUCTOS = [
  {id:"gorra", tipo:"Gorra", nombre:"Visera Villa Quién", precio:18000, img:"p-gorra.png",
   desc:"Gorra de gabardina azul marino con el logo sue7er bordado en naranja al frente. Visera curva y cierre regulable atrás. Talle único."},
  {id:"remera", tipo:"Remera", nombre:"Remera Enero Cuervo", precio:24000, img:"p-remera.png", talles:["S","M","L","XL","XXL"],
   desc:"Remera negra de algodón peinado 24/1, corte oversize. Estampa al frente con la ilustración de las antenas y el cielo de la tapa de Diario. Serigrafía a mano."},
  {id:"buzo", tipo:"Buzo", nombre:"Buzo Almohadas", precio:42000, img:"p-buzo.png", talles:["S","M","L","XL","XXL"],
   desc:"Buzo cuello redondo color crudo, frisa de algodón pesada. Logo sue7er bordado en azul en el pecho. Abrigado y suave, para los andenes de invierno."},
  {id:"llavero", tipo:"Llavero", nombre:"Llavero del Andén", precio:7500, img:"p-llavero.png",
   desc:"Llavero de acrílico transparente con el arte de las antenas impreso en los dos lados y argolla metálica. Mide 6 cm de alto."},
  {id:"vinilo", tipo:"Vinilo", nombre:"Todo Salió Bien LP", precio:48000, img:"p-vinilo.png",
   desc:"Edición en vinilo de 12\" de Todo Salió Bien en la Sencilla Villa Quién: los 8 temas del disco, en sobre impreso con la tapa original e inserto con las letras."},
  {id:"poster", tipo:"Póster", nombre:"Póster Escritorio", precio:12000, img:"p-poster.png",
   desc:"Póster de 30 × 40 cm con la ilustración de la tapa del disco, impreso en papel obra de 200 g. Se envía enrollado en tubo de cartón."},
  {id:"fanzine", tipo:"Fanzine", nombre:"Diario de Mari", precio:9500, img:"p-fanzine.png",
   desc:"Fanzine de 24 páginas abrochado a mano con las páginas del Diario de Mari: dibujos, notas y letras que acompañan al disco. Impresión risográfica."},
  {id:"medias", tipo:"Medias", nombre:"Medias sue7er", precio:8500, img:"p-medias.jpg",
   desc:"Medias largas de algodón color crudo con el logo sue7er tejido en azul. Puño acanalado. Talle único (del 36 al 43)."},
  {id:"botella", tipo:"Botella", nombre:"Botella térmica", precio:21000, img:"p-botella.jpg",
   desc:"Botella térmica de acero inoxidable de 500 ml, color crema mate con tapa metálica. Mantiene el agua fría 24 h y el mate caliente 12 h."},
  {id:"cuaderno", tipo:"Librería", nombre:"Cuaderno + lapicera", precio:11000, img:"p-cuaderno.jpg",
   desc:"Cuaderno A5 anillado de tapa dura azul con 80 hojas lisas, más una lapicera con el logo. Para escribir canciones, listas o tu propio diario."},
  {id:"pua", tipo:"Púa", nombre:"Púa sue7er", precio:2500, img:"p-pua.jpg",
   desc:"Púa de guitarra azul de 0,71 mm con el logo sue7er impreso en naranja. La misma que se usa en los shows."},
  {id:"tote", tipo:"Tote bag", nombre:"See the good", precio:14000, img:"p-tote.jpg",
   desc:"Bolsa de lienzo de algodón crudo de 38 × 42 cm con manijas largas. Estampa en azul con el paisaje de cables y la frase See the good."}
];
window.S7_API_CHECKOUT = "https://sueter7-villa-quien.vercel.app/api/checkout";
window.S7_ENVIO = 4500;   /* costo del envío a domicilio */
