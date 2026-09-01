const CONFIG=window.KAIZEN_CONFIG||{};
const FALLBACK_PRODUCTS=(window.KAIZEN_PRODUCTS||[]).map((p,i)=>({...p,active:true,sort_order:i+1,image_url:"",description:""}));
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const routes=["home","explore","attraction","improvement","lifestyle","success","membership"];
const routeTheme={home:["207,210,216","#cfd2d8"],explore:["207,210,216","#cfd2d8"],attraction:["255,54,93","#ff365d"],improvement:["77,163,255","#4da3ff"],lifestyle:["156,99,255","#9c63ff"],success:["208,170,99","#d0aa63"],membership:["207,210,216","#cfd2d8"]};
const cardRGB={Attraction:"255,54,93",Improvement:"77,163,255",Lifestyle:"156,99,255",Success:"208,170,99"};
let PRODUCTS=[...FALLBACK_PRODUCTS],selected=null,activeFilter="all",cart=[];
const CART_KEY="kaizen_cart_v2";

function esc(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]))}
function setRouteTheme(route){const t=routeTheme[route]||routeTheme.explore;document.documentElement.style.setProperty("--route-rgb",t[0]);document.documentElement.style.setProperty("--route",t[1])}

async function loadRemoteCatalog(){
  if(!CONFIG.SUPABASE_URL||!CONFIG.SUPABASE_ANON_KEY)return;
  try{
    const r=await fetch(`${CONFIG.SUPABASE_URL}/rest/v1/${CONFIG.PRODUCT_TABLE||"products"}?select=*&active=eq.true&order=sort_order.asc.nullslast`,{headers:{apikey:CONFIG.SUPABASE_ANON_KEY,Authorization:`Bearer ${CONFIG.SUPABASE_ANON_KEY}`}});
    if(!r.ok)throw new Error("Catalog request failed");
    const remote=await r.json();
    // Once Supabase is configured, it becomes the production source of truth.
    // This avoids displaying stale browser prices that the secure checkout API will reject.
    if(Array.isArray(remote))PRODUCTS=remote.filter(p=>p.active!==false);
  }catch(e){
    console.warn("Supabase catalog unavailable; local fallback catalog is being displayed.");
  }
}

