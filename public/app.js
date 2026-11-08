// SECRA — the assistant page: voice, streamed answers, Verified panel, documents, business profiles, 3D knight hookup.
  // 3D knight when the browser has WebGL2; otherwise still pictures with simple CSS motion
  window.__use3d = !!document.createElement('canvas').getContext('webgl2');
const APP_SRC = (document.currentScript && document.currentScript.src) || location.href;
(() => {
  'use strict';
  // ---------------- Тексты ----------------
  const T = {
    ru: {
      title:'SECRA', subtitle:'Приватный ИИ-агент на NEAR', start:'Поздороваться с SECRA',
      hello:'Привет! Я SECRA.',
      greetRest:'Я Секра, твой приватный агент на NEAR. Нажми на кнопку с микрофоном и спроси меня о чём угодно: про NEAR, приватность или искусственный интеллект!',
      listening:'Слушаю…', thinking:'Думаю…', speaking:'Говорю… (нажми на микрофон, чтобы перебить)',
      ready:'Нажми на микрофон и задай вопрос', placeholder:'Напиши вопрос…', send:'Спросить',
      noHear:'Я ничего не расслышал. Попробуй ещё раз, погромче!',
      micDenied:'Браузер не дал доступ к микрофону. Разреши микрофон в настройках сайта или напиши вопрос текстом.',
      noStt:'Твой браузер не умеет распознавать голос. Напиши вопрос текстом — я отвечу голосом!',
      limitUser:'Уф, ты задал много вопросов! Дай мне передохнуть и возвращайся чуть позже.',
      limitDay:'На сегодня мой запас ответов закончился. Приходи завтра!',
      error:'Мой оракул задумался и не ответил. Спроси ещё раз, пожалуйста.',
      poke:['Ай!','Ой!','Эй!','Ух!'], annoyed:['Ну хватит тыкать!','Эй, я агент, а не кнопка!','Сейчас обижусь!'], fall:['Ой-ой… всё кружится!','Нечестно! Я поскользнулся!','Рыцари не падают… почти никогда.'],
      tickle:['Ха-ха-ха! Щекотно!','Эй, осторожнее с бронёй!','Ой! Я агент, а не барабан!','Хи-хи! Сенсоры щекотно!'],
      note:'Голосовой ввод сейчас недоступен — напиши вопрос текстом. Ответы генерирует модель в защищённой среде NEAR AI, сервер сайта не сохраняет разговоры.',
      demoNote:'Демо-режим: ответы заготовлены, микрофон здесь не работает. На настоящем сайте отвечает нейросеть NEAR AI и работает голос.',
      noVoice:'Озвучка выключена: в этом браузере голос шёл бы через облако, а это не приватно. Ответы — текстом.', privMic:'Этот браузер не умеет записывать звук для приватного распознавания. Напишите вопрос текстом — так ничего не уйдёт сторонним сервисам.',
      searchFiller:'Секунду, сейчас проверю.', searching:'Ищу свежую информацию…',
      vWait:'TEE…', vOk:'TEE ✓', vFail:'TEE ✗', vTitle:'Проверка приватности', vOkBig:'✅ Проверено: ответы считает нейросеть внутри защищённой среды (TEE)', vFailBig:'❌ Проверка не пройдена',
      vIntro:'Сервер сайта сам запросил у NEAR AI отчёт аттестации со свежим случайным числом (nonce) и проверил его так, как описано в документации NEAR AI. Подделать или подсунуть старый отчёт нельзя.',
      vModel:'Модель', vTime:'Проверено', vNonce:'Nonce', vGateway:'Шлюз NEAR AI', vGpuModel:'Модель на видеокарте', vSigner:'Ключ подписи', vAgain:'Проверить заново', vClose:'Закрыть',
      vAnswer:'Последний ответ', vNoStore:'🔒 Сервер этого сайта не сохраняет ни вопросы, ни ответы, ни документы, ни голос. Только счётчики токенов и — если ты их создал — зашифрованные планы регулярных покупок агента.',
      vInfo:'справочно', vThrottled:'Повторная проверка — не чаще нескольких раз в час, показан последний результат.', vSelf:'Как проверить самому, не доверяя этому сайту', vSelfText:'1) Скачайте исходный отчёт аттестации — в нём nonce и подписанные доказательства Intel и NVIDIA. 2) Проверьте его официальным инструментом NEAR AI: github.com/nearai/nearai-cloud-verifier. 3) Подпись ответа выше проверяется так: ethers.verifyMessage(signed_text, signature) должен вернуть signing_address, а этот адрес — совпасть с ключом из отчёта.', vRaw:'Скачать исходный отчёт', vRelay:'Наш сервер-посредник', vRelayNo:'⚠️ Наш сервер пока работает не в TEE: он ничего не хранит (это видно в открытом коде), но криптографически это не доказано.', vRelayTC:'Открыть отчёт Phala Trust Center', vRelayRaw:'Скачать отчёт сервера', vRelayIntro:'Между вашим браузером и NEAR AI стоит наш сервер. Он тоже работает в защищённой среде Intel TDX, и это проверено здесь же:',
      vCh:'Проверьте сами: своё число', vChText:'Придумайте любое число или слово. Мы попросим железо NEAR AI вписать его (в виде sha256) внутрь отчёта, подписанного Intel. Заранее такой отчёт не подготовить — значит, проверка идёт вживую.', vChPh:'например 58371', vChBtn:'Проверить', vChWait:'Запрашиваю отчёт у NEAR AI… (10–30 сек)', vChOk:'✅ Ваше число найдено внутри отчёта, подписанного Intel', vChBad:'❌ Ваше число в отчёте не найдено', vChErr:'Не получилось — попробуйте чуть позже (не чаще пары раз в несколько минут).', vChWord:'Ваше слово', vChHash:'sha256 → nonce', vChRaw:'Скачать этот отчёт', proofOk:'🔏 Ответ подписан внутри TEE — проверено', proofFail:'⚠️ Подпись ответа не подтвердилась — подробнее',
      agTitle:'Кошелёк агента (полный режим)', agWhat:'Отдельный кошелёк вашего агента. Его ключ существует только внутри защищённой среды сервера (Intel TDX): его не видит никто, даже мы. Агент платит из него сам, без окна кошелька, но только по вашей команде и в пределах лимитов. Ваш основной кошелёк агенту не нужен.', agDev:'⚠️ Тестовый сервер не в TEE: здесь ключ агента НЕ защищён. Пополняйте только копейками.', agAccount:'Адрес агента', agBal:'Баланс', agLimits:'Лимиты', agPerAction:'за раз', agPerDay:'в день', agTopUp:'Пополнить', agTopUsdc:'USDC', agTopNear:'Пополнение идёт приватно через NEAR Intents (NEAR или USDT) и попадает агенту на приватный баланс. Газ агенту не нужен.', agBack:'Отправлено на ваш приватный баланс NEAR Intents — им можно сразу платить из карточки.', intentsSign:'Вход в NEAR Intents: подпишите сообщение в кошельке (один раз за сеанс, без газа)…', intentsKeyNeed:'Ключ вашего кошелька ещё не подключён к NEAR Intents. Это одна транзакция, один раз.', intentsKeyBtn:'Подключить ключ', srcLabel:'Списание', srcPriv:'приватный баланс Intents', srcPub:'баланс Intents', srcTop:'пополнение баланса Intents из кошелька: {x}', payTopping:'Подтвердите пополнение баланса Intents в кошельке…', payWaitBal:'Жду, пока пополнение дойдёт…', paySign:'Подпишите платёж в кошельке (без газа)…', agWithdraw:'Вернуть всё мне', lmEdit:'Изменить', mbTitle:'Мой баланс в Intents', mbWhat:'Сюда приходят приватные переводы тебе и возвраты от агента. Это твои деньги внутри NEAR Intents: их видно на near.com, а обычный кошелёк их не показывает. «Вывести» — на твой обычный кошелёк (подпись + одна транзакция).', mbPriv:'приватно', mbPub:'Intents', mbOut:'Вывести', mbTx:'Подтверди вывод на кошелёк в кошельке…', mbDone:'✅ Выведено на кошелёк ({s}).', xFromW:'Из кошелька', xPayW:'Отправить из кошелька', xConfirmW:'Подтверди перевод в кошельке…', xSwitch:'Переключи кошелёк на сеть {c} и попробуй снова.', xNet:'Сеть, из которой отправляешь', xGive:'Сколько ты отправляешь и чем', xGets:'Что получит агент', xEst:'{a} ≈ ${u}', xTooMuch:'Для демо — не больше ${m} за раз (≈ {x}).', lmSign:'Подписать', lmSigning:'Подпишите новые лимиты в кошельке (без газа)…', lmSaved:'Лимиты сохранены.', lmToday:'сегодня', lmWhy:'Лимиты меняются только твоей подписью: за раз от $1 до ${a}, в сутки — не меньше лимита за раз и до ${d}.', xTop:'Пополнить из другой сети', xTitle:'Пополнение из другой сети', xForAgent:'Отправь USDT/USDC или монету сети со своего кошелька в BNB Chain, Ethereum, Solana, Tron и др. — агент получит USDT или NEAR на приватный баланс.', xForMe:'Отправь с другой сети — получишь на свой баланс в NEAR Intents.', xRefund:'Твой адрес в этой сети — на него вернутся деньги, если что-то пойдёт не так:', xGet:'Получить адрес', xSend:'Отправь ровно {a} в сети {c} на этот адрес — только в этой сети!', xAddr:'Адрес для перевода', xCopy:'Скопировать адрес', xWait:'Жду поступления…', xDone:'✅ Пришло! Баланс пополнен.', xPriv:'🔒 Пополнение придёт на приватный баланс в NEAR Intents.', xPub:'Пополнение придёт на баланс в NEAR Intents.', infoTitle:'Об агенте', pendYes:'Да, отправить', agUseOwn:'Заплатить из моего кошелька', ctTitle:'Сохранить контакт', ctName:'Имя', ctSave:'Сохранить', ctChecking:'Проверяю адрес в сети…', ctExists:'✓ Такой аккаунт есть в сети NEAR.', ctMissing:'✗ Такого аккаунта нет в сети NEAR — проверь адрес.', ctSaved:'Запомнил: {n}.', ctList:'Контакты', ctNone:'Контактов пока нет. Скажи «сохрани ro52.near как Клиника» или добавь здесь.', ctAdd:'Добавить (хранится только на этом устройстве)', rqTitle:'Запрос денег', rqAmount:'Сумма', rqFrom:'От кого', rqNote:'За что', rqPriv:'🔒 По ссылке или QR человек заплатит тебе приватно через NEAR Intents со своего кошелька.', rqCopy:'Скопировать ссылку', rqShare:'Поделиться', rqShareText:'Запрос на {x} через SECRA — оплата приватная', rqConnect:'Чтобы деньги пришли тебе, подключи кошелёк — ссылка будет на твой адрес.', rqIncoming:'Тебя просят оплатить {a} на {w}', lmIf:'если', lmNow:'сейчас', lmWait:'Жду нужной цены: проверяю раз в минуту.', dcaTitle:'Регулярная покупка', dcaAt:'в {x}', dcaNext:'Первая покупка: {x}.', dcaPlan:'План', dcaDaily:'каждый день', dcaEveryD:'раз в {n} дн.', dcaEveryH:'раз в {n} ч', dcaLeft:'осталось {n}', dcaCreating:'Создаю план…', dcaFirst:'Первая покупка идёт прямо сейчас…', dcaDone:'Готово.', dcaNone:'Регулярных покупок нет.', dcaWhich:'Какой план отменить?', dcaCancel:'Отменить', dcaCancelled:'Отменено', dcaList:'Регулярные покупки', agAllow:'Разрешить платить голосом', agAllowWhy:'Одна подпись сообщения на 24 часа, без газа и без суммы: так сервер знает, что команды даёшь ты. Потом агент платит голосом без окон кошелька.', agAllowed:'Агент может платить голосом (24 часа, в пределах лимитов).', agNeedAllow:'Сначала разреши агенту платить голосом: одна подпись на 24 часа, дальше без окон.', agDisconnect:'Отключить кошелёк', agPay:'⚡ Из кошелька агента', agSession:'Подпишите разрешение в кошельке (один раз на 24 часа на этом устройстве, без газа)…', agPaying:'Агент отправляет платёж из TEE…', agOff:'Кошелёк агента работает только на сервере в TEE.', agTopping:'Подтвердите пополнение в кошельке…', agDone:'Готово.', wConnect:'Кошелёк', wTitle:'Подключить кошелёк NEAR', payTitleSend:'Приватный перевод', payTitleSwap:'Приватный обмен', payTitleReview:'Приватный разбор анализов', payTo:'Получатель', payReceives:'Получит', payYouPay:'Вы отправите', payEta:'Время', paySec:'сек', payPriv:'🔒 Конфиденциально через NEAR Intents: деньги приходят получателю на приватный баланс — он видит их на near.com, а по блокчейну не видно, кому вы заплатили. Ключи у вас: каждое действие подписывает ваш кошелёк.', payConnect:'Подключить кошелёк', payConfirm:'Подтвердить в кошельке', payCancel:'Отмена', payQuoting:'Считаю условия в NEAR Intents…', payWallet:'Подтвердите в кошельке…', payProcessing:'Платёж идёт, жду подтверждения…', payDone:'✅ Готово: получатель получил деньги.', payDoneSay:'Готово! Платёж прошёл приватно.', payRefunded:'↩️ Платёж не прошёл, деньги возвращаются вам.', payFailed:'❌ Не получилось. Деньги не списаны или вернутся.', payErr:'Не получилось: ', payDeclined:'кошелёк отклонил или не ответил', payOff:'Платежи сейчас выключены на этом сервере.', payCheckSay:'Проверь карточку и подтверди в своём кошельке.', payLink:'Транзакция', payWith:'Чем платить', payAuto:'У вас не хватает {a} — платим {b}, обмен пройдёт приватно по пути.', payNone:'На кошельке не хватает ни одной монеты для этого платежа.', reviewAsk:'Разбор ваших собственных анализов платный — 1 USDT, приватно. Примеры бесплатны.', payPaidSay:'Оплата получена, разбираю документ.', lbDoc:'Документ', lbKbd:'Текст', lbHush:'Тише', dropT:'Отпусти файл — SECRA разберёт', docAria:'Загрузить документ', dTitle:'Документ', dSub:'Рыцарь приватно разберёт анализы, выписку, чеки или договор — можно просто сфотографировать. Файл уходит только в защищённую среду и нигде не сохраняется.', dUpload:'📁 Загрузить свой файл', dUploadS:'Фото или скриншот (JPG, PNG, WebP), PDF, TXT, CSV', dSamples:'Или вымышленный пример (для проверки):', dClose:'Закрыть',
      imgErr:'Не получилось открыть картинку. Попробуй JPG или PNG.', docPh:'Вопрос к документу — или просто «Спросить»', docReady:'Документ прикреплён. Напиши вопрос, скажи голосом или сразу нажми «Спросить».', docAsk:'Разбери этот документ: что в нём главное и что выглядит необычно или подозрительно?', docAttached:'Документ прикреплён. Сейчас разберу!', docErr:'Не получилось прочитать файл.', docBig:'Файл большой — я прочитаю первые 20 тысяч символов.',
      transcribing:'Распознаю речь (Whisper в TEE)…', noteWhisper:'Голос распознаёт Whisper внутри защищённой среды NEAR AI, ответы — модель в TEE. Сервер сайта не сохраняет разговоры. Нажми «TEE ✓» вверху, чтобы увидеть доказательство.',
      speech:'ru-RU'
    },
    en: {
      title:'SECRA', subtitle:'Private AI agent on NEAR', start:'Say hi to SECRA',
      hello:"Hi! I'm SECRA.",
      greetRest:"I'm SECRA, your private agent on NEAR. Tap the microphone and ask me anything about NEAR, privacy or artificial intelligence!",
      listening:'Listening…', thinking:'Thinking…', speaking:'Speaking… (tap the mic to interrupt)',
      ready:'Tap the mic and ask a question', placeholder:'Type a question…', send:'Ask',
      noHear:"I didn't catch that. Try again, a bit louder!",
      micDenied:'The browser blocked the microphone. Allow it in site settings or type your question.',
      noStt:"Your browser can't recognize speech. Type your question and I'll answer out loud!",
      limitUser:"Phew, that's a lot of questions! Let me rest and come back a bit later.",
      limitDay:"I'm out of answers for today. Come back tomorrow!",
      error:"My oracle got lost in thought. Please ask again.",
      poke:['Ouch!','Oof!','Hey!'], annoyed:['Stop poking me!','Hey, I am an agent, not a button!'], fall:['Whoa… the room is spinning!','Not fair! I slipped!'],
      tickle:['Ha-ha-ha! That tickles!','Hey, careful with the armor!','Ouch! I am an agent, not a drum!'],
      note:'Voice input is unavailable right now — please type your question. Answers come from a model in NEAR AI secure enclaves; this server stores no conversations.',
      demoNote:'Demo mode: no server connected, answers are pre-written. On the real site NEAR AI answers.',
      noVoice:'Voice is off: in this browser speech would go through a cloud service, which is not private. Answers are shown as text.', privMic:'This browser cannot record audio for private transcription. Please type your question — nothing goes to third-party services.',
      searchFiller:'One moment, let me check.', searching:'Looking up fresh info…',
      vWait:'TEE…', vOk:'TEE ✓', vFail:'TEE ✗', vTitle:'Privacy verification', vOkBig:'✅ Verified: answers are computed by a model inside a Trusted Execution Environment', vFailBig:'❌ Verification failed',
      vIntro:'This site’s server requested a NEAR AI attestation report with a fresh random nonce and verified it as the NEAR AI verification docs describe. An old or forged report cannot pass.',
      vModel:'Model', vTime:'Checked', vNonce:'Nonce', vGateway:'NEAR AI gateway', vGpuModel:'Model on GPU', vSigner:'Signing key', vAgain:'Verify again', vClose:'Close',
      vAnswer:'Last answer', vNoStore:'🔒 This server keeps no questions, answers, documents or voice. Only token counters and — if you created them — the agent\'s encrypted recurring-purchase plans.',
      vInfo:'info', vThrottled:'Re-verification is limited to a few times per hour — showing the latest result.', vSelf:'Verify it yourself, without trusting this site', vSelfText:'1) Download the raw attestation report — it contains the nonce and the signed Intel and NVIDIA evidence. 2) Check it with NEAR AI’s official tool: github.com/nearai/nearai-cloud-verifier. 3) The answer signature above: ethers.verifyMessage(signed_text, signature) must return signing_address, and that address must match a key in the report.', vRaw:'Download raw report', vRelay:'Our relay server', vRelayNo:'⚠️ Our relay server is not running in a TEE yet: it stores nothing (see the open code), but that is not cryptographically proven.', vRelayTC:'Open the Phala Trust Center report', vRelayRaw:'Download the server report', vRelayIntro:'Our server sits between your browser and NEAR AI. It also runs inside an Intel TDX enclave, verified right here:',
      vCh:'Check it yourself: your own number', vChText:'Type any number or word. We ask NEAR AI hardware to put it (as sha256) inside the Intel-signed report. Such a report cannot be prepared in advance — so the check is live.', vChPh:'e.g. 58371', vChBtn:'Verify', vChWait:'Requesting a report from NEAR AI… (10–30 s)', vChOk:'✅ Your number was found inside the Intel-signed report', vChBad:'❌ Your number was not found in the report', vChErr:'Failed — try again a bit later (a couple of times per few minutes).', vChWord:'Your word', vChHash:'sha256 → nonce', vChRaw:'Download this report', proofOk:'🔏 Answer signed inside the TEE — verified', proofFail:'⚠️ Answer signature not confirmed — details',
      agTitle:'Agent wallet (full mode)', agWhat:'A separate wallet for your agent. Its key exists only inside the server enclave (Intel TDX): nobody sees it, not even us. The agent pays from it by itself, with no wallet popup, but only on your command and within limits. Your main wallet stays yours.', agDev:'⚠️ This test server is not a TEE: the agent key is NOT protected here. Top up only pennies.', agAccount:'Agent address', agBal:'Balance', agLimits:'Limits', agPerAction:'per action', agPerDay:'per day', agTopUp:'Top up', agTopUsdc:'USDC', agTopNear:'The top-up goes privately through NEAR Intents (NEAR or USDT) onto the agent\'s private balance. The agent needs no gas.', agBack:'Sent to your private NEAR Intents balance — the payment card can spend it right away.', intentsSign:'Signing in to NEAR Intents: sign the message in your wallet (once per session, no gas)…', intentsKeyNeed:'Your wallet key is not linked to NEAR Intents yet. One transaction, once.', intentsKeyBtn:'Link key', srcLabel:'Paid from', srcPriv:'private Intents balance', srcPub:'Intents balance', srcTop:'top-up of the Intents balance from your wallet: {x}', payTopping:'Confirm the Intents top-up in your wallet…', payWaitBal:'Waiting for the top-up to arrive…', paySign:'Sign the payment in your wallet (no gas)…', agWithdraw:'Send everything back to me', lmEdit:'Change', mbTitle:'My Intents balance', mbWhat:'Private payments to you and refunds from the agent land here. It is your money inside NEAR Intents: near.com shows it, your regular wallet does not. "Withdraw" moves it to your regular wallet (a signature + one transaction).', mbPriv:'private', mbPub:'Intents', mbOut:'Withdraw', mbTx:'Confirm the withdrawal in your wallet…', mbDone:'✅ Withdrawn to your wallet ({s}).', xFromW:'From wallet', xPayW:'Send from my wallet', xConfirmW:'Confirm the transfer in your wallet…', xSwitch:'Switch your wallet to {c} and try again.', xNet:'Chain you send from', xGive:'How much you send, and in what', xGets:'What the agent gets', xEst:'{a} ≈ ${u}', xTooMuch:'Demo cap: at most ${m} per top-up (≈ {x}).', lmSign:'Sign', lmSigning:'Sign the new limits in your wallet (no gas)…', lmSaved:'Limits saved.', lmToday:'today', lmWhy:'Limits change only with your signature: per action $1 to ${a}, per day at least the per-action limit and up to ${d}.', xTop:'Top up from another chain', xTitle:'Top up from another chain', xForAgent:'Send USDT/USDC or the chain\'s coin from your wallet on BNB Chain, Ethereum, Solana, Tron and more — the agent gets USDT or NEAR on its private balance.', xForMe:'Send from another chain — it arrives on your NEAR Intents balance.', xRefund:'Your address on that chain — refunds go there if anything fails:', xGet:'Get the address', xSend:'Send exactly {a} on {c} to this address — on that chain only!', xAddr:'Deposit address', xCopy:'Copy address', xWait:'Waiting for the deposit…', xDone:'✅ Arrived! The balance is topped up.', xPriv:'🔒 The top-up lands on the private NEAR Intents balance.', xPub:'The top-up lands on the NEAR Intents balance.', infoTitle:'About the agent', pendYes:'Yes, send', agUseOwn:'Pay from my own wallet', ctTitle:'Save contact', ctName:'Name', ctSave:'Save', ctChecking:'Checking the address on chain…', ctExists:'✓ This account exists on NEAR.', ctMissing:'✗ No such account on NEAR — check the address.', ctSaved:'Saved: {n}.', ctList:'Contacts', ctNone:'No contacts yet. Say “save ro52.near as Clinic” or add one here.', ctAdd:'Add (kept only on this device)', rqTitle:'Payment request', rqAmount:'Amount', rqFrom:'From', rqNote:'For', rqPriv:'🔒 With this link or QR, they pay you privately through NEAR Intents from their own wallet.', rqCopy:'Copy link', rqShare:'Share', rqShareText:'A request for {x} via SECRA — paid privately', rqConnect:'Connect your wallet so the money comes to you — the link points to your address.', rqIncoming:'You are asked to pay {a} to {w}', lmIf:'if', lmNow:'now', lmWait:'Waiting for the price: checked every minute.', dcaTitle:'Recurring purchase', dcaAt:'at {x}', dcaNext:'First purchase: {x}.', dcaPlan:'Plan', dcaDaily:'daily', dcaEveryD:'every {n} days', dcaEveryH:'every {n} h', dcaLeft:'{n} left', dcaCreating:'Creating the plan…', dcaFirst:'The first purchase is running now…', dcaDone:'Done.', dcaNone:'No recurring purchases.', dcaWhich:'Which plan to cancel?', dcaCancel:'Cancel', dcaCancelled:'Cancelled', dcaList:'Recurring purchases', agAllow:'Allow voice payments', agAllowWhy:'One message signature for 24 hours, no gas, no amount: it tells the server the commands come from you. After that the agent pays by voice with no wallet popups.', agAllowed:'The agent can pay by voice (24 hours, within limits).', agNeedAllow:'First allow the agent to pay by voice: one signature for 24 hours, then no popups.', agDisconnect:'Disconnect wallet', agPay:'⚡ From agent wallet', agSession:'Sign the permission in your wallet (once per 24 hours on this device, no gas)…', agPaying:'The agent is sending the payment from the TEE…', agOff:'The agent wallet works only on the TEE server.', agTopping:'Confirm the top-up in your wallet…', agDone:'Done.', wConnect:'Wallet', wTitle:'Connect a NEAR wallet', payTitleSend:'Private transfer', payTitleSwap:'Private swap', payTitleReview:'Private lab-results review', payTo:'Recipient', payReceives:'Receives', payYouPay:'You send', payEta:'Time', paySec:'sec', payPriv:'🔒 Confidential through NEAR Intents: the money lands on the recipient\'s private balance — they see it on near.com, and the chain does not show whom you paid. Your keys stay with you: your wallet signs every step.', payConnect:'Connect wallet', payConfirm:'Confirm in wallet', payCancel:'Cancel', payQuoting:'Getting terms from NEAR Intents…', payWallet:'Confirm in your wallet…', payProcessing:'Payment in progress…', payDone:'✅ Done: the recipient got the money.', payDoneSay:'Done! The payment went through privately.', payRefunded:'↩️ The payment did not go through; your money is being refunded.', payFailed:'❌ It failed. Nothing was taken, or it will be refunded.', payErr:'Did not work: ', payDeclined:'the wallet declined or did not answer', payOff:'Payments are switched off on this server.', payCheckSay:'Check the card and confirm in your wallet.', payLink:'Transaction', payWith:'Pay with', payAuto:'Not enough {a} — paying with {b}; it is exchanged privately on the way.', payNone:'Your wallet does not have enough of any token for this payment.', reviewAsk:'A review of your own results costs 1 USDT, paid privately. The samples are free.', payPaidSay:'Payment received, reviewing the document.', lbDoc:'Document', lbKbd:'Type', lbHush:'Mute', dropT:'Drop the file — SECRA will review it', docAria:'Upload a document', dTitle:'Document', dSub:'SECRA privately reviews lab results, a statement, receipts or a contract — a photo is fine. The file goes only into the enclave and is never stored.', dUpload:'📁 Upload your file', dUploadS:'Photo or screenshot (JPG, PNG, WebP), PDF, TXT, CSV', dSamples:'Or a fictional sample (for testing):', dClose:'Close',
      imgErr:'Could not open the image. Try JPG or PNG.', docPh:'Ask about the document — or just tap “Ask”', docReady:'Document attached. Type or say your question, or just tap “Ask”.', docAsk:'Review this document: what matters most and what looks unusual or suspicious?', docAttached:'Document attached. Let me take a look!', docErr:'Could not read the file.', docBig:'Large file — I will read the first 20 thousand characters.',
      transcribing:'Transcribing (Whisper in TEE)…', noteWhisper:'Speech is transcribed by Whisper inside a NEAR AI enclave, answers come from a model in a TEE. This server stores no conversations. Tap “TEE ✓” on top for the proof.',
      speech:'en-US'
    }
  };
  let lang = (navigator.language||'ru').toLowerCase().startsWith('ru') ? 'ru' : 'en';
  try { const s = localStorage.getItem('knight-lang'); if (s) lang = s; } catch(e){}
  // Embedded on a business website: ?embed=1&biz=clinic&lang=en (see widget.js and public/biz/*.json)
  const QS=new URLSearchParams(location.search), BIZ=(QS.get('biz')||'').replace(/[^a-z0-9_-]/gi,''), EMBED=QS.get('embed')==='1';
  if(QS.get('lang')==='ru'||QS.get('lang')==='en') lang=QS.get('lang');
  if(EMBED) document.documentElement.classList.add('embed');
  // installable as an app on the home screen (the service worker caches nothing)
  else if('serviceWorker' in navigator && !BIZ){ try{ navigator.serviceWorker.register('sw.js'); }catch(e){} }
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
    const dots='<span class="dots"><span></span><span></span><span></span></span>';
    if(opts.dots) bubble.innerHTML=opts.under?`<div style="opacity:.85">${esc(opts.under)}</div>${dots}`:dots;
    else bubble.textContent=text;
    bubble.classList.add('show'); fadeLong();
  }
  // fade the bottom edge only while there is more text below
  const bexp=document.getElementById('bexp');
  function fadeLong(){ requestAnimationFrame(()=>{
    bubble.classList.toggle('long', bubble.scrollHeight-bubble.scrollTop-bubble.clientHeight>4);
    // the expand button shows when the text does not fit (or while the bubble is open)
    const over=bubble.scrollHeight>bubble.clientHeight+4, open=bubble.classList.contains('open');
    bexp.classList.toggle('show', bubble.classList.contains('show') && (over||open));
    bexp.textContent=open?'⌃':'⌄'; bexp.classList.toggle('up',open);
    bexp.style.top=(bubble.offsetTop+bubble.offsetHeight-4)+'px';
  }); }
  bexp.addEventListener('click',e=>{ e.stopPropagation(); bubble.classList.toggle('open'); fadeLong(); setTimeout(fadeLong,260); });
  bubble.addEventListener('scroll',fadeLong,{passive:true});
  const hideBubble=()=>{ bubble.classList.remove('show','open'); bexp.classList.remove('show'); };
  const setStatus=s=>statusEl.textContent=s||'';

  // ---------------- Озвучка ----------------
  // 1) голос браузера (бесплатно); 2) если браузер не умеет (Telegram, приложения) — голос с сервера;
  // 3) если и сервера нет — SECRA «говорит» текстом в пузыре.
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
  let typedAsk=false, pendingPay=null;
  const YES_RE=/^\s*(yes|yeah|yep|yup|correct|right|confirm(ed)?|sure|ok(ay)?|go( ahead)?|да|ага|угу|верно|правильно|подтверждаю|ок|окей|точно|давай|отправляй)(?=$|[\s.,!?)])/iu;
  function hidePending(){ const b=document.getElementById('pendBar'); if(b) b.remove(); }
  // show the exact transfer and a tap alternative to saying "yes"
  // the next "yes" (spoken or typed) runs exactly this proposal; no extra buttons
  function confirmPending(p){ pendingPay={p,at:Date.now()}; }
  async function ask(question,{typed=false}={}){
    typedAsk=typed; bubble.classList.remove('open'); question=question.trim();
    // the single confirmation of an agent transfer: "yes" runs exactly the proposal shown, anything else cancels it
    if(pendingPay){ const pp=pendingPay; pendingPay=null; hidePending();
      if(Date.now()-pp.at<3*60e3 && YES_RE.test(question)){ history.push({role:'user',content:question},{role:'assistant',content:pp.p.question}); say('🎙 '+question,{user:true}); agentRun(pp.p); return; } } if(!question) return;
    if(typeof pendingAsk!=='undefined' && pendingAsk){ pendingAsk=null; q.placeholder=t('placeholder'); }
    stopSpeaking();
    say(question,{user:true}); setMode('think'); setStatus(t('thinking')); hideProof();
    const myAsk=++askId;
    const dotsTimer=setTimeout(()=>{ if(myAsk===askId && mode==='think') say('',{dots:true,under:'🎙 '+question,user:true}); },400);   // the question stays readable until the answer starts
    history.push({role:'user',content:question});
    let answer=null;
    if(!demo){
      try{
        const paid=attachedDoc&&paidFor[attachedDoc.name];
        const personal=!BIZ&&payCfg&&payCfg.enabled;
        const r=await fetch('api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:history.slice(-6),stream:true,document:attachedDoc||undefined,profile:BIZ||undefined,typed:typedAsk||undefined,owner:(!BIZ&&W&&W.getAccount())||(paid&&paid.agent&&W&&W.getAccount())||undefined,
          paidDeposit:paid?paid.dep:undefined,paidByAgent:paid&&paid.agent?true:undefined,intentsSession:(paid&&!paid.agent&&W&&W.sessionToken())||undefined,
          // personal context, kept only on this device: contacts and the last 30 days of payments (incl. the agent's plans)
          contacts:personal?getContacts():undefined,spend:personal?await spendForAsk():undefined})});
        if(r.status===402 && PROFILE && PROFILE.paidReview){ clearTimeout(dotsTimer); history.pop(); const q2=question; setMode('idle'); say(t('reviewAsk')); openPay({review:true, then:(dep,agent)=>{ paidFor[attachedDoc.name]={dep,agent:!!agent}; ask(q2); }}); return; }
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
    let pending='', full='', speaking=null, id=null, searching=false, proofBuf=null, payBuf=null, payMk='\u0003';
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
      // \u0003…\u0003 = a payment the assistant prepared; \u0004…\u0004 = a standing-order (DCA) operation
      while(true){
        if(payBuf!==null){ const e=piece.indexOf(payMk); if(e<0){ payBuf+=piece; piece=''; break; } payBuf+=piece.slice(0,e); piece=piece.slice(e+1);
          try{ const p=JSON.parse(payBuf), mk=payMk; setTimeout(()=>mk==='\u0006'?confirmPending(p):mk==='\u0004'?dcaRun(p):mk==='\u0005'?actRun(p):(p.payFrom==='agent'&&agentOn()?agentRun(p):openPay({proposal:p})),0); }catch(e){} payBuf=null; continue; }
        const s0=['\u0003','\u0004','\u0005','\u0006'].map(m=>piece.indexOf(m)).filter(i=>i>=0).reduce((x,y)=>Math.min(x,y),Infinity); if(s0===Infinity) break;
        payMk=piece[s0]; const before=piece.slice(0,s0); payBuf=''; piece=piece.slice(s0+1); if(before){ full+=before; pending+=before; }
      }
      const pm=piece.indexOf('\u0002');   // after this mark the server sends the signature check of the answer
      if(pm>=0){ proofBuf=piece.slice(pm+1); piece=piece.slice(0,pm); }
      if(piece.includes('\u0007')){ // SECRA пошёл искать информацию
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
    if(has('кто ты','тебя зовут','who are you','your name')) return ru?'Я Секра, приватный агент на NEAR! Охраняю приватность и рассказываю про технологии NEAR простыми словами.':"I'm SECRA, your private agent on NEAR! I guard privacy and explain NEAR tech in plain words.";
    if(has('привет','здравств','hello','hi ','hey')) return ru?'И тебе привет! Спроси меня про NEAR, приватность или TEE.':'Hello to you too! Ask me about NEAR, privacy or TEEs.';
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
  const paidFor={};            // document name → {dep, agent}: the payment that unlocked its review (this tab only)
  let W=null, payCfg=null;
  const loadWallet=async()=>{ if(!W){ W=await import(new URL('wallet.js',APP_SRC).href); W.onChange(a=>showWallet(a)); await W.restore(); } return W; };
  function showWallet(a){ const b=$('wbtn'); if(!b) return; b.classList.toggle('on',!!a); $('wtext').textContent=a?('✓ '+(a.length>18?a.slice(0,8)+'…'+a.slice(-6):a)):t('wConnect'); }
  fetch('api/pay/config',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(c=>{ payCfg=c; return (window.__profileReady||Promise.resolve()).then(()=>{ if(c&&c.enabled&&(!BIZ||(PROFILE&&(PROFILE.paidReview||PROFILE.payments)))){ $('wbtn').classList.remove('hidden'); showWallet(null); } if(c&&c.enabled) setTimeout(openRequestFromLink,600); }); }).catch(()=>{});
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
      const fail=m=>{ render(`<div class="sub">${esc(t('payErr')+m)}</div>`,`<button id="pX">${esc(t('payCancel'))}</button>`); $('pX').onclick=closePay; };
      let bal={}; try{ bal=await (await fetch('api/pay/balances?account='+encodeURIComponent(w.getAccount()),{cache:'no-store'})).json(); }catch(e){}
      // 1) session with NEAR Intents (one signature, no gas); a named account may first need to link its key
      if(!w.sessionKey()){
        render(`<div class="pay-st">${esc(t('intentsSign'))}</div>`,'');
        try{ await w.intentsSession(); }
        catch(e){
          const pk=e.publicKey;
          if(pk && Array.isArray(bal.intentsKeys) && !bal.intentsKeys.includes(pk)){
            render(`<div class="sub">${esc(t('intentsKeyNeed'))}</div>`,`<button id="pX">${esc(t('payCancel'))}</button><button class="primary" id="pK">${esc(t('intentsKeyBtn'))}</button>`);
            $('pX').onclick=closePay; $('pK').onclick=async()=>{ try{ await w.registerKey(pk); step(); }catch(e2){ fail((e2&&e2.message)||t('payDeclined')); } }; return;
          }
          return fail((e&&e.message)||t('payDeclined'));
        }
      }
      render(`<div class="pay-st">${esc(t('payQuoting'))}</div>`,'');
      const priv=await w.privateBalances().catch(()=>({}));
      const pubB=bal.intents||{};
      const B=(o,k)=>{ try{ return BigInt(o&&o[k]||'0'); }catch(e){ return 0n; } };
      const want=ctx.review?(PROFILE.paidReview.token||'USDT'):p.token;
      const canSwitch=ctx.review||p.action==='send';
      const getQ=(sym,source)=>w.getQuote(ctx.review?{profile:BIZ,from:w.getAccount(),payWith:sym,source}:{...p,payWith:canSwitch?sym:undefined,from:w.getAccount(),source});
      // 2) where the money comes from: private balance → public Intents balance → top it up from the wallet
      const plan=async sym=>{
        let q=null;
        if(B(priv,sym)>0n){ try{ q=await getQ(sym,'private'); if(B(priv,sym)>=BigInt(q.amountIn||'0')) return {q,src:'private',top:0n}; }catch(e){} }
        q=await getQ(sym,'intents');
        const n2=BigInt(q.amountIn||'0'), have=B(pubB,sym);
        if(have>=n2) return {q,src:'intents',top:0n};
        if(have+B(bal,sym)>=n2) return {q,src:'intents',top:n2-have};
        return {q,src:'intents',top:n2-have,short:true};
      };
      let pl=null, using=ctx.payWith||p.payWith||want, note='';
      try{
        pl=await plan(using);
        if(pl.short && canSwitch && !ctx.payWith){
          let found=null;
          for(const sym of ['USDT','NEAR'].filter(s=>s!==using)){ try{ const p2=await plan(sym); if(!p2.short){ found=[sym,p2]; break; } }catch(e){} }
          if(found){ note=t('payAuto').replace('{a}',using).replace('{b}',found[0]); using=found[0]; pl=found[1]; } else note=t('payNone');
        } else if(pl.short) note=t('payNone');
      }catch(e){ return fail(e.message); }
      const q=pl.q;
      const total=sym=>{ const v={}; v[sym]=(B(priv,sym)+B(pubB,sym)+B(bal,sym)).toString(); return v; };
      const fmtB=s=>{ const d=s==='NEAR'?24:6; try{ const b=BigInt(total(s)[s]||'0'),u=10n**BigInt(d); return (b/u)+'.'+(b%u).toString().padStart(d,'0').slice(0,s==='NEAR'?3:2); }catch(e){ return '0'; } };
      const chips=canSwitch?`<div class="sub" style="margin-top:10px">${esc(t('payWith'))}</div><div class="btns" style="margin-top:6px">${['USDT','NEAR'].map(s=>`<button class="pw${s===using?' primary':''}" data-s="${s}" style="padding:8px">${s}<br><small style="opacity:.75;font-weight:600">${fmtB(s)}</small></button>`).join('')}</div>`:'';
      const rows=[[t('payTo'),fmtAcct(q.recipient)+(q.dest&&q.dest.chain!=='near'?' ('+q.dest.chain+')':'')],[t('payReceives'),`${q.amountOutFormatted} ${q.dest?q.dest.symbol:''}`],[t('payYouPay'),`${q.amountInFormatted} ${q.origin?q.origin.symbol:''}`],[t('payEta'),`~${q.timeEstimate||20} ${t('paySec')}`],
        [t('srcLabel'),pl.src==='private'?t('srcPriv'):(pl.top>0n?t('srcTop').replace('{x}',fmtUnits(pl.top.toString(),using==='NEAR'?24:6,using==='NEAR'?3:2)+' '+using):t('srcPub'))]];
      render(rows.map(([k,v])=>`<div class="pay-row"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')+(note?`<div class="pay-priv" style="color:#fcd57a;background:rgba(251,191,36,.12)">${esc(note)}</div>`:'')+chips+`<div class="pay-priv">${esc(t('payPriv'))}</div><div class="pay-st" id="pSt"></div>`,
        `<button id="pX">${esc(t('payCancel'))}</button>${(ctx.review?agentAvail():agentOn())?`<button id="pAg">${esc(t('agPay'))}</button>`:''}<button class="primary" id="pOk">${esc(t('payConfirm'))}</button>`);
      if(!ctx.review) speak(t('payCheckSay'));
      $('pX').onclick=closePay;
      document.querySelectorAll('#psheet .pw').forEach(b=>b.onclick=()=>{ ctx.payWith=b.dataset.s; step(); });
      if($('pAg')) $('pAg').onclick=async()=>{
        const st=$('pSt'); ['pAg','pOk','pX'].forEach(i=>$(i).disabled=true);
        // the clinic review paid by the agent: the agent buys a service by itself (Agent Economy)
        const ap=ctx.review?{action:'send',amount:PROFILE.paidReview.price,token:PROFILE.paidReview.token||'USDT',to:PROFILE.paidReview.recipient,payWith:using}:{...p,payWith:canSwitch?using:undefined};
        try{ st.textContent=t('agSession'); await w.agentSession(); st.textContent=t('agPaying'); const r=await w.agentPay(ap);
          st.textContent=t('payProcessing'); const fin=await w.waitDone(r.depositAddress,x=>{ st.textContent=t('payProcessing')+' ['+x.status+(x.error?': '+x.error:'')+']'; },{agent:true});
          const link=(fin.destTx&&fin.destTx[0])||(fin.originTx&&fin.originTx[0]);
          if(fin.status==='SUCCESS'){
            logSpend({amount:ap.amount,token:ap.token,to:ap.to,kind:ctx.review?'review':'send',via:'agent'});
            st.innerHTML=esc(t('payDone'))+(link?` <a href="${esc(link)}" target="_blank" rel="noopener">${esc(t('payLink'))} ↗</a>`:'');
            if(ctx.review){ setTimeout(()=>{ closePay(); say(t('payPaidSay')); ctx.then&&ctx.then(r.depositAddress,true); },900); } else speak(t('payDoneSay'));
          }
          else st.textContent=fin.status==='REFUNDED'?t('payRefunded'):t('payFailed');
        }catch(e){ st.textContent=t('payErr')+((e&&e.message)||t('payDeclined')); }
        $('pX').disabled=false;
      };
      if(pl.short) $('pOk').disabled=true;
      $('pOk').onclick=async()=>{
        const st=$('pSt'); $('pOk').disabled=true; $('pX').disabled=true; st.textContent=t('payWallet');
        try{
          if(pl.top>0n){
            st.textContent=t('payTopping'); await w.depositToIntents(using,pl.top.toString(),bal.wNEAR||'0');
            st.textContent=t('payWaitBal'); const need=BigInt(q.amountIn||'0'); let ok=false;
            for(let k=0;k<30&&!ok;k++){ await new Promise(r=>setTimeout(r,2000)); try{ const b2=await (await fetch('api/pay/balances?account='+encodeURIComponent(w.getAccount())+'&t='+Date.now(),{cache:'no-store'})).json(); ok=B(b2.intents,using)>=need; }catch(e){} }
            if(!ok) throw new Error('top-up not visible yet, try again in a minute');
          }
          st.textContent=t('paySign'); await w.payQuote(q);
        }catch(e){ st.textContent=t('payErr')+((e&&e.message)||t('payDeclined')); $('pX').disabled=false; return; }
        st.textContent=t('payProcessing');
        const fin=await w.waitDone(q.depositAddress,s=>{ st.textContent=t('payProcessing')+' ['+s.status+(s.error?': '+s.error:'')+']'; });
        const link=(fin.destTx&&fin.destTx[0])||(fin.originTx&&fin.originTx[0]);
        if(fin.status==='SUCCESS'){
          if(ctx.review) logSpend({amount:PROFILE.paidReview.price,token:PROFILE.paidReview.token||'USDT',to:PROFILE.paidReview.recipient,kind:'review',via:'wallet'});
          if(!ctx.review&&p.action==='send'&&agentAvail()&&!w.hasAgentSession()){ try{ const ai=await w.agentInfo(); if(ai&&ai.account===p.to){ st.textContent=t('agSession'); await w.agentSession(); } }catch(e){} }
          if(ctx.review){} else logSpend({amount:p.action==='swap'?p.amount:(q.amountOutFormatted||p.amount),token:p.action==='swap'?(q.origin&&q.origin.symbol||p.token):(q.dest&&q.dest.symbol||p.token),to:p.action==='swap'?'swap → '+(p.toToken||''):q.recipient,kind:p.action==='swap'?'swap':'send',via:'wallet'});
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
  const agentAvail=()=>!!(payCfg && (payCfg.agentWallet==='tee'||payCfg.agentWallet==='dev'));
  const agentOn=()=>!BIZ && agentAvail();
  // ---- personal data kept only on this device (localStorage): contacts and a 30-day payment log
  const LS=(k,v)=>{ try{ if(v===undefined) return JSON.parse(localStorage.getItem(k)||'null'); localStorage.setItem(k,JSON.stringify(v)); }catch(e){ return null; } };
  const getContacts=()=>(LS('sirnear.contacts')||[]).filter(c=>c&&c.name&&c.account).slice(0,50);
  const setContacts=l=>LS('sirnear.contacts',l.slice(0,50));
  const day=()=>new Date().toISOString().slice(0,10);
  function logSpend(x){ const cut=new Date(Date.now()-30*864e5).toISOString().slice(0,10); LS('sirnear.spend',[{at:day(),...x},...(LS('sirnear.spend')||[])].filter(e=>e.at>=cut).slice(0,100)); }
  let dcaCache=null;
  async function spendForAsk(){
    const cut=new Date(Date.now()-30*864e5).toISOString().slice(0,10);
    const own=(LS('sirnear.spend')||[]).filter(e=>e.at>=cut);
    // purchases made by the agent's plans while this page was closed
    try{
      if(W&&W.getAccount()&&W.hasAgentSession()){
        if(!dcaCache||Date.now()-dcaCache.at>60e3) dcaCache={at:Date.now(),l:(await W.agentDca({op:'list'})).orders||[]};
        for(const o of dcaCache.l) for(const h of (o.history||[])) if(h.ok) own.push({at:new Date(h.at).toISOString().slice(0,10),amount:String(h.spent||o.amount).split(' ')[0],token:o.token,to:'buy '+o.toToken,kind:o.whenBelow!=null||o.whenAbove!=null?'limit':'dca',via:'agent'});
      }
    }catch(e){}
    return own.slice(0,60);
  }
  const fmtUnits=(v,d,dp)=>{ try{ const b=BigInt(v||'0'), s=10n**BigInt(d); const i=b/s, f=(b%s).toString().padStart(d,'0').slice(0,dp); return i+'.'+f; }catch(e){ return '0'; } };
  // Voice payment from the agent wallet: no card to confirm — the agent pays itself (session + limits on the server)
  async function agentRun(p){
    const sh=$('psheet'); $('pmodal').classList.remove('hidden');
    const draw=(msg,done)=>{ sh.innerHTML=`<h2>${esc(t('agTitle'))}</h2><div class="pay-row"><span>${esc(t('payTo'))}</span><b>${esc(fmtAcct(p.to||''))}</b></div><div class="pay-row"><span>${esc(t('payReceives'))}</span><b>${esc(p.amount+' '+p.token)}</b></div><div class="pay-st" id="aSt">${msg}</div>${done?`<div class="btns"><button id="aX">OK</button></div>`:''}`; if(done) $('aX').onclick=closePay; };
    const w=await loadWallet();
    try{
      if(!w.hasAgentSession()){
        draw(esc(t('agNeedAllow')));
        sh.insertAdjacentHTML('beforeend',`<div class="btns"><button id="aX">${esc(t('payCancel'))}</button><button class="primary" id="aA">${esc(t('agAllow'))}</button></div>`);
        $('aX').onclick=closePay;
        await new Promise((res,rej)=>{ $('aA').onclick=async()=>{ try{ draw(esc(t('agSession'))); await w.agentSession(); res(); }catch(e){ rej(e); } }; });
      }
      draw(esc(t('agPaying'))); let r;
      try{ r=await w.agentPay(p); }
      catch(e){ if(e.code!=='need_allow') throw e;
        draw(esc(t('agNeedAllow'))); sh.insertAdjacentHTML('beforeend',`<div class="btns"><button id="aX">${esc(t('payCancel'))}</button><button class="primary" id="aA">${esc(t('agAllow'))}</button></div>`); $('aX').onclick=closePay;
        await new Promise((res,rej)=>{ $('aA').onclick=async()=>{ try{ draw(esc(t('agSession'))); await w.agentSession(); res(); }catch(e2){ rej(e2); } }; });
        draw(esc(t('agPaying'))); try{ r=await w.agentPay(p); }catch(e3){ throw new Error(e3.code==='need_allow'?'session refused right after signing ('+(e3.reason||'?')+')':e3.message); } }
      const fin=await w.waitDone(r.depositAddress,x=>draw(esc(t('payProcessing')+' ['+x.status+']')),{agent:true});
      if(fin.status==='SUCCESS'){ logSpend({amount:p.amount,token:p.token,to:p.to,kind:p.action==='swap'?'swap':'send',via:'agent'}); draw(esc(t('payDone')),true); speak(t('payDoneSay')); }
      else draw(esc(fin.status==='REFUNDED'?t('payRefunded'):t('payFailed')),true);
    }catch(e){
      const m=(e&&e.message)||t('payDeclined');
      draw(esc(t('payErr')+m),true);
      if(/not enough/i.test(m)){ sh.insertAdjacentHTML('beforeend',`<div class="btns"><button class="primary" id="aOwn">${esc(t('agUseOwn'))}</button></div>`); $('aOwn').onclick=()=>{ closePay(); openPay({proposal:{...p,payFrom:'wallet'}}); }; }
    }
  }
  // Standing orders (DCA): the assistant proposes create / list / cancel, the browser runs it with the owner's session
  const hm=m=>{ const d=new Date(); d.setUTCHours(Math.floor(m/60),m%60,0,0); return d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}); };
  const fmtPlan=o=>(o.whenBelow!=null||o.whenAbove!=null)?`${o.amount} ${o.token} → ${o.toToken} · ${t('lmIf')} NEAR ${o.whenBelow!=null?'≤ $'+o.whenBelow:'≥ $'+o.whenAbove}${o.lastPrice?' ('+t('lmNow')+' $'+Number(o.lastPrice).toFixed(3)+')':''}${o.paused?' · ⏸':''}`:`${o.amount} ${o.token} → ${o.toToken} · ${o.everyHours%24===0?(o.everyHours/24===1?t('dcaDaily'):t('dcaEveryD').replace('{n}',o.everyHours/24)):t('dcaEveryH').replace('{n}',o.everyHours)}${o.atUtcMin!=null?' '+t('dcaAt').replace('{x}',hm(o.atUtcMin)):''} · ${t('dcaLeft').replace('{n}',o.runsLeft)}${o.paused?' · ⏸':''}`;
  const fmtLast=o=>!o.last?'':(o.last.ok?`✓ ${o.last.spent} ${o.token} → ${o.last.got} ${o.toToken}`:`✗ ${o.last.error}`);
  async function dcaRun(p){
    const sh=$('psheet'); $('pmodal').classList.remove('hidden');
    const draw=(html,done)=>{ sh.innerHTML=`<h2>${esc(t('dcaTitle'))}</h2>${html}${done?`<div class="btns"><button id="aX">OK</button></div>`:''}`; if(done) $('aX').onclick=closePay; };
    const w=await loadWallet();
    try{
      if(!w.hasAgentSession()){
        draw(`<div class="pay-st">${esc(t('agNeedAllow'))}</div><div class="btns"><button id="aX">${esc(t('payCancel'))}</button><button class="primary" id="aA">${esc(t('agAllow'))}</button></div>`);
        $('aX').onclick=closePay;
        await new Promise((res,rej)=>{ $('aA').onclick=async()=>{ try{ draw(`<div class="pay-st">${esc(t('agSession'))}</div>`); await w.agentSession(); res(); }catch(e){ rej(e); } }; });
      }
      if(p.op==='create'){
        draw(`<div class="pay-st">${esc(t('dcaCreating'))}</div>`);
        let atUtcMin; if(p.atTime){ const [hh,mm]=p.atTime.split(':').map(Number); const d=new Date(); d.setHours(hh,mm,0,0); atUtcMin=d.getUTCHours()*60+d.getUTCMinutes(); }
        const body={op:'create',amount:p.amount,token:p.token,toToken:p.toToken,everyHours:p.everyHours,runs:p.runs,forDays:p.forDays,atUtcMin,whenBelow:p.whenBelow,whenAbove:p.whenAbove};
        let o; try{ o=await w.agentDca(body); }catch(e){ if(e.code!=='need_allow') throw e;
          draw(`<div class="pay-st">${esc(t('agNeedAllow'))}</div><div class="btns"><button id="aX">${esc(t('payCancel'))}</button><button class="primary" id="aA">${esc(t('agAllow'))}</button></div>`); $('aX').onclick=closePay;
          await new Promise((res,rej)=>{ $('aA').onclick=async()=>{ try{ await w.agentSession(); res(); }catch(e2){ rej(e2); } }; });
          try{ o=await w.agentDca(body); }catch(e3){ throw new Error(e3.code==='need_allow'?'session refused right after signing ('+(e3.reason||'?')+')':e3.message); } }
        const isLimit=o.whenBelow!=null||o.whenAbove!=null;
        draw(`<div class="pay-row"><span>${esc(t('dcaPlan'))}</span><b>${esc(fmtPlan(o))}</b></div><div class="pay-st" id="dSt">${esc(isLimit?t('lmWait'):o.atUtcMin!=null?t('dcaNext').replace('{x}',new Date(o.nextAt).toLocaleString([], {weekday:'short',hour:'2-digit',minute:'2-digit'})):t('dcaFirst'))}</div>`);
        // without a time of day the first purchase runs at once on the server: show its result
        if(o.atUtcMin==null&&!isLimit) for(let k=0;k<40;k++){ await new Promise(r=>setTimeout(r,3000)); const l=(await w.agentDca({op:'list'})).orders||[]; const x=l.find(y=>y.id===o.id); if(!x){ $('dSt').textContent=t('dcaDone'); break; } if(x.last){ $('dSt').textContent=fmtLast(x); break; } }
        draw(sh.innerHTML.replace(/^<h2>.*?<\/h2>/,''),true);
      } else if(p.op==='cancel'){
        const l=(await w.agentDca({op:'list'})).orders||[];
        const x=p.id?l.find(y=>y.id===p.id):(l.length===1?l[0]:null);
        if(!x){ draw(`<div class="sub">${esc(l.length?t('dcaWhich'):t('dcaNone'))}</div>`+l.map(o=>`<div class="pay-row"><span>${esc(fmtPlan(o))}</span><button data-c="${esc(o.id)}">${esc(t('dcaCancel'))}</button></div>`).join(''),true); sh.querySelectorAll('[data-c]').forEach(b=>b.onclick=async()=>{ await w.agentDca({op:'cancel',id:b.dataset.c}); b.closest('.pay-row').remove(); }); return; }
        await w.agentDca({op:'cancel',id:x.id}); draw(`<div class="sub">${esc(t('dcaCancelled'))}: ${esc(fmtPlan(x))}</div>`,true);
      } else {
        const l=(await w.agentDca({op:'list'})).orders||[];
        draw((l.length?l.map(o=>`<div class="pay-row"><span>${esc(fmtPlan(o))}<br><small>${esc(fmtLast(o))}</small></span><button data-c="${esc(o.id)}">${esc(t('dcaCancel'))}</button></div>`).join(''):`<div class="sub">${esc(t('dcaNone'))}</div>`),true);
        sh.querySelectorAll('[data-c]').forEach(b=>b.onclick=async()=>{ await w.agentDca({op:'cancel',id:b.dataset.c}); b.closest('.pay-row').remove(); });
      }
    }catch(e){ draw(`<div class="sub">${esc(e&&e.code==='need_allow'?t('agNeedAllow'):t('payErr')+((e&&e.message)||t('payDeclined')))}</div>`,true); }
  }
  // ---- screen actions the assistant proposes: save a contact, show a payment request
  async function actRun(p){ if(p.kind==='contact') return contactSave(p); if(p.kind==='request') return requestShow(p); }
  const sheet=(title,inner)=>{ $('pmodal').classList.remove('hidden'); $('psheet').innerHTML=`<h2>${esc(title)}</h2>${inner}`; };
  async function contactSave(p){
    const acct=String(p.account||'').toLowerCase();
    sheet(t('ctTitle'),`<div class="pay-row"><span>${esc(t('ctName'))}</span><b>${esc(p.name)}</b></div><div class="pay-row"><span>${esc(t('payTo'))}</span><b>${esc(acct)}</b></div><div class="pay-st" id="cSt">${esc(t('ctChecking'))}</div><div class="btns"><button id="cX">${esc(t('payCancel'))}</button><button class="primary" id="cOk" disabled>${esc(t('ctSave'))}</button></div>`);
    $('cX').onclick=closePay;
    let ok=/^[0-9a-f]{64}$/.test(acct);
    if(!ok) try{ ok=!!(await (await fetch('api/pay/balances?account='+encodeURIComponent(acct),{cache:'no-store'})).json()).exists; }catch(e){}
    $('cSt').textContent=ok?t('ctExists'):t('ctMissing');
    if(!ok) return;
    $('cOk').disabled=false;
    $('cOk').onclick=()=>{ setContacts([{name:p.name,account:acct},...getContacts().filter(c=>c.name.toLowerCase()!==p.name.toLowerCase())]); closePay(); speak(t('ctSaved').replace('{n}',p.name)); };
  }
  function contactsSheet(){
    const draw=()=>{ const l=getContacts();
      sheet(t('ctList'),(l.length?l.map((c,i)=>`<div class="pay-row"><span>${esc(c.name)}<br><small>${esc(c.account)}</small></span><button data-d="${i}" aria-label="delete">✕</button></div>`).join(''):`<div class="sub">${esc(t('ctNone'))}</div>`)+
        `<div class="sub" style="margin-top:12px">${esc(t('ctAdd'))}</div><input id="cN" placeholder="${esc(t('ctName'))}" style="width:100%;margin-top:6px"><input id="cA" placeholder="name.near" autocapitalize="off" style="width:100%;margin-top:6px"><div class="btns"><button id="cX">OK</button><button class="primary" id="cS">${esc(t('ctSave'))}</button></div>`);
      document.querySelectorAll('#psheet [data-d]').forEach(b=>b.onclick=()=>{ const l2=getContacts(); l2.splice(Number(b.dataset.d),1); setContacts(l2); draw(); });
      $('cX').onclick=closePay; $('cS').onclick=()=>{ const n=$('cN').value.trim(), a=$('cA').value.trim().toLowerCase(); if(n&&a) contactSave({name:n,account:a}); };
    }; draw();
  }
  async function requestShow(p){
    const w=await loadWallet();
    if(!w.getAccount()){ sheet(t('rqTitle'),`<div class="sub">${esc(t('rqConnect'))}</div><div class="btns"><button id="cX">${esc(t('payCancel'))}</button><button class="primary" id="cC">${esc(t('payConnect'))}</button></div>`); $('cX').onclick=closePay; $('cC').onclick=async()=>{ try{ await w.connect(); }catch(e){} if(w.getAccount()) requestShow(p); }; return; }
    const data={to:w.getAccount(),amount:p.amount,token:p.token,note:p.note||'',name:p.fromName||''};
    const enc=btoa(unescape(encodeURIComponent(JSON.stringify(data)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
    const link=location.origin+location.pathname+'?payreq='+enc;
    let svg=''; try{ const qr=(await import('./vendor/qrcode/qrcode.mjs')).default(0,'M'); qr.addData(link); qr.make(); svg=qr.createSvgTag({cellSize:4,margin:2,scalable:true}); }catch(e){}
    sheet(t('rqTitle'),`<div class="pay-row"><span>${esc(t('rqAmount'))}</span><b>${esc(p.amount+' '+p.token)}</b></div>${p.fromName?`<div class="pay-row"><span>${esc(t('rqFrom'))}</span><b>${esc(p.fromName)}</b></div>`:''}${p.note?`<div class="pay-row"><span>${esc(t('rqNote'))}</span><b>${esc(p.note)}</b></div>`:''}
      <div style="background:#fff;border-radius:14px;padding:10px;margin:12px auto;max-width:230px">${svg}</div><div class="pay-priv">${esc(t('rqPriv'))}</div>
      <div class="btns"><button id="cX">OK</button><button id="cCp">${esc(t('rqCopy'))}</button>${navigator.share?`<button class="primary" id="cSh">${esc(t('rqShare'))}</button>`:''}</div>`);
    $('cX').onclick=closePay;
    $('cCp').onclick=async()=>{ try{ await navigator.clipboard.writeText(link); $('cCp').textContent='✓'; }catch(e){ prompt('',link); } };
    if($('cSh')) $('cSh').onclick=()=>navigator.share({title:'SECRA',text:t('rqShareText').replace('{x}',p.amount+' '+p.token),url:link}).catch(()=>{});
  }
  // someone opened a payment request link: a normal private-payment card to the requester
  function openRequestFromLink(){
    const raw=QS.get('payreq'); if(!raw||BIZ) return;
    let d; try{ d=JSON.parse(decodeURIComponent(escape(atob(raw.replace(/-/g,'+').replace(/_/g,'/'))))); }catch(e){ return; }
    if(!d||!/^[a-z0-9._-]{2,64}$/.test(String(d.to))||!/^\d+(\.\d+)?$/.test(String(d.amount))||!['NEAR','USDT'].includes(d.token)) return;
    window.history.replaceState(null,'',location.pathname);
    say(t('rqIncoming').replace('{a}',d.amount+' '+d.token).replace('{w}',d.to)+(d.note?' — '+d.note:''));
    openPay({proposal:{action:'send',amount:String(d.amount),token:d.token,to:d.to}});
  }
  const INFO={ru:`<div class="info">
<p><b>SECRA</b> — голосовой агент на NEAR. Как Siri, только он работает в защищённых средах (TEE), а деньги проходят приватно через NEAR Intents.</p>
<h3>🗣 Что он умеет</h3><ul>
<li>Отвечает голосом и текстом на русском и английском, читает документы и фото: анализы, выписки, чеки, договоры.</li>
<li>Переводит NEAR и USDT: <code>send 2 USDT to anna.near</code>. Если нужной монеты нет, сам обменяет её по пути.</li>
<li>Меняет NEAR ↔ USDT: <code>swap 3 NEAR to USDT</code>.</li>
<li>Отправляет в другие сети: USDT/USDC на адрес в BNB Chain, Ethereum, Arbitrum, Base, Polygon, Solana, Tron. Адрес лучше вставить текстом.</li>
<li>Пополняется из других сетей: в окне агента «🌐 Пополнить из другой сети» — адрес и QR-код для перевода с любого кошелька.</li>
<li>Покупает по расписанию (DCA): <code>buy NEAR for 1 dollar every day at 9 for two weeks</code>.</li>
<li>Ставит лимит-ордера: <code>buy NEAR for 5 dollars if the price drops below 2</code>.</li>
<li>Запоминает контакты: <code>save ro52.near as Clinic</code> → <code>send Clinic 1 USDT</code>.</li>
<li>Просит деньги за тебя: <code>ask Anna for 3 USDT</code> — появляются ссылка и QR-код.</li>
<li>Считает траты: <code>what did I spend this week?</code></li>
<li>Сам оплачивает услуги, например платный разбор анализов в клинике.</li></ul>
<h3>🔐 Два режима</h3><ul>
<li><b>Твой кошелёк.</b> Агент готовит карточку, а ты проверяешь её и подписываешь в своём кошельке (HOT, Meteor…). Без твоей подписи деньги не двигаются.</li>
<li><b>Кошелёк агента (полный режим)<span class="tag">Agent Economy</span>.</b> У агента свой кошелёк, его ключ существует только внутри TEE, его не видим даже мы. Ты пополняешь его небольшим бюджетом, и агент платит по голосу сам, без окон кошелька. Перед платежом он переспрашивает получателя по буквам, а сервер не выпустит деньги без твоего «да». Лимиты по умолчанию — $10 за раз и $25 в день; меняются только твоей подписью. «Вернуть всё мне» — одной кнопкой.</li></ul>
<h3>⚙️ Как это работает</h3><ul>
<li><b>Ответы:</b> модель DeepSeek V4.1 Flash в TEE на NEAR AI Cloud (Intel TDX + NVIDIA). Каждый ответ подписан внутри защищённой среды. Кнопка «TEE ✓» показывает доказательство, его можно проверить самому.</li>
<li><b>Голос:</b> распознаёт Whisper в TEE. Облачное распознавание браузера (Google или Apple) не используется.</li>
<li><b>Наш сервер</b> сам работает в Intel TDX на Phala и тоже показывает аттестацию. Разговоры он не хранит. Хранит только планы регулярных покупок, если ты их создал, и только в зашифрованном виде.</li>
<li><b>Платежи:</b> NEAR Intents, конфиденциальный режим. Деньги приходят получателю на приватный баланс, и по блокчейну не видно, кому ты заплатил.</li>
<li><b>Контакты и история трат</b> хранятся только на твоём устройстве.</li></ul>
<h3>⚠️ Честно о границах</h3><ul>
<li>Пополнение баланса Intents из кошелька — обычная публичная транзакция.</li>
<li>Тестовый сервер не в TEE: там ключ агента не защищён.</li>
<li>Покупки по расписанию идут, только пока работает сервер.</li></ul>
<h3>🛠 В разработке</h3><ul>
<li>Голосовые транзакции в твоём кошельке — подтверждение голосом, без нажатия<span class="tag soon">скоро</span></li>
<li>Лимиты агента в смарт-контракте, поверх лимитов в TEE<span class="tag soon">скоро</span></li>
<li>Уведомления о покупках по расписанию<span class="tag soon">скоро</span></li>
<li>Агент, который нанимает других агентов и платит им за API, данные и вычисления<span class="tag soon">скоро</span></li>
<li>Собственный сервер-ретранслятор бизнеса в его TEE, с той же проверкой<span class="tag soon">скоро</span></li></ul>
</div>`,en:`<div class="info">
<p><b>SECRA</b> is a voice agent on NEAR. Think Siri, except it runs in secure enclaves (TEEs) and money moves privately through NEAR Intents.</p>
<h3>🗣 What it can do</h3><ul>
<li>Answers by voice and text in English and Russian; reads documents and photos (lab results, statements, receipts, contracts).</li>
<li>Sends NEAR and USDT: <code>send 2 USDT to anna.near</code>. If you lack the token, it exchanges it on the way.</li>
<li>Swaps NEAR ↔ USDT: <code>swap 3 NEAR to USDT</code>.</li>
<li>Sends to other chains: USDT/USDC to an address on BNB Chain, Ethereum, Arbitrum, Base, Polygon, Solana or Tron (paste the address as text).</li>
<li>Tops up from other chains: "🌐 Top up from another chain" in the agent window gives an address and a QR code for a transfer from any wallet.</li>
<li>Buys on a schedule (DCA): <code>buy NEAR for 1 dollar every day at 9 for two weeks</code>.</li>
<li>Places limit orders: <code>buy NEAR for 5 dollars if the price drops below 2</code>.</li>
<li>Remembers contacts: <code>save ro52.near as Clinic</code> → <code>send Clinic 1 USDT</code>.</li>
<li>Requests money for you: <code>ask Anna for 3 USDT</code> gives you a link and a QR code.</li>
<li>Reports spending: <code>what did I spend this week?</code></li>
<li>Pays for services by itself, e.g. the clinic's paid lab-results review.</li></ul>
<h3>🔐 Two modes</h3><ul>
<li><b>Your wallet.</b> The agent prepares a card; you check it and sign in your own wallet (HOT, Meteor…). Nothing moves without your signature.</li>
<li><b>Agent wallet (full mode)<span class="tag">Agent Economy</span>.</b> The agent has its own wallet. Its key exists only inside the TEE; not even we can see it. You top it up with a small budget, and the agent pays on your voice command with no wallet popups. Before paying, it spells the recipient back to you, and the server releases nothing without your "yes". Default limits: $10 per action, $25 per day; they change only with your signature. "Send everything back to me" is one tap.</li></ul>
<h3>⚙️ How it works</h3><ul>
<li><b>Answers:</b> DeepSeek V4.1 Flash in a TEE on NEAR AI Cloud (Intel TDX + NVIDIA). Every answer is signed inside the enclave; "TEE ✓" shows the proof, which you can verify yourself.</li>
<li><b>Voice:</b> Whisper in a TEE. The browser's cloud speech recognition (Google or Apple) is never used.</li>
<li><b>Our server</b> runs in Intel TDX on Phala and attests itself as well. It keeps no conversations. The only thing it keeps is the recurring-purchase plans you create, and those are encrypted.</li>
<li><b>Payments:</b> confidential NEAR Intents. The payout lands on the recipient's private balance, so the chain does not show whom you paid.</li>
<li><b>Contacts and spending history</b> stay on your device.</li></ul>
<h3>⚠️ Honest limits</h3><ul>
<li>Topping up your Intents balance from your wallet is a normal public transaction.</li>
<li>The test server is not a TEE: the agent key is not protected there.</li>
<li>Scheduled purchases run only while the server is up.</li></ul>
<h3>🛠 In development</h3><ul>
<li>Voice transactions in your own wallet, confirmed by voice with no tap<span class="tag soon">soon</span></li>
<li>Agent limits in a smart contract, on top of the limits in the TEE<span class="tag soon">soon</span></li>
<li>Notifications for scheduled purchases<span class="tag soon">soon</span></li>
<li>An agent that hires other agents and pays them for APIs, data and compute<span class="tag soon">soon</span></li>
<li>A business's own relay in its own TEE, verified the same way<span class="tag soon">soon</span></li></ul>
</div>`};
  function openInfo(){ $('pmodal').classList.remove('hidden'); $('psheet').innerHTML=`<h2>${esc(t('infoTitle'))}</h2>${INFO[lang]||INFO.en}<div class="btns"><button id="iX">OK</button></div>`; $('psheet').scrollTop=0; $('iX').onclick=closePay; }
  if(!BIZ){ const ib=document.getElementById('ibtn'); ib.classList.remove('hidden'); ib.onclick=openInfo; ib.title=t('infoTitle'); }
  // ---- top up from another chain (BNB, Ethereum, Solana, Tron…): a one-time deposit address from NEAR Intents
  const toUnitsStr=(a,dec)=>{ const [i,f='']=String(a).split('.'); return (BigInt(i||'0')*10n**BigInt(dec)+BigInt((f+'0'.repeat(dec)).slice(0,dec)||'0')).toString(); };
  async function xDepositSheet({agent=true}={}){
    const w=await loadWallet(); if(!w.getAccount()){ try{ await w.connect(); }catch(e){} if(!w.getAccount()) return; }
    sheet(t('xTitle'),`<div class="pay-st">…</div>`);
    let chains=[]; try{ chains=(await (await fetch('api/pay/chains',{cache:'no-store'})).json()).chains||[]; }catch(e){}
    if(!chains.length){ sheet(t('xTitle'),`<div class="sub">${esc(t('payErr'))}chains</div><div class="btns"><button id="cX">OK</button></div>`); $('cX').onclick=closePay; return; }
    const sel=(id,opts)=>`<select id="${id}" style="flex:1;min-width:0;border-radius:12px;border:1px solid rgba(160,200,255,.25);background:#0a1430;color:#fff;padding:10px;font:inherit">${opts}</select>`;
    sheet(t('xTitle'),`<div class="sub">${esc(agent?t('xForAgent'):t('xForMe'))}</div>
      <div class="sub" style="margin-top:10px">${esc(t('xNet'))}</div><div class="btns" style="margin-top:4px">${sel('xC',chains.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join(''))}</div>
      <div class="sub" style="margin-top:10px">${esc(t('xGive'))}</div><div class="btns" style="margin-top:4px"><input id="xA" inputmode="decimal" value="5" style="flex:1;min-width:0" aria-label="amount">${sel('xT','')}</div>
      <div class="sub" style="margin-top:10px">${esc(t('xGets'))}</div><div class="btns" style="margin-top:4px">${sel('xD','<option>USDT</option><option>NEAR</option>')}</div>
      <div class="sub" id="xEst" style="margin-top:6px"></div>
      <div class="sub">${esc(t('xRefund'))}</div><div class="btns" style="margin-top:6px"><input id="xR" autocapitalize="off" spellcheck="false" style="flex:1;min-width:0">${window.ethereum?`<button id="xEv" style="flex:none">🦊 ${esc(t('xFromW'))}</button>`:''}</div>
      <div class="pay-st" id="xSt"></div><div class="btns"><button id="cX">${esc(t('payCancel'))}</button><button class="primary" id="xGo">${esc(t('xGet'))}</button></div>`);
    const MAXU=(payCfg&&payCfg.maxUsd)||50;
    // live estimate: what you give is in the chosen token; shows its dollar value and the demo cap
    const est=()=>{ const c=chains.find(x=>x.id===$('xC').value)||chains[0], sym=$('xT').value, px=Number((c.prices||{})[sym]), a=Number(String($('xA').value).replace(',','.'));
      const e=$('xEst'); if(!(px>0)||!(a>0)){ e.textContent=''; return; }
      const usd=a*px, out=$('xD').value==='USDT'?usd:usd/((payCfg&&payCfg.nearUsd)||NaN);
      e.style.color=usd>MAXU?'#fca5a5':''; e.textContent=usd>MAXU?t('xTooMuch').replace('{m}',MAXU).replace('{x}',(MAXU/px).toPrecision(2)+' '+sym):t('xEst').replace('{a}',a+' '+sym).replace('{u}',usd<1?usd.toFixed(2):usd.toFixed(usd<100?2:0))+($('xD').value==='USDT'?' → ≈ '+usd.toFixed(2)+' USDT':(out>0?' → ≈ '+out.toFixed(3)+' NEAR':'')); };
    const fillT=()=>{ const c=chains.find(x=>x.id===$('xC').value)||chains[0]; $('xT').innerHTML=c.tokens.map(k=>`<option>${esc(k)}</option>`).join(''); $('xR').value=(LS('sirnear.refund')||{})[c.id]||''; $('xR').placeholder=c.id==='sol'?'Solana address':c.id==='tron'?'T…':'0x…'; est(); };
    if($('xEv')) $('xEv').onclick=async()=>{ try{ const [a]=await window.ethereum.request({method:'eth_requestAccounts'}); if(a) $('xR').value=a; }catch(e){} };
    $('xC').onchange=fillT; $('xT').onchange=est; $('xD').onchange=est; $('xA').oninput=est; fillT(); $('cX').onclick=closePay;
    $('xGo').onclick=async()=>{ const st=$('xSt'); $('xGo').disabled=true;
      try{
        const chain=$('xC').value, symbol=$('xT').value, amount=String($('xA').value).replace(',','.'), refundTo=$('xR').value.trim();
        if(!/^\d+(\.\d{1,8})?$/.test(amount)) throw new Error('amount');
        const rf=LS('sirnear.refund')||{}; rf[chain]=refundTo; LS('sirnear.refund',rf);
        st.textContent=t('payQuoting');
        let headers={'Content-Type':'application/json'};
        if(!agent){ st.textContent=t('intentsSign'); await w.intentsSession(); headers['X-Intents-Session']=w.sessionToken(); }
        const r=await fetch('api/pay/xdeposit',{method:'POST',headers,body:JSON.stringify({chain,symbol,amount,refundTo,destToken:$('xD').value,...(agent?{toAgentOf:w.getAccount()}:{to:w.getAccount()})})});
        const d=await r.json().catch(()=>({})); if(!r.ok) throw new Error(d.message||d.error||('HTTP '+r.status));
        const ch=chains.find(x=>x.id===chain)||{};
        let svg=''; try{ const qr=(await import('./vendor/qrcode/qrcode.mjs')).default(0,'M'); qr.addData(d.depositAddress); qr.make(); svg=qr.createSvgTag({cellSize:4,margin:2,scalable:true}); }catch(e){}
        sheet(t('xTitle'),`<div class="pay-priv" style="color:#fcd57a;background:rgba(251,191,36,.12)">${esc(t('xSend').replace('{a}',d.amountIn+' '+d.symbol).replace('{c}',d.chainName))}</div>
          <div class="pay-row"><span>${esc(t('xAddr'))}</span><b style="font-family:monospace">${esc(d.depositAddress)}</b></div>${d.depositMemo?`<div class="pay-row"><span>Memo</span><b>${esc(d.depositMemo)}</b></div>`:''}
          <div class="pay-row"><span>${esc(t('payReceives'))}</span><b>≈ ${esc(d.amountOut+' '+d.destToken)}</b></div>
          <div style="background:#fff;border-radius:14px;padding:10px;margin:12px auto;max-width:210px">${svg}</div>
          <div class="pay-priv">${esc(d.private?t('xPriv'):t('xPub'))}</div><div class="pay-st" id="xSt">${esc(t('xWait'))}</div>
          <div class="btns"><button id="cCp">${esc(t('xCopy'))}</button><button id="cX">OK</button></div>${ch.evm&&window.ethereum?`<div class="btns"><button class="primary" id="xPay">🦊 ${esc(t('xPayW'))}</button></div>`:''}`);
        $('cX').onclick=closePay;
        // one tap in an EVM wallet (Brave Wallet, MetaMask, HOT…): switch to the chain and send exactly the quoted amount
        if($('xPay')) $('xPay').onclick=async()=>{ const st=$('xSt'); try{
            const eth=window.ethereum, [from]=await eth.request({method:'eth_requestAccounts'});
            const cid={eth:'0x1',bsc:'0x38',arb:'0xa4b1',base:'0x2105',pol:'0x89'}[chain];
            try{ await eth.request({method:'wallet_switchEthereumChain',params:[{chainId:cid}]}); }catch(e){ throw new Error(t('xSwitch').replace('{c}',d.chainName)); }
            const m=(ch.meta||{})[symbol]||{}; const units=BigInt(toUnitsStr(String(d.amountIn),m.decimals));
            const tx=m.contract&&/^0x[0-9a-fA-F]{40}$/.test(m.contract)
              ? {from,to:m.contract,data:'0xa9059cbb'+d.depositAddress.slice(2).toLowerCase().padStart(64,'0')+units.toString(16).padStart(64,'0')}
              : {from,to:d.depositAddress,value:'0x'+units.toString(16)};
            st.textContent=t('xConfirmW'); await eth.request({method:'eth_sendTransaction',params:[tx]});
            st.textContent=t('xWait'); $('xPay').disabled=true;
          }catch(e){ st.textContent=t('payErr')+((e&&e.message)||t('payDeclined')); } }; $('cCp').onclick=async()=>{ try{ await navigator.clipboard.writeText(d.depositAddress); $('cCp').textContent='✓'; }catch(e){ prompt('',d.depositAddress); } };
        const fin=await w.waitDone(d.depositAddress,x=>{ const e=$('xSt'); if(e) e.textContent=t('xWait')+' ['+x.status+']'; },{agent,timeoutMs:35*60e3});
        const e=$('xSt'); if(e) e.textContent=fin.status==='SUCCESS'?t('xDone'):fin.status==='REFUNDED'?t('payRefunded'):t('payFailed');
        if(fin.status==='SUCCESS') speak(t('xDone'));
      }catch(e){ const x=$('xSt'); if(x) x.textContent=t('payErr')+((e&&e.message)||t('payDeclined')); const g=$('xGo'); if(g) g.disabled=false; }
    };
  }
  // ---- my own money inside NEAR Intents: what came in privately (payments to me, agent refunds) and how to get it out
  async function myBalanceSheet(){
    const w=await loadWallet(); if(!w.getAccount()){ try{ await w.connect(); }catch(e){} if(!w.getAccount()) return; }
    sheet(t('mbTitle'),`<div class="pay-st">${esc(t('intentsSign'))}</div>`);
    try{ await w.intentsSession(); }catch(e){ sheet(t('mbTitle'),`<div class="sub">${esc(t('payErr')+((e&&e.message)||t('payDeclined')))}</div><div class="btns"><button id="cX">OK</button></div>`); $('cX').onclick=closePay; return; }
    const draw=async msg=>{
      let bal={}, priv={}; try{ bal=await (await fetch('api/pay/balances?account='+encodeURIComponent(w.getAccount())+'&t='+Date.now(),{cache:'no-store'})).json(); }catch(e){} try{ priv=await w.privateBalances(); }catch(e){}
      const pub=bal.intents||{}, f=(v,s)=>fmtUnits(String(v||'0'),s==='NEAR'?24:6,s==='NEAR'?3:2);
      const row=(s)=>`<div class="pay-row"><span><b>${s}</b><br><small>${esc(t('mbPriv'))}: ${esc(f(priv[s],s))} · ${esc(t('mbPub'))}: ${esc(f(pub[s],s))}</small></span>${(BigInt(priv[s]||'0')>0n||BigInt(pub[s]||'0')>0n)?`<button data-w="${s}">${esc(t('mbOut'))}</button>`:''}</div>`;
      sheet(t('mbTitle'),`<div class="sub">${esc(t('mbWhat'))}</div>${row('USDT')}${row('NEAR')}<div class="pay-st" id="mSt">${esc(msg||'')}</div><div class="btns"><button id="cX">OK</button></div>`);
      $('cX').onclick=closePay;
      document.querySelectorAll('#psheet [data-w]').forEach(b=>b.onclick=async()=>{ const sym=b.dataset.w, st=$('mSt'); b.disabled=true;
        try{
          // 1) private → my public Intents balance (one signature, no gas), 2) Intents → my wallet (one transaction)
          if(BigInt(priv[sym]||'0')>0n){
            st.textContent=t('payQuoting');
            const q=await w.getQuote({unshield:true,from:w.getAccount(),token:sym,amount:fmtUnits(String(priv[sym]),sym==='NEAR'?24:6,sym==='NEAR'?24:6).replace(/\.?0+$/,'')});
            st.textContent=t('paySign'); await w.payQuote(q);
            st.textContent=t('payProcessing'); const fin=await w.waitDone(q.depositAddress,x=>{ st.textContent=t('payProcessing')+' ['+x.status+']'; });
            if(fin.status!=='SUCCESS') throw new Error(fin.status);
          }
          let have='0'; for(let k=0;k<15;k++){ const b2=await (await fetch('api/pay/balances?account='+encodeURIComponent(w.getAccount())+'&t='+Date.now(),{cache:'no-store'})).json(); have=(b2.intents||{})[sym]||'0'; if(BigInt(have)>0n) break; await new Promise(r=>setTimeout(r,2000)); }
          st.textContent=t('mbTx'); await w.withdrawFromIntents(sym,have);
          draw(t('mbDone').replace('{s}',sym==='NEAR'?'wNEAR':sym));
        }catch(e){ st.textContent=t('payErr')+((e&&e.message)||t('payDeclined')); b.disabled=false; } });
    };
    draw();
  }
  async function openAgent(){
    const sh=$('psheet'); $('pmodal').classList.remove('hidden');
    sh.innerHTML=`<h2>${esc(t('agTitle'))}</h2><div class="pay-st">…</div>`;
    const w=await loadWallet();
    const draw=async(msg)=>{
      let i; try{ i=await w.agentInfo(); }catch(e){ sh.innerHTML=`<h2>${esc(t('agTitle'))}</h2><div class="sub">${esc(t('agOff'))}</div><div class="btns"><button id="aX">OK</button></div>`; $('aX').onclick=closePay; return; }
      const L=i.limits||{};
      sh.innerHTML=`<h2>${esc(t('agTitle'))}</h2><div class="sub" style="word-break:normal">${esc(t('agWhat'))}</div>${i.mode==='dev'?`<div class="pay-priv" style="color:#fcd57a;background:rgba(251,191,36,.12)">${esc(t('agDev'))}</div>`:''}
        <div class="pay-row"><span>${esc(t('agAccount'))}</span><b>${esc(fmtAcct(i.account))}</b></div>
        <div class="pay-row"><span>${esc(t('agBal'))}</span><b>${esc(fmtUnits(i.balances.USDT,6,2))} USDT · ${esc(fmtUnits(i.balances.NEAR,24,3))} NEAR</b></div>
        <div class="pay-row"><span>${esc(t('agLimits'))}</span><b>$${esc(L.perActionUsd)} ${esc(t('agPerAction'))} · $${esc(L.perDayUsd)} ${esc(t('agPerDay'))}${i.spentToday?` <small style="opacity:.7">(${esc(t('lmToday'))} $${esc(Number(i.spentToday).toFixed(2))})</small>`:''} <button id="aLim" style="padding:4px 10px;margin-left:6px">${esc(t('lmEdit'))}</button></b></div>
        <div id="aLimF" class="hidden"><div class="btns"><input id="aLa" inputmode="decimal" value="${esc(L.perActionUsd)}" style="flex:1;min-width:0" aria-label="per action"><input id="aLd" inputmode="decimal" value="${esc(L.perDayUsd)}" style="flex:1;min-width:0" aria-label="per day"><button class="primary" id="aLs">${esc(t('lmSign'))}</button></div><div class="sub">${esc(t('lmWhy').replace('{a}',(i.caps&&i.caps.perActionUsd)||500).replace('{d}',(i.caps&&i.caps.perDayUsd)||2000))}</div></div>
        <div class="btns"><input id="aAmt" inputmode="decimal" value="3" style="flex:1;min-width:0;border-radius:14px;border:1px solid rgba(160,200,255,.25);background:#0a1430;color:#fff;padding:10px;font:inherit"><select id="aTok" style="border-radius:14px;border:1px solid rgba(160,200,255,.25);background:#0a1430;color:#fff;padding:10px;font:inherit"><option>USDT</option><option>NEAR</option></select><button class="primary" id="aTop">${esc(t('agTopUp'))}</button></div>
        <div class="sub">${esc(t('agTopNear'))}</div>
        <div class="btns"><button id="aXc">🌐 ${esc(t('xTop'))}</button></div>
        <div class="pay-st" id="aSt">${esc(msg||'')}</div>
        ${w.hasAgentSession()?`<div class="sub">✓ ${esc(t('agAllowed'))}</div>`:`<div class="btns"><button class="primary" id="aA">${esc(t('agAllow'))}</button></div><div class="sub">${esc(t('agAllowWhy'))}</div>`}
        <div class="btns"><button id="aL">${esc(t('dcaList'))}</button><button id="aC">${esc(t('ctList'))}</button></div>
        <div class="btns"><button id="aMy">💼 ${esc(t('mbTitle'))}</button></div>
        <div class="btns"><button id="aW">${esc(t('agWithdraw'))}</button><button id="aD">${esc(t('agDisconnect'))}</button><button id="aX">OK</button></div>`;
      $('aX').onclick=closePay; $('aD').onclick=async()=>{ await w.disconnect(); closePay(); };
      $('aL').onclick=()=>dcaRun({op:'list'}); $('aC').onclick=contactsSheet; $('aXc').onclick=()=>xDepositSheet({agent:true}); $('aMy').onclick=myBalanceSheet;
      $('aLim').onclick=()=>$('aLimF').classList.toggle('hidden');
      $('aLs').onclick=async()=>{ const st=$('aSt'); try{
          const a=String($('aLa').value).replace(',','.'), d=String($('aLd').value).replace(',','.');
          if(!/^\d+(\.\d{1,2})?$/.test(a)||!/^\d+(\.\d{1,2})?$/.test(d)) throw new Error('amount');
          st.textContent=t('lmSigning'); await w.agentSetLimits(Number(a),Number(d)); draw(t('lmSaved'));
        }catch(e){ st.textContent=t('payErr')+((e&&e.message)||t('payDeclined')); } };
      if($('aA')) $('aA').onclick=async()=>{ const st=$('aSt'); try{ st.textContent=t('agSession'); await w.agentSession(); draw(t('agAllowed')); }catch(e){ st.textContent=t('payErr')+((e&&e.message)||t('payDeclined')); } };
      // Top up = a private payment to the agent wallet through NEAR Intents (pay with whatever you hold).
      $('aTop').onclick=async()=>{ const st=$('aSt'); try{
          const amt=String($('aAmt').value).replace(',','.'); if(!/^\d+(\.\d{1,6})?$/.test(amt)||Number(amt)<=0) throw new Error('amount');
          closePay(); openPay({proposal:{action:'send',amount:amt,token:$('aTok').value,to:i.account}});
        }catch(e){ st.textContent=t('payErr')+((e&&e.message)||t('payDeclined')); } };
      $('aW').onclick=async()=>{ const st=$('aSt'); try{ st.textContent='…'; await w.agentWithdraw(); draw(t('agBack')); }catch(e){ st.textContent=t('payErr')+((e&&e.message)||t('payDeclined')); } };
    };
    draw();
  }

  // ---------------- Voice via Whisper in a TEE (recorded here, transcribed inside the enclave) ----------------
  let sttServer=false, recState=null;
  const canRecord=()=>sttServer && window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  async function toWav(blob){
    const AC=window.AudioContext||window.webkitAudioContext; const c=new AC();
    let buf; try{ buf=await c.decodeAudioData(await blob.arrayBuffer()); } finally { try{ c.close(); }catch(e){} }
    const rate=16000, n=Math.max(1,Math.round(buf.duration*rate));
    const off=new (window.OfflineAudioContext||window.webkitOfflineAudioContext)(1,n,rate);
    const s=off.createBufferSource(); s.buffer=buf; s.connect(off.destination); s.start();
    const pcm=(await off.startRendering()).getChannelData(0);
    const out=new DataView(new ArrayBuffer(44+pcm.length*2)); const w=(o,str)=>{ for(let i=0;i<str.length;i++) out.setUint8(o+i,str.charCodeAt(i)); };
    w(0,'RIFF'); out.setUint32(4,36+pcm.length*2,true); w(8,'WAVE'); w(12,'fmt '); out.setUint32(16,16,true); out.setUint16(20,1,true); out.setUint16(22,1,true);
    out.setUint32(24,rate,true); out.setUint32(28,rate*2,true); out.setUint16(32,2,true); out.setUint16(34,16,true); w(36,'data'); out.setUint32(40,pcm.length*2,true);
    for(let i=0;i<pcm.length;i++){ const v=Math.max(-1,Math.min(1,pcm[i])); out.setInt16(44+i*2,v<0?v*0x8000:v*0x7fff,true); }
    return new Blob([out],{type:'audio/wav'});
  }
  async function startRecording(){
    stopSpeaking();
    let stream;
    try{ stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}}); }
    catch(e){ showText(true); speak(t('micDenied')); return; }
    const mime=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg;codecs=opus'].find(m=>MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(m))||'';
    const mr=new MediaRecorder(stream,mime?{mimeType:mime}:{}); const parts=[];
    const AC=window.AudioContext||window.webkitAudioContext; const ac=new AC(); try{ if(ac.state!=='running') ac.resume(); }catch(e){} const srcN=ac.createMediaStreamSource(stream); const an=ac.createAnalyser(); an.fftSize=1024; srcN.connect(an);
    const data=new Uint8Array(an.fftSize); let heard=false, meterMoved=false, peak=0, lastLoud=performance.now(); const t0=performance.now();
    recState={mr,stream,ac,stopped:false};
    mr.ondataavailable=e=>{ if(e.data&&e.data.size) parts.push(e.data); };
    mr.onstop=async()=>{
      stream.getTracks().forEach(tr=>tr.stop()); try{ac.close();}catch(e){}
      mic.classList.remove('rec'); recognizing=false; recState=null;
      // mobile browsers may keep the level meter muted (AudioContext not running): then trust the recording itself
      const meterDead=ac.state!=='running'||!meterMoved, size=parts.reduce((a,b)=>a+b.size,0);
      let diag=`[rec ${Math.round(size/1024)} KB · ${mr.mimeType||'?'} · meter ${ac.state}${meterMoved?'':' silent'} · peak ${peak.toFixed(3)}`;
      if(!heard && !(meterDead && size>6000)){ if(mode==='listen'){ setMode('idle'); hideBubble(); } speak(t('noHear')).then(()=>setStatus(diag+']')); return; }
      setStatus(t('transcribing')); setMode('think'); say('',{dots:true,user:true});
      let blob=new Blob(parts,{type:mr.mimeType||'audio/webm'});
      // Whisper accepts 16 kHz mono WAV from every browser; the recorder's own webm/mp4 is the fallback
      try{ blob=await toWav(blob); diag+=' → wav '+Math.round(blob.size/1024)+' KB'; }catch(e){ diag+=' (no wav)'; }
      try{
        const r=await fetch('api/stt?lang='+lang,{method:'POST',headers:{'Content-Type':blob.type.split(';')[0]},body:blob});
        const d=await r.json().catch(()=>({}));
        if(r.status===429){ speak(d.error==='daily_limit'?t('limitDay'):t('limitUser')); return; }
        if(!r.ok||!d.text){ throw new Error('stt '+r.status+' '+(d.error||'')+(d.detail?' '+d.detail:'')+(r.ok&&!d.text?' no text':'')); }
        ask(d.text);
      }catch(e){ setMode('idle'); speak(t('noHear')).then(()=>setStatus(diag+' · '+((e&&e.message)||'network')+']')); }
    };
    const tick=()=>{
      if(!recState||recState.stopped) return;
      an.getByteTimeDomainData(data); let sum=0; for(const v of data){ const x=(v-128)/128; sum+=x*x; }
      const rms=Math.sqrt(sum/data.length), now=performance.now();
      if(rms>peak) peak=rms; if(rms>0.002) meterMoved=true;
      if(rms>0.02){ heard=true; lastLoud=now; }
      // no level meter → no silence detection: stop after 8 s or on a second tap
      if((heard&&now-lastLoud>1000)||now-t0>15000||(!heard&&now-t0>(meterMoved?6000:8000))) return stopRecording();
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
    ask(v,{typed:true}); });

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


  // ---------------- Фон: светящийся круг ровно под ногами SECRA ----------------
  const bgImg=$('bgimg'), appEl=document.querySelector('.app');
  let RING={x:0.5,y:0.858}; // где на картинке фона находится круг (доли ширины и высоты); профиль бизнеса может задать свой фон
  function layoutBg(){
    if(!bgImg.naturalWidth) return;
    const app=appEl.getBoundingClientRect(), ch=charEl.getBoundingClientRect();
    const W=app.width, iw=bgImg.naturalWidth, ih=bgImg.naturalHeight;
    const feetY=ch.bottom-app.top-ch.height*0.025, feetX=ch.left-app.left+ch.width*0.5;
    const H=app.height;
    let sc=feetY/(ih*RING.y);           // масштаб по высоте: круг всегда одного размера относительно SECRA
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

  // ---------------- 3D SECRA ----------------
  function onReact(kind){
    if(!started || mode!=='idle' || uttActive || curSource) return;
    const L=T[lang];
    if(kind==='tickle') speak(L.tickle[tickleIdx++ % L.tickle.length],{face:'laugh'});
    else if(kind==='fall') setTimeout(()=>{ if(mode==='idle') speak(L.fall[Math.floor(Math.random()*L.fall.length)]); },2600);
    else if(kind==='annoyed') speak(L.annoyed[Math.floor(Math.random()*L.annoyed.length)]);
    else if(kind==='poke' && Math.random()<0.5) speak(L.poke[Math.floor(Math.random()*L.poke.length)]);
  }
  if(window.__use3d) import('./knight3d.js?v=6').then(m=>m.createKnight(charEl,{onReact})).then(k=>{
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
