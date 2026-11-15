/* ===========================================================
   sitio.js — Funciones comunes del sitio
   Portal de Programación con Scratch
   Autor: Mario Morena — Licencia CC BY-NC-SA 4.0

   1. Panel de accesibilidad (tamaño de texto, mayúsculas,
      alto contraste) con preferencia recordada por equipo.
   2. Protección del campo de código de estudiante: impide
      guardar algo con forma de cédula de identidad.
   3. Generación del código QR en la página del formulario.
   =========================================================== */

(function () {
  'use strict';

  /* ---------- utilidades de almacenamiento seguro ---------- */
  function leer(clave) {
    try { return localStorage.getItem(clave); } catch (e) { return null; }
  }
  function guardar(clave, valor) {
    try { localStorage.setItem(clave, valor); } catch (e) { /* modo privado */ }
  }

  /* ========================================================
     1. PANEL DE ACCESIBILIDAD
     ======================================================== */
  var PREF = 'sitio_preferencias_vista';

  var estado = { texto: 'normal', mayus: false, contraste: false };

  function cargarPreferencias() {
    var crudo = leer(PREF);
    if (!crudo) return;
    try {
      var p = JSON.parse(crudo);
      if (p && typeof p === 'object') {
        estado.texto = p.texto || 'normal';
        estado.mayus = !!p.mayus;
        estado.contraste = !!p.contraste;
      }
    } catch (e) { /* preferencia ilegible: se ignora */ }
  }

  function aplicarPreferencias() {
    var b = document.body;
    b.classList.remove('txt-lg', 'txt-xl');
    if (estado.texto === 'grande') b.classList.add('txt-lg');
    if (estado.texto === 'enorme') b.classList.add('txt-xl');
    b.classList.toggle('all-caps', estado.mayus);
    b.classList.toggle('hc', estado.contraste);
    guardar(PREF, JSON.stringify(estado));
    marcarBotones();
  }

  function marcarBotones() {
    var mapa = {
      'a11y-texto-normal': estado.texto === 'normal',
      'a11y-texto-grande': estado.texto === 'grande',
      'a11y-texto-enorme': estado.texto === 'enorme',
      'a11y-mayus': estado.mayus,
      'a11y-contraste': estado.contraste
    };
    Object.keys(mapa).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.setAttribute('aria-pressed', mapa[id] ? 'true' : 'false');
    });
  }

  function construirPanel() {
    if (document.getElementById('a11y-fab')) return;

    var fab = document.createElement('button');
    fab.id = 'a11y-fab';
    fab.type = 'button';
    fab.setAttribute('aria-expanded', 'false');
    fab.setAttribute('aria-controls', 'a11y-box');
    fab.innerHTML = '<span aria-hidden="true">⚙</span> Ver mejor';

    var caja = document.createElement('div');
    caja.id = 'a11y-box';
    caja.setAttribute('role', 'group');
    caja.setAttribute('aria-label', 'Opciones para ver mejor la página');
    caja.innerHTML =
      '<h2>Ver mejor</h2>' +
      '<p class="a11y-ayuda">Elegí cómo querés leer esta página. Queda guardado en esta computadora.</p>' +
      '<div class="a11y-grupo">' +
      '  <span class="a11y-rot" id="a11y-rot-texto">Tamaño de la letra</span>' +
      '  <div class="a11y-fila" role="group" aria-labelledby="a11y-rot-texto">' +
      '    <button type="button" class="a11y-btn" id="a11y-texto-normal" aria-pressed="false">A</button>' +
      '    <button type="button" class="a11y-btn" id="a11y-texto-grande" aria-pressed="false">A+</button>' +
      '    <button type="button" class="a11y-btn" id="a11y-texto-enorme" aria-pressed="false">A++</button>' +
      '  </div>' +
      '</div>' +
      '<div class="a11y-grupo">' +
      '  <span class="a11y-rot">Letra y color</span>' +
      '  <div class="a11y-fila">' +
      '    <button type="button" class="a11y-btn" id="a11y-mayus" aria-pressed="false">MAYÚSCULAS</button>' +
      '  </div>' +
      '  <div class="a11y-fila" style="margin-top:6px;">' +
      '    <button type="button" class="a11y-btn" id="a11y-contraste" aria-pressed="false">Fondo negro</button>' +
      '  </div>' +
      '</div>';

    document.body.appendChild(caja);
    document.body.appendChild(fab);

    fab.addEventListener('click', function () {
      var abierto = caja.style.display === 'block';
      caja.style.display = abierto ? 'none' : 'block';
      fab.setAttribute('aria-expanded', abierto ? 'false' : 'true');
    });

    document.getElementById('a11y-texto-normal').addEventListener('click', function () { estado.texto = 'normal'; aplicarPreferencias(); });
    document.getElementById('a11y-texto-grande').addEventListener('click', function () { estado.texto = 'grande'; aplicarPreferencias(); });
    document.getElementById('a11y-texto-enorme').addEventListener('click', function () { estado.texto = 'enorme'; aplicarPreferencias(); });
    document.getElementById('a11y-mayus').addEventListener('click', function () { estado.mayus = !estado.mayus; aplicarPreferencias(); });
    document.getElementById('a11y-contraste').addEventListener('click', function () { estado.contraste = !estado.contraste; aplicarPreferencias(); });

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && caja.style.display === 'block') {
        caja.style.display = 'none';
        fab.setAttribute('aria-expanded', 'false');
        fab.focus();
      }
    });
  }

  /* ========================================================
     2. PROTECCIÓN DEL CÓDIGO DE ESTUDIANTE
     No se recoge cédula de identidad. Si alguien escribe algo
     con forma de documento, se avisa y no se guarda.
     ======================================================== */
  function pareceDocumento(valor) {
    var solo = String(valor).replace(/[^0-9]/g, '');
    var limpio = String(valor).replace(/[^0-9a-zA-Z]/g, '');
    return solo.length >= 7 && solo.length === limpio.length;
  }

  function protegerCampoCodigo() {
    var campo = document.getElementById('student-ci');
    if (!campo) return;

    var alerta = document.createElement('p');
    alerta.id = 'aviso-codigo';
    alerta.setAttribute('role', 'alert');
    alerta.style.cssText = 'display:none; margin:8px 0 0; font-size:13.5px; font-weight:800; color:#991b1b; background:#fee2e2; border:1.5px solid #fca5a5; border-radius:8px; padding:8px 10px; line-height:1.45;';
    alerta.textContent = 'No escribas tu cédula. Usá tu código: iniciales y número de lista. Ejemplo: MM-07';
    if (campo.parentNode) campo.parentNode.appendChild(alerta);

    function revisar() {
      if (pareceDocumento(campo.value)) {
        alerta.style.display = 'block';
        campo.value = '';
        campo.setAttribute('aria-invalid', 'true');
        campo.focus();
      } else {
        alerta.style.display = 'none';
        campo.removeAttribute('aria-invalid');
      }
    }
    campo.addEventListener('blur', revisar);
    campo.addEventListener('change', revisar);
  }

  /* ========================================================
     3. CÓDIGO QR
     Se dibuja sobre el elemento #qr-lienzo a partir de la URL
     que esté en #qr-url. Si la biblioteca no carga, queda
     visible el enlace en texto, que cumple la misma función.
     ======================================================== */
  function dibujarQR() {
    var lienzo = document.getElementById('qr-lienzo');
    var campoUrl = document.getElementById('qr-url');
    if (!lienzo || !campoUrl) return;

    var url = (campoUrl.textContent || '').trim();
    if (!url || url.indexOf('http') !== 0) {
      lienzo.textContent = 'Falta pegar el enlace del formulario.';
      return;
    }
    if (typeof window.QRCode === 'undefined') {
      lienzo.textContent = 'No se pudo cargar el generador de QR. El enlace de al lado cumple la misma función.';
      return;
    }
    lienzo.innerHTML = '';
    try {
      new window.QRCode(lienzo, {
        text: url, width: 170, height: 170,
        colorDark: '#1a1a2e', colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.M
      });
      var img = lienzo.querySelector('img');
      if (img) img.setAttribute('alt', 'Código QR que lleva al formulario. El enlace también está escrito al lado.');
      var cv = lienzo.querySelector('canvas');
      if (cv) cv.setAttribute('aria-label', 'Código QR que lleva al formulario. El enlace también está escrito al lado.');
    } catch (e) {
      lienzo.textContent = 'No se pudo generar el QR. Usá el enlace escrito al lado.';
    }
  }

  /* ---------- arranque ---------- */
  function iniciar() {
    cargarPreferencias();
    construirPanel();
    aplicarPreferencias();
    protegerCampoCodigo();
    dibujarQR();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