function route(){const r=(location.hash||"#home").slice(1).toLowerCase(),current=routes.includes(r)?r:"home";setRouteTheme(current);$$('.route').forEach(el=>el.classList.toggle('visible',el.dataset.route.split(' ').includes(current)));$$('.bottom-nav a').forEach(a=>a.classList.toggle('active',a.dataset.nav===current||(current!=="home"&&current!=="membership"&&a.dataset.nav==="explore")));if(["explore","attraction","improvement","lifestyle","success"].includes(current)){activeFilter=current==="explore"?"all":current[0].toUpperCase()+current.slice(1);updateFilterButtons();$('#catalogTitle').textContent=current==="explore"?"Explore Kaizen":activeFilter;render()}closeMenu();window.scrollTo({top:0,behavior:'smooth'})}
function updateFilterButtons(){$$('#filterRow button').forEach(b=>b.classList.toggle('active',b.dataset.filter===activeFilter))}
function render(){const q=($('#searchInput')?.value||'').trim().toLowerCase();const items=PRODUCTS.filter(p=>(activeFilter==='all'||p.category===activeFilter)&&(!q||p.name.toLowerCase().includes(q)));$('#productGrid').innerHTML=items.length?items.map(productMarkup).join(''):'<div class="empty">No matching subliminals.</div>';$$('.product-card').forEach(c=>c.addEventListener('click',()=>openProduct(c.dataset.slug)));observeReveals()}
function productMarkup(p){const rgb=cardRGB[p.category]||'207,210,216';return `<article class="product-card reveal" data-slug="${esc(p.slug)}" style="--card-rgb:${rgb}"><div class="product-image">${p.image_url?`<img src="${esc(p.image_url)}" alt="${esc(p.name)}" loading="lazy">`:`<div class="fallback">K</div>`}</div><div class="product-content"><span class="tag">${esc(p.category)}</span><h3>${esc(p.name)}</h3><div class="card-foot"><strong>${esc(CONFIG.CURRENCY||'USD')} $${Number(p.price).toFixed(Number(p.price)%1?2:0)}</strong><span>VIEW →</span></div></div></article>`}
function openProduct(slug){selected=PRODUCTS.find(p=>p.slug===slug);if(!selected)return;setRouteTheme(selected.category.toLowerCase());$('#sheetCategory').textContent=selected.category.toUpperCase();$('#sheetName').textContent=selected.name;$('#sheetPrice').textContent=`${CONFIG.CURRENCY||'USD'} $${selected.price}`;$('#sheetDescription').textContent=selected.description||`${selected.name} is a focused Kaizen subliminal within the ${selected.category.toLowerCase()} collection, designed for consistent personal use and deliberate refinement.`;const art=$('#sheetArt');art.innerHTML=selected.image_url?`<img src="${esc(selected.image_url)}" alt="${esc(selected.name)}">`:'<div class="sheet-art-monogram">K</div>';$('#productSheet').classList.add('open');$('#productSheet').setAttribute('aria-hidden','false')}
function closeProduct(){$('#productSheet').classList.remove('open');$('#productSheet').setAttribute('aria-hidden','true');const r=(location.hash||'#home').slice(1);setRouteTheme(routeTheme[r]?r:'explore')}
function openMenu(){$('#menuShell').classList.add('open');$('#menuShell').setAttribute('aria-hidden','false')}
function closeMenu(){$('#menuShell').classList.remove('open');$('#menuShell').setAttribute('aria-hidden','true')}
function loadCart(){try{cart=JSON.parse(localStorage.getItem(CART_KEY)||'[]')}catch{cart=[]}renderCart()}
function saveCart(){localStorage.setItem(CART_KEY,JSON.stringify(cart));renderCart()}
function addToCart(p){if(!p)return;if(!cart.includes(p.slug))cart.push(p.slug);saveCart();openCart()}
function removeFromCart(slug){cart=cart.filter(x=>x!==slug);saveCart()}
function cartProducts(){return cart.map(s=>PRODUCTS.find(p=>p.slug===s)).filter(Boolean)}
function renderCart(){const items=cartProducts(),count=items.length,total=items.reduce((a,p)=>a+Number(p.price||0),0);$('#cartCount').textContent=count;$('#mobileCartCount').textContent=count;$('#cartTotal').textContent=`${CONFIG.CURRENCY||'USD'} $${total.toFixed(2)}`;$('#cartItems').innerHTML=items.length?items.map(p=>{const rgb=cardRGB[p.category]||'207,210,216';return `<div class="cart-item" style="--item-rgb:${rgb}"><div class="cart-thumb">${p.image_url?`<img src="${esc(p.image_url)}" alt="">`:'K'}</div><div><strong>${esc(p.name)}</strong><small>${CONFIG.CURRENCY||'USD'} $${p.price}</small></div><button class="remove" data-remove="${esc(p.slug)}" aria-label="Remove">×</button></div>`}).join(''):'<div class="cart-empty">Your cart is empty.<br><small>Choose a subliminal to begin.</small></div>';$$('[data-remove]').forEach(b=>b.onclick=()=>removeFromCart(b.dataset.remove));$('#checkoutBtn').disabled=!items.length}
function openCart(){renderCart();$('#cartShell').classList.add('open');$('#cartShell').setAttribute('aria-hidden','false')}
function closeCart(){$('#cartShell').classList.remove('open');$('#cartShell').setAttribute('aria-hidden','true');$('#paypalButtons').innerHTML='';$('#checkoutBtn').style.display='inline-flex'}

