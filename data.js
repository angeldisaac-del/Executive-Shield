const I18N = {
  es: {
    rotate: "GIRA TU IPHONE EN HORIZONTAL", live: "● PORTADA EN VIVO", menuBtn: "🎛️ MENÚ",
    coverTitle: "PROTECCIÓN PRESIDENCIAL", coverSub: "Arrastra el dedo para girar alrededor de los agentes, La Bestia y Marine One",
    enterBtn: "ENTRAR EN SERVICIO ▶", agencyTag: "1. AGENCIA Y MANDATARIO", opsTag: "2. OPERACIONES",
    backBtn: "◀ PORTADA", deployBtn: "INICIAR OPERACIÓN ▶", routine: "PROTOCOLO", hollywood: "ALTO RIESGO",
    passed: "MISIÓN SUPERADA • PATRULLA LIBRE", radio: "NUEVA ALERTA POR RADIO", acceptNext: "ACEPTAR SIGUIENTE MISIÓN ▶",
    limo: "LIMUSINA", heli: "HELICÓPTERO", plane: "AVIÓN VIP", meta: "META",
    tabConvoy: "🚘 CONVOY", tabFoot: "🛡️ A PIE", tabAir: "✈️ AÉREO", tabInf: "♾️ ALERTA"
  },
  en: {
    rotate: "ROTATE YOUR IPHONE TO LANDSCAPE", live: "● LIVE COVER", menuBtn: "🎛️ HUB",
    coverTitle: "PRESIDENTIAL PROTECTION", coverSub: "Drag to orbit around Secret Service agents, The Beast & Marine One",
    enterBtn: "ENTER SERVICE ▶", agencyTag: "1. AGENCY & HEAD OF STATE", opsTag: "2. OPERATIONS",
    backBtn: "◀ COVER", deployBtn: "START OPERATION ▶", routine: "PROTOCOL", hollywood: "HIGH RISK",
    passed: "MISSION PASSED • FREE ROAM", radio: "INCOMING RADIO ALERT", acceptNext: "ACCEPT NEXT MISSION ▶",
    limo: "LIMOUSINE", heli: "HELICOPTER", plane: "VIP AIRCRAFT", meta: "GOAL",
    tabConvoy: "🚘 CONVOY", tabFoot: "🛡️ FOOT", tabAir: "✈️ AIR", tabInf: "♾️ ALERT"
  },
  ru: {
    rotate: "ПОВЕРНИТЕ ЭКРАН ГОРИЗОНТАЛЬНО", live: "● ПРЯМОЙ ЭФИР", menuBtn: "🎛️ МЕНЮ",
    coverTitle: "ОХРАНА ПРЕЗИДЕНТА", coverSub: "Вращайте камеру вокруг агентов, кортежа и вертолёта",
    enterBtn: "НАЧАТЬ СЛУЖБУ ▶", agencyTag: "1. СЛУЖБА И ЛИДЕР", opsTag: "2. ОПЕРАЦИИ",
    backBtn: "◀ ОБЛОЖКА", deployBtn: "НАЧАТЬ ОПЕРАЦИЮ ▶", routine: "ПРОТОКОЛ", hollywood: "ВЫСОКИЙ РИСК",
    passed: "МИССИЯ ВЫПОЛНЕНА • ПАТРУЛЬ", radio: "СИГНАЛ ПО РАЦИИ", acceptNext: "ПРИНЯТЬ МИССИЮ ▶",
    limo: "ЛИМУЗИН", heli: "ВЕРТОЛЁТ", plane: "БОРТ №1", meta: "ЦЕЛЬ",
    tabConvoy: "🚘 КОРТЕЖ", tabFoot: "🛡️ ОХРАНА", tabAir: "✈️ АВИА", tabInf: "♾️ ТРЕВОГА"
  },
  pt: {
    rotate: "GIRE SEU IPHONE NA HORIZONTAL", live: "● CAPA AO VIVO", menuBtn: "🎛️ MENU",
    coverTitle: "PROTEÇÃO PRESIDENCIAL", coverSub: "Arraste para girar ao redor dos agentes, A Besta e Marine One",
    enterBtn: "ENTRAR EM SERVIÇO ▶", agencyTag: "1. AGÊNCIA E MANDATÁRIO", opsTag: "2. OPERAÇÕES",
    backBtn: "◀ CAPA", deployBtn: "INICIAR OPERAÇÃO ▶", routine: "PROTOCOLO", hollywood: "ALTO RISCO",
    passed: "MISSÃO CONCLUÍDA • PATRULHA", radio: "NOVO ALERTA DE RÁDIO", acceptNext: "ACEITAR PRÓXIMA ▶",
    limo: "LIMUSINE", heli: "HELICÓPTERO", plane: "AVIÃO VIP", meta: "META",
    tabConvoy: "🚘 COMBOIO", tabFoot: "🛡️ A PÉ", tabAir: "✈️ AÉREO", tabInf: "♾️ ALERTA"
  },
  fr: {
    rotate: "TOURNEZ VOTRE IPHONE EN PAYSAGE", live: "● EN DIRECT", menuBtn: "🎛️ MENU",
    coverTitle: "PROTECTION PRÉSIDENTIELLE", coverSub: "Glissez pour tourner autour des agents, The Beast et Marine One",
    enterBtn: "ENTRER EN SERVICE ▶", agencyTag: "1. AGENCE ET CHEF D'ÉTAT", opsTag: "2. OPÉRATIONS",
    backBtn: "◀ ACCUEIL", deployBtn: "LANCER L'OPÉRATION ▶", routine: "PROTOCOLE", hollywood: "HAUT RISQUE",
    passed: "MISSION RÉUSSIE • PATROUILLE", radio: "ALERTE RADIO", acceptNext: "MISSION SUIVANTE ▶",
    limo: "LIMOUSINE", heli: "HÉLICOPTÈRE", plane: "AVION VIP", meta: "BUT",
    tabConvoy: "🚘 CONVOI", tabFoot: "🛡️ À PIED", tabAir: "✈️ AÉRIEN", tabInf: "♾️ ALERTE"
  },
  zh: {
    rotate: "请将手机横屏放置", live: "● 实时封面", menuBtn: "🎛️ 菜单",
    coverTitle: "总统安保行动", coverSub: "拖动屏幕环视特勤局特工、野兽专车与海军陆战队一号",
    enterBtn: "进入执勤 ▶", agencyTag: "1. 安保机构与国家元首", opsTag: "2. 行动部署",
    backBtn: "◀ 返回封面", deployBtn: "开始行动 ▶", routine: "常规礼宾", hollywood: "高危行动",
    passed: "任务完成 • 自由巡逻中", radio: "新无线电警报", acceptNext: "接受下一个任务 ▶",
    limo: "防弹专车", heli: "直升机", plane: "总统专机", meta: "目标",
    tabConvoy: "🚘 车队", tabFoot: "🛡️ 护卫", tabAir: "✈️ 专机", tabInf: "♾️ 警戒"
  }
};

