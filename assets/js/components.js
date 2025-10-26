// Reusable component factories (pure DOM)
// Each function receives props and returns a DOM element

export function Header(props={}){
  const { brandLeft = 'Ink', brandRight = 'Master', links = [] } = props;
  const el = document.createElement('header');
  el.className = 'header';
  el.innerHTML = `
    <div class="container header-inner">
      <a class="brand" href="/">
        ${brandLeft}<span class="brand-accent">${brandRight}</span>
      </a>
      <nav class="nav">
        ${links.map(l=> `<a href="${l.href}">${l.label}</a>`).join('')}
      </nav>
    </div>
  `;
  // mark active link
  const path = location.pathname.replace(/\\/g,'/');
  el.querySelectorAll('.nav a').forEach(a=>{
    if (a.getAttribute('href') === path){ a.classList.add('active'); }
  });
  return el;
}

export function Footer(props={}){
  const year = new Date().getFullYear();
  const { about="Professional tattoo studio offering custom designs.", links=[
    {label:'Home', href:'/'}, {label:'Portfolio', href:'/portfolio.html'}, {label:'Contact', href:'#'}
  ] } = props;
  const el = document.createElement('footer');
  el.className = 'footer';
  el.innerHTML = `
    <div class="container footer-inner">
      <div>
        <div class="brand">Ink<span class="brand-accent">Master</span></div>
        <p style="color:#667085; max-width: 46ch;">${about}</p>
      </div>
      <div>
        <h4>Quick Links</h4>
        <div>${links.map(l=> `<div><a href="${l.href}">${l.label}</a></div>`).join('')}</div>
      </div>
      <div>
        <h4>Contact</h4>
        <div style="color:#667085;">contact@inkmaster.com</div>
        <div style="color:#667085;">(11) 99999-9999</div>
      </div>
    </div>
    <div class="container footer-bottom">
      <div>© ${year} InkMaster. All rights reserved.</div>
      <div style="display:flex; gap:12px;">
        <a href="#">Privacy</a>
        <a href="#">Terms</a>
      </div>
    </div>
  `;
  return el;
}

export function Hero(props={}){
  const { title="Transforming Ideas Into Stunning Tattoo Art", subtitle="Expert tattoo artistry that turns your vision into permanent art.", cta=[{label:'Explore Portfolio', href:'/portfolio.html', primary:true},{label:'Book Consultation', href:'#'}], imageUrl="https://images.unsplash.com/photo-1596524430615-b46475ddff6e?q=80&w=1200&auto=format&fit=crop" } = props;
  const el = document.createElement('section');
  el.className = 'section hero';
  el.innerHTML = `
    <div>
      <h1>${title}</h1>
      <p>${subtitle}</p>
      <div class="hero-cta">
        ${cta.map(c=> `<a class="btn ${c.primary?'primary':''}" href="${c.href}">${c.label}</a>`).join('')}
      </div>
    </div>
    <div>
      <div class="card" style="overflow:hidden; border-radius:999px; max-width: 420px; margin: 0 auto;">
        <img alt="tattoo" src="${imageUrl}" style="width:100%; height:auto; display:block;"/>
      </div>
    </div>
  `;
  return el;
}

export function Services(props={}){
  const { items = [] } = props;
  const el = document.createElement('section');
  el.className = 'section';
  el.innerHTML = `
    <div class="container">
      <h2 class="section-title">Our Services</h2>
      <p class="section-subtitle">We offer a range of professional tattoo services</p>
      <div class="grid cols-3">
        ${items.map(s=> `
          <div class="card">
            <div class="card-body">
              <div class="badge">${s.badge || 'Service'}</div>
              <h3 style="margin:8px 0 6px; font-size: 18px;">${s.title}</h3>
              <p style="color:#667085;">${s.description || ''}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  return el;
}

export function PortfolioGrid(props={}){
  const { items = [], columns = 3 } = props;
  const el = document.createElement('section');
  el.className = 'section alt';
  el.innerHTML = `
    <div class="container">
      <h2 class="section-title">Featured Works</h2>
      <p class="section-subtitle">Explore a selection of our finest tattoo creations</p>
      <div class="grid ${columns>=4?'cols-4':'cols-3'}" id="portfolio-grid"></div>
    </div>
  `;
  const grid = el.querySelector('#portfolio-grid');
  items.forEach(item=>{
    const card = document.createElement('a');
    card.className = 'portfolio-card card';
    card.href = item.link || '#';
    card.innerHTML = `
      <img src="${item.imageUrl}" alt="${item.title}">
      <div class="overlay"></div>
      <div class="meta">
        <div style="font-weight:600;">${item.title||''}</div>
        <div style="opacity:.9; font-size: 12px;">${item.style||''}</div>
      </div>
    `;
    grid.appendChild(card);
  });
  return el;
}

export function Testimonials(props={}){
  const { items = [] } = props;
  const el = document.createElement('section');
  el.className = 'section';
  el.innerHTML = `
    <div class="container">
      <h2 class="section-title">What Our Clients Say</h2>
      <div class="grid cols-3">
        ${items.map(t=> `
          <div class="card"><div class="card-body">
            <p style="color:#667085">"${t.text}"</p>
            <div style="margin-top:8px; font-weight:600;">${t.author}</div>
          </div></div>
        `).join('')}
      </div>
    </div>
  `;
  return el;
}

export function ChatWidget(props={}){
  const { onSend } = props;
  const el = document.createElement('div');
  el.className = 'card';
  el.innerHTML = `
    <div class="card-body">
      <h3>Chat</h3>
      <div id="chat-list" style="max-height: 240px; overflow:auto; display:flex; flex-direction:column; gap:8px; margin: 8px 0 12px;"></div>
      <div class="form-row">
        <input id="chat-input" class="input" placeholder="Type a message"/>
        <button id="chat-send" class="btn primary">Send</button>
      </div>
    </div>
  `;
  el.querySelector('#chat-send').addEventListener('click', ()=>{
    const input = el.querySelector('#chat-input');
    const value = input.value.trim();
    if (!value) return;
    onSend?.(value);
    input.value = '';
  });
  return el;
}

export function Toast(){
  const t = document.createElement('div');
  t.className = 'toast';
  document.body.appendChild(t);
  return {
    show(msg){ t.textContent = msg; t.classList.add('show'); setTimeout(()=> t.classList.remove('show'), 2500); },
    el: t
  };
}
