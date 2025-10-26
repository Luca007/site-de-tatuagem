// JSON-driven renderer: maps component type -> factory
import { Header, Footer, Hero, Services, PortfolioGrid, Testimonials, ChatWidget, Toast } from './components.js';
import { addMessage, onMessagesSnapshot, getPortfolioItems } from './data.js';

const registry = {
  header: Header,
  footer: Footer,
  hero: Hero,
  services: Services,
  portfolioGrid: PortfolioGrid,
  testimonials: Testimonials,
  chat: ChatWidget,
};

export async function renderPage(root, pageConfig){
  root.innerHTML = '';
  const toast = Toast();

  for (const block of pageConfig.blocks || []){
    const { type, props = {} } = block;
    const factory = registry[type];
    if (!factory) continue;

    // Dynamic data hooks
    if (type === 'portfolioGrid' && props.dataSource === 'firestore'){
      const items = await getPortfolioItems();
      const node = factory({ ...props, items });
      root.appendChild(node);
      continue;
    }
    if (type === 'chat'){
      const node = factory({
        ...props,
        onSend: async (text)=>{
          try{
            await addMessage({ text });
          }catch(e){ toast.show('Failed to send message'); }
        }
      });
      const list = node.querySelector('#chat-list');
      onMessagesSnapshot((messages)=>{
        list.innerHTML = '';
        messages.forEach(m=>{
          const row = document.createElement('div');
          row.textContent = m.text;
          list.appendChild(row);
        });
      });
      root.appendChild(node);
      continue;
    }

    const node = factory(props);
    root.appendChild(node);
  }
}
