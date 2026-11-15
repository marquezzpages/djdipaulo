(() => {
  'use strict';
  const header = document.querySelector('.site-header');
  const nav = document.getElementById('mobileNav');
  const toggle = document.getElementById('menuToggle');
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  function setNav(open) {
    if (!nav || !toggle) return;
    nav.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
  }
  toggle?.addEventListener('click', () => setNav(nav.hidden));
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setNav(false)));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') setNav(false); });
  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 48);
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  const slot = document.getElementById('playerSlot');
  const loader = document.getElementById('loadSpotify');
  loader?.addEventListener('click', () => {
    if (!slot) return;
    const iframe = document.createElement('iframe');
    iframe.className = 'player-iframe';
    iframe.title = 'Spotify — músicas de Di Paulo';
    iframe.src = 'https://open.spotify.com/embed/artist/3mV32t6fsjAGWdzSOjHzW8?utm_source=generator';
    iframe.loading = 'lazy';
    iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    slot.replaceWith(iframe);
  });

  const dialog = document.getElementById('lightbox');
  const modalImage = document.getElementById('lightboxImage');
  const modalCaption = document.getElementById('lightboxCaption');
  let previouslyFocused = null;
  document.querySelectorAll('[data-full]').forEach(button => {
    button.addEventListener('click', () => {
      if (!dialog || !modalImage || !modalCaption) return;
      previouslyFocused = button;
      modalImage.src = button.dataset.full;
      modalImage.alt = button.dataset.alt || '';
      modalCaption.textContent = button.dataset.alt || '';
      if (typeof dialog.showModal === 'function') dialog.showModal();
    });
  });
  document.getElementById('lightboxClose')?.addEventListener('click', () => dialog?.close());
  dialog?.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  dialog?.addEventListener('close', () => previouslyFocused?.focus());
})();

// Official agenda: only server-approved events are rendered.
(() => {
  'use strict';
  const locale = document.documentElement.lang.startsWith('es') ? 'es' : document.documentElement.lang.startsWith('en') ? 'en' : 'pt';
  const strings = {
    pt: {empty:'Em breve, novas datas confirmadas. Acompanhe as novidades no Instagram.',unavailable:'Agenda temporariamente indisponível. Confira as atualizações no Instagram.',ticket:'INGRESSOS',details:'DETALHES',time:'ÀS',months:['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'],format:'pt-BR'},
    en: {empty:'New confirmed tour dates coming soon. Follow Instagram for updates.',unavailable:'Schedule temporarily unavailable. Please check Instagram for updates.',ticket:'TICKETS',details:'DETAILS',time:'AT',months:['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'],format:'en-US'},
    es: {empty:'Pronto anunciaremos nuevas fechas. Sigue Instagram para novedades.',unavailable:'Agenda temporalmente no disponible. Consulta Instagram para actualizaciones.',ticket:'ENTRADAS',details:'DETALLES',time:'A LAS',months:['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'],format:'es-ES'}
  }[locale];
  const container = document.getElementById('agendaList');
  if (!container) return;
  const textNode = (tag, content, cls) => {
    const el = document.createElement(tag); if (cls) el.className=cls;
    el.textContent = String(content || ''); return el;
  };
  function empty(message) { container.replaceChildren(textNode('p', message, 'agenda-empty'));container.setAttribute('aria-busy','false'); }
  function safeExternal(raw) { try { const url = new URL(raw); return (url.protocol === 'https:' || url.protocol === 'http:') ? url.toString() : null; } catch { return null; } }

  // Constrói a seta como desenho SVG, não como caractere/emoji.
  function appendVectorArrow(link) {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '1em'); svg.setAttribute('height', '1em');
    svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.1'); svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round'); svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false'); svg.classList.add('dp-ui-symbol');
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', 'M5 19 19 5M8 5h11v11'); svg.appendChild(path);
    link.appendChild(svg);
  }
  function drawEvent(event) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event.data || '')) return;
    const [y,m,d] = event.data.split('-').map(Number);
    if (m<1||m>12||d<1||d>31) return;
    const row=textNode('article','', 'agenda-row');
    const date=textNode('div','', 'agenda-date');
    date.append(textNode('strong',String(d).padStart(2,'0'),'agenda-day'));
    const md=textNode('span','', 'agenda-month'); md.append(textNode('b',strings.months[m-1]),textNode('small',String(y))); date.append(md);row.append(date);
    const main=textNode('div','', 'agenda-event');main.append(textNode('strong',event.evento));
    if (event.horario) main.append(textNode('small',strings.time+' '+event.horario));row.append(main);
    const place=textNode('div','', 'agenda-place');place.append(textNode('b',event.local));
    place.append(textNode('small',[event.cidade,event.estado,event.pais].filter(Boolean).join(' · ')));row.append(place);
    const action=textNode('div','', 'agenda-buy');
    const target=safeExternal(event.ingressos_url);
    if(target){const link=document.createElement('a');link.href=target;link.target='_blank';link.rel='noopener noreferrer';link.textContent=strings.ticket+' ';appendVectorArrow(link);action.append(link);}
    else if (safeExternal(event.mapa_url)){const link=document.createElement('a');link.href=safeExternal(event.mapa_url);link.target='_blank';link.rel='noopener noreferrer';link.textContent=strings.details+' ';appendVectorArrow(link);action.append(link);}
    row.append(action);container.append(row);
  }
  async function load() {
    try {
      const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),9500);
      const res=await fetch('/.netlify/functions/agenda',{signal:controller.signal,headers:{'Accept':'application/json'}});
      clearTimeout(timer);
      if(!res.ok) throw new Error('Agenda API unavailable');
      const data=await res.json(); if(!Array.isArray(data.events)) throw new Error('Agenda response invalid');
      container.replaceChildren();
      if(!data.events.length) return empty(strings.empty);
      data.events.forEach(drawEvent);
      if(!container.children.length) empty(strings.empty);
      container.setAttribute('aria-busy','false');
    } catch {empty(strings.unavailable);}
  }
  load();
})();
