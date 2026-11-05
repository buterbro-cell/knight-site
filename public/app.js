// Sir Near — the assistant page: voice, streamed answers, Verified panel, documents, business profiles, 3D knight hookup.
  // 3D knight when the browser has WebGL2; otherwise still pictures with simple CSS motion
  window.__use3d = !!document.createElement('canvas').getContext('webgl2');
const APP_SRC = (document.currentScript && document.currentScript.src) || location.href;
(() => {
  'use strict';
  // ---------------- Тексты ----------------
  const T = {
    ru: {
      title:'Спроси рыцаря NEAR', subtitle:'Приватный ИИ на NEAR AI', start:'Поздороваться с рыцарем',
      hello:'Привет, путник!',
      greetRest:'Я Сэр Ниар, рыцарь NEAR. Нажми на кнопку с микрофоном и спроси меня о чём угодно: про NEAR, приватность или искусственный интеллект!',
      listening:'Слушаю…', thinking:'Думаю…', speaking:'Говорю… (нажми на микрофон, чтобы перебить)',
      ready:'Нажми на микрофон и задай вопрос', placeholder:'Напиши вопрос…', send:'Спросить',
      noHear:'Я ничего не расслышал. Попробуй ещё раз, погромче!',
      micDenied:'Браузер не дал доступ к микрофону. Разреши микрофон в настройках сайта или напиши вопрос текстом.',
      noStt:'Твой браузер не умеет распознавать голос. Напиши вопрос текстом — я отвечу голосом!',
      limitUser:'Уф, ты задал много вопросов! Дай рыцарю передохнуть и возвращайся чуть позже.',
      limitDay:'На сегодня мой запас ответов закончился. Приходи завтра, путник!',
      error:'Мой оракул задумался и не ответил. Спроси ещё раз, пожалуйста.',
      poke:['Ай!','Ой!','Эй!','Ух!'], annoyed:['Ну хватит тыкать!','Эй, я же рыцарь, а не кнопка!','Сейчас обижусь!'], fall:['Ой-ой… всё кружится!','Нечестно! Я поскользнулся!','Рыцари не падают… почти никогда.'],
      tickle:['Ха-ха-ха! Щекотно!','Эй, осторожнее с доспехами!','Ой! Я рыцарь, а не барабан!','Хи-хи! Ещё раз — и вызову на дуэль!'],
      note:'Голосовой ввод сейчас недоступен — напиши вопрос текстом. Ответы генерирует модель в защищённой среде NEAR AI, сервер сайта ничего не сохраняет.',
      demoNote:'Демо-режим: ответы заготовлены, микрофон здесь не работает. На настоящем сайте отвечает нейросеть NEAR AI и работает голос.',
      noVoice:'Озвучка выключена: в этом браузере голос шёл бы через облако, а это не приватно. Ответы — текстом.', privMic:'Этот браузер не умеет записывать звук для приватного распознавания. Напишите вопрос текстом — так ничего не уйдёт сторонним сервисам.',
      searchFiller:'Секунду, сейчас проверю.', searching:'Ищу свежую информацию…',
      vWait:'TEE…', vOk:'TEE ✓', vFail:'TEE ✗', vTitle:'Проверка приватности', vOkBig:'✅ Проверено: ответы считает нейросеть внутри защищённой среды (TEE)', vFailBig:'❌ Проверка не пройдена',
      vIntro:'Сервер сайта сам запросил у NEAR AI отчёт аттестации со свежим случайным числом (nonce) и проверил его так, как описано в документации NEAR AI. Подделать или подсунуть старый отчёт нельзя.',
      vModel:'Модель', vTime:'Проверено', vNonce:'Nonce', vGateway:'Шлюз NEAR AI', vGpuModel:'Модель на видеокарте', vSigner:'Ключ подписи', vAgain:'Проверить заново', vClose:'Закрыть',
      vAnswer:'Последний ответ', vNoStore:'🔒 Сервер этого сайта ничего не сохраняет: ни вопросы, ни ответы, ни документы, ни голос. Только счётчики токенов для расходов.',
      vInfo:'справочно', vThrottled:'Повторная проверка — не чаще нескольких раз в час, показан последний результат.', vSelf:'Как проверить самому, не доверяя этому сайту', vSelfText:'1) Скачайте исходный отчёт аттестации — в нём nonce и подписанные доказательства Intel и NVIDIA. 2) Проверьте его официальным инструментом NEAR AI: github.com/nearai/nearai-cloud-verifier. 3) Подпись ответа выше проверяется так: ethers.verifyMessage(signed_text, signature) должен вернуть signing_address, а этот адрес — совпасть с ключом из отчёта.', vRaw:'Скачать исходный отчёт', vRelay:'Наш сервер-посредник', vRelayNo:'⚠️ Наш сервер пока работает не в TEE: он ничего не хранит (это видно в открытом коде), но криптографически это не доказано.', vRelayTC:'Открыть отчёт Phala Trust Center', vRelayRaw:'Скачать отчёт сервера', vRelayIntro:'Между вашим браузером и NEAR AI стоит наш сервер. Он тоже работает в защищённой среде Intel TDX, и это проверено здесь же:',
      vCh:'Проверьте сами: своё число', vChText:'Придумайте любое число или слово. Мы попросим железо NEAR AI вписать его (в виде sha256) внутрь отчёта, подписанного Intel. Заранее такой отчёт не подготовить — значит, проверка идёт вживую.', vChPh:'например 58371', vChBtn:'Проверить', vChWait:'Запрашиваю отчёт у NEAR AI… (10–30 сек)', vChOk:'✅ Ваше число найдено внутри отчёта, подписанного Intel', vChBad:'❌ Ваше число в отчёте не найдено', vChErr:'Не получилось — попробуйте чуть позже (не чаще пары раз в несколько минут).', vChWord:'Ваше слово', vChHash:'sha256 → nonce', vChRaw:'Скачать этот отчёт', proofOk:'🔏 Ответ подписан внутри TEE — проверено', proofFail:'⚠️ Подпись ответа не подтвердилась — подробнее',
      agTitle:'Кошелёк агента (полный режим)', agWhat:'Отдельный кошелёк вашего агента. Его ключ существует только внутри защищённой среды сервера (Intel TDX): его не видит никто, даже мы. Агент платит из него сам, без окна кошелька, но только по вашей команде и в пределах лимитов. Ваш основной кошелёк агенту не нужен.', agDev:'⚠️ Тестовый сервер не в TEE: здесь ключ агента НЕ защищён. Пополняйте только копейками.', agAccount:'Адрес агента', agBal:'Баланс', agLimits:'Лимиты', agPerAction:'за раз', agPerDay:'в день', agTopUp:'Пополнить', agTopUsdc:'USDC', agTopNear:'+ 0.05 NEAR на газ', agWithdraw:'Вернуть всё мне', agDisconnect:'Отключить кошелёк', agPay:'⚡ Из кошелька агента', agSession:'Подпишите разрешение в кошельке (один раз на 30 минут)…', agPaying:'Агент отправляет платёж из TEE…', agOff:'Кошелёк агента работает только на сервере в TEE.', agTopping:'Подтвердите пополнение в кошельке…', agDone:'Готово.', wConnect:'Кошелёк', wTitle:'Подключить кошелёк NEAR', payTitleSend:'Приватный перевод', payTitleSwap:'Приватный обмен', payTitleReview:'Приватный разбор анализов', payTo:'Получатель', payReceives:'Получит', payYouPay:'Вы отправите', payEta:'Время', paySec:'сек', payPriv:'🔒 Конфиденциально через NEAR Intents: в блокчейне видно ваш депозит и выплату получателю, но связать их между собой нельзя. Ключи и деньги остаются у вас — подписывает ваш кошелёк.', payConnect:'Подключить кошелёк', payConfirm:'Подтвердить в кошельке', payCancel:'Отмена', payQuoting:'Считаю условия в NEAR Intents…', payWallet:'Подтвердите в кошельке…', payProcessing:'Платёж идёт, жду подтверждения…', payDone:'✅ Готово: получатель получил деньги.', payDoneSay:'Готово! Платёж прошёл приватно.', payRefunded:'↩️ Платёж не прошёл, деньги возвращаются вам.', payFailed:'❌ Не получилось. Деньги не списаны или вернутся.', payErr:'Не получилось подготовить платёж: ', payOff:'Платежи сейчас выключены на этом сервере.', payCheckSay:'Проверь карточку и подтверди в своём кошельке.', payLink:'Транзакция', reviewAsk:'Разбор ваших собственных анализов платный — 1 USDC, приватно. Примеры бесплатны.', payPaidSay:'Оплата получена, разбираю документ.', lbDoc:'Документ', lbKbd:'Текст', lbHush:'Тише', dropT:'Отпусти файл — рыцарь разберёт', docAria:'Загрузить документ', dTitle:'Документ', dSub:'Рыцарь приватно разберёт анализы, выписку, чеки или договор — можно просто сфотографировать. Файл уходит только в защищённую среду и нигде не сохраняется.', dUpload:'📁 Загрузить свой файл', dUploadS:'Фото или скриншот (JPG, PNG, WebP), PDF, TXT, CSV', dSamples:'Или вымышленный пример (для проверки):', dClose:'Закрыть',
      imgErr:'Не получилось открыть картинку. Попробуй JPG или PNG.', docPh:'Вопрос к документу — или просто «Спросить»', docReady:'Документ прикреплён. Напиши вопрос, скажи голосом или сразу нажми «Спросить».', docAsk:'Разбери этот документ: что в нём главное и что выглядит необычно или подозрительно?', docAttached:'Документ прикреплён. Сейчас разберу!', docErr:'Не получилось прочитать файл.', docBig:'Файл большой — я прочитаю первые 20 тысяч символов.',
      transcribing:'Распознаю речь (Whisper в TEE)…', noteWhisper:'Голос распознаёт Whisper внутри защищённой среды NEAR AI, ответы — модель в TEE. Сервер сайта ничего не сохраняет. Нажми «TEE ✓» вверху, чтобы увидеть доказательство.',
      speech:'ru-RU'
    },
    en: {
      title:'Ask the NEAR Knight', subtitle:'Private AI powered by NEAR AI', start:'Say hi to the knight',
      hello:'Hello, traveler!',
      greetRest:"I'm Sir Near, the NEAR knight. Tap the microphone and ask me anything about NEAR, privacy or artificial intelligence!",
      listening:'Listening…', thinking:'Thinking…', speaking:'Speaking… (tap the mic to interrupt)',
      ready:'Tap the mic and ask a question', placeholder:'Type a question…', send:'Ask',
      noHear:"I didn't catch that. Try again, a bit louder!",
      micDenied:'The browser blocked the microphone. Allow it in site settings or type your question.',
      noStt:"Your browser can't recognize speech. Type your question and I'll answer out loud!",
      limitUser:"Phew, that's a lot of questions! Let the knight rest and come back a bit later.",
      limitDay:"I'm out of answers for today. Come back tomorrow, traveler!",
      error:"My oracle got lost in thought. Please ask again.",
      poke:['Ouch!','Oof!','Hey!'], annoyed:['Stop poking me!','Hey, I am a knight, not a button!'], fall:['Whoa… the room is spinning!','Not fair! I slipped!'],
      tickle:['Ha-ha-ha! That tickles!','Hey, careful with the armor!','Ouch! I am a knight, not a drum!'],
      note:'Voice input is unavailable right now — please type your question. Answers come from a model in NEAR AI secure enclaves; this server stores nothing.',
      demoNote:'Demo mode: no server connected, answers are pre-written. On the real site NEAR AI answers.',
      noVoice:'Voice is off: in this browser speech would go through a cloud service, which is not private. Answers are shown as text.', privMic:'This browser cannot record audio for private transcription. Please type your question — nothing goes to third-party services.',
      searchFiller:'One moment, let me check.', searching:'Looking up fresh info…',
      vWait:'TEE…', vOk:'TEE ✓', vFail:'TEE ✗', vTitle:'Privacy verification', vOkBig:'✅ Verified: answers are computed by a model inside a Trusted Execution Environment', vFailBig:'❌ Verification failed',
      vIntro:'This site’s server requested a NEAR AI attestation report with a fresh random nonce and verified it as the NEAR AI verification docs describe. An old or forged report cannot pass.',
      vModel:'Model', vTime:'Checked', vNonce:'Nonce', vGateway:'NEAR AI gateway', vGpuModel:'Model on GPU', vSigner:'Signing key', vAgain:'Verify again', vClose:'Close',
      vAnswer:'Last answer', vNoStore:'🔒 This server keeps nothing: no questions, answers, documents or voice. Only token counters for cost.',
      vInfo:'info', vThrottled:'Re-verification is limited to a few times per hour — showing the latest result.', vSelf:'Verify it yourself, without trusting this site', vSelfText:'1) Download the raw attestation report — it contains the nonce and the signed Intel and NVIDIA evidence. 2) Check it with NEAR AI’s official tool: github.com/nearai/nearai-cloud-verifier. 3) The answer signature above: ethers.verifyMessage(signed_text, signature) must return signing_address, and that address must match a key in the report.', vRaw:'Download raw report', vRelay:'Our relay server', vRelayNo:'⚠️ Our relay server is not running in a TEE yet: it stores nothing (see the open code), but that is not cryptographically proven.', vRelayTC:'Open the Phala Trust Center report', vRelayRaw:'Download the server report', vRelayIntro:'Our server sits between your browser and NEAR AI. It also runs inside an Intel TDX enclave, verified right here:',
      vCh:'Check it yourself: your own number', vChText:'Type any number or word. We ask NEAR AI hardware to put it (as sha256) inside the Intel-signed report. Such a report cannot be prepared in advance — so the check is live.', vChPh:'e.g. 58371', vChBtn:'Verify', vChWait:'Requesting a report from NEAR AI… (10–30 s)', vChOk:'✅ Your number was found inside the Intel-signed report', vChBad:'❌ Your number was not found in the report', vChErr:'Failed — try again a bit later (a couple of times per few minutes).', vChWord:'Your word', vChHash:'sha256 → nonce', vChRaw:'Download this report', proofOk:'🔏 Answer signed inside the TEE — verified', proofFail:'⚠️ Answer signature not confirmed — details',
      agTitle:'Agent wallet (full mode)', agWhat:'A separate wallet for your agent. Its key exists only inside the server enclave (Intel TDX): nobody sees it, not even us. The agent pays from it by itself, with no wallet popup, but only on your command and within limits. Your main wallet stays yours.', agDev:'⚠️ This test server is not a TEE: the agent key is NOT protected here. Top up only pennies.', agAccount:'Agent address', agBal:'Balance', agLimits:'Limits', agPerAction:'per action', agPerDay:'per day', agTopUp:'Top up', agTopUsdc:'USDC', agTopNear:'+ 0.05 NEAR for gas', agWithdraw:'Send everything back to me', agDisconnect:'Disconnect wallet', agPay:'⚡ From agent wallet', agSession:'Sign the permission in your wallet (once per 30 minutes)…', agPaying:'The agent is sending the payment from the TEE…', agOff:'The agent wallet works only on the TEE server.', agTopping:'Confirm the top-up in your wallet…', agDone:'Done.', wConnect:'Wallet', wTitle:'Connect a NEAR wallet', payTitleSend:'Private transfer', payTitleSwap:'Private swap', payTitleReview:'Private lab-results review', payTo:'Recipient', payReceives:'Receives', payYouPay:'You send', payEta:'Time', paySec:'sec', payPriv:'🔒 Confidential through NEAR Intents: the chain shows your deposit and the payout, but they cannot be linked to each other. Your keys and money stay with you — your wallet signs.', payConnect:'Connect wallet', payConfirm:'Confirm in wallet', payCancel:'Cancel', payQuoting:'Getting terms from NEAR Intents…', payWallet:'Confirm in your wallet…', payProcessing:'Payment in progress…', payDone:'✅ Done: the recipient got the money.', payDoneSay:'Done! The payment went through privately.', payRefunded:'↩️ The payment did not go through; your money is being refunded.', payFailed:'❌ It failed. Nothing was taken, or it will be refunded.', payErr:'Could not prepare the payment: ', payOff:'Payments are switched off on this server.', payCheckSay:'Check the card and confirm in your wallet.', payLink:'Transaction', reviewAsk:'A review of your own results costs 1 USDC, paid privately. The samples are free.', payPaidSay:'Payment received, reviewing the document.', lbDoc:'Document', lbKbd:'Type', lbHush:'Mute', dropT:'Drop the file — the knight will review it', docAria:'Upload a document', dTitle:'Document', dSub:'The knight privately reviews lab results, a statement, receipts or a contract — a photo is fine. The file goes only into the enclave and is never stored.', dUpload:'📁 Upload your file', dUploadS:'Photo or screenshot (JPG, PNG, WebP), PDF, TXT, CSV', dSamples:'Or a fictional sample (for testing):', dClose:'Close',
      imgErr:'Could not open the image. Try JPG or PNG.', docPh:'Ask about the document — or just tap “Ask”', docReady:'Document attached. Type or say your question, or just tap “Ask”.', docAsk:'Review this document: what matters most and what looks unusual or suspicious?', docAttached:'Document attached. Let me take a look!', docErr:'Could not read the file.', docBig:'Large file — I will read the first 20 thousand characters.',
      transcribing:'Transcribing (Whisper in TEE)…', noteWhisper:'Speech is transcribed by Whisper inside a NEAR AI enclave, answers come from a model in a TEE. This server stores nothing. Tap “TEE ✓” on top for the proof.',
      speech:'en-US'
    }
  };
  let lang = (navigator.language||'ru').toLowerCase().startsWith('ru') ? 'ru' : 'en';
  try { const s = localStorage.getItem('knight-lang'); if (s) lang = s; } catch(e){}
  // Embedded on a business website: ?embed=1&biz=clinic&lang=en (see widget.js and public/biz/*.json)
  const QS=new URLSearchParams(location.search), BIZ=(QS.get('biz')||'').replace(/[^a-z0-9_-]/gi,''), EMBED=QS.get('embed')==='1';
  if(QS.get('lang')==='ru'||QS.get('lang')==='en') lang=QS.get('lang');
  if(EMBED) document.documentElement.classList.add('embed');
  const t = k => T[lang][k];

  // ---------------- Элементы ----------------
  const $ = id => document.getElementById(id);
  const charEl=$('char'), bubble=$('bubble'), statusEl=$('status'), stage=$('stage'), glow=$('glow');
  // With WebGL2 the 3D knight loads; hide the old still pictures from the very first frame (no flash)
  if(window.__use3d) stage.classList.add('k3d');
  const startBtn=$('start'), row=$('row'), mic=$('mic'), kbd=$('kbd'), hush=$('hush'), form=$('form'), q=$('q');
  const frames={}; charEl.querySelectorAll('img').forEach(i=>frames[i.dataset.f]=i);
  let current='idle';
  let K3D=null;
  function show(f){
    if(K3D){ if(f==='wave') K3D.mode('wave'); else if(f==='laugh') K3D.emote('laugh'); else K3D.mode(mode); }
    if(VID.on){ VID.want(f==='idle'||f==='blink'?baseClip():'talk'); }
    if(f===current) return; frames[current].classList.remove('show'); frames[f].classList.add('show'); current=f; }

  // The old video knight was replaced by the 3D knight (knight3d.js); without WebGL2 the still pictures stay.
  const VID={on:false,state:'idle',want(){}};

  // ---------------- Состояния персонажа ----------------
  let mode='idle'; // idle | wave | listen | think | talk
  function baseClip(){ return (mode==='listen'||mode==='think')?'listen':'idle'; }
  function setMode(m){
    mode=m; if(K3D) K3D.mode(m);
    charEl.className='char'+(m==='idle'?'':' '+m);
    if(VID.on && m!=='talk') VID.want(baseClip()); // «говорит» включает только настоящая речь
    stage.classList.toggle('listening', m==='listen'); glow.style.opacity = m==='listen'?1:0;
    if(m==='idle'||m==='listen'||m==='think') show('idle');
    if(m==='wave') show('wave');
  }
  // Моргание
  (function blinkLoop(){
    setTimeout(()=>{
      if((mode==='idle'||mode==='listen'||mode==='think') && current==='idle'){
        show('blink'); setTimeout(()=>{ if(current==='blink') show('idle'); }, 130);
        if(Math.random()<.2) setTimeout(()=>{ if(current==='idle'){ show('blink'); setTimeout(()=>current==='blink'&&show('idle'),110);} },300);
      }
      blinkLoop();
    }, 2200+Math.random()*3800);
  })();

  // Движение рта во время речи
  let mouthTimer=null, kick=0;
  function mouthStart(){
    mouthStop();
    const seq=()=>{
      const r=Math.random();
      let f = kick>0 ? 'talk2' : (r<.38?'talk2':r<.78?'talk1':'idle');
      kick=Math.max(0,kick-1);
      show(f);
      mouthTimer=setTimeout(seq, 80+Math.random()*90);
    };
    seq();
  }
  function mouthStop(){ clearTimeout(mouthTimer); mouthTimer=null; if(mode==='talk'||current.startsWith('talk')) show('idle'); }

  // ---------------- Пузырь ----------------
  function say(text, opts={}){
    bubble.classList.toggle('user', !!opts.user);
    if(opts.dots) bubble.innerHTML='<span class="dots"><span></span><span></span><span></span></span>';
    else bubble.textContent=text;
    bubble.classList.add('show'); fadeLong();
  }
  // fade the bottom edge only while there is more text below
  function fadeLong(){ requestAnimationFrame(()=>bubble.classList.toggle('long', bubble.scrollHeight-bubble.scrollTop-bubble.clientHeight>4)); }
  bubble.addEventListener('scroll',fadeLong,{passive:true});
  const hideBubble=()=>bubble.classList.remove('show');
  const setStatus=s=>statusEl.textContent=s||'';

  // ---------------- Озвучка ----------------
  // 1) голос браузера (бесплатно); 2) если браузер не умеет (Telegram, приложения) — голос с сервера;
  // 3) если и сервера нет — рыцарь «говорит» текстом в пузыре.
  let serverTTS={ru:false,en:false}, audioCtx=null, curSource=null;
  function unlockAudio(){
    try{
      if(!audioCtx){ const AC=window.AudioContext||window.webkitAudioContext; if(AC) audioCtx=new AC(); }
      if(audioCtx && audioCtx.state==='suspended') audioCtx.resume();
      if(audioCtx){ const b=audioCtx.createBuffer(1,1,22050), s=audioCtx.createBufferSource(); s.buffer=b; s.connect(audioCtx.destination); s.start(0); }
    }catch(e){}
  }
  document.addEventListener('pointerdown',unlockAudio,{passive:true});
  async function fetchAudio(text){
    const r=await fetch('api/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,lang})});
    if(!r.ok) throw new Error('tts '+r.status);
    const buf=await r.arrayBuffer();
    return await new Promise((res,rej)=>audioCtx.decodeAudioData(buf,res,rej));
  }
  // Проигрывает звук и двигает ртом в такт громкости
  function playBuffer(buffer,id){
    return new Promise(resolve=>{
      const src=audioCtx.createBufferSource(); src.buffer=buffer;
      src.playbackRate.value=1.0; // естественный голос, без ускорения
      const an=audioCtx.createAnalyser(); an.fftSize=512; const data=new Uint8Array(an.fftSize);
      src.connect(an); an.connect(audioCtx.destination);
      curSource=src; let raf=0, last=0;
      const loop=(ts)=>{
        if(ts-last>60){ last=ts;
          an.getByteTimeDomainData(data); let sum=0; for(const v of data){ const x=(v-128)/128; sum+=x*x; }
          const rms=Math.sqrt(sum/data.length);
          show(rms>0.11?'talk2':rms>0.035?'talk1':'idle');
        }
        raf=requestAnimationFrame(loop);
      };
      raf=requestAnimationFrame(loop);
      src.onended=()=>{ cancelAnimationFrame(raf); if(curSource===src) curSource=null; show('idle'); resolve(); };
      src.start(0);
    });
  }
  async function speakServer(src,id,waveFirst){
    const chunks=src.chunks;
    if(!await hasNext(src,0,id)) return true;
    let next=fetchAudio(chunks[0]);
    for(let i=0;;i++){
      let buf; try{ buf=await next; }catch(e){ return false; }
      if(id!==speakId) return true;
      const more=await Promise.race([hasNext(src,i+1,id), new Promise(r=>setTimeout(()=>r(null),0))]);
      if(more) next=fetchAudio(chunks[i+1]); // заранее готовим следующую фразу
      else next=null;
      scrollBubble(chunks,i);
      if(waveFirst && i===0){ charEl.className='char wave'; show('wave'); await playBufferStill(buf); }
      else { charEl.className='char talk'; await playBuffer(buf,id); }
      if(id!==speakId) return true;
      if(!next){ if(!await hasNext(src,i+1,id)) return true; next=fetchAudio(chunks[i+1]); }
    }
  }
  function playBufferStill(buffer){ // для приветствия: машет рукой, рот не трогаем
    return new Promise(resolve=>{ const s=audioCtx.createBufferSource(); s.buffer=buffer; s.playbackRate.value=1.0; s.connect(audioCtx.destination); curSource=s; s.onended=()=>{ if(curSource===s) curSource=null; resolve(); }; s.start(0); });
  }
  function speakSilent(src,id,waveFirst){ // звука нет совсем — анимируем по длине текста
    const chunks=src.chunks;
    return new Promise(resolve=>{
      let i=0;
      const step=async()=>{
        if(!await hasNext(src,i,id)) return resolve();
        scrollBubble(chunks,i); const c=chunks[i], wave=waveFirst&&i===0; i++;
        if(wave){ charEl.className='char wave'; show('wave'); } else { charEl.className='char talk'; mouthStart(); }
        silentTalk=true;
        setTimeout(()=>{ silentTalk=false; mouthStop(); setTimeout(step,150); }, Math.min(9000,500+c.length*60));
      };
      step();
    });
  }

  const synth = window.speechSynthesis;
  let voices=[];
  function loadVoices(){ voices = synth ? synth.getVoices() : []; }
  if(synth){ loadVoices(); synth.onvoiceschanged=loadVoices; }
  // PRIVACY: only voices that run on this device. Cloud voices (e.g. "Google …" in Chrome, localService=false)
  // would send the answer text to the browser vendor, so they are never used.
  function pickVoice(){
    const code=t('speech'), base=code.slice(0,2);
    const list=voices.filter(v=>v.lang && v.lang.replace('_','-').toLowerCase().startsWith(base) && v.localService!==false);
    const pref=['milena','yuri','irina','pavel','microsoft','samantha','daniel','alex'];
    for(const p of pref){ const v=list.find(v=>v.name.toLowerCase().includes(p)); if(v) return v; }
    return list[0]||null;
  }
  function splitText(text){
    const parts=text.replace(/\s+/g,' ').match(/[^.!?…]+[.!?…]*\s*/g)||[text];
    const out=[]; let buf='';
    for(const p of parts){ if((buf+p).length>170 && buf){ out.push(buf.trim()); buf=p; } else buf+=p; }
    if(buf.trim()) out.push(buf.trim());
    return out;
  }
  let speakId=0;
  // Источник фраз: для готового текста — сразу все, для потокового ответа — пополняется на лету
  function makeSource(chunks=[],done=false){
    const src={chunks,done,w:[],
      push(c){ if(c&&c.trim()){ src.chunks.push(c.trim()); src.wake(); } },
      end(){ src.done=true; src.wake(); },
      wake(){ const w=src.w; src.w=[]; w.forEach(f=>f()); },
      next(){ return new Promise(r=>src.w.push(r)); }};
    return src;
  }
  // Ждём следующую фразу: true — есть, false — ответ закончился
  async function hasNext(src,i,id){ while(i>=src.chunks.length && !src.done && id===speakId) await src.next(); return id===speakId && i<src.chunks.length; }
  const waitVoices=()=>new Promise(r=>{ if(!synth||voices.length) return r(); let n=0; const iv=setInterval(()=>{ loadVoices(); if(voices.length||++n>8){ clearInterval(iv); r(); } },100); });
  function scrollBubble(chunks,i){ const before=chunks.slice(0,i).join(' ').length, total=chunks.join(' ').length||1; bubble.scrollTop=(before/total)*(bubble.scrollHeight-bubble.clientHeight); }
  async function speak(text, {after='idle', face=null, intro=null, id:givenId=null}={}){
    const id=givenId||++speakId;
    if(synth) synth.cancel(); if(curSource){ try{curSource.stop();}catch(e){} curSource=null; }
    let src;
    if(typeof text==='string'){
      say(intro ? intro+' '+text : text);
      src=makeSource((intro?[intro]:[]).concat(splitText(text)),true);
    } else { src=text; say(src.fullText||''); }
    bubble.scrollTop=0;
    setMode('talk'); setStatus(t('speaking'));
    await waitVoices();
    if(id!==speakId) return;
    // One voice on every device: the server voice (Piper) comes first, the browser voice is only a fallback
    let ok=false;
    if(serverTTS[lang] && audioCtx){ ok=await speakServer(src,id,!!intro); }
    if(!ok && id===speakId){
      const voice=synth?pickVoice():null;
      if(voice) await speakBrowser(src,id,!!intro,voice);
      else { voiceless=true; setStatus(t('noVoice')); await speakSilent(src,id,!!intro); }
    }
    if(id!==speakId) return;
    mouthStop(); setMode(after);
    if(face){ show(face); setTimeout(()=>current===face&&show('idle'),900); }
    setStatus(voiceless?t('noVoice'):t('ready'));
  }
  let voiceless=false;
  function speakBrowser(src,id,waveFirst,voice){
    const chunks=src.chunks;
    return new Promise(resolve=>{
      let i=0, watchdog=null;
      const next=async()=>{
        clearTimeout(watchdog);
        if(!await hasNext(src,i,id)) return resolve();
        const waving = waveFirst && i===0; // первая фраза приветствия — машет рукой
        scrollBubble(chunks,i);
        const u=new SpeechSynthesisUtterance(chunks[i++]);
        u.lang=t('speech'); u.voice=voice;
        u.pitch=1.0; u.rate=1.0; u.volume=1;
        if(waving){ charEl.className='char wave'; show('wave'); } else charEl.className='char talk';
        let started=false;
        u.onstart=()=>{ started=true; uttActive=true; if(id===speakId && !waving) mouthStart(); };
        u.onboundary=()=>{ kick=1; };
        u.onend=()=>{ uttActive=false; if(id!==speakId) return resolve(); mouthStop(); setTimeout(next,120); };
        u.onerror=()=>{ uttActive=false; if(id!==speakId) return resolve(); mouthStop(); next(); };
        synth.speak(u);
        // страховка: если браузер так и не начал говорить — анимируем по длине текста
        watchdog=setTimeout(()=>{ if(id===speakId && !started && !synth.speaking){ if(!waving) mouthStart(); setTimeout(()=>{ if(id===speakId){ mouthStop(); next(); } }, Math.min(8000,500+u.text.length*55)); } }, 1500);
      };
      next();
    });
  }
  function stopSpeaking(){ speakId++; uttActive=false; silentTalk=false; if(synth) synth.cancel(); if(curSource){ try{curSource.stop();}catch(e){} curSource=null; } mouthStop(); if(mode==='talk') setMode('idle'); }
  // Рот в живой анимации двигается ровно пока звучит речь: замолчал — закрыл, продолжил — открыл
  let uttActive=false, silentTalk=false;
  setInterval(()=>{
    const talking = uttActive || !!curSource || silentTalk;
    if(K3D) K3D.talking(talking);
    if(!VID.on) return;
    if(talking) VID.want('talk');
    else if(VID.state==='talk') VID.want(baseClip());
  },80);

  // ---------------- Общение с сервером ----------------
  let demo=false;
  const history=[];
  async function ask(question){
    question=question.trim(); if(!question) return;
    if(typeof pendingAsk!=='undefined' && pendingAsk){ pendingAsk=null; q.placeholder=t('placeholder'); }
    stopSpeaking();
    say(question,{user:true}); setMode('think'); setStatus(t('thinking')); hideProof();
    const myAsk=++askId;
    const dotsTimer=setTimeout(()=>{ if(myAsk===askId && mode==='think') say('',{dots:true}); },400);
    history.push({role:'user',content:question});
    let answer=null;
    if(!demo){
      try{
        const r=await fetch('api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:history.slice(-6),stream:true,document:attachedDoc||undefined,profile:BIZ||undefined,paidDeposit:(attachedDoc&&paidFor[attachedDoc.name])||undefined})});
        if(r.status===402 && PROFILE && PROFILE.paidReview){ clearTimeout(dotsTimer); history.pop(); const q2=question; setMode('idle'); say(t('reviewAsk')); openPay({review:true, then:dep=>{ paidFor[attachedDoc.name]=dep; ask(q2); }}); return; }
        if(r.status===404||r.status===405) throw new Error('no-server');
        if(myAsk!==askId) return;
        if(r.ok && (r.headers.get('content-type')||'').includes('text/plain') && r.body){
          // Потоковый ответ: начинаем говорить, как только пришла первая фраза
          answer=await streamAnswer(r,myAsk);
          clearTimeout(dotsTimer);
        } else {
          const data=await r.json().catch(()=>({}));
          if(r.status===429) answer = data.error==='daily_limit'?t('limitDay'):t('limitUser');
          else if(!r.ok){ answer=t('error')+' (HTTP '+r.status+(data.error?' · '+data.error:'')+')'; }
          else answer=data.answer;
        }
      }catch(e){ if(e&&e.message==='no-server') enableDemo(); else if(answer==null) answer=t('error'); }
    }
    clearTimeout(dotsTimer);
    if(myAsk!==askId) return;
    if(demo) { await new Promise(r=>setTimeout(r,300)); answer=demoAnswer(question); }
    if(typeof answer==='object' && answer){ // уже озвучивается потоком
      history.push({role:'assistant',content:answer.text});
      if(history.length>12) history.splice(0,history.length-12);
      await answer.done; return;
    }
    history.push({role:'assistant',content:answer});
    if(history.length>12) history.splice(0,history.length-12);
    await speak(answer);
  }
  let askId=0;
  async function streamAnswer(r,myAsk){
    const reader=r.body.getReader(), dec=new TextDecoder();
    const src=makeSource(); src.fullText='';
    let pending='', full='', speaking=null, id=null, searching=false, proofBuf=null, payBuf=null;
    const flush=(final)=>{
      // Режем на фразы: первая — как можно раньше (после первого знака препинания), дальше — по предложениям
      while(true){
        const minLen=src.chunks.length?40:8;
        const m=pending.slice(minLen).search(/[.!?…](\s|$)/);
        if(m<0) break;
        const cut=minLen+m+1; src.push(pending.slice(0,cut)); pending=pending.slice(cut);
      }
      if(!final && pending.length>220){ const c=pending.lastIndexOf(',',200); if(c>40){ src.push(pending.slice(0,c+1)); pending=pending.slice(c+1); } }
      if(final){ src.push(pending); pending=''; }
      if(src.chunks.length && !speaking && myAsk===askId){ id=++speakId; speaking=speak(src,{id}); }
    };
    while(true){
      const {value,done}=await reader.read();
      if(myAsk!==askId){ try{reader.cancel();}catch(e){} break; }
      if(done) break;
      let piece=dec.decode(value,{stream:true});
      if(proofBuf!==null){ proofBuf+=piece; continue; }
      // \u0003…\u0003 = a payment the assistant prepared (shown as a card, never sent without the wallet)
      while(true){
        if(payBuf!==null){ const e=piece.indexOf('\u0003'); if(e<0){ payBuf+=piece; piece=''; break; } payBuf+=piece.slice(0,e); piece=piece.slice(e+1); try{ const p=JSON.parse(payBuf); setTimeout(()=>openPay({proposal:p}),0); }catch(e){} payBuf=null; continue; }
        const s0=piece.indexOf('\u0003'); if(s0<0) break; const before=piece.slice(0,s0); payBuf=''; const rest=piece.slice(s0+1);
        piece=rest; if(before){ full+=before; pending+=before; } 
      }
      const pm=piece.indexOf('\u0002');   // after this mark the server sends the signature check of the answer
      if(pm>=0){ proofBuf=piece.slice(pm+1); piece=piece.slice(0,pm); }
      if(piece.includes('\u0007')){ // рыцарь пошёл искать информацию
        piece=piece.split('\u0007').join('');
        if(!searching){ searching=true;
          if(!src.chunks.length && !pending.trim()){ const f=t('searchFiller'); full+=f+' '; src.push(f); }
          else { src.push(pending); pending=''; }
          flush(false); setStatus(t('searching'));
        }
      }
      full+=piece; pending+=piece; src.fullText=full;
      if(speaking && id===speakId){ bubble.textContent=full; fadeLong(); }
      flush(false);
    }
    flush(true); src.end();
    if(speaking && id===speakId) { bubble.textContent=full; fadeLong(); }
    if(proofBuf){ try{ showProof(JSON.parse(proofBuf)); }catch(e){} }
    if(!speaking){ return full.trim()||t('error'); }
    return {text:full.trim(), done:speaking};
  }
  function enableDemo(){ demo=true; $('demo').classList.add('show'); $('note').textContent=t('demoNote'); }

  // Заготовленные ответы для демо-режима (когда нет сервера)
  function demoAnswer(qs){
    const s=qs.toLowerCase(), ru=lang==='ru';
    const has=(...w)=>w.some(x=>s.includes(x));
    if(has('tee','ти и','анклав','enclave','сейф')) return ru?'TEE — это как запечатанный сейф внутри процессора и видеокарты. Даже владелец сервера не может заглянуть внутрь, а железо выдаёт подписанное доказательство, что всё честно. Клянусь своим щитом!':'A TEE is like a sealed safe inside the processor and GPU. Even the server owner cannot look inside, and the hardware signs a proof that everything is legit. On my shield!';
    if(has('приват','privacy','private','данн','видит','sees')) return ru?'В NEAR AI Cloud нейросеть работает внутри защищённой среды TEE: вопросы расшифровываются только внутри неё, и их не видит никто, даже сама NEAR. А проверить это может любой — по криптографической аттестации.':'In NEAR AI Cloud the model runs inside a TEE: your questions are decrypted only inside it, and nobody, not even NEAR, can see them. Anyone can verify this with cryptographic attestation.';
    if(has('intent','интент')) return ru?'NEAR Intents — это когда ты говоришь, что хочешь получить, например обменять биткоин на доллары, а исполнители соревнуются, кто сделает это выгоднее. Работает с десятками блокчейнов.':'With NEAR Intents you say what you want, like swapping bitcoin for dollars, and solvers compete to do it best. It works across dozens of chains.';
    if(has('signature','подпис')) return ru?'Chain Signatures позволяют аккаунту NEAR подписывать транзакции в других сетях: Bitcoin, Ethereum, Solana и не только. Ключ разделён между многими узлами, и ни у одного нет его целиком.':'Chain Signatures let a NEAR account sign transactions on other chains like Bitcoin, Ethereum and Solana. The key is split across many nodes, and no single node holds it.';
    if(has('near','нир','блокчейн','blockchain')) return ru?'NEAR — быстрый блокчейн с шардингом: блоки примерно каждые 0,6 секунды, а финальность около секунды. Адреса там человеческие, вроде alice.near, а комиссии — доли цента.':'NEAR is a fast sharded blockchain: blocks every 0.6 seconds and finality in about a second. Addresses are human-readable like alice.near, and fees are fractions of a cent.';
    if(has('кто ты','тебя зовут','who are you','your name')) return ru?'Я Сэр Ниар, рыцарь NEAR! Охраняю приватность и рассказываю про технологии NEAR простыми словами.':"I'm Sir Near, the NEAR knight! I guard privacy and explain NEAR tech in plain words.";
    if(has('привет','здравств','hello','hi ','hey')) return ru?'И тебе привет, путник! Спроси меня про NEAR, приватность или TEE.':'Hello to you too, traveler! Ask me about NEAR, privacy or TEEs.';
    return ru?'Это демо-версия, тут у меня только заготовки. На настоящем сайте я отвечу на любой вопрос с помощью нейросети NEAR AI. Попробуй спросить про TEE или приватность!':"This is a demo with pre-written answers. On the real site I answer anything using NEAR AI. Try asking about TEEs or privacy!";
  }

  // ---------------- Распознавание голоса ----------------
  let recognizing=false;



  // ---------------- Proof of each answer + Verified panel ----------------
  let lastRelay=null;
  let lastProof=null, lastAtt=null, chWord='', chBusy=false, chRes=null;
  const proofEl=$('proof');
  function hideProof(){ proofEl.classList.add('hidden'); }
  function showProof(p){
    lastProof=p;
    proofEl.textContent=p.ok?t('proofOk'):t('proofFail');
    proofEl.classList.toggle('fail',!p.ok); proofEl.classList.remove('hidden');
  }
  proofEl.addEventListener('click',()=>openVerified());
  const esc=x=>String(x??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const ckList=list=>list.map(c=>`<div class="ck"><span class="i">${c.ok?'✅':(c.critical===false?'ℹ️':'❌')}</span><div>${esc(c.label)}${c.critical===false?` <small style="display:inline">(${t('vInfo')})</small>`:''}<small>${esc(c.detail)}</small></div></div>`).join('');
  function setVBtn(a){
    const b=$('vbtn'); b.classList.remove('wait','ok','fail');
    if(!a){ b.classList.add('wait'); $('vtext').textContent=t('vWait'); return; }
    b.classList.add(a.ok?'ok':'fail'); $('vtext').textContent=a.ok?t('vOk'):t('vFail');
  }
  function renderVerified(){
    const a=lastAtt;
    let h=`<h2>${t('vTitle')}</h2>`;
    if(!a){ h+=`<div class="sub">${t('vWait')}</div>`; }
    else{
      h+=`<div class="big">${a.ok?t('vOkBig'):t('vFailBig')}</div><div class="sub">${t('vIntro')}</div>`;
      h+=`<div class="sub" style="margin-top:8px">${t('vModel')}: <b>${esc(a.model)}</b><br>${t('vTime')}: ${a.checkedAt?new Date(a.checkedAt).toLocaleString():'—'}${a.nonce?`<br>${t('vNonce')}: ${esc(a.nonce)}`:''}${a.error?`<br>❗ ${esc(a.error)}`:''}${a.throttled?`<br>⏳ ${t('vThrottled')}`:''}</div>`;
      (a.models||[]).forEach((m,i)=>{ h+=`<h3>${t('vGpuModel')}${a.models.length>1?' #'+(i+1):''}</h3><div class="sub">${t('vSigner')}: ${esc(m.signing_address)}</div>${ckList(m.checks)}`; });
      if(a.gateway){ h+=`<h3>${t('vGateway')}</h3><div class="sub">${t('vSigner')}: ${esc(a.gateway.signing_address)}</div>${ckList(a.gateway.checks)}`; }
    }
    h+=relayHtml(lastRelay);
    if(lastProof){ h+=`<h3>${t('vAnswer')}</h3>${ckList(lastProof.checks||[])}`;
      const ev=lastProof.evidence; if(ev) h+=`<div class="sub" style="font-family:ui-monospace,monospace;font-size:11px;margin-top:6px">chat_id: ${esc(ev.chat_id)}<br>signed_text: ${esc(ev.signed_text)}<br>signature: ${esc(ev.signature)}<br>signing_address: ${esc(ev.signing_address)}</div>`; }
    h+=`<h3>${t('vCh')}</h3><div class="sub">${t('vChText')}</div><div class="btns"><input id="vChIn" maxlength="64" placeholder="${t('vChPh')}" value="${esc(chWord)}" style="flex:2;min-width:0;border-radius:14px;padding:12px;border:1px solid #3a4f8f;background:#0d1733;color:#fff;font-size:16px"><button class="primary" id="vChGo" ${chBusy?'disabled':''}>${t('vChBtn')}</button></div><div id="vChOut">${chHtml()}</div>`;
    if(a&&a.nonce){ h+=`<h3>${t('vSelf')}</h3><div class="sub">${t('vSelfText')}</div><div class="btns"><a href="api/attestation/raw" download style="flex:1;text-align:center;text-decoration:none;border-radius:14px;padding:12px;font-weight:800;background:#1d356f;color:#fff">⬇️ ${t('vRaw')}</a></div>`; }
    h+=`<div class="sub" style="margin-top:14px">${t('vNoStore')}</div>`;
    h+=`<div class="btns"><button id="vAgain">${t('vAgain')}</button><button class="primary" id="vClose">${t('vClose')}</button></div>`;
    $('vsheet').innerHTML=h;
    $('vClose').onclick=()=>$('vmodal').classList.add('hidden');
    $('vAgain').onclick=()=>loadAttestation(true);
    $('vChGo').onclick=runChallenge; const dl=$('vChDl'); if(dl) dl.onclick=downloadCh;
    $('vChIn').addEventListener('keydown',e=>{ if(e.key==='Enter') runChallenge(); });
  }
  function relayHtml(r){
    if(!r) return '';
    let h=`<h3>${t('vRelay')}</h3>`;
    if(!r.inTee) return h+`<div class="sub">${t('vRelayNo')}</div>`;
    h+=`<div class="sub">${t('vRelayIntro')}</div>`+ckList(r.checks||[]);
    if(r.error) h+=`<div class="sub">❗ ${esc(r.error)}</div>`;
    const links=[]; if(r.trustCenter) links.push(`<a href="${esc(r.trustCenter)}" target="_blank" rel="noopener" style="flex:1;text-align:center;text-decoration:none;border-radius:14px;padding:12px;font-weight:800;background:#1d356f;color:#fff">🛡️ ${t('vRelayTC')}</a>`);
    links.push(`<a href="api/attestation/self?raw=1" download style="flex:1;text-align:center;text-decoration:none;border-radius:14px;padding:12px;font-weight:800;background:#1d356f;color:#fff">⬇️ ${t('vRelayRaw')}</a>`);
    return h+`<div class="btns">${links.join('')}</div>`;
  }
  function chHtml(){
    if(chBusy) return `<div class="sub">⏳ ${t('vChWait')}</div>`;
    if(!chRes) return '';
    if(chRes.error) return `<div class="sub">❗ ${t('vChErr')}</div>`;
    const c=chRes.challenge, m=(chRes.models||[])[0];
    let h=`<div class="big" style="font-size:16px;margin-top:8px">${c.found?t('vChOk'):t('vChBad')}</div>`;
    h+=`<div class="sub" style="font-family:ui-monospace,monospace;font-size:11px;margin-top:6px">${t('vChWord')}: ${esc(c.word)}<br>${t('vChHash')}: ${esc(c.nonce)}<br>${t('vTime')}: ${new Date(chRes.checkedAt).toLocaleString()}</div>`;
    if(m) h+=ckList(m.checks);
    if(chRes.relay&&chRes.relay.inTee) h+=`<h3>${t('vRelay')}</h3>`+ckList(chRes.relay.checks||[]);
    if(chRes.rawReport) h+=`<div class="btns"><button id="vChDl">⬇️ ${t('vChRaw')}</button></div>`;
    return h;
  }
  async function runChallenge(){
    const w=($('vChIn').value||'').trim(); if(!w||chBusy) return;
    chWord=w; chBusy=true; chRes=null; renderVerified();
    try{ const r=await fetch('api/attestation/challenge?word='+encodeURIComponent(w)); chRes=r.ok?await r.json():{error:true}; }catch(e){ chRes={error:true}; }
    chBusy=false; renderVerified();
  }
  function downloadCh(){ {
      const blob=new Blob([JSON.stringify({model:chRes.model,word:chRes.challenge.word,nonce:chRes.challenge.nonce,checkedAt:chRes.checkedAt,signing_algo:'ecdsa',report:chRes.rawReport},null,2)],{type:'application/json'});
      const u=URL.createObjectURL(blob), a=document.createElement('a'); a.href=u; a.download='near-ai-attestation-'+chRes.challenge.nonce.slice(0,8)+'.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(u),5000);
    }
  }
  function openVerified(){ renderVerified(); $('vmodal').classList.remove('hidden'); }
  $('vbtn').addEventListener('click',openVerified);
  $('vmodal').addEventListener('click',e=>{ if(e.target.id==='vmodal') $('vmodal').classList.add('hidden'); });
  async function loadAttestation(fresh){
    if(demo) return;
    setVBtn(null); if(!$('vmodal').classList.contains('hidden')) renderVerified();
    try{ const r=await fetch('api/attestation'+(fresh?'?fresh=1':'')); const a=await r.json(); if(a&&('ok' in a)) lastAtt=a; }catch(e){}
    try{ lastRelay=await (await fetch('api/attestation/self'+(fresh?'?fresh=1':''))).json(); }catch(e){}
    setVBtn(lastAtt||{ok:false}); if(!$('vmodal').classList.contains('hidden')) renderVerified();
  }

  // ---------------- Documents (read in the browser, sent only with the question) ----------------
  let attachedDoc=null;
  function setDoc(name,text,image){
    if(text && text.length>20000){ text=text.slice(0,20000); }
    attachedDoc=image?{name,image}:{name,text}; $('docicon').textContent=image?'🖼':'📄'; $('docname').textContent=name; $('docchip').classList.remove('hidden');
  }
  // Photos: shrunk in the browser (max side 1344 px, ≤ ~700 KB JPEG), then sent to the model in the TEE as an image
  async function imageData(file){
    const url=URL.createObjectURL(file);
    try{
      const img=await new Promise((ok,bad)=>{ const i=new Image(); i.onload=()=>ok(i); i.onerror=bad; i.src=url; });
      let side=1280, q=.82, out='';
      for(let n=0;n<6;n++){
        const k=Math.min(1,side/Math.max(img.naturalWidth,img.naturalHeight));
        const c=document.createElement('canvas'); c.width=Math.round(img.naturalWidth*k); c.height=Math.round(img.naturalHeight*k);
        const g=c.getContext('2d'); g.fillStyle='#fff'; g.fillRect(0,0,c.width,c.height); g.drawImage(img,0,0,c.width,c.height);
        out=c.toDataURL('image/jpeg',q); if(out.length<700000) return out;
        q-=.1; if(q<.6){ q=.8; side=Math.round(side*.8); }
      }
      return out.length<1350000?out:null;
    } finally { URL.revokeObjectURL(url); }
  }
  const isImage=f=>/^image\//.test(f.type)||/\.(jpe?g|png|webp|gif|heic|heif)$/i.test(f.name);
  async function handleFile(f){
    try{
      if(isImage(f)){ const d=await imageData(f); if(!d) throw 0; return attachAndAsk(f.name,null,'',d); }
      const text=/pdf$/i.test(f.name)||f.type==='application/pdf'?await pdfText(f):await f.text(); if(!text.trim()) throw 0; attachAndAsk(f.name,text);
    }catch(err){ closeDocs(); speak(t(isImage(f)?'imgErr':'docErr')); }
  }
  $('docx').addEventListener('click',()=>{ attachedDoc=null; pendingAsk=null; q.placeholder=t('placeholder'); $('docchip').classList.add('hidden'); });
  function openDocs(){
    $('dTitle').textContent=t('dTitle'); $('dSub').textContent=t('dSub'); $('dUploadT').textContent=t('dUpload'); $('dUploadS').textContent=t('dUploadS');
    $('dSamplesT').textContent=t('dSamples'); $('dClose').textContent=t('dClose'); $('dmodal').classList.remove('hidden');
  }
  const closeDocs=()=>$('dmodal').classList.add('hidden');
  $('docbtn').addEventListener('click',openDocs);
  $('dClose').addEventListener('click',closeDocs);
  $('dmodal').addEventListener('click',e=>{ if(e.target.id==='dmodal') closeDocs(); });
  $('dUpload').addEventListener('click',()=>$('dFile').click());
  // pdf.js is served from this site (public/vendor/pdfjs, Apache-2.0) — no third-party CDN sees the page or the file
  let pdfjsLib=null;
  async function pdfText(file){
    if(!pdfjsLib){
      pdfjsLib=await import(new URL('vendor/pdfjs/pdf.min.mjs',APP_SRC).href);
      pdfjsLib.GlobalWorkerOptions.workerSrc=new URL('vendor/pdfjs/pdf.worker.min.mjs',APP_SRC).href;
    }
    const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise; let out='';
    for(let i=1;i<=Math.min(pdf.numPages,30);i++){ const pg=await pdf.getPage(i); const tc=await pg.getTextContent(); out+=tc.items.map(x=>x.str).join(' ')+'\n'; if(out.length>20000) break; }
    return out;
  }
  // Attach first, then let the visitor add their own question (typed or spoken) — or send right away with the default one
  let pendingAsk=null;
  async function attachAndAsk(name,text,question,image){
    closeDocs(); if(!started) begin();
    setDoc(name,text,image);
    pendingAsk=question||t('docAsk');
    stopSpeaking(); showText(true); q.placeholder=t('docPh'); setStatus(t('docReady'));
  }
  $('dFile').addEventListener('change',async e=>{
    const f=e.target.files[0]; e.target.value=''; if(!f) return; handleFile(f);
  });
  // Drag a file anywhere onto the page (desktop)
  let dragN=0; const dropEl=$('drop');
  addEventListener('dragenter',e=>{ if([...(e.dataTransfer&&e.dataTransfer.types||[])].includes('Files')){ dragN++; dropEl.classList.remove('hidden'); } });
  addEventListener('dragleave',()=>{ if(--dragN<=0){ dragN=0; dropEl.classList.add('hidden'); } });
  addEventListener('dragover',e=>e.preventDefault());
  addEventListener('drop',e=>{ e.preventDefault(); dragN=0; dropEl.classList.add('hidden'); const f=e.dataTransfer.files&&e.dataTransfer.files[0]; if(f) handleFile(f); });
  $('dSamples').addEventListener('click',async e=>{ const b=e.target.closest('[data-sample]'); if(!b) return;
    try{ const name=b.dataset.sample; const ask=b.dataset.ask&&b.dataset.ask!=='undefined'?b.dataset.ask:''; const r=await fetch('samples/'+name);
      if(/\.(png|jpe?g|webp)$/i.test(name)){ const d=await imageData(new File([await r.blob()],name,{type:'image/png'})); if(!d) throw 0; return attachAndAsk(name,null,ask,d); }
      attachAndAsk(name,await r.text(),ask); }catch(e){ closeDocs(); speak(t('docErr')); }
  });

  // ---------------- Private payments (NEAR Intents, confidential) — wallet.js is loaded on first use ----------------
  const paidFor={};            // document name → deposit address of the payment that unlocked its review (this tab only)
  let W=null, payCfg=null;
  const loadWallet=async()=>{ if(!W){ W=await import(new URL('wallet.js',APP_SRC).href); W.onChange(a=>showWallet(a)); await W.restore(); } return W; };
  function showWallet(a){ const b=$('wbtn'); if(!b) return; b.classList.toggle('on',!!a); $('wtext').textContent=a?('✓ '+(a.length>18?a.slice(0,8)+'…'+a.slice(-6):a)):t('wConnect'); }
  fetch('api/pay/config',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(c=>{ payCfg=c; return (window.__profileReady||Promise.resolve()).then(()=>{ if(c&&c.enabled&&(!BIZ||(PROFILE&&(PROFILE.paidReview||PROFILE.payments)))){ $('wbtn').classList.remove('hidden'); showWallet(null); } }); }).catch(()=>{});
  $('wbtn').addEventListener('click',async()=>{ try{ const w=await loadWallet(); if(!w.getAccount()) return await w.connect(); if(agentOn()) return openAgent(); await w.disconnect(); }catch(e){} });
  const closePay=()=>$('pmodal').classList.add('hidden');
  $('pmodal').addEventListener('click',e=>{ if(e.target.id==='pmodal') closePay(); });
  const fmtAcct=a=>a&&a.length>28?a.slice(0,12)+'…'+a.slice(-8):a;
  // ctx: {proposal:{action,amount,token,toToken,toChain,to}} from the assistant, or {review:true, then(dep)} for a paid review
  async function openPay(ctx){
    if(!payCfg||!payCfg.enabled){ say(t('payOff')); return; }
    const sh=$('psheet'); $('pmodal').classList.remove('hidden');
    const p=ctx.proposal||{};
    const title=ctx.review?t('payTitleReview'):(p.action==='swap'?t('payTitleSwap'):t('payTitleSend'));
    const render=(inner,btns)=>{ sh.innerHTML=`<h2>${esc(title)}</h2>${inner}<div class="btns">${btns}</div>`; };
    let w; try{ w=await loadWallet(); }catch(e){ render(`<div class="sub">${esc(t('payErr')+e.message)}</div>`,`<button id="pX">${esc(t('payCancel'))}</button>`); $('pX').onclick=closePay; return; }
    const step=async()=>{
      if(!w.getAccount()){
        render(`<div class="pay-priv">${esc(t('payPriv'))}</div>`,`<button id="pX">${esc(t('payCancel'))}</button><button class="primary" id="pC">${esc(t('payConnect'))}</button>`);
        $('pX').onclick=closePay; $('pC').onclick=async()=>{ try{ await w.connect(); }catch(e){} step(); }; return;
      }
      render(`<div class="pay-st">${esc(t('payQuoting'))}</div>`,'');
      let q; try{ q=await w.getQuote(ctx.review?{profile:BIZ,from:w.getAccount()}:{...p,from:w.getAccount()}); }
      catch(e){ render(`<div class="sub">${esc(t('payErr')+e.message)}</div>`,`<button id="pX">${esc(t('payCancel'))}</button>`); $('pX').onclick=closePay; return; }
      const rows=[[t('payTo'),fmtAcct(q.recipient)+(q.dest&&q.dest.chain!=='near'?' ('+q.dest.chain+')':'')],[t('payReceives'),`${q.amountOutFormatted} ${q.dest?q.dest.symbol:''}`],[t('payYouPay'),`${q.amountInFormatted} ${q.origin?q.origin.symbol:''}`],[t('payEta'),`~${q.timeEstimate||20} ${t('paySec')}`]];
      render(rows.map(([k,v])=>`<div class="pay-row"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')+`<div class="pay-priv">${esc(t('payPriv'))}</div><div class="pay-st" id="pSt"></div>`,
        `<button id="pX">${esc(t('payCancel'))}</button>${!ctx.review&&agentOn()?`<button id="pAg">${esc(t('agPay'))}</button>`:''}<button class="primary" id="pOk">${esc(t('payConfirm'))}</button>`);
      if(!ctx.review) speak(t('payCheckSay'));
      $('pX').onclick=closePay;
      if($('pAg')) $('pAg').onclick=async()=>{
        const st=$('pSt'); ['pAg','pOk','pX'].forEach(i=>$(i).disabled=true);
        try{ st.textContent=t('agSession'); await w.agentSession(); st.textContent=t('agPaying'); const r=await w.agentPay(p);
          st.textContent=t('payProcessing'); const fin=await w.waitDone(r.depositAddress,()=>{});
          const link=(fin.destTx&&fin.destTx[0])||(fin.originTx&&fin.originTx[0]);
          if(fin.status==='SUCCESS'){ st.innerHTML=esc(t('payDone'))+(link?` <a href="${esc(link)}" target="_blank" rel="noopener">${esc(t('payLink'))} ↗</a>`:''); speak(t('payDoneSay')); }
          else st.textContent=fin.status==='REFUNDED'?t('payRefunded'):t('payFailed');
        }catch(e){ st.textContent=t('payErr')+(e&&e.message||e); }
        $('pX').disabled=false;
      };
      $('pOk').onclick=async()=>{
        const st=$('pSt'); $('pOk').disabled=true; $('pX').disabled=true; st.textContent=t('payWallet');
        try{ await w.payQuote(q); }catch(e){ st.textContent=t('payErr')+(e&&e.message||e); $('pX').disabled=false; return; }
        st.textContent=t('payProcessing');
        const fin=await w.waitDone(q.depositAddress,s=>{ if(s.status==='PROCESSING'||s.status==='KNOWN_DEPOSIT_TX') st.textContent=t('payProcessing'); });
        const link=(fin.destTx&&fin.destTx[0])||(fin.originTx&&fin.originTx[0]);
        if(fin.status==='SUCCESS'){
          st.innerHTML=esc(t('payDone'))+(link?` <a href="${esc(link)}" target="_blank" rel="noopener">${esc(t('payLink'))} ↗</a>`:'');
          $('pX').disabled=false; $('pX').textContent='OK';
          if(ctx.review){ setTimeout(()=>{ closePay(); say(t('payPaidSay')); ctx.then&&ctx.then(q.depositAddress); },900); }
          else speak(t('payDoneSay'));
        } else { st.textContent=fin.status==='REFUNDED'?t('payRefunded'):t('payFailed'); $('pX').disabled=false; }
      };
    };
    step();
  }

  // ---------------- Full mode: agent wallet (key only inside the server TEE) ----------------
  const agentOn=()=>!BIZ && payCfg && (payCfg.agentWallet==='tee'||payCfg.agentWallet==='dev');
  const fmtUnits=(v,d,dp)=>{ try{ const b=BigInt(v||'0'), s=10n**BigInt(d); const i=b/s, f=(b%s).toString().padStart(d,'0').slice(0,dp); return i+'.'+f; }catch(e){ return '0'; } };
  async function openAgent(){
    const sh=$('psheet'); $('pmodal').classList.remove('hidden');
    const w=await loadWallet();
    const draw=async(msg)=>{
      let i; try{ i=await w.agentInfo(); }catch(e){ sh.innerHTML=`<h2>${esc(t('agTitle'))}</h2><div class="sub">${esc(t('agOff'))}</div><div class="btns"><button id="aX">OK</button></div>`; $('aX').onclick=closePay; return; }
      const L=i.limits||{};
      sh.innerHTML=`<h2>${esc(t('agTitle'))}</h2><div class="sub" style="word-break:normal">${esc(t('agWhat'))}</div>${i.mode==='dev'?`<div class="pay-priv" style="color:#fcd57a;background:rgba(251,191,36,.12)">${esc(t('agDev'))}</div>`:''}
        <div class="pay-row"><span>${esc(t('agAccount'))}</span><b>${esc(fmtAcct(i.account))}</b></div>
        <div class="pay-row"><span>${esc(t('agBal'))}</span><b>${esc(fmtUnits(i.balances.USDC,6,2))} USDC · ${esc(fmtUnits(i.balances.NEAR,24,3))} NEAR</b></div>
        <div class="pay-row"><span>${esc(t('agLimits'))}</span><b>$${esc(L.perActionUsd)} ${esc(t('agPerAction'))} · $${esc(L.perDayUsd)} ${esc(t('agPerDay'))}</b></div>
        <div class="btns"><input id="aAmt" inputmode="decimal" value="3" style="flex:1;min-width:0;border-radius:14px;border:1px solid rgba(160,200,255,.25);background:#0a1430;color:#fff;padding:10px;font:inherit"><button class="primary" id="aTop">${esc(t('agTopUp'))} ${esc(t('agTopUsdc'))}</button></div>
        <div class="sub">${esc(t('agTopNear'))}</div>
        <div class="pay-st" id="aSt">${esc(msg||'')}</div>
        <div class="btns"><button id="aW">${esc(t('agWithdraw'))}</button><button id="aD">${esc(t('agDisconnect'))}</button><button id="aX">OK</button></div>`;
      $('aX').onclick=closePay; $('aD').onclick=async()=>{ await w.disconnect(); closePay(); };
      $('aTop').onclick=async()=>{ const st=$('aSt'); try{ const units=(()=>{ const s=String($('aAmt').value).replace(',','.'); if(!/^\d+(\.\d{1,6})?$/.test(s)) throw new Error('amount'); const [a,b='']=s.split('.'); return (BigInt(a)*1000000n+BigInt((b+'000000').slice(0,6))).toString(); })();
        st.textContent=t('agTopping'); await w.topUp(i.account,i.usdcContract,units,'50000000000000000000000'); draw(t('agDone')); }catch(e){ st.textContent=t('payErr')+(e&&e.message||e); } };
      $('aW').onclick=async()=>{ const st=$('aSt'); try{ st.textContent=t('agSession'); await w.agentSession(); st.textContent='…'; await w.agentWithdraw(); draw(t('agDone')); }catch(e){ st.textContent=t('payErr')+(e&&e.message||e); } };
    };
    draw();
  }

  // ---------------- Voice via Whisper in a TEE (recorded here, transcribed inside the enclave) ----------------
  let sttServer=false, recState=null;
  const canRecord=()=>sttServer && window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  async function startRecording(){
    stopSpeaking();
    let stream;
    try{ stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}}); }
    catch(e){ showText(true); speak(t('micDenied')); return; }
    const mime=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'].find(m=>MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(m))||'';
    const mr=new MediaRecorder(stream,mime?{mimeType:mime}:{}); const parts=[];
    const AC=window.AudioContext||window.webkitAudioContext; const ac=new AC(); const srcN=ac.createMediaStreamSource(stream); const an=ac.createAnalyser(); an.fftSize=1024; srcN.connect(an);
    const data=new Uint8Array(an.fftSize); let heard=false, lastLoud=performance.now(); const t0=performance.now();
    recState={mr,stream,ac,stopped:false};
    mr.ondataavailable=e=>{ if(e.data&&e.data.size) parts.push(e.data); };
    mr.onstop=async()=>{
      stream.getTracks().forEach(tr=>tr.stop()); try{ac.close();}catch(e){}
      mic.classList.remove('rec'); recognizing=false; recState=null;
      if(!heard){ if(mode==='listen'){ setMode('idle'); hideBubble(); } speak(t('noHear')); return; }
      setStatus(t('transcribing')); setMode('think');
      const blob=new Blob(parts,{type:mr.mimeType||'audio/webm'});
      try{
        const r=await fetch('api/stt?lang='+lang,{method:'POST',headers:{'Content-Type':blob.type},body:blob});
        const d=await r.json().catch(()=>({}));
        if(r.status===429){ speak(d.error==='daily_limit'?t('limitDay'):t('limitUser')); return; }
        if(!r.ok||!d.text){ throw 0; }
        ask(d.text);
      }catch(e){ setMode('idle'); speak(t('noHear')); }
    };
    const tick=()=>{
      if(!recState||recState.stopped) return;
      an.getByteTimeDomainData(data); let sum=0; for(const v of data){ const x=(v-128)/128; sum+=x*x; }
      const rms=Math.sqrt(sum/data.length), now=performance.now();
      if(rms>0.035){ heard=true; lastLoud=now; }
      if((heard&&now-lastLoud>1300)||now-t0>15000||(!heard&&now-t0>6000)) return stopRecording();
      requestAnimationFrame(tick);
    };
    mr.start(250); recognizing=true; mic.classList.add('rec'); setMode('listen'); setStatus(t('listening')); say('…',{user:true});
    requestAnimationFrame(tick);
  }
  function stopRecording(){ if(recState&&!recState.stopped){ recState.stopped=true; try{recState.mr.stop();}catch(e){} } }

  // ---------------- Кнопки ----------------
  function showText(on){ form.classList.toggle('show',on); if(on) setTimeout(()=>q.focus(),50); }
  // PRIVACY: voice input goes only to Whisper inside the NEAR AI TEE. The browser's own speech recognition
  // (Chrome sends audio to Google, Safari to Apple) is never used; without recording we ask for text instead.
  mic.addEventListener('click',()=>{
    if(canRecord()){ recognizing?stopRecording():startRecording(); return; }
    showText(true); setStatus(t('privMic'));
  });
  kbd.addEventListener('click',()=>showText(!form.classList.contains('show')));
  hush.addEventListener('click',()=>{ stopSpeaking(); hideBubble(); setStatus(t('ready')); });
  form.addEventListener('submit',e=>{ e.preventDefault(); let v=q.value.trim(); q.value='';
    if(!v && attachedDoc && pendingAsk) v=pendingAsk;
    if(v){ pendingAsk=null; q.placeholder=t('placeholder'); }
    ask(v); });

  let tickleIdx=0, started=false;
  charEl.addEventListener('click',()=>{
    if(!started) return begin();
    if(K3D) return;   // the 3D knight handles taps, rubs and falls itself
    if(mode!=='idle') return;
    charEl.classList.remove('poke'); void charEl.offsetWidth; charEl.classList.add('poke');
    show('laugh');
    const phrase=T[lang].tickle[tickleIdx++ % T[lang].tickle.length];
    setTimeout(()=>speak(phrase,{face:'laugh'}),250);
  });

  function begin(){
    if(started) return; started=true;
    startBtn.classList.add('hidden'); row.classList.remove('hidden');
    if(!canRecord()) showText(true);
    // Приветствие голосом: на первой фразе машет рукой, дальше говорит
    speak(t('greetRest'),{intro:t('hello')});
  }
  startBtn.addEventListener('click',begin);

  // ---------------- Язык ----------------
  function applyLang(){
    document.documentElement.lang=lang;
    document.querySelectorAll('.lang button').forEach(b=>b.classList.toggle('on',b.dataset.l===lang));
    $('title').firstChild.textContent=t('title'); $('subtitle').textContent=t('subtitle');
    $('lbDoc').textContent=t('lbDoc'); $('lbKbd').textContent=t('lbKbd'); $('lbHush').textContent=t('lbHush'); $('dropT').textContent=t('dropT'); $('docbtn').setAttribute('aria-label',t('docAria'));
    startBtn.textContent=t('start'); q.placeholder=t(typeof pendingAsk!=='undefined'&&pendingAsk?'docPh':'placeholder'); $('sendBtn').textContent=t('send');
    $('note').textContent=demo?t('demoNote'):(typeof sttServer!=='undefined'&&sttServer?t('noteWhisper'):t('note'));
    try{ setVBtn(lastAtt); if(lastProof) showProof(lastProof); renderSamples(); showOfficial(); }catch(e){}
    if(started) setStatus(t('ready'));
  }
  document.querySelectorAll('.lang button').forEach(b=>b.addEventListener('click',()=>{
    lang=b.dataset.l; try{localStorage.setItem('knight-lang',lang);}catch(e){}
    stopSpeaking(); applyLang(); if(!started){ say(t('hello')); }
  }));


  // ---------------- Фон: светящийся круг ровно под ногами рыцаря ----------------
  const bgImg=$('bgimg'), appEl=document.querySelector('.app');
  let RING={x:0.5,y:0.858}; // где на картинке фона находится круг (доли ширины и высоты); профиль бизнеса может задать свой фон
  function layoutBg(){
    if(!bgImg.naturalWidth) return;
    const app=appEl.getBoundingClientRect(), ch=charEl.getBoundingClientRect();
    const W=app.width, iw=bgImg.naturalWidth, ih=bgImg.naturalHeight;
    const feetY=ch.bottom-app.top-ch.height*0.025, feetX=ch.left-app.left+ch.width*0.5;
    const H=app.height;
    let sc=feetY/(ih*RING.y);           // масштаб по высоте: круг всегда одного размера относительно рыцаря
    if(iw*sc<W) sc=W/iw;               // always cover the full width: no empty sides on phones
    const w=iw*sc, h=ih*sc;
    bgImg.style.width=w+'px'; bgImg.style.height=h+'px';
    // если фон уже экрана — края не нужно растворять
    const m=w>W*1.02?'none':''; bgImg.style.webkitMaskImage=m; bgImg.style.maskImage=m;
    bgImg.style.top=(feetY-h*RING.y)+'px';
    bgImg.style.left=(feetX-w*RING.x+w/2)+'px';
  }
  bgImg.addEventListener('load',()=>{ appEl.classList.add('hasbg'); bgImg.classList.add('on'); layoutBg(); });
  if(bgImg.complete && bgImg.naturalWidth){ appEl.classList.add('hasbg'); bgImg.classList.add('on'); }
  window.addEventListener('resize',layoutBg);
  if(window.ResizeObserver) new ResizeObserver(layoutBg).observe(charEl);
  setTimeout(layoutBg,50);

  // ---------------- Business profile (public/biz/<id>.json) ----------------
  let PROFILE=null;
  const pick=o=>o&&(o[lang]||o.en||o.ru)||'';
  function renderSamples(){
    if(!PROFILE||!PROFILE.samples) return;
    $('dSamples').innerHTML=PROFILE.samples.map(x=>`<button class="opt" data-sample="${esc(x.file)}" data-ask="${esc(pick(x.ask))}">${esc(pick(x.label))}<small>${esc(pick(x.note))}</small></button>`).join('');
  }
  function applyProfile(){
    if(!PROFILE) return;
    for(const l of ['ru','en']){ const L=T[l];
      L.title=PROFILE.title[l]||L.title; L.subtitle=PROFILE.subtitle[l]||L.subtitle; L.hello=PROFILE.hello[l]||L.hello; if(PROFILE.start) L.start=PROFILE.start[l]||L.start; L.greetRest=PROFILE.greetRest[l]||L.greetRest; }
    document.title=pick(PROFILE.title); renderSamples(); showOfficial();
  }
  // Is this assistant embedded on one of the business's own sites? (profile.domains; our own origin hosts the demo)
  // The host page cannot fake the iframe's referrer origin, and it cannot read or restyle this badge.
  function showOfficial(){
    if(!EMBED||!PROFILE) return;
    let host=''; try{ host=new URL(document.referrer).hostname; }catch(e){}
    const ok=host && (host===location.hostname || (PROFILE.domains||[]).some(d=>host===d||host.endsWith('.'+d)));
    let el=$('official'); if(!el){ el=document.createElement('div'); el.id='official'; $('subtitle').after(el); }
    el.className='official '+(ok?'ok':'warn');
    el.textContent= ok ? (lang==='ru'?'✓ Официальный помощник на ':'✓ Official assistant on ')+host
                       : (lang==='ru'?'⚠ Этот сайт не в списке сайтов ':'⚠ This site is not listed for ')+pick(PROFILE.name);
  }
  const profileReady = window.__profileReady = BIZ ? fetch('biz/'+BIZ+'.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(p=>{ PROFILE=p; applyProfile(); }).catch(()=>{}) : Promise.resolve();
  // Background: the business's own room (biz/<id>.json → background), otherwise the default data-center hall
  profileReady.then(()=>{
    const b=PROFILE&&PROFILE.background;
    if(b&&b.src){ RING={x:b.ringX??0.5,y:b.ringY??0.858}; bgImg.src=b.src; } else bgImg.src='img/bg.webp';
  });

  // ---------------- 3D-рыцарь ----------------
  function onReact(kind){
    if(!started || mode!=='idle' || uttActive || curSource) return;
    const L=T[lang];
    if(kind==='tickle') speak(L.tickle[tickleIdx++ % L.tickle.length],{face:'laugh'});
    else if(kind==='fall') setTimeout(()=>{ if(mode==='idle') speak(L.fall[Math.floor(Math.random()*L.fall.length)]); },2600);
    else if(kind==='annoyed') speak(L.annoyed[Math.floor(Math.random()*L.annoyed.length)]);
    else if(kind==='poke' && Math.random()<0.5) speak(L.poke[Math.floor(Math.random()*L.poke.length)]);
  }
  if(window.__use3d) import('./knight3d.js?v=4').then(m=>m.createKnight(charEl,{onReact})).then(k=>{
    K3D=k; window.__knight=k; stage.classList.add('k3d'); k.mode(mode); setTimeout(layoutBg,50);
  }).catch(e=>{ console.warn('3D knight failed, showing pictures',e); stage.classList.remove('k3d'); });

  // ---------------- Старт ----------------
  applyLang();
  // Пока посетитель не нажал кнопку, браузер не разрешает говорить вслух — просто машем и показываем приветствие
  Promise.all(Object.values(frames).map(i=>i.decode?i.decode().catch(()=>{}):0).concat([profileReady])).then(()=>{
    applyLang();
    setMode('wave'); say(t('hello'));
    setTimeout(()=>{ if(!started) setMode('idle'); }, 2600);
  });
  // Проверяем, подключён ли сервер (иначе демо-режим)
  fetch('api/health').then(r=>{ if(!r.ok) throw 0; return r.json(); }).then(d=>{ if(!d.ok) throw 0; if(d.tts) serverTTS=d.tts; sttServer=!!d.stt; if(sttServer) $('note').textContent=t('noteWhisper'); loadAttestation(false); }).catch(()=>{ enableDemo(); $('vbtn').classList.add('hidden'); });
})();