async function loadPayPal(){
  if(window.paypal)return true;
  if(!CONFIG.PAYPAL_CLIENT_ID)return false;
  return new Promise(resolve=>{
    const s=document.createElement('script');
    s.src=`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(CONFIG.PAYPAL_CLIENT_ID)}&currency=${encodeURIComponent(CONFIG.CURRENCY||'USD')}&intent=capture`;
    s.onload=()=>resolve(!!window.paypal);
    s.onerror=()=>resolve(false);
    document.head.appendChild(s);
  });
}

async function apiJson(path,body){
  const response=await fetch(`${CONFIG.CHECKOUT_API_BASE||'/api/paypal'}${path}`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body)
  });
  let data={};
  try{data=await response.json()}catch{}
  if(!response.ok)throw new Error(data.error||'Checkout request failed.');
  return data;
}

async function checkout(){
  const items=cartProducts();
  if(!items.length)return;
  const ready=await loadPayPal();
  if(!ready){alert('Checkout is temporarily unavailable.');return}

  $('#checkoutBtn').style.display='none';
  $('#paypalButtons').innerHTML='';

  paypal.Buttons({
    style:{shape:'pill',layout:'vertical',label:'pay'},

    // SECURITY: only product slugs are sent. The Vercel function gets the real prices
    // from Supabase and creates the PayPal order server-side.
    createOrder:async()=>{
      try{
        const result=await apiJson('/create-order',{items:items.map(p=>({slug:p.slug}))});
        return result.id;
      }catch(err){
        alert(err.message||'Could not start checkout.');
        $('#checkoutBtn').style.display='inline-flex';
        throw err;
      }
    },

    // SECURITY: the browser never marks an order as paid. Vercel captures PayPal,
    // verifies the amount against its server checkout record, then writes the order.
    onApprove:async data=>{
      try{
        const result=await apiJson('/capture-order',{orderID:data.orderID});
        if(result.status!=='COMPLETED')throw new Error('Payment was not completed.');
        cart=[];
        saveCart();
        $('#cartItems').innerHTML='<div class="cart-empty"><strong style="color:#fff">Payment confirmed.</strong><br><small>Your Kaizen purchase has been received.</small></div>';
        $('#paypalButtons').innerHTML='';
        $('#checkoutBtn').style.display='none';
      }catch(err){
        alert(err.message||'Your payment could not be verified. Please contact support if PayPal shows a completed charge.');
        $('#checkoutBtn').style.display='inline-flex';
      }
    },

    onCancel:()=>{$('#checkoutBtn').style.display='inline-flex';$('#paypalButtons').innerHTML=''},
    onError:err=>{console.error(err);alert('PayPal could not complete checkout. Please try again.');$('#checkoutBtn').style.display='inline-flex'}
  }).render('#paypalButtons');
}

function observeReveals(){const els=$$('.reveal:not(.in)');if(!('IntersectionObserver'in window)){els.forEach(e=>e.classList.add('in'));return}const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.08});els.forEach(e=>io.observe(e))}

$('#searchInput').addEventListener('input',render);
$$('#filterRow button').forEach(b=>b.addEventListener('click',()=>{activeFilter=b.dataset.filter;updateFilterButtons();render()}));
$$('[data-close-product]').forEach(x=>x.addEventListener('click',closeProduct));
$('#menuBtn').onclick=openMenu;
$('#closeMenu').onclick=closeMenu;
$$('[data-close-menu]').forEach(x=>x.onclick=closeMenu);
$('#cartBtn').onclick=openCart;
$('#mobileCartBtn').onclick=openCart;
$('#closeCart').onclick=closeCart;
$$('[data-close-cart]').forEach(x=>x.onclick=closeCart);
$('#addToCartBtn').onclick=()=>{addToCart(selected);closeProduct()};
$('#buyNowBtn').onclick=()=>{if(selected&&!cart.includes(selected.slug))cart.push(selected.slug);saveCart();closeProduct();openCart()};
$('#checkoutBtn').onclick=checkout;
window.addEventListener('hashchange',route);

(async()=>{loadCart();await loadRemoteCatalog();renderCart();route();observeReveals()})();