const FACTIONS = {
  usa: {
    stamp: "USA", carColor: 0x0b1120, heliTop: 0xffffff, heliBody: 0x1b4332,
    car: 'CADILLAC ONE "THE BEAST"', heli: "MARINE ONE (VH-3D)", plane: "AIR FORCE ONE (VC-25)",
    leaders: [
      { label: "45/47 • TRUMP", name: "DONALD J. TRUMP", codename: "CODENAME: MOGUL" },
      { label: "44 • OBAMA", name: "BARACK OBAMA", codename: "CODENAME: RENEGADE" },
      { label: "43 • BUSH", name: "GEORGE W. BUSH", codename: "CODENAME: TRAILBLAZER" }
    ],
    missions: {
      convoy: [
        { title: "01. Ruta al Capitolio", desc: "Mantén la formación con la escolta.", risk: "routine", dist: 450 },
        { title: "02. Emboscada en Túnel", desc: "Esquiva barricadas y protege La Bestia.", risk: "hollywood", dist: 700 }
      ],
      foot: [{ title: "03. Salida Casa Blanca", desc: "Asegura el perímetro con tus agentes.", risk: "routine", dist: 400 }],
      air: [{ title: "04. Despegue Marine One", desc: "Traslado VIP hacia la base aérea.", risk: "routine", dist: 500 }]
    }
  },
  rus: {
    stamp: "RUS", carColor: 0x1f0d14, heliTop: 0x1d4ed8, heliBody: 0xe2e8f0,
    car: "AURUS SENAT", heli: "MIL MI-8 VIP", plane: "ILYUSHIN IL-96",
    leaders: [{ label: "PRESIDENT • PUTIN", name: "VLADIMIR PUTIN", codename: "CODENAME: KREMLIN-1" }],
    missions: {
      convoy: [{ title: "01. Avenida Kutuzovsky", desc: "Tránsito presidencial rápido.", risk: "routine", dist: 450 }],
      foot: [{ title: "02. Protocolo Plaza Roja", desc: "Escolta cerrada del FSO.", risk: "routine", dist: 400 }],
      air: [{ title: "03. Vuelo Mil Mi-8", desc: "Despegue desde el Kremlin.", risk: "routine", dist: 500 }]
    }
  },
  chn: {
    stamp: "CHN", carColor: 0x260a0a, heliTop: 0xdc2626, heliBody: 0x1e293b,
    car: "HONGQI N701", heli: "HARBIN Z-20", plane: "B747-8 VIP",
    leaders: [{ label: "PRESIDENT • XI", name: "XI JINPING", codename: "CODENAME: DRAGON-1" }],
    missions: {
      convoy: [{ title: "01. Avenida Chang'an", desc: "Caravana Hongqi sincronizada.", risk: "routine", dist: 450 }],
      foot: [{ title: "02. Gran Salón del Pueblo", desc: "Control diplomático.", risk: "routine", dist: 400 }],
      air: [{ title: "03. Traslado Z-20 VIP", desc: "Vuelo entre rascacielos.", risk: "routine", dist: 500 }]
    }
  }
};

