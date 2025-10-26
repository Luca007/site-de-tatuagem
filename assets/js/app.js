// App entry: load siteConfig from Firestore and render according to current path
import { onSiteConfigSnapshot, getSiteConfig } from './data.js';
import { renderPage } from './renderer.js';

const routes = {
  '/': 'home',
  '/index.html': 'home',
  '/portfolio.html': 'portfolio',
  '/login.html': 'login',
  '/register.html': 'register',
  '/admin.html': 'admin',
};

async function boot(){
  const root = document.getElementById('app');
  const path = location.pathname;
  const pageKey = routes[path] || 'home';
  const initial = await getSiteConfig();
  // Fallback config if Firestore empty
  const defaultConfig = {
    pages: {
      home: { blocks: [
        { type: 'header', props: { links: [
          {label:'Home', href:'/'}, {label:'Portfolio', href:'/portfolio.html'}, {label:'Login', href:'/login.html'}
        ]}},
        { type: 'hero', props: {} },
        { type: 'portfolioGrid', props: { dataSource: 'firestore', columns: 3 } },
        { type: 'services', props: { items:[
          { title:'Custom Designs', description:'Unique artwork tailored to you', badge:'Design' },
          { title:'Fine Line', description:'Detail-focused minimal tattoos', badge:'Line' },
          { title:'Realism', description:'Life-like shading and texture', badge:'Art' },
        ]}},
        { type: 'testimonials', props: { items:[
          { text:'Amazing experience!', author:'Ana' },
          { text:'Great artist and environment', author:'Carlos' },
          { text:'Exceeded expectations', author:'Luiza' },
        ]}},
        { type: 'chat', props: {} },
        { type: 'footer', props: {} },
      ]},
      portfolio: { blocks:[
        { type: 'header', props: { links:[{label:'Home', href:'/'},{label:'Portfolio', href:'/portfolio.html'}] }},
        { type: 'portfolioGrid', props: { dataSource:'firestore', columns: 4 } },
        { type: 'footer' }
      ]},
      login: { blocks:[
        { type: 'header' },
        { type: 'footer' }
      ]},
      register: { blocks:[{ type: 'header' }, { type: 'footer' }]},
      admin: { blocks:[{ type: 'header' }, { type: 'footer' }]},
    }
  };
  const cfg = initial || defaultConfig;

  const pageConfig = cfg.pages?.[pageKey] || cfg.pages.home;
  await renderPage(root, pageConfig);
}

boot();
