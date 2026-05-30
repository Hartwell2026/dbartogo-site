/* D'BarToGo — EN/ES language toggle.
   English lives in the HTML (default + SEO). Spanish lives here.
   On load we cache each element's English innerHTML, then swap on toggle. */
(function () {
  "use strict";

  // groups: querySelectorAll, ES strings in document order (en auto-cached unless provided)
  const GROUPS = [
    { sel: "#hero .hero__title span", es: ["La barra que", "llega a ti."] },
    { sel: ".nav__links a", es: ["Nosotros", "Servicios", "Paquetes", "Cócteles", "Galería", "Cómo Funciona", "Preguntas"] },
    { sel: ".mobile-menu a:not(.btn)", es: ["Nosotros", "Servicios", "Paquetes", "Cócteles", "Galería", "Cómo Funciona", "Preguntas"] },
    { sel: ".trust__list li", es: [
      "<span>✦</span> Con Licencia y Asegurados",
      "<span>✦</span> Mixólogos Certificados",
      "<span>✦</span> Responsabilidad Civil de Licor",
      "<span>✦</span> Menús Totalmente a Medida",
      "<span>✦</span> Montaje y Desmontaje Incluidos",
    ] },
    { sel: "#about .stat__label", es: ["Años de Experiencia", "Eventos Atendidos", "Calificación Promedio"] },
    { sel: "#services .card h3", es: ["Cócteles Artísticos", "Catering, Rentas y Más", "Planes Personalizados", "Personal Adicional", "Servicio VVIP y UHNWI", "Renta de Yates de Lujo"] },
    { sel: "#services .card p", es: [
      "Bartending gourmet con cócteles de lujo y una propuesta culinaria excepcional. Menús personalizados para cada tipo de evento.",
      "Catering gourmet más barras móviles profesionales, cristalería premium y equipo de evento — todo para una celebración completa e impecable.",
      "Planes flexibles adaptados a tu presupuesto y necesidades. Con o sin licor, combinables con bartending, catering y personal.",
      "Meseros, barbacks y profesionales de eventos con amplia experiencia en la hospitalidad, listos para cualquier ocasión.",
      "Atención discreta, sofisticada y totalmente personalizada para clientes premium — lujo servido con absoluta profesionalidad.",
      "Renta un yate de lujo con servicio de barra premium y tripulación — una celebración inolvidable en el agua, gestionada de principio a fin.",
    ] },
    { sel: "#packages .pkg__tag", es: ["Caribe", "Art Déco", "Tropical"] },
    { sel: "#packages .pkg__desc", es: [
      "Inolvidable y con el ron como protagonista. Mojitos al momento, daiquirís bien hechos y una barra móvil con el encanto de la vieja Habana.",
      "Glamour de la era de la Prohibición. Hielo tallado a mano, cócteles clásicos de autor y una barra de latón y mármol que cautiva apenas llegan los invitados.",
      "Energía bohemia de beach club. Mezcal, tequila y fruta tropical fresca servidos desde una barra de madera y ratán hecha para la hora dorada.",
    ] },
    { sel: "#packages .pkg__list li", es: [
      "3 cócteles de ron de autor", "Estación de garnish y macerado en vivo", "Tarjetas de menú personalizadas",
      "4 cócteles de autor + servicio de champán", "Cristalería premium y copas coupé", "Bartenders uniformados y barback",
      "3 cócteles a base de agave", "Barra de rims ahumados y especiados", "Estilo boho y señalización",
    ] },
    { sel: "#packages .pkg__price", es: ["desde <strong>$1,200</strong>", "desde <strong>$1,950</strong>", "desde <strong>$1,400</strong>"] },
    { sel: "#packages .pkg .btn", es: ["Solicitar Este Paquete", "Solicitar Este Paquete", "Solicitar Este Paquete"] },
    { sel: "#menu .menu__type", es: ["Ron", "Bourbon", "Aperitivo", "Mezcal", "Tequila", "Sin Alcohol"] },
    { sel: "#menu .menu__item p", es: [
      "Ron añejo, mamey fresco, limón y un toque de canela.",
      "Bourbon, demerara infusionado con espresso, naranja y bitters de café cubano.",
      "Aperitivo amargo, prosecco, toronja, soda y romero.",
      "Mezcal, pepino, albahaca, limón, agave y rim de Tajín.",
      "Tequila blanco, guayaba rosa, toronja, limón y sal rosa.",
      "Maracuyá, coco, limón y soda — cada invitado recibe trato VIP.",
    ] },
    { sel: "#process .step h3", es: ["Cotiza", "Diseña el Menú", "Llegamos", "Brinda y Celebra"] },
    { sel: "#process .step p", es: [
      "Cuéntanos tu fecha, número de invitados y visión. Te enviamos una cotización transparente y todo incluido en 24 horas.",
      "Creamos una lista de cócteles a medida y te damos una lista de compras exacta — sin sobreprecio, sin adivinanzas.",
      "Nuestro equipo llega temprano, monta la barra completa y se encarga de todo. Tú solo disfruta tu evento.",
      "Servimos, encantamos y limpiamos sin dejar rastro — dejando solo grandes recuerdos.",
    ] },
    { sel: "#reviews .quote p", es: [
      "“D'BarToGo convirtió nuestra boda en la fiesta del año. Los cócteles eran arte y los bartenders, las personas más amables del lugar.”",
      "“Profesionales, puntuales e increíblemente fluidos. Nuestros invitados corporativos aún hablan del cafecito old fashioned.”",
      "“Crearon un menú a medida para los 60 de mi mamá y se sintió como un lounge de lujo en nuestro patio. Vale cada centavo.”",
    ] },
    { sel: "#reviews cite", es: ["— Daniela y Marco, Boda en Coral Gables", "— Priya N., Lanzamiento de Marca en Brickell", "— Carlos R., Fiesta Privada"] },
    { sel: "#area .area__list li", es: ["Miami y Miami Beach", "Coral Gables y Brickell", "Fort Lauderdale", "West Palm Beach", "Los Cayos (viaje)", "Eventos de destino"] },
    { sel: "#faq .acc summary", es: [
      "¿Cuánto cuesta el servicio de barra móvil?",
      "¿Ustedes proveen el licor?",
      "¿Sus bartenders tienen licencia y seguro?",
      "¿Qué áreas cubren?",
      "¿Con cuánta anticipación debo reservar?",
    ] },
    { sel: "#faq .acc p", es: [
      "Los paquetes inician en $600 para reuniones íntimas y aumentan según el número de invitados, el estilo de barra y el menú de cócteles. La mayoría de bodas y eventos privados van de $1,200 a $3,500. Cada cotización es a medida e incluye bartenders con licencia, la barra móvil, cristalería, garnish y desmontaje.",
      "Ofrecemos planes flexibles <em>con o sin licor</em>. Podemos armar un paquete con todo incluido, o brindar los bartenders, la barra, mezcladores, hielo, cristalería y garnish mientras tú pones las bebidas. En cualquier caso, tu plan se personaliza a tu presupuesto y evento.",
      "Sí. Cada bartender está certificado en servicio responsable de alcohol y contamos con seguro completo de responsabilidad civil por licor y responsabilidad general. Con gusto entregamos un certificado de seguro para cualquier venue que lo requiera.",
      "Cubrimos todo el sur de Florida — los condados de Miami-Dade, Broward y Palm Beach. El viaje más allá de un radio de 30 millas está disponible por una pequeña tarifa adicional.",
      "Recomendamos de 4 a 8 semanas para bodas y eventos grandes, aunque atendemos solicitudes de último minuto cuando el calendario lo permite. Las fechas de invierno y primavera se reservan rápido.",
    ] },
    { sel: "#quote .quote__perks li", es: ["✦ Propuesta personalizada gratis", "✦ Sin cargos ocultos — con o sin licor", "✦ Planes flexibles y totalmente personalizables"] },
    { sel: "#quote .quote__contact-line span", es: ["Llama / Texto", "Correo", "Instagram"] },
    { sel: "#quote .field label", es: ["Nombre", "Correo", "Teléfono", "Fecha del Evento", "Invitados", "Cuéntanos sobre tu evento"] },
    { sel: ".footer__col h4", es: ["Explora", "Contacto", "Horario"] },
    { sel: ".footer__cols .footer__col:nth-child(1) a", es: ["Nosotros", "Paquetes", "Cócteles", "Preguntas"] },
    { sel: ".footer__cols .footer__col:nth-child(3) p", es: ["Lun–Dom · 9am–9pm", "Eventos los 7 días"] },
  ];

  // singles: querySelector. Provide en where the HTML default isn't the English we want.
  const SINGLES = [
    { sel: "#hero .eyebrow", es: "Barra Móvil de Lujo · Sur de Florida" },
    { sel: "#hero .hero__lead", es: "Cócteles de autor, bartenders de guante blanco y una barra a tu medida — <em>una barra móvil</em> diseñada para convertir tu evento en la noche que todos recordarán." },
    { sel: "#hero .hero__rating span:last-child", es: "5.0 de calificación en más de 127 celebraciones" },
    { sel: ".nav__cta", es: "Cotiza Gratis" },
    { sel: ".mobile-menu .btn", es: "Cotiza Gratis" },
    { sel: "#about .eyebrow", es: "Quiénes Somos" },
    { sel: "#about .h2", es: "Una barra móvil con el alma de un lounge cinco estrellas." },
    { sel: "#about .lead", es: "D'BarToGo es una empresa de servicios de bartending de lujo con más de diez años de experiencia en la industria de la hospitalidad. El servicio es nuestro enfoque — cada cóctel es una obra de arte y cada evento, una celebración que vale la pena recordar." },
    { sel: "#about .about__copy p:not(.eyebrow):not(.lead)", es: "Desde reuniones íntimas hasta galas corporativas, residencias privadas y yates, nuestros profesionales con amplia experiencia ofrecen cócteles artísticos, presentación elegante y una experiencia premium que se adapta a tu visión y tu presupuesto — <em>con o sin licor</em>." },
    { sel: "#about .about__quote", es: "“Cada cóctel es una obra de arte. Cada evento, una celebración.”" },
    { sel: "#about .about__sig", es: "— La Promesa D'BarToGo" },
    { sel: "#services .eyebrow", en: "Our Services", es: "Nuestros Servicios" },
    { sel: "#services .h2", es: "Todo lo que necesitas, del bartending al personal." },
    { sel: "#services .section__sub", es: "Del bartending de lujo hasta la renta de yates — un servicio de lujo completo y personalizable para cada ocasión." },
    { sel: "#packages .eyebrow", es: "Experiencias Exclusivas" },
    { sel: "#packages .h2", es: "Elige tu estilo. Nosotros servimos el resto." },
    { sel: "#packages .section__sub", es: "Cada paquete es totalmente personalizable. El precio varía según el número de invitados y la duración del servicio." },
    { sel: "#packages .pkg__ribbon", es: "El Más Reservado" },
    { sel: "#menu .eyebrow", es: "De Nuestra Barra" },
    { sel: "#menu .h2", es: "Una probadita del menú." },
    { sel: "#menu .menu__note", es: "Los menús son totalmente a medida — cuéntanos tu historia y armamos la lista a tu alrededor." },
    { sel: "#gallery .eyebrow", en: "Gallery", es: "Galería" },
    { sel: "#gallery .h2", es: "Eventos reales. Arte real." },
    { sel: "#gallery .section__sub", es: "Un vistazo a los cócteles que creamos y las celebraciones que servimos en todo el sur de Florida." },
    { sel: "#gallery .gallery__cta .btn", es: "Ver más en Instagram →" },
    { sel: "#process .eyebrow", es: "Cómo Funciona" },
    { sel: "#process .h2", es: "Reserva en cuatro simples pasos." },
    { sel: "#reviews .eyebrow", es: "Lo Que Dicen" },
    { sel: "#reviews .h2", es: "Nuestros clientes siempre regresan." },
    { sel: "#area .eyebrow", es: "Dónde Servimos" },
    { sel: "#area .h2", es: "Con orgullo, servimos todo el sur de Florida." },
    { sel: "#area .lead", es: "Si celebras en el 305, el 954 o el 561 — llevamos la barra hasta ti." },
    { sel: ".miami-map__legend", es: '<span class="dot"></span> Área de servicio activa · Miami-Dade · Broward · Palm Beach' },
    { sel: "#faq .eyebrow", es: "Bueno Saber" },
    { sel: "#faq .h2", es: "Preguntas frecuentes." },
    { sel: "#quote .eyebrow", es: "Hagámoslo Realidad" },
    { sel: "#quote .h2", es: "¿Listo para llevar la barra a tu evento?" },
    { sel: "#quote .lead", es: "Recibe una cotización gratis y sin compromiso en menos de 24 horas. Cuéntanos sobre tu celebración y nosotros nos encargamos del resto." },
    { sel: "#quoteForm button[type='submit']", es: "Enviar Mi Solicitud", en: "Send My Quote Request" },
    { sel: "#formNote", es: "Perfecto — enviaremos tu información a nuestro equipo. ¡Gracias por confiar en D'BarToGo! 🥂", en: "Perfect — we'll send your info to our team. ¡Gracias por confiar en D'BarToGo! 🥂" },
    { sel: ".footer__tag", es: "Barra móvil de lujo y catering de cócteles de autor · Barra Móvil · Sur de Florida" },
    { sel: ".footer__bar p:first-child", en: '© <span id="year"></span> D\'BarToGo — Barra Móvil. All rights reserved.', es: '© <span id="year"></span> D\'BarToGo — Barra Móvil. Todos los derechos reservados.' },
    { sel: ".footer__bar p:last-child", es: "Con licencia y asegurados · Bebe con responsabilidad · 21+" },
  ];

  // attributes (placeholders)
  const ATTRS = [
    { sel: "#name", attr: "placeholder", es: "Tu nombre completo" },
    { sel: "#email", attr: "placeholder", es: "tu@correo.com" },
    { sel: "#details", attr: "placeholder", es: "Boda, paquete de interés, ambiente…" },
  ];

  const store = [];

  function init() {
    GROUPS.forEach((g) => {
      const els = Array.prototype.slice.call(document.querySelectorAll(g.sel));
      els.forEach((el, i) => {
        if (g.es[i] == null) return;
        store.push({ el, en: g.en ? g.en[i] : el.innerHTML, es: g.es[i], attr: null });
      });
    });
    SINGLES.forEach((s) => {
      const el = document.querySelector(s.sel);
      if (!el) return;
      store.push({ el, en: s.en != null ? s.en : el.innerHTML, es: s.es, attr: null });
    });
    ATTRS.forEach((a) => {
      const el = document.querySelector(a.sel);
      if (!el) return;
      store.push({ el, en: a.en != null ? a.en : el.getAttribute(a.attr), es: a.es, attr: a.attr });
    });
  }

  function apply(lang) {
    store.forEach((it) => {
      const val = lang === "es" ? it.es : it.en;
      if (val == null) return;
      if (it.attr) it.el.setAttribute(it.attr, val);
      else it.el.innerHTML = val;
    });
    document.documentElement.lang = lang;
    const y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
    document.querySelectorAll("[data-lang-btn]").forEach((b) => {
      const on = b.getAttribute("data-lang-btn") === lang;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    try { localStorage.setItem("dbartogo-lang", lang); } catch (e) {}
  }

  document.addEventListener("DOMContentLoaded", () => {
    init();
    let lang = "en";
    try { lang = localStorage.getItem("dbartogo-lang") || "en"; } catch (e) {}
    document.querySelectorAll("[data-lang-btn]").forEach((b) =>
      b.addEventListener("click", () => apply(b.getAttribute("data-lang-btn")))
    );
    apply(lang);
  });
})();
