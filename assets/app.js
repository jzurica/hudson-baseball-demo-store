(function(){
'use strict';
var P=window.HBC_PRODUCTS||[], CATS=window.HBC_CATS||[];
var YOUTH=['YXS','YS','YM','YL','YXL'];
var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var app=$('#app');
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function money(n){return '$'+(Math.round(n*100)/100).toFixed(2).replace(/\.00$/,'')}
function money2(n){return '$'+n.toFixed(2)}
function bySlug(s){for(var i=0;i<P.length;i++) if(P[i].slug===s) return P[i]; return null}
function isYouth(sz){return YOUTH.indexOf(sz)>-1}
function priceFor(p,size){
  if(size && p.sizePrices && p.sizePrices[size]!=null) return p.sizePrices[size];
  if(size && isYouth(size) && p.youthPrice) return p.youthPrice;
  return p.price;
}
function priceRange(p){
  var v=[p.price]; if(p.youthPrice) v.push(p.youthPrice); if(p.sizePrices) for(var k in p.sizePrices) v.push(p.sizePrices[k]);
  var lo=Math.min.apply(null,v), hi=Math.max.apply(null,v); return lo===hi?money(lo):'From '+money(lo);
}
function swatchStyle(hex){var h=hex.split('|');return h.length>1?'--c:'+h[1]+';--c2:'+h[0]:'--c:'+h[0]}
function isSplit(hex){return hex.indexOf('|')>-1}
function inCat(p,c){
  if(!c||c==='all') return true;
  if(c==='youth') return p.sizes.some(isYouth);
  if(c==='tees') return /tee/.test(p.slug);
  return p.cat===c;
}
function catName(c){for(var i=0;i<CATS.length;i++) if(CATS[i][0]===c) return CATS[i][1]; return 'Shop all'}

/* ---------- storage ---------- */
var mem={};
function store(k,v){try{if(v===undefined){var x=localStorage.getItem(k);return x?JSON.parse(x):null} localStorage.setItem(k,JSON.stringify(v))}catch(e){if(v===undefined) return mem[k]||null; mem[k]=v}}
function cart(){return store('hbc_demo_cart')||[]}
function setCart(c){store('hbc_demo_cart',c); renderBag()}
function cartCount(){return cart().reduce(function(a,b){return a+b.qty},0)}
function cartTotal(){return cart().reduce(function(a,it){var p=bySlug(it.slug);return a+(p?priceFor(p,it.size)*it.qty:0)},0)}
function addToCart(slug,color,size,qty){
  var c=cart(), f=null;
  c.forEach(function(it){if(it.slug===slug&&it.color===color&&it.size===size) f=it});
  if(f) f.qty+=qty; else c.push({slug:slug,color:color,size:size,qty:qty});
  setCart(c);
}
function colorObj(p,name){for(var i=0;i<p.colors.length;i++) if(p.colors[i].name===name) return p.colors[i]; return p.colors[0]}

/* ---------- components ---------- */
function card(p){
  var a=p.colors[0], b=p.colors[1]||p.colors[0];
  return '<a class="card reveal" href="#/product/'+p.slug+'">'+
    '<div class="ph"><img src="'+a.img+'" alt="'+esc(p.name)+' in '+esc(a.name)+'" loading="lazy" width="1000" height="1000"><img class="alt" src="'+b.img+'" alt="" loading="lazy" width="1000" height="1000"></div>'+
    '<div class="meta"><h3>'+esc(p.name)+'</h3><span class="price">'+priceRange(p)+'</span></div>'+
    '<div class="sub">'+p.colors.length+' colors · '+esc(p.pf.brand==='Generic brand'?p.pf.product:p.pf.brand+' '+p.pf.model)+'</div>'+
    '<div class="dots">'+p.colors.map(function(c){return '<i class="dot'+(isSplit(c.hex)?' duo':'')+'" style="'+swatchStyle(c.hex)+'" title="'+esc(c.name)+'"></i>'}).join('')+'</div>'+
  '</a>';
}
function lineHTML(it,i,compact){
  var p=bySlug(it.slug); if(!p) return '';
  var c=colorObj(p,it.color);
  return '<div class="line"><a class="im" href="#/product/'+p.slug+'?c='+encodeURIComponent(c.name)+'"><img src="'+c.img+'" alt=""></a>'+
    '<div><h4>'+esc(p.name)+'</h4><div class="v">'+esc(c.name)+' · '+esc(it.size)+(compact?' · Qty '+it.qty:'')+'</div>'+
    (compact?'':'<div class="ctl"><div class="qty"><button data-q="'+i+'" data-d="-1" aria-label="Decrease">−</button><span>'+it.qty+'</span><button data-q="'+i+'" data-d="1" aria-label="Increase">+</button></div><button class="rm" data-rm="'+i+'">Remove</button></div>')+
    '</div><div class="lp">'+money2(priceFor(p,it.size)*it.qty)+'</div></div>';
}
function ship(sub){return sub===0?0:(sub>=75?0:6.95)}
function renderBag(){
  var n=cartCount(); $('#bagCount').textContent=n;
  var c=cart(), body=$('#drawerBody'), foot=$('#drawerFoot');
  if(!c.length){
    body.innerHTML='<div class="empty"><div class="display">Your bag is empty</div><p>Start with the hoodie everyone at the facility is wearing.</p></div>';
    foot.innerHTML='<a class="btn btn-ink" style="width:100%" href="#/shop" data-action="close-cart">Shop the store</a>';
    return;
  }
  body.innerHTML=c.map(function(it,i){return lineHTML(it,i)}).join('');
  var sub=cartTotal(), s=ship(sub);
  foot.innerHTML='<div class="sum"><span>Subtotal</span><span>'+money2(sub)+'</span></div>'+
    '<div class="sum"><span>Shipping to your home</span><span>'+(s?money2(s):'Free')+'</span></div>'+
    '<p class="ship-note">'+(sub<75?'Add '+money2(75-sub)+' more for free shipping. ':'')+'Each item is printed to order and ships straight to you.</p>'+
    '<a class="btn btn-red" style="width:100%" href="#/checkout" data-action="close-cart">Checkout</a>'+
    '<a class="btn btn-line" style="width:100%;margin-top:8px" href="#/cart" data-action="close-cart">View bag</a>';
}
function openCart(){document.body.classList.add('cart-open');$('#drawer').setAttribute('aria-hidden','false')}
function closeCart(){document.body.classList.remove('cart-open');$('#drawer').setAttribute('aria-hidden','true')}
var toastT;
function toast(html){var t=$('#toast');t.innerHTML=html;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on')},3200)}

/* ---------- pages ---------- */
function home(){
  var feat=['heavy-blend-hoodie','mid-profile-cap','clubhouse-tee-mens','heavy-blend-crewneck','clubhouse-tee-youth','clubhouse-tee-womens','team-sweatpants','fleece-shorts'].map(bySlug);
  var cap=bySlug('mid-profile-cap');
  var ess=['insulated-tumbler-20oz','accent-coffee-mug','rally-towel','acrylic-keychain'].map(bySlug);
  var tick='<span>7U–12U Travel</span><i>/</i><span>Clinics</span><i>/</i><span>Private Lessons</span><i>/</i><span>Cage Rentals</span><i>/</i><span>Camps</span><i>/</i><span>Union City, NJ</span><i>/</i>';
  return ''+
  '<section class="hero"><div class="hero-media"><img src="assets/img/hero-cage.webp" alt="Youth hitter taking swings in an indoor batting cage" width="2000" height="1125" fetchpriority="high"></div>'+
   '<div class="wrap hero-copy"><div class="eyebrow">Official team store · Fall/Winter 2026</div>'+
   '<h1 class="display">Built in<br>the <span class="red">cage.</span></h1>'+
   '<p class="lead">Gear for the players, parents and coaches of Hudson Baseball Center. Every family orders their own, from youth XS to adult 3XL, and it ships to your door.</p>'+
   '<div class="btn-row"><a class="btn btn-red" href="#/shop">Shop the collection</a><a class="btn btn-ghost" href="#/shop/youth">Shop youth</a></div></div>'+
   '<div class="hero-meta"><b>Hudson Baseball Center</b><br>2300 Summit Ave<br>Union City, NJ</div></section>'+
  '<div class="ticker" aria-hidden="true"><div class="ticker-track">'+tick+tick+tick+tick+'</div></div>'+

  '<section class="sec"><div class="wrap"><div class="sec-head"><div><div class="eyebrow">Collections</div><h2 class="display" style="margin-top:12px">Shop the club</h2></div><a class="more" href="#/shop">View all 16 products</a></div>'+
   '<div class="tiles">'+
    '<a class="tile t1 reveal" href="#/shop/fleece"><img src="assets/products/hoodie-sand.webp" alt="Sand Dugout Hoodie" loading="lazy"><div class="cap"><h3>Fleece</h3><span>Hoodies · Crews · Sweats</span></div></a>'+
    '<a class="tile t2 reveal" href="#/shop/headwear"><img src="assets/products/hat-royal-natural.webp" alt="Royal and natural Clubhouse Cap" loading="lazy"><div class="cap"><h3>Headwear</h3><span>The Clubhouse Cap</span></div></a>'+
    '<a class="tile t3 reveal" href="#/shop/tees"><img src="assets/products/tee-men-soft-cream.webp" alt="Soft cream Clubhouse Tee" loading="lazy"><div class="cap"><h3>Tees</h3><span>Men · Women · Youth</span></div></a>'+
    '<a class="tile t4 reveal" href="#/shop/youth"><img src="assets/products/tee-kids-red.webp" alt="Red youth tee" loading="lazy"><div class="cap"><h3>Youth</h3><span>YXS–YXL</span></div></a>'+
    '<a class="tile t5 reveal" href="#/shop/gear"><img src="assets/products/backpack-navy.webp" alt="Navy team backpack" loading="lazy"><div class="cap"><h3>Gear</h3><span>Bags · Cases · Towels</span></div></a>'+
   '</div></div></section>'+

  '<section class="sec" style="padding-top:0"><div class="wrap"><div class="sec-head"><div><div class="eyebrow">New this season</div><h2 class="display" style="margin-top:12px">The drop</h2></div><a class="more" href="#/shop/fleece">Shop fleece</a></div>'+
   '<div class="rail">'+feat.map(card).join('')+'</div></div></section>'+

  '<section class="split"><div class="media"><img src="assets/img/life-huddle.webp" alt="Hudson youth team huddled on the turf" loading="lazy"></div>'+
   '<div class="copy reveal"><div class="eyebrow" style="color:#a9a59b">How the team store works</div><h2 class="display">One club.<br><em>Every family.</em></h2>'+
   '<p>No bulk order forms, no collecting cash at practice and no box of wrong sizes. Each family shops on their own and their gear ships home.</p>'+
   '<ol class="steps"><li><b>01</b><div><strong>Pick it, size it</strong><span>Youth XS through adult 3XL. No minimums.</span></div></li>'+
   '<li><b>02</b><div><strong>Printed to order</strong><span>Every piece is made when you order it, so nothing sits in a warehouse.</span></div></li>'+
   '<li><b>03</b><div><strong>Shipped to your door</strong><span>It goes straight to your home, not to the facility.</span></div></li></ol>'+
   '<div><a class="btn btn-red" href="#/club">More about the store</a></div></div></section>'+

  '<section class="sec"><div class="wrap spot">'+
   '<a class="big reveal" href="#/product/'+cap.slug+'"><img id="spotImg" src="'+cap.colors[0].img+'" alt="The Clubhouse Cap" loading="lazy"></a>'+
   '<div class="reveal"><div class="eyebrow">Spotlight</div><h2 class="display">The Clubhouse<br>Cap</h2>'+
   '<div class="model">OTTO Cap 31-069 Mid Profile Baseball Cap · natural crown, contrast brim</div>'+
   '<p>The one parents keep stealing from their kids. A structured mid-profile crown in natural twill, a contrast brim in four club colors, and the H front and center.</p>'+
   '<div class="swatches" id="spotSw">'+cap.colors.map(function(c,i){return '<button class="sw duo'+(i===0?' on':'')+'" style="'+swatchStyle(c.hex)+'" data-spot="'+i+'" aria-label="'+esc(c.name)+'" title="'+esc(c.name)+'"></button>'}).join('')+'</div>'+
   '<div class="btn-row"><a class="btn btn-ink" href="#/product/'+cap.slug+'" id="spotLink">Shop the cap · '+money(cap.price)+'</a></div></div>'+
  '</div></section>'+

  '<section class="sec band"><div class="wrap"><div class="band-grid">'+
   '<div class="feature reveal"><img src="assets/img/life-bucket.webp" alt="Bucket of practice baseballs and a wood bat on turf" loading="lazy"><div class="lbl"><div class="eyebrow" style="color:#e9e6de">Practice-day essentials</div><h2 class="display" style="margin-top:12px">Bring it<br>to the cage</h2></div></div>'+
   '<div class="grid">'+ess.map(card).join('')+'</div>'+
  '</div></div></section>'+

  '<section class="sec" style="padding-bottom:clamp(56px,8vw,96px)"><div class="wrap"><div class="promise">'+
   '<div><b>YXS–3XL</b><span>Youth and adult sizes on the fleece and tees</span></div>'+
   '<div><b>No minimums</b><span>Order one piece or ten</span></div>'+
   '<div><b>Ships home</b><span>Straight to each family, usually 5–9 business days</span></div>'+
   '<div><b>Supports HBC</b><span>Part of every order goes back to the club</span></div>'+
  '</div></div></section>';
}
function shop(cat){
  cat=cat||'all';
  var list=P.filter(function(p){return inCat(p,cat)});
  var sort=store('hbc_sort')||'featured';
  if(sort==='low') list=list.slice().sort(function(a,b){return a.price-b.price});
  if(sort==='high') list=list.slice().sort(function(a,b){return b.price-a.price});
  var intro={all:'Everything in the Hudson Baseball Center team store. Mix the colors, pick your sizes and it ships to your door.',fleece:'Heavyweight hoodies, crews, sweats and shorts in sand, light blue, heather grey, navy, black and red.',tees:"Men's, women's and youth tees, each a different cut.",youth:'Sized for 7U through 12U, YXS–YXL.',headwear:'The Clubhouse Cap in four brim colors.',drinkware:'Tumblers and mugs for the sideline and the morning drive.',gear:'Bags, cases, towels and the small stuff.',home:'Blankets for April night games.'}[cat]||'';
  return '<section class="page-head"><div class="wrap"><div class="eyebrow">Team store</div><h1 class="display" style="margin-top:12px">'+esc(catName(cat))+'</h1><p>'+intro+'</p></div></section>'+
  '<div class="wrap"><div class="filters"><nav class="tabs">'+CATS.map(function(c){return '<a href="#/shop'+(c[0]==='all'?'':'/'+c[0])+'" class="'+(c[0]===cat?'on':'')+'">'+c[1]+'</a>'}).join('')+'</nav>'+
  '<div style="display:flex;gap:16px;align-items:center"><span class="count">'+list.length+' products</span><select id="sort" aria-label="Sort"><option value="featured">Featured</option><option value="low">Price, low to high</option><option value="high">Price, high to low</option></select></div></div>'+
  '<div class="grid" style="padding-bottom:96px">'+list.map(card).join('')+'</div></div>';
}
function product(slug,q){
  var p=bySlug(slug); if(!p) return notFound();
  var ci=0; if(q.c){p.colors.forEach(function(c,i){if(c.name===q.c) ci=i})}
  var c=p.colors[ci];
  var hasY=p.sizes.some(isYouth), hasA=p.sizes.some(function(s){return !isYouth(s)});
  var wide=(p.sizeLabel==='Model')||p.sizes.some(function(s){return s.length>6});
  var sizesHTML='';
  if(hasY&&hasA){
    sizesHTML='<span class="group-lbl">Youth</span>'+p.sizes.filter(isYouth).map(szBtn).join('')+'<span class="group-lbl">Adult</span>'+p.sizes.filter(function(s){return !isYouth(s)}).map(szBtn).join('');
  } else sizesHTML=p.sizes.map(szBtn).join('');
  function szBtn(s){return '<button class="size" data-size="'+esc(s)+'">'+esc(s)+'</button>'}
  var related=P.filter(function(x){return x.slug!==p.slug&&(x.cat===p.cat)}).concat(P.filter(function(x){return x.cat!==p.cat})).slice(0,4);
  var spec='<dl class="spec"><dt>Printify product</dt><dd>'+esc(p.pf.product)+'</dd><dt>Brand / model</dt><dd>'+esc(p.pf.brand)+(p.pf.brand==='Generic brand'?'':' '+esc(p.pf.model))+'</dd><dt>Catalog ID</dt><dd>Blueprint '+p.pf.blueprint+' · '+esc(p.pf.provider)+'</dd>'+
    (p.pfYouth?'<dt>Youth version</dt><dd>'+esc(p.pfYouth.brand+' '+p.pfYouth.model+' '+p.pfYouth.product)+' (blueprint '+p.pfYouth.blueprint+')</dd>':'')+'</dl>';
  return '<div class="wrap"><div class="crumbs"><a href="#/">Home</a> / <a href="#/shop/'+(p.cat==='youth'?'youth':p.cat)+'">'+esc(catName(p.cat))+'</a> / '+esc(p.name)+'</div>'+
  '<div class="pdp" data-slug="'+p.slug+'">'+
   '<div class="gallery"><div class="thumbs">'+p.colors.map(function(x,i){return '<button class="'+(i===ci?'on':'')+'" data-ci="'+i+'" aria-label="'+esc(x.name)+'"><img src="'+x.img+'" alt=""></button>'}).join('')+'</div>'+
   '<div class="stage"><img id="stageImg" src="'+c.img+'" alt="'+esc(p.name)+' in '+esc(c.name)+'" width="1000" height="1000"></div></div>'+
   '<div class="buy"><div class="eyebrow">'+esc(p.tag)+' · Hudson Baseball Center</div><h1 class="display">'+esc(p.name)+'</h1>'+
    '<div class="price" id="pdpPrice">'+(p.youthPrice?money(p.youthPrice)+' youth · '+money(p.price)+' adult':(p.sizePrices?priceRange(p):money(p.price)))+'</div>'+
    '<div class="model"><b>'+esc(p.pf.brand==='Generic brand'?'Printify':p.pf.brand+' '+p.pf.model)+'</b> · '+esc(p.pf.product)+'</div>'+
    '<p class="blurb">'+esc(p.blurb)+'</p>'+
    '<div class="opt"><div class="opt-h"><span>Color: <b id="colorName">'+esc(c.name)+'</b></span></div><div class="swatches" style="margin:0">'+
      p.colors.map(function(x,i){return '<button class="sw'+(isSplit(x.hex)?' duo':'')+(i===ci?' on':'')+'" style="'+swatchStyle(x.hex)+'" data-ci="'+i+'" aria-label="'+esc(x.name)+'" title="'+esc(x.name)+'"></button>'}).join('')+'</div></div>'+
    '<div class="opt"><div class="opt-h"><span>'+esc(p.sizeLabel||'Size')+': <b id="sizeName">'+(p.sizes.length===1?esc(p.sizes[0]):'Select')+'</b></span>'+(p.sizes.length>2&&!p.sizeLabel?'<a href="#/sizing">Size guide</a>':'')+'</div>'+
      '<div class="sizes'+(wide?' wide':'')+'" id="sizes">'+sizesHTML+'</div><div class="note" id="sizeNote"></div></div>'+
    '<div class="err" id="err"></div>'+
    '<div class="qty-row"><div class="qty"><button data-pq="-1" aria-label="Decrease quantity">−</button><span id="pq">1</span><button data-pq="1" aria-label="Increase quantity">+</button></div>'+
    '<button class="btn btn-red add" id="addBtn">Add to bag</button></div>'+
    '<div class="note">Printed to order. Ships to your home in about 5–9 business days. Free shipping over $75.</div>'+
    '<div class="acc"><details open><summary>Details</summary><div class="in"><ul>'+p.details.map(function(d){return '<li>'+esc(d)+'</li>'}).join('')+'</ul></div></details>'+
    '<details><summary>Product specs</summary><div class="in">'+spec+'</div></details>'+
    '<details><summary>Shipping and returns</summary><div class="in">Each item is printed on demand and shipped straight to the address you enter at checkout. Since everything is made to order, exchanges are for size or print issues within 30 days. <em>This is a demo, so nothing is actually charged or shipped.</em></div></details></div>'+
   '</div></div>'+
  '<section style="padding:0 0 96px"><div class="sec-head"><div><div class="eyebrow">Complete the kit</div><h2 class="display" style="margin-top:12px;font-size:clamp(36px,4.5vw,64px)">You might also like</h2></div></div><div class="grid">'+related.map(card).join('')+'</div></section></div>';
}
function bindProduct(slug,q){
  var p=bySlug(slug); if(!p) return;
  var state={ci:0,size:p.sizes.length===1?p.sizes[0]:null,qty:1};
  if(q.c) p.colors.forEach(function(c,i){if(c.name===q.c) state.ci=i});
  if(state.size) $$('#sizes .size').forEach(function(b){if(b.dataset.size===state.size) b.classList.add('on')});
  function availability(){
    var cn=p.colors[state.ci].name, note='';
    $$('#sizes .size').forEach(function(b){
      var s=b.dataset.size, dis=false;
      if(isYouth(s)&&p.youthColors&&p.youthColors.indexOf(cn)<0) dis=true;
      b.disabled=dis; if(dis&&state.size===s){state.size=null;b.classList.remove('on');$('#sizeName').textContent='Select'}
    });
    if(p.youthColors&&p.youthColors.indexOf(cn)<0) note='Youth sizes come in '+p.youthColors.join(' and ')+'.';
    $('#sizeNote').textContent=note;
  }
  function price(){
    if(state.size) $('#pdpPrice').textContent=money(priceFor(p,state.size));
  }
  function setColor(i){
    state.ci=i; var c=p.colors[i], img=$('#stageImg');
    img.classList.add('fade');
    var n=new Image(); n.onload=function(){img.src=c.img;img.alt=p.name+' in '+c.name;img.classList.remove('fade')}; n.src=c.img;
    $('#colorName').textContent=c.name;
    $$('.pdp [data-ci]').forEach(function(b){b.classList.toggle('on',+b.dataset.ci===i)});
    try{history.replaceState(null,'','#/product/'+p.slug+'?c='+encodeURIComponent(c.name))}catch(e){}
    availability();
  }
  $$('.pdp [data-ci]').forEach(function(b){b.addEventListener('click',function(){setColor(+b.dataset.ci)})});
  $$('#sizes .size').forEach(function(b){b.addEventListener('click',function(){
    if(b.disabled) return; $$('#sizes .size').forEach(function(x){x.classList.remove('on')}); b.classList.add('on'); state.size=b.dataset.size; $('#sizeName').textContent=state.size; $('#err').textContent=''; price();
  })});
  $$('[data-pq]').forEach(function(b){b.addEventListener('click',function(){state.qty=Math.max(1,Math.min(20,state.qty+(+b.dataset.pq)));$('#pq').textContent=state.qty})});
  $('#addBtn').addEventListener('click',function(){
    if(!state.size){$('#err').textContent='Pick a '+(p.sizeLabel||'size').toLowerCase()+' first.';return}
    addToCart(p.slug,p.colors[state.ci].name,state.size,state.qty);
    var b=$('#addBtn'); b.textContent='Added to bag'; setTimeout(function(){b.textContent='Add to bag'},1600);
    openCart();
  });
  availability();
}
function cartPage(){
  var c=cart();
  if(!c.length) return '<div class="wrap"><section class="page-head"><h1 class="display">Your bag</h1></section><div class="empty" style="padding:80px 0"><div class="display">Nothing here yet</div><p>Your bag is empty.</p><p><a class="btn btn-ink" href="#/shop">Shop the store</a></p></div></div>';
  var sub=cartTotal(), s=ship(sub);
  return '<div class="wrap"><section class="page-head" style="border:0;padding-bottom:0"><h1 class="display">Your bag</h1></section>'+
  '<div class="co"><div id="cartLines">'+c.map(function(it,i){return lineHTML(it,i)}).join('')+'</div>'+
  '<aside class="summary"><h3>Order summary</h3><div class="sum"><span>Subtotal</span><span>'+money2(sub)+'</span></div><div class="sum"><span>Shipping</span><span>'+(s?money2(s):'Free')+'</span></div><div class="sum total"><span>Total</span><span>'+money2(sub+s)+'</span></div>'+
  '<a class="btn btn-red" style="width:100%" href="#/checkout">Checkout</a><p class="ship-note" style="margin-top:12px">Demo store. No payment is collected.</p></aside></div></div>';
}
function checkout(){
  var c=cart();
  if(!c.length) return '<div class="wrap"><div class="empty" style="padding:100px 0"><div class="display">Your bag is empty</div><p><a class="btn btn-ink" href="#/shop">Shop the store</a></p></div></div>';
  var sub=cartTotal(), s=ship(sub);
  return '<div class="wrap"><div class="crumbs"><a href="#/cart">Bag</a> / Checkout</div><div class="co">'+
  '<form id="coForm" novalidate><h1 class="display">Checkout</h1><p class="ship-note" style="margin-bottom:28px">This is a demo checkout. Use any details you want; nothing is saved or sent.</p>'+
   '<fieldset><legend><i>1</i>Contact</legend><div class="f"><input class="inp" name="email" type="email" placeholder="Email for order updates" autocomplete="off"><div class="f2"><input class="inp" name="first" placeholder="First name" autocomplete="off"><input class="inp" name="last" placeholder="Last name" autocomplete="off"></div>'+
   '<div class="f2"><input class="inp" name="player" placeholder="Player name (optional)" autocomplete="off"><select class="inp" name="team" aria-label="Team"><option>Team (optional)</option><option>7U</option><option>8U</option><option>9U</option><option>10U</option><option>11U</option><option>12U</option><option>Clinic / lessons</option><option>Parent / fan</option></select></div></div></fieldset>'+
   '<fieldset><legend><i>2</i>Ship to your home</legend><div class="f"><input class="inp" name="addr" placeholder="Street address" autocomplete="off"><div class="f3"><input class="inp" name="city" placeholder="City" autocomplete="off"><input class="inp" name="state" placeholder="State" autocomplete="off"><input class="inp" name="zip" placeholder="ZIP" autocomplete="off"></div></div></fieldset>'+
   '<fieldset><legend><i>3</i>Shipping</legend>'+
    '<label class="radio on"><span><input type="radio" name="ship" value="std" checked>Standard · 5–9 business days</span><span>'+(s?money2(s):'Free')+'</span></label>'+
    '<label class="radio"><span><input type="radio" name="ship" value="exp">Express · 3–5 business days</span><span>'+money2(s+9)+'</span></label></fieldset>'+
   '<fieldset><legend><i>4</i>Payment</legend><div class="paybox"><b>Payments are turned off in this demo.</b>In the live store, families pay securely at checkout. No card details are collected here.</div></fieldset>'+
   '<button class="btn btn-red" style="width:100%;height:56px" type="submit" id="placeBtn">Place demo order · '+money2(sub+s)+'</button></form>'+
  '<aside class="summary"><h3>In your bag</h3>'+c.map(function(it,i){return lineHTML(it,i,true)}).join('')+
   '<div style="margin-top:14px"><div class="sum"><span>Subtotal</span><span>'+money2(sub)+'</span></div><div class="sum"><span>Shipping</span><span id="shipAmt">'+(s?money2(s):'Free')+'</span></div><div class="sum total"><span>Total</span><span id="totAmt">'+money2(sub+s)+'</span></div></div></aside>'+
  '</div></div>';
}
function bindCheckout(){
  var f=$('#coForm'); if(!f) return;
  var sub=cartTotal(), s=ship(sub);
  $$('input[name=ship]',f).forEach(function(r){r.addEventListener('change',function(){
    $$('.radio',f).forEach(function(l){l.classList.toggle('on',l.contains(r)&&r.checked)});
    var sh=r.value==='exp'?s+9:s; $('#shipAmt').textContent=sh?money2(sh):'Free'; $('#totAmt').textContent=money2(sub+sh); $('#placeBtn').textContent='Place demo order · '+money2(sub+sh);
  })});
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var exp=f.ship.value==='exp', sh=exp?s+9:s;
    var id='HBC-'+String(Math.floor(1000+Math.random()*9000));
    var order={id:id,lines:cart(),sub:sub,ship:sh,total:sub+sh,name:(f.first.value||'').trim(),email:(f.email.value||'').trim(),method:exp?'Express · 3–5 business days':'Standard · 5–9 business days'};
    store('hbc_last_order',order); setCart([]);
    location.hash='#/confirmation/'+id;
  });
}
function confirmation(id){
  var o=store('hbc_last_order');
  if(!o||o.id!==id) return '<div class="wrap conf"><h1 class="display">Order not found</h1><p>This demo only remembers your most recent order.</p><a class="btn btn-ink" href="#/shop">Back to the store</a></div>';
  return '<div class="wrap conf"><img class="mark" src="assets/brand/h_mark.webp" alt="">'+
   '<div class="eyebrow">Demo order placed</div><h1 class="display">Thanks'+(o.name?', '+esc(o.name):'')+'.<br>You\'re in the lineup.</h1>'+
   '<p>This is what families see after checkout. In the live store, a confirmation email goes out right away and each item is printed and shipped to the address on the order. <strong>This was a demo, so nothing was charged and nothing will ship.</strong></p>'+
   '<div class="ord"><div><span>Order number</span><b>'+esc(o.id)+'</b></div><div><span>Shipping</span><b>'+esc(o.method)+'</b></div><div><span>Total (demo)</span><b>'+money2(o.total)+'</b></div></div>'+
   '<div class="lines">'+o.lines.map(function(it,i){return lineHTML(it,i,true)}).join('')+'</div>'+
   '<div class="btn-row"><a class="btn btn-red" href="#/shop">Keep shopping</a><a class="btn btn-line" href="#/">Back to home</a></div></div>';
}
function club(){
  return '<section class="club-hero"><div class="copy"><div class="eyebrow" style="color:#a9a59b">The team store</div><h1 class="display">Gear for<br>the whole club</h1>'+
  '<p>Hudson Baseball Center runs clinics, lessons, cage rentals, camps and 7U–12U travel teams out of an 8,000 sq ft indoor facility on Summit Ave. This store dresses all of it.</p>'+
  '<p>It runs on Benchside Supply. Families order on their own, sizes run YXS to 3XL, every piece is printed on demand, and it ships to each home. The club never handles inventory, order forms or cash.</p>'+
  '<div class="btn-row" style="margin-top:28px"><a class="btn btn-red" href="#/shop">Shop the store</a></div></div><div class="media"><img src="assets/img/life-huddle.webp" alt="Youth team huddle" loading="lazy"></div></section>'+
  '<section class="sec"><div class="wrap faq"><div class="eyebrow">FAQ</div><h2 class="display" style="font-size:clamp(40px,5vw,72px);margin:12px 0 28px">Good questions</h2><div class="acc">'+
  faq('Is there a minimum order?','No. Order a single hat or outfit the whole family.')+
  faq('When will my order arrive?','Most orders arrive in 5–9 business days. Everything is printed to order, then shipped straight to your home.')+
  faq('What sizes are available?','Youth XS through adult 3XL on the hoodies, crews and tees, depending on the item. Each product page shows the sizes it comes in.')+
  faq('Can I exchange a size?','Yes, within 30 days if the size is off or there is a print issue.')+
  faq('Does the club get anything?','Yes. Part of every order goes back to Hudson Baseball Center.')+
  '</div></div></section>';
  function faq(q,a){return '<details><summary>'+q+'</summary><div class="in">'+a+'</div></details>'}
}
function sizing(){
  var t=function(h,rows){return '<table class="size-table"><thead><tr>'+h.map(function(x){return '<th>'+x+'</th>'}).join('')+'</tr></thead><tbody>'+rows.map(function(r){return '<tr>'+r.map(function(x){return '<td>'+x+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table>'};
  return '<div class="wrap"><section class="page-head" style="border:0"><div class="eyebrow">Fit</div><h1 class="display" style="margin-top:12px">Size guide</h1><p>Body chest measurements in inches. If you are between sizes, size up for fleece.</p></section>'+
  '<h3>Youth (Gildan 5000B tee, 18500B hoodie, 18000B crew)</h3>'+t(['Size','YXS','YS','YM','YL','YXL'],[['Age (approx.)','4–5','6–8','10–12','14–16','18–20'],['Chest','24–26','26–28','28–30','30–32','32–34']])+
  '<h3>Adult (Bella+Canvas 3001, Gildan 18500 / 18000 / 18200)</h3>'+t(['Size','S','M','L','XL','2XL','3XL'],[['Chest','34–37','38–41','42–45','46–49','50–53','54–57']])+
  '<h3>Women\'s (Bella+Canvas 6400)</h3>'+t(['Size','S','M','L','XL','2XL','3XL'],[['Chest','32–34','35–37','38–40','41–43','44–46','47–49']])+
  '<p style="padding-bottom:80px"><a class="btn btn-ink" href="#/shop">Back to the store</a></p></div>';
}
function notFound(){return '<div class="wrap conf"><h1 class="display">Foul ball.</h1><p>That page is not in this demo.</p><a class="btn btn-ink" href="#/">Back to home</a></div>'}

/* ---------- router ---------- */
function parse(){
  var h=location.hash.replace(/^#/,'')||'/', qs={}, i=h.indexOf('?');
  if(i>-1){h.slice(i+1).split('&').forEach(function(kv){var a=kv.split('=');qs[decodeURIComponent(a[0])]=decodeURIComponent((a[1]||'').replace(/\+/g,' '))});h=h.slice(0,i)}
  return {parts:h.split('/').filter(Boolean),q:qs};
}
var lastPath='';
function route(){
  var r=parse(), a=r.parts, html, after=null, title='Team Store';
  document.body.classList.remove('menu-open'); closeCart();
  if(!a.length){html=home();after=bindHome;title='Team Store'}
  else if(a[0]==='shop'){html=shop(a[1]);after=bindShop;title=catName(a[1]||'all')}
  else if(a[0]==='product'){html=product(a[1],r.q);after=function(){bindProduct(a[1],r.q)};var p=bySlug(a[1]);title=p?p.name:'Product'}
  else if(a[0]==='cart'){html=cartPage();after=bindCartPage;title='Your bag'}
  else if(a[0]==='checkout'){html=checkout();after=bindCheckout;title='Checkout'}
  else if(a[0]==='confirmation'){html=confirmation(a[1]);title='Order confirmed'}
  else if(a[0]==='club'){html=club();title='How it works'}
  else if(a[0]==='sizing'){html=sizing();title='Size guide'}
  else html=notFound();
  var path=a.join('/');
  app.innerHTML=html; document.title=title+' — Hudson Baseball Center (Demo)';
  if(path!==lastPath) window.scrollTo(0,0); lastPath=path;
  $$('.main-nav a').forEach(function(x){x.classList.toggle('on',x.getAttribute('href')==='#/'+path)});
  if(after) after();
  reveal();
}
function bindHome(){
  var cap=bySlug('mid-profile-cap');
  $$('[data-spot]').forEach(function(b){b.addEventListener('click',function(){
    var i=+b.dataset.spot; $('#spotImg').src=cap.colors[i].img;
    $$('[data-spot]').forEach(function(x){x.classList.toggle('on',x===b)});
    $('#spotLink').href='#/product/'+cap.slug+'?c='+encodeURIComponent(cap.colors[i].name);
  })});
}
function bindShop(){var s=$('#sort'); if(!s) return; s.value=store('hbc_sort')||'featured'; s.addEventListener('change',function(){store('hbc_sort',s.value);route()})}
function bindCartPage(){}
function reveal(){
  var els=$$('.reveal');
  if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return}
  var io=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{rootMargin:'0px 0px -6% 0px'});
  els.forEach(function(e){io.observe(e)});
}
/* global clicks */
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-action],[data-q],[data-rm]'); if(!t) return;
  if(t.dataset.action==='open-cart'){openCart()}
  else if(t.dataset.action==='close-cart'){closeCart()}
  else if(t.dataset.action==='menu'){document.body.classList.toggle('menu-open')}
  else if(t.dataset.q!=null){var c=cart(),i=+t.dataset.q;c[i].qty=Math.max(0,c[i].qty+(+t.dataset.d));if(!c[i].qty)c.splice(i,1);setCart(c);if(/cart|checkout/.test(location.hash))route()}
  else if(t.dataset.rm!=null){var c2=cart();c2.splice(+t.dataset.rm,1);setCart(c2);if(/cart|checkout/.test(location.hash))route()}
});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeCart()});
window.addEventListener('hashchange',route);
renderBag(); route();
})();
