
import gallery1 from '@/assets/services/file_3.jpg';
import gallery2 from '@/assets/services/file_11.jpg';
import gallery3 from '@/assets/services/file_12.jpg';
import gallery4 from '@/assets/services/file_13.jpg';
import gallery5 from '@/assets/services/file_15.jpg';
import gallery6 from '@/assets/services/file_16.jpg';
import construction1 from '@/assets/services/file_19.jpg';
import construction2 from '@/assets/services/file_21.jpg';
import construction3 from '@/assets/services/file_22.jpg';
import design1 from '@/assets/services/file_23.jpg';
import design2 from '@/assets/services/file_24.jpg';
import design3 from '@/assets/services/file_25.jpg';
import remodeling1 from '@/assets/services/file_26.jpg';
import remodeling2 from '@/assets/services/file_27.jpg';
import remodeling3 from '@/assets/services/file_28.jpg';
import repairs1 from '@/assets/services/file_29.jpg';
import repairs2 from '@/assets/services/file_30.jpg';
import repairs3 from '@/assets/services/file_31.jpg';
import slide1 from '@/assets/services/file_32.jpg';
import slide2 from '@/assets/services/file_33.jpg';
import slide3 from '@/assets/services/file_34.jpg';

export interface ProjectStats {
  surfaceWithoutWalls?: string;
  floorArea?: string;
  volume?: string;
  rooms?: number;
  doors?: number;
  windows?: number;
  ceilingHeight?: string;
  interiorWallThickness?: string;
  exteriorWallThickness?: string;
}

export interface ProjectMetadata {
  id: number;
  name: string;
  teaser: string;
  image: string;
  caption: string;
  intro: string;
  challenge: string;
  outcome: string;
  quote: string;
  quoteAuthor: string;
  category: string;
  client: string;
  location: string;
  year: string;
  link: string;
  model3dUrl?: string;
  model3dUrls?: string[];
  stats?: ProjectStats;
}

export const projectsData: ProjectMetadata[] = [
  {
    id: 1,
    name: "حدائق الندى السكنية",
    teaser: "واحة عصرية تجمع الراحة والهدوء وسط الطبيعة الخضراء.",
    image: gallery1,
    caption: "مساحات خضراء تتناغم مع خطوط التصميم الحديث.",
    intro: "مشروع حدائق الندى السكنية هو تجسيد للرقي والأمان وسط بيئة طبيعية خصبة خُصصت لعائلة تبحث عن الهدوء والتميز.",
    challenge: "كان التحدي يكمن في المزج بين المساحات الخضراء المفتوحة والتخطيط العمراني الذكي لتحقيق الخصوصية دون إقصاء الإضاءة أو الإطلالات.",
    outcome: "نجحنا في خلق بيئة معيشية تنبض بالحياة، حيث اعتبر السكان بيوتهم امتدادًا للطبيعة، مما عزز شعورهم بالرضا والإلهام كل يوم.",
    quote: "كل صباح هنا يحمل بداية جديدة بين عبق الأشجار وصفاء التصميم.",
    quoteAuthor: "م. نهى صالح – مالكة فيلا",
    category: "سكني – تصميم وتنفيذ",
    client: "عائلة الصالح",
    location: "القاهرة الجديدة",
    year: "2023",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=ZjI0ODhhMTY1ZTE3NTJkYzEzODBmOGJkMzNiYjlhNjAxOTY1NGQyODQxN2E3MGEzNTczN2I5OGMwZGU1YjNmMwmkQQ%2BOofXD0kjmJX1zq8yiFTlGO9FNzIl3WcIm2YdHffr2stJ7PZcc4ZWboojiRQ%3D%3D"
  },
  {
    id: 2,
    name: "فيلا الغروب الذهبي",
    teaser: "تصميم أنيق يحتفي بألوان الغروب ومساحات مفتوحة للسكينة.",
    image: gallery2,
    caption: "سيمفونية الألوان تلتقي مع العمارة المعاصرة.",
    intro: "فيلا الغروب الذهبي صممت خصيصًا لعائلة تقدّر الدفء والرفاهية والتكامل مع الطبيعة.",
    challenge: "دمجنا بين العناصر الطبيعية والانسيابية، مع استخدام تدرجات لون الغروب لإضفاء لمسة فنية مميزة على الواجهات والفراغات الداخلية.",
    outcome: "غدت الفيلا تحفة معمارية تدعو للاسترخاء، حيث بات الغروب موعدًا للجمال اليومي والشعور بالاحتواء.",
    quote: "لم أتوقع أن أشعر بالسكينة في كل زاوية كما أعيشها هنا.",
    quoteAuthor: "أ. جلال السالم – مالك",
    category: "فيلا خاصة – تصميم وتنفيذ",
    client: "عائلة السالم",
    location: "القاهرة",
    year: "2024",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=ZjI0ODhhMTY1ZTE3NTJkYzEzODBmOGJkMzNiYjlhNjAxOTY1NGQyODQxN2E3MGEzNTczN2I5OGMwZGU1YjNmMwmkQQ%2BOofXD0kjmJX1zq8yiFTlGO9FNzIl3WcIm2YdHffr2stJ7PZcc4ZWboojiRQ%3D%3D"
  },
  {
    id: 3,
    name: "مجمّع الأعمال الذكي",
    teaser: "فضاء عمل مبتكر يدمج بين التكنولوجيا والمرونة المعمارية.",
    image: gallery3,
    caption: "مكاتب عصرية تلهم الإبداع وتعزز الإنتاجية.",
    intro: "مجمع الأعمال الذكي هو رؤية مستقبلية لبيئة العمل الحديثة التي تجمع بين التقنية والراحة.",
    challenge: "التحدي كان في تصميم مساحات مرونة تتكيف مع احتياجات الشركات المختلفة مع دمج أحدث التقنيات الذكية.",
    outcome: "أصبح المجمع مركزًا نابضًا للأعمال يضم أكثر من 50 شركة ناشئة ومتوسطة في بيئة محفزة للنمو والابتكار.",
    quote: "هذا المكان غيّر طريقة تفكيرنا في العمل والتعاون.",
    quoteAuthor: "د. أحمد الخطيب – مدير عام شركة تقنية",
    category: "تجاري – تصميم وتنفيذ",
    client: "مجموعة الخليج للاستثمار",
    location: "دبي",
    year: "2023",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=ZjI0ODhhMTY1ZTE3NTJkYzEzODBmOGJkMzNiYjlhNjAxOTY1NGQyODQxN2E3MGEzNTczN2I5OGMwZGU1YjNmMwmkQQ%2BOofXD0kjmJX1zq8yiFTlGO9FNzIl3WcIm2YdHffr2stJ7PZcc4ZWboojiRQ%3D%3D"
  },
  {
    id: 4,
    name: "سكن الأفق البعيد",
    teaser: "وحدات شاهقة مطلة تضيء المدينة بحضورها وحسن تخطيطها.",
    image: gallery4,
    caption: "برج سكني يعانق السحاب بتصميم أنيق ومستدام.",
    intro: "سكن الأفق البعيد هو مشروع سكني فاخر يوفر إطلالات بانورامية خلابة على المدينة.",
    challenge: "كان التحدي في تحقيق التوازن بين الارتفاع الشاهق والاستدامة البيئية مع ضمان الراحة لجميع السكان.",
    outcome: "أصبح البرج معلمًا بارزًا في أفق المدينة ووجهة مفضلة للعائلات التي تبحث عن الفخامة والراحة.",
    quote: "كل يوم أستيقظ على منظر يأخذ الأنفاس، كأنني أعيش في لوحة فنية.",
    quoteAuthor: "م. سارة العتيبي – مقيمة بالبرج",
    category: "سكني – برج شاهق",
    client: "شركة العمران الحديث",
    location: "الكويت",
    year: "2022",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=ZjI0ODhhMTY1ZTE3NTJkYzEzODBmOGJkMzNiYjlhNjAxOTY1NGQyODQxN2E3MGEzNTczN2I5OGMwZGU1YjNmMwmkQQ%2BOofXD0kjmJX1zq8yiFTlGO9FNzIl3WcIm2YdHffr2stJ7PZcc4ZWboojiRQ%3D%3D"
  },
  {
    id: 5,
    name: "مركز التسوق الملكي",
    teaser: "تجربة تسوّق راقية تجمع بين الفخامة والحداثة.",
    image: gallery5,
    caption: "فضاءات تجارية تجمع بين التسوق والترفيه في بيئة راقية.",
    intro: "مركز التسوق الملكي هو وجهة تجارية وترفيهية متكاملة تقدم تجربة فريدة للزوار.",
    challenge: "التحدي كان في دمج المتاجر والمطاعم ومناطق الترفيه في تصميم متماسك يوفر تجربة سلسة للزوار.",
    outcome: "أصبح المركز الوجهة الأولى للتسوق في المنطقة، يستقبل أكثر من 100 ألف زائر شهريًا.",
    quote: "هذا المكان يجعل التسوق متعة حقيقية، كل تفصيلة مدروسة بعناية.",
    quoteAuthor: "أ. منى الشريف – زائرة دائمة",
    category: "تجاري – مركز تسوق",
    client: "مجموعة الشرق الأوسط التجارية",
    location: "عمّان",
    year: "2023",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=ZjI0ODhhMTY1ZTE3NTJkYzEzODBmOGJkMzNiYjlhNjAxOTY1NGQyODQxN2E3MGEzNTczN2I5OGMwZGU1YjNmMwmkQQ%2BOofXD0kjmJX1zq8yiFTlGO9FNzIl3WcIm2YdHffr2stJ7PZcc4ZWboojiRQ%3D%3D"
  },
  {
    id: 6,
    name: "مشروع الواحة الصناعية",
    teaser: "هندسة صناعية متقدمة ترتقي بمعايير الكفاءة والسلامة.",
    image: gallery6,
    caption: "مجمع صناعي حديث يجمع بين الكفاءة والاستدامة البيئية.",
    intro: "مشروع الواحة الصناعية هو مجمع صناعي متطور يضع معايير جديدة للإنتاج النظيف والمستدام.",
    challenge: "كان التحدي في تصميم مرافق صناعية تحقق أعلى معايير الإنتاجية مع الحفاظ على البيئة والسلامة المهنية.",
    outcome: "أصبح المشروع نموذجًا يُحتذى به في الصناعة النظيفة واستقطب أكبر الشركات الصناعية في المنطقة.",
    quote: "هذا المجمع أعاد تعريف مفهوم الصناعة الحديثة والمسؤولة.",
    quoteAuthor: "م. خالد البريكي – مدير مصنع",
    category: "صناعي – مجمع إنتاجي",
    client: "الهيئة العامة للصناعة",
    location: "الدوحة",
    year: "2024",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=ZjI0ODhhMTY1ZTE3NTJkYzEzODBmOGJkMzNiYjlhNjAxOTY1NGQyODQxN2E3MGEzNTczN2I5OGMwZGU1YjNmMwmkQQ%2BOofXD0kjmJX1zq8yiFTlGO9FNzIl3WcIm2YdHffr2stJ7PZcc4ZWboojiRQ%3D%3D"
  },
  {
    id: 7,
    name: "برج الرؤية",
    teaser: "رمز حضاري يعلو بتصميمه عن النمط التقليدي للمباني الشاهقة.",
    image: construction1,
    caption: "هندسة معمارية جريئة تشق طريقها نحو المستقبل.",
    intro: "برج الرؤية هو مشروع معماري طموح يجسد رؤية المدينة المستقبلية بتصميم فريد ومبتكر.",
    challenge: "التحدي كان في ابتكار تصميم معماري لا يضاهى مع دمج أحدث التقنيات الذكية والمستدامة.",
    outcome: "أصبح البرج رمزًا للمدينة ومحطة جذب للسياح والمستثمرين من جميع أنحاء العالم.",
    quote: "هذا البرج ليس مجرد مبنى، إنه بيان معماري يخاطب المستقبل.",
    quoteAuthor: "د. عبدالله الراشد – خبير عمراني",
    category: "تجاري – برج متعدد الاستخدامات",
    client: "شركة الرؤية للاستثمار",
    location: "أبو ظبي",
    year: "2023",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=ZjI0ODhhMTY1ZTE3NTJkYzEzODBmOGJkMzNiYjlhNjAxOTY1NGQyODQxN2E3MGEzNTczN2I5OGMwZGU1YjNmMwmkQQ%2BOofXD0kjmJX1zq8yiFTlGO9FNzIl3WcIm2YdHffr2stJ7PZcc4ZWboojiRQ%3D%3D"
  },
  {
    id: 8,
    name: "شقق الحياة الهادئة",
    teaser: "معيشة مثالية لعشّاق البساطة والرقي في آن واحد.",
    image: construction2,
    caption: "تصميم داخلي يتنفس الهدوء والأناقة.",
    intro: "شقق الحياة الهادئة مشروع سكني يستهدف الأفراد والعائلات الباحثين عن السكينة والجودة.",
    challenge: "كان التحدي في تحقيق الخصوصية والهدوء في منطقة حضرية نشطة مع توفير جميع وسائل الراحة العصرية.",
    outcome: "حقق المشروع نسبة إشغال 100% قبل اكتماله، وأصبح مثالاً للسكن الهادئ وسط المدينة.",
    quote: "أخيرًا وجدت المكان الذي يمنحني السلام الداخلي الذي أبحث عنه.",
    quoteAuthor: "أ. فاطمة الزهراني – مقيمة",
    category: "سكني – شقق فاخرة",
    client: "شركة السكن الهادئ",
    location: "الإسكندرية",
    year: "2024",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=ZjI0ODhhMTY1ZTE3NTJkYzEzODBmOGJkMzNiYjlhNjAxOTY1NGQyODQxN2E3MGEzNTczN2I5OGMwZGU1YjNmMwmkQQ%2BOofXD0kjmJX1zq8yiFTlGO9FNzIl3WcIm2YdHffr2stJ7PZcc4ZWboojiRQ%3D%3D"
  },
  {
    id: 9,
    name: "مركز أفق للتدريب",
    teaser: "بيئة تعليمية عصرية محفزة للإبداع وتطوير المهارات.",
    image: construction3,
    caption: "فضاءات تعليمية مرنة تلبي احتياجات التدريب الحديث.",
    intro: "مركز أفق للتدريب هو مؤسسة تعليمية متطورة تقدم برامج تدريبية متنوعة في بيئة محفزة للتعلم.",
    challenge: "التحدي كان في تصميم قاعات متعددة الاستخدامات قابلة للتكيف مع أنواع مختلفة من التدريب والتعليم.",
    outcome: "أصبح المركز الوجهة الأولى للتدريب المهني في المنطقة واستقطب أكثر من 5000 متدرب سنويًا.",
    quote: "البيئة هنا تشجع على التعلم والابتكار، كل قاعة صممت لتحفز الإبداع.",
    quoteAuthor: "د. محمد العلي – مدرب محترف",
    category: "تعليمي – مركز تدريب",
    client: "معهد التطوير المهني",
    location: "القاهرة",
    year: "2023",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=ZjI0ODhhMTY1ZTE3NTJkYzEzODBmOGJkMzNiYjlhNjAxOTY1NGQyODQxN2E3MGEzNTczN2I5OGMwZGU1YjNmMwmkQQ%2BOofXD0kjmJX1zq8yiFTlGO9FNzIl3WcIm2YdHffr2stJ7PZcc4ZWboojiRQ%3D%3D"
  },
  {
    id: 10,
    name: "محور العائلة الترفيهي",
    teaser: "فضاء نابض بالتسلية والخصوصية لكل أفراد الأسرة.",
    image: design1,
    caption: "مساحات ترفيهية متنوعة تجمع العائلة في أجواء مميزة.",
    intro: "محور العائلة الترفيهي هو مجمع ترفيهي شامل يقدم أنشطة متنوعة لجميع أفراد الأسرة.",
    challenge: "كان التحدي في تصميم مساحات تلبي احتياجات جميع الأعمار مع ضمان السلامة والمتعة في آن واحد.",
    outcome: "أصبح المجمع الوجهة العائلية الأولى في المدينة ويستقبل آلاف العائلات أسبوعيًا.",
    quote: "هذا المكان أصبح تقليدًا عائليًا أسبوعيًا، الكل يجد ما يحبه هنا.",
    quoteAuthor: "أ. عمر الحمادي – والد لثلاثة أطفال",
    category: "ترفيهي – مجمع عائلي",
    client: "شركة المرح العائلي",
    location: "الشارقة",
    year: "2024",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=ZjI0ODhhMTY1ZTE3NTJkYzEzODBmOGJkMzNiYjlhNjAxOTY1NGQyODQxN2E3MGEzNTczN2I5OGMwZGU1YjNmMwmkQQ%2BOofXD0kjmJX1zq8yiFTlGO9FNzIl3WcIm2YdHffr2stJ7PZcc4ZWboojiRQ%3D%3D"
  },
  {
    id: 11,
    name: "صالة التوازن الرياضي",
    teaser: "تصميم ديناميكي يلهم القوة والنشاط لكل رواده.",
    image: design2,
    caption: "نادي رياضي عصري يجمع بين الأداء والجمال المعماري.",
    intro: "صالة التوازن الرياضي هي نادي رياضي متطور يوفر بيئة مثالية لممارسة الرياضة واللياقة البدنية.",
    challenge: "التحدي كان في تصميم مساحات رياضية متنوعة مع أنظمة تهوية وإضاءة متقدمة تعزز الأداء الرياضي.",
    outcome: "أصبحت الصالة مقصدًا لعشاق الرياضة وحققت عضوية كاملة خلال أشهر من افتتاحها.",
    quote: "التمرين هنا يختلف تمامًا، التصميم يحفز على بذل أقصى جهد.",
    quoteAuthor: "كابتن أحمد سالم – مدرب شخصي",
    category: "رياضي – نادي صحي",
    client: "مجموعة اللياقة الذهبية",
    location: "المنامة",
    year: "2023",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=ZjI0ODhhMTY1ZTE3NTJkYzEzODBmOGJkMzNiYjlhNjAxOTY1NGQyODQxN2E3MGEzNTczN2I5OGMwZGU1YjNmMwmkQQ%2BOofXD0kjmJX1zq8yiFTlGO9FNzIl3WcIm2YdHffr2stJ7PZcc4ZWboojiRQ%3D%3D"
  },
  {
    id: 12,
    name: "منزل الأحلام الذكية",
    teaser: "منزل ذكي يواكب أحدث التقنيات ويمنح رفاهية متكاملة.",
    image: design3,
    caption: "تقنية ذكية تتكامل مع التصميم الأنيق في منزل المستقبل.",
    intro: "منزل الأحلام الذكية هو فيلا فاخرة تدمج أحدث التقنيات الذكية مع التصميم المعماري الراقي.",
    challenge: "كان التحدي في دمج أنظمة المنزل الذكي مع التصميم الكلاسيكي دون الإخلال بالجمال المعماري.",
    outcome: "أصبح المنزل نموذجًا للسكن الذكي وتم تصويره لعدة مجلات معمارية عالمية.",
    quote: "حياتي أصبحت أسهل وأكثر راحة، كل شيء يعمل بلمسة واحدة.",
    quoteAuthor: "د. ليلى المرزوقي – مالكة المنزل",
    category: "سكني – فيلا ذكية",
    client: "عائلة المرزوقي",
    location: "العين",
    year: "2024",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=ZjI0ODhhMTY1ZTE3NTJkYzEzODBmOGJkMzNiYjlhNjAxOTY1NGQyODQxN2E3MGEzNTczN2I5OGMwZGU1YjNmMwmkQQ%2BOofXD0kjmJX1zq8yiFTlGO9FNzIl3WcIm2YdHffr2stJ7PZcc4ZWboojiRQ%3D%3D"
  },
  {
    id: 13,
    name: "مجمع الورود الطبي",
    teaser: "مركز صحي حديث ينضح بالطمأنينة والرعاية الشاملة.",
    image: remodeling1,
    caption: "مرافق طبية عصرية تجمع بين التقنية المتقدمة والراحة النفسية.",
    intro: "مجمع الورود الطبي هو مركز رعاية صحية متكامل يقدم خدمات طبية متخصصة في بيئة مريحة ومطمئنة.",
    challenge: "التحدي كان في تصميم مرافق طبية تحقق أعلى معايير النظافة والسلامة مع خلق جو مريح وغير مخيف للمرضى.",
    outcome: "أصبح المجمع مرجعًا في الرعاية الصحية المتميزة واستقطب أفضل الأطباء والمتخصصين.",
    quote: "المكان يبعث الطمأنينة من اللحظة الأولى، يشعرك أنك في أيدٍ أمينة.",
    quoteAuthor: "أ. سعاد الخالدي – مريضة",
    category: "طبي – مجمع طبي",
    client: "مؤسسة الرعاية الصحية",
    location: "مسقط",
    year: "2023",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=ZjI0ODhhMTY1ZTE3NTJkYzEzODBmOGJkMzNiYjlhNjAxOTY1NGQyODQxN2E3MGEzNTczN2I5OGMwZGU1YjNmMwmkQQ%2BOofXD0kjmJX1zq8yiFTlGO9FNzIl3WcIm2YdHffr2stJ7PZcc4ZWboojiRQ%3D%3D"
  },
  {
    id: 14,
    name: "مطعم النكهة السرية",
    teaser: "تجربة تذوّق في أجواء ساحرة وتصميم دافئ يلامس الروح.",
    image: remodeling2,
    caption: "تصميم داخلي أنيق يخلق أجواء طعام لا تُنسى.",
    intro: "مطعم النكهة السرية هو مطعم فاخر يقدم تجربة طعام متميزة في أجواء ساحرة ومميزة.",
    challenge: "كان التحدي في خلق أجواء حميمية ودافئة مع توفير مساحات مناسبة لمختلف أنواع المناسبات.",
    outcome: "أصبح المطعم الوجهة الأولى للطعام الراقي في المدينة وحجز مكانته بين أفضل المطاعم.",
    quote: "ليس فقط الطعام رائع، لكن المكان يجعل كل وجبة مناسبة خاصة.",
    quoteAuthor: "الشيف ماركو روسي – شيف إيطالي",
    category: "تجاري – مطعم فاخر",
    client: "مجموعة المذاق الذهبي",
    location: "بيروت",
    year: "2024",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=ZjI0ODhhMTY1ZTE3NTJkYzEzODBmOGJkMzNiYjlhNjAxOTY1NGQyODQxN2E3MGEzNTczN2I5OGMwZGU1YjNmMwmkQQ%2BOofXD0kjmJX1zq8yiFTlGO9FNzIl3WcIm2YdHffr2stJ7PZcc4ZWboojiRQ%3D%3D"
  },
  {
    id: 15,
    name: "مكتبة المستقبل",
    teaser: "وجهة قرائية ملهمة تلهم الفكر وتنمّي الفضول.",
    image: remodeling3,
    caption: "فضاء معرفي عصري يجمع بين الكتب التقليدية والتقنية الحديثة.",
    intro: "مكتبة المستقبل هي مكتبة عامة حديثة تدمج بين المصادر التقليدية والرقمية في بيئة محفزة للتعلم.",
    challenge: "التحدي كان في تصميم مساحات هادئة للقراءة مع مناطق تفاعلية للأنشطة التعليمية والثقافية.",
    outcome: "أصبحت المكتبة مركزًا ثقافيًا نابضًا في المجتمع وتستقبل آلاف الزوار شهريًا.",
    quote: "هذا المكان أعاد حبي للقراءة، كل زاوية تدعو للاكتشاف والتعلم.",
    quoteAuthor: "أ. يوسف الكندي – باحث وكاتب",
    category: "ثقافي – مكتبة عامة",
    client: "وزارة الثقافة",
    location: "صنعاء",
    year: "2023",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=ZjI0ODhhMTY1ZTE3NTJkYzEzODBmOGJkMzNiYjlhNjAxOTY1NGQyODQxN2E3MGEzNTczN2I5OGMwZGU1YjNmMwmkQQ%2BOofXD0kjmJX1zq8yiFTlGO9FNzIl3WcIm2YdHffr2stJ7PZcc4ZWboojiRQ%3D%3D"
  },
  {
    id: 16,
    name: "قصور الصفاء البيضاء",
    teaser: "أناقة معمارية فاخرة مستوحاة من الصفاء الكلاسيكي.",
    image: repairs1,
    caption: "قصر أبيض يتنفس الفخامة والأناقة الخالدة.",
    intro: "قصور الصفاء البيضاء هو مجمع فلل فاخرة يجسد الأناقة الكلاسيكية مع اللمسات العصرية.",
    challenge: "كان التحدي في المزج بين الطراز الكلاسيكي الخالد مع وسائل الراحة والتقنيات الحديثة.",
    outcome: "أصبح المجمع رمزًا للفخامة والذوق الرفيع واستقطب عائلات من النخبة الاجتماعية.",
    quote: "العيش هنا كالحياة في قصر من قصص الحكايات، كل لحظة تشعر بالتميز.",
    quoteAuthor: "د. عبدالرحمن الفيصل – مالك قصر",
    category: "سكني – قصور فاخرة",
    client: "مجموعة القصور الملكية",
    location: "القاهرة",
    year: "2024",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=ZjI0ODhhMTY1ZTE3NTJkYzEzODBmOGJkMzNiYjlhNjAxOTY1NGQyODQxN2E3MGEzNTczN2I5OGMwZGU1YjNmMwmkQQ%2BOofXD0kjmJX1zq8yiFTlGO9FNzIl3WcIm2YdHffr2stJ7PZcc4ZWboojiRQ%3D%3D"
  },
  {
    id: 17,
    name: "مركز الإشراقة الثقافي",
    teaser: "منصة لقاء للمجتمع تحتفي بالفنون والتنوع الثقافي.",
    image: repairs2,
    caption: "مساحات ثقافية متنوعة تنبض بالحياة والإبداع.",
    intro: "مركز الإشراقة الثقافي هو مجمع ثقافي متعدد الاستخدامات يحتضن الفعاليات والأنشطة الثقافية المتنوعة.",
    challenge: "التحدي كان في تصميم مساحات مرنة تستوعب أنواعًا مختلفة من الفعاليات من المعارض إلى العروض المسرحية.",
    outcome: "أصبح المركز قلب النشاط الثقافي في المدينة ومنصة انطلاق للمواهب المحلية.",
    quote: "هذا المكان غيّر وجه الثقافة في مدينتنا، أصبح كل يوم جديد يحمل حدثًا مميزًا.",
    quoteAuthor: "أ. رانيا حداد – منسقة فعاليات ثقافية",
    category: "ثقافي – مركز فعاليات",
    client: "وزارة الثقافة والفنون",
    location: "تونس",
    year: "2023",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=ZjI0ODhhMTY1ZTE3NTJkYzEzODBmOGJkMzNiYjlhNjAxOTY1NGQyODQxN2E3MGEzNTczN2I5OGMwZGU1YjNmMwmkQQ%2BOofXD0kjmJX1zq8yiFTlGO9FNzIl3WcIm2YdHffr2stJ7PZcc4ZWboojiRQ%3D%3D"
  },
  {
    id: 18,
    name: "روضة الشمس الذهبية",
    teaser: "بيئة طفولية زاهية تنمو فيها البسمة وشغف الاكتشاف.",
    image: repairs3,
    caption: "فصول دراسية ملونة ومساحات لعب آمنة ومحفزة للإبداع.",
    intro: "روضة الشمس الذهبية هي روضة أطفال متطورة توفر بيئة تعليمية آمنة ومحفزة للنمو والتطور.",
    challenge: "كان التحدي في تصميم مساحات آمنة وممتعة للأطفال مع دمج أحدث أساليب التعليم المبكر.",
    outcome: "أصبحت الروضة الخيار الأول للعائلات في المنطقة وحققت قائمة انتظار طويلة للقبول.",
    quote: "ابنتي تحب الذهاب للروضة كل يوم، أصبحت أكثر إبداعًا وثقة بنفسها.",
    quoteAuthor: "أم أحمد – والدة طفلة بالروضة",
    category: "تعليمي – روضة أطفال",
    client: "مجموعة التعليم المبكر",
    location: "عمّان",
    year: "2024",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=ZjI0ODhhMTY1ZTE3NTJkYzEzODBmOGJkMzNiYjlhNjAxOTY1NGQyODQxN2E3MGEzNTczN2I5OGMwZGU1YjNmMwmkQQ%2BOofXD0kjmJX1zq8yiFTlGO9FNzIl3WcIm2YdHffr2stJ7PZcc4ZWboojiRQ%3D%3D"
  },
  {
    id: 19,
    name: "مباني اللوتس السكنية",
    teaser: "شقق رحبة تحتضن الجمال والسلام في كل تفصيلة.",
    image: slide1,
    caption: "تصميم معماري هادئ يستوحي جماله من زهرة اللوتس.",
    intro: "مباني اللوتس السكنية هي مجمع سكني راقي يوفر شقق عصرية في بيئة هادئة ومتوازنة.",
    challenge: "التحدي كان في تحقيق التوازن بين الخصوصية والانفتاح مع دمج العناصر الطبيعية في التصميم.",
    outcome: "حقق المشروع نسبة رضا عالية بين السكان وأصبح نموذجًا للسكن المتوازن في المدينة.",
    quote: "هنا أجد السلام الذي أحتاجه بعد يوم عمل طويل، كل شيء مصمم بحب.",
    quoteAuthor: "م. خديجة العامري – مقيمة",
    category: "سكني – مجمع شقق",
    client: "شركة اللوتس للإسكان",
    location: "الدار البيضاء",
    year: "2023",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=ZjI0ODhhMTY1ZTE3NTJkYzEzODBmOGJkMzNiYjlhNjAxOTY1NGQyODQxN2E3MGEzNTczN2I5OGMwZGU1YjNmMwmkQQ%2BOofXD0kjmJX1zq8yiFTlGO9FNzIl3WcIm2YdHffr2stJ7PZcc4ZWboojiRQ%3D%3D"
  },
  {
    id: 20,
    name: "مجمع النور التجاري",
    teaser: "مركز أعمال حي يلبي احتياجات رواد الأعمال والشركات الحديثة.",
    image: slide2,
    caption: "مكاتب ذكية ومساحات عمل مشتركة في بيئة محفزة للنجاح.",
    intro: "مجمع النور التجاري هو مركز أعمال متطور يوفر بيئة عمل مثالية للشركات والمؤسسات الحديثة.",
    challenge: "كان التحدي في تصميم مساحات عمل مرنة تتكيف مع احتياجات الشركات المختلفة مع توفير خدمات متميزة.",
    outcome: "أصبح المجمع مقر أكثر من 200 شركة ومؤسسة ومركزًا للأعمال التجارية في المنطقة.",
    quote: "موقع مثالي وخدمات ممتازة، نمت شركتنا بشكل ملحوظ منذ انتقلنا هنا.",
    quoteAuthor: "د. محمد البلوشي – مدير شركة تقنية",
    category: "تجاري – مركز أعمال",
    client: "مجموعة النور للاستثمار",
    location: "دبي",
    year: "2024",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=ZjI0ODhhMTY1ZTE3NTJkYzEzODBmOGJkMzNiYjlhNjAxOTY1NGQyODQxN2E3MGEzNTczN2I5OGMwZGU1YjNmMwmkQQ%2BOofXD0kjmJX1zq8yiFTlGO9FNzIl3WcIm2YdHffr2stJ7PZcc4ZWboojiRQ%3D%3D"
  },
  {
    id: 21,
    name: "جناح التصميم المفتوح",
    teaser: "مساحة عمل إبداعية تتيح حرية الابتكار وروح الفريق.",
    image: slide3,
    caption: "ستوديو تصميم عصري يدمج بين الإبداع والتقنية المتقدمة.",
    intro: "جناح التصميم المفتوح هو ستوديو إبداعي متطور يوفر بيئة مثالية للمصممين والفنانين.",
    challenge: "التحدي كان في خلق مساحة مفتوحة تشجع على التعاون مع توفير مناطق هادئة للتفكير الإبداعي.",
    outcome: "أصبح المكان مقصدًا للمواهب الإبداعية وشهد إنتاج أعمال فنية وتصميمية مميزة.",
    quote: "هذا المكان يطلق العنان للإبداع، كل يوم أكتشف إلهامًا جديدًا.",
    quoteAuthor: "أ. لينا قاسم – مصممة جرافيك",
    category: "إبداعي – ستوديو تصميم",
    client: "جمعية المصممين العرب",
    location: "القاهرة",
    year: "2024",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=ZjI0ODhhMTY1ZTE3NTJkYzEzODBmOGJkMzNiYjlhNjAxOTY1NGQyODQxN2E3MGEzNTczN2I5OGMwZGU1YjNmMwmkQQ%2BOofXD0kjmJX1zq8yiFTlGO9FNzIl3WcIm2YdHffr2stJ7PZcc4ZWboojiRQ%3D%3D"
  },
  {
    id: 22,
    name: "فرع أبو عوف – بنها",
    teaser: "فرع تجاري بمعايير العلامة الكاملة وارتفاع سقف يمنح إحساس الفخامة.",
    image: gallery1,
    caption: "مخطط فرع أبو عوف ببنها – مسح ميداني ثلاثي الأبعاد دقيق.",
    intro: "تنفيذ فرع أبو عوف في مدينة بنها وفق دليل العلامة التجارية، بمساحة مفتوحة وارتفاع سقف 3.40 م يعزّز تجربة العميل داخل المعرض.",
    challenge: "إعادة توزيع فراغ كبير برؤية موحّدة، مع 4 نقاط دخول/خروج وضمان حركة سلسة للزبائن وكفاءة عرض المنتج.",
    outcome: "فرع منفذ بدقة المسح ثلاثي الأبعاد ومخطط معتمد، جاهز لإجراءات التشغيل والتسويق الفوري.",
    quote: "المسح ثلاثي الأبعاد قبل التنفيذ وفّر علينا أسابيع من التعديلات.",
    quoteAuthor: "إدارة مشاريع أبو عوف",
    category: "تجاري – فرع تجزئة",
    client: "أبو عوف Abu Auf",
    location: "بنها، القليوبية",
    year: "2024",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=Y2M4MjY0ZWM4ZGQ0OGU4MzI4NjhhZDI1OWEyNjk1NDE5ZDU4NTk5MjVhMDA2NTljNDc1NTUzMGQ4MjNjZTMwMxPgr%2BAeXhBzlZ7j4k1EstSMTgd%2BQAnjaQcoq3n0tstBI8Hgu%2BagyEOCICZ42XlHIKL22SlYevbWMHWvj0yow2HQmi8NDwa%2Fnmui0bpt010b",
    stats: {
      surfaceWithoutWalls: "76.9 م²",
      floorArea: "46.3 م",
      volume: "192 م³",
      rooms: 1,
      doors: 4,
      windows: 0,
      ceilingHeight: "3.40 م",
      interiorWallThickness: "0.10 م",
      exteriorWallThickness: "0.15 م"
    }
  },
  {
    id: 23,
    name: "فرع أبو عوف – أركان بلازا",
    teaser: "فرع متكامل بـ 12 غرفة و7 نوافذ يجمع الإدارة والمعرض والمخازن في موقع حيوي.",
    image: gallery2,
    caption: "مخطط فرع أركان بلازا – توزيع تشغيلي متعدد الوظائف.",
    intro: "تنفيذ شامل لفرع أبو عوف داخل أركان بلازا بمساحة 183 م²، يضم منطقة عرض، مكاتب إدارية، ومخازن خلفية وفق التشغيل اليومي للعلامة.",
    challenge: "تقسيم مرن لـ 12 غرفة وظيفية مع 12 بابًا و7 نوافذ، مع الحفاظ على هوية بصرية واضحة ومسارات حركة احترافية.",
    outcome: "بيئة تشغيل متكاملة جاهزة للعمل بكفاءة عالية، تدعم تجربة العميل وكفاءة الفريق التشغيلي.",
    quote: "كل متر مربع تم استثماره بذكاء، الفرع يعمل كآلة دقيقة.",
    quoteAuthor: "مدير فرع أركان بلازا",
    category: "تجاري – فرع تجزئة متكامل",
    client: "أبو عوف Abu Auf",
    location: "أركان بلازا، الشيخ زايد",
    year: "2024",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=OTBiNTEzNjMzYTIyNWE0YTM1ZGZiZDMwZjRkOGQ1NDdmNDc3ZDhlMDQ0NzY2OGEwMTE5NGY1NGRmZTUxMTYyMWV8DT%2BlvMX1HW%2B65c5%2FPiv6Vn7EdSqdvS6h95mGfLdcfDK30Ylbs8maJwpyvuxjZLXln537hAEXG3YGxjvtRE4IWooddLyj5Rd6WjiYCucy",
    stats: {
      surfaceWithoutWalls: "183 م²",
      floorArea: "114 م",
      volume: "516 م³",
      rooms: 12,
      doors: 12,
      windows: 7,
      ceilingHeight: "2.50 م",
      interiorWallThickness: "0.12 م",
      exteriorWallThickness: "0.25 م"
    }
  },
  {
    id: 24,
    name: "فرع أبو عوف – متعدد الطوابق",
    teaser: "فرع تجاري بـ 4 مستويات وعرض ثلاثي الأبعاد متعدد الزوايا للمسح الكامل.",
    image: gallery3,
    caption: "مسح ميداني متعدد الطوابق بعرض تفاعلي شامل.",
    intro: "فرع أبو عوف متعدد الطوابق بمساحة 92.1 م²، يضم 6 غرف موزعة لخدمة الجمهور والإدارة والتخزين، مع مسح ثلاثي الأبعاد دقيق لكل طابق.",
    challenge: "توحيد التصميم عبر الطوابق الأربعة مع الحفاظ على هوية الفرع وتدفق العميل بين المستويات بسلاسة.",
    outcome: "مخطط نهائي معتمد جاهز للتنفيذ بدقة عالية، يوفر مرونة تشغيلية كاملة.",
    quote: "رؤية المشروع من كل زاوية قبل التنفيذ غيّرت طريقة اتخاذ القرار.",
    quoteAuthor: "مدير المشاريع",
    category: "تجاري – فرع متعدد الطوابق",
    client: "أبو عوف Abu Auf",
    location: "جمهورية مصر العربية",
    year: "2024",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=MGNjM2MwZGRjMDIxODdhMTMwZWMyZTIwNjhjZTBhNDJkNDc1MzJjODE4OTQxM2Y2ZTk5Mzk4OTI1OGQ0NDQzNhLqDjboFyJcjRzvgta4Ki93h6dxwdKtVTEJKPoGXCgRbiujSFBlozOIwAj3rj5DT8M%2Fz0nXbZ8Rr4x4xA4q3J0cqBglPkQJWKhJDZk8z9Rj",
    model3dUrls: [
      "https://3d.magicplan.app/#embed/?key=MGNjM2MwZGRjMDIxODdhMTMwZWMyZTIwNjhjZTBhNDJkNDc1MzJjODE4OTQxM2Y2ZTk5Mzk4OTI1OGQ0NDQzNhLqDjboFyJcjRzvgta4Ki93h6dxwdKtVTEJKPoGXCgRbiujSFBlozOIwAj3rj5DT8M%2Fz0nXbZ8Rr4x4xA4q3J0cqBglPkQJWKhJDZk8z9Rj"
    ],
    stats: {
      surfaceWithoutWalls: "92.1 م²",
      floorArea: "83.0 م",
      volume: "274 م³",
      rooms: 6,
      doors: 6,
      windows: 6,
      ceilingHeight: "2.44 م",
      interiorWallThickness: "0.12 م",
      exteriorWallThickness: "0.25 م"
    }
  },
  {
    id: 25,
    name: "فرع أبو عوف – وحدة مدمجة",
    teaser: "فرع مدمج بكفاءة عالية، مساحة مدروسة لكل سنتيمتر.",
    image: gallery4,
    caption: "مخطط وحدة تجارية مدمجة بمسح ميداني دقيق.",
    intro: "فرع مدمج بمساحة 52.8 م² صُمم بأقصى كفاءة استثمارية، يخدم الزبائن في موقع حيوي بأقل تكلفة تشغيل.",
    challenge: "تحقيق وظائف فرع متكامل ضمن مساحة محدودة دون التأثير على هوية العلامة أو راحة العميل.",
    outcome: "نموذج تشغيلي رشيق قابل للتكرار في فروع جديدة بنفس المعايير.",
    quote: "مساحة صغيرة، لكن تجربة عميل كاملة.",
    quoteAuthor: "فريق التطوير",
    category: "تجاري – فرع مدمج",
    client: "أبو عوف Abu Auf",
    location: "جمهورية مصر العربية",
    year: "2024",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=YWViZDAxMzE4ODc4M2I4MzVlZmE1YTQ1YmRiZDQwYmUxZTNmYjQ5OWUwYTYwYjMxMWY5YjVlNTRhZDNiMTU1Y1bOh1jIn1asxuqQvO3mAoB%2BQ6sjI12jBGPyKYJPvh%2F7AVBiwxrKEedkTOjTkAAPmnpkeY8oYqFz%2BKFNbPgxEcOQ%2FRiQKZUC0KmPGWZ5RkU8",
    stats: {
      surfaceWithoutWalls: "52.8 م²",
      floorArea: "39.5 م",
      volume: "195 م³",
      rooms: 2,
      doors: 2,
      windows: 0,
      ceilingHeight: "2.44 م",
      interiorWallThickness: "0.12 م",
      exteriorWallThickness: "0.25 م"
    }
  },
  {
    id: 26,
    name: "فرع أبو عوف – Elxe Loran",
    teaser: "فرع برج لوران بإسكندرية، ارتفاع سقف 3.70 م يمنح حضورًا بصريًا فاخرًا.",
    image: gallery5,
    caption: "مخطط فرع Elxe Loran – طابع كلاسيكي بسقوف مرتفعة.",
    intro: "فرع أبو عوف Elxe Loran في الإسكندرية بمساحة 49.1 م² وارتفاع 3.70 م يمنح المعرض رحابة بصرية مميزة تليق بالموقع التاريخي.",
    challenge: "توظيف الارتفاع الكبير للسقف لإبراز هوية العلامة التجارية، مع الحفاظ على دفء التجربة وكفاءة العرض.",
    outcome: "فرع متميز يعكس هوية أبو عوف وسط معمار الإسكندرية الكلاسيكي.",
    quote: "الارتفاع والإضاءة الطبيعية صنعا تجربة لا تُنسى داخل الفرع.",
    quoteAuthor: "إدارة فروع الإسكندرية",
    category: "تجاري – فرع تجزئة",
    client: "أبو عوف Abu Auf",
    location: "لوران، الإسكندرية",
    year: "2024",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=ZGU0YjY4MzczOTk3OWVjNGJjMWNlODViOGFmNWU4NzBkOWJkODM4NTQ5ODA0ZTQ0NmYyYzliNzM2YzBhYjYyZFhszvHnRcw%2FZZxLuH744UTToZiy2%2BEPrd%2Fxswny3VkBz6RomXXPH%2B8BV61crDdw5w%3D%3D",
    stats: {
      surfaceWithoutWalls: "49.1 م²",
      floorArea: "40.9 م",
      volume: "177 م³",
      rooms: 2,
      doors: 2,
      windows: 0,
      ceilingHeight: "3.70 م",
      interiorWallThickness: "0.10 م",
      exteriorWallThickness: "0.15 م"
    }
  },
  {
    id: 27,
    name: "فرع أبو عوف – المنصورة المشاية",
    teaser: "فرع بمنطقة المشاية بالمنصورة بسقف 3.60 م وحضور بصري قوي.",
    image: gallery6,
    caption: "مخطط فرع المنصورة المشاية – واجهة تجارية مميزة.",
    intro: "فرع أبو عوف بمنطقة المشاية في المنصورة بمساحة 60.1 م²، صُمم ليتكامل مع طبيعة الشارع التجاري النابض ويستقطب جمهور المشاة.",
    challenge: "تحويل واجهة المتجر إلى عنصر جذب رئيسي مع تنظيم داخلي يخدم حركة الزبائن المستمرة.",
    outcome: "فرع نشط أصبح من أبرز معالم المشاية بأداء مبيعات قوي منذ افتتاحه.",
    quote: "الفرع جزء من هوية المشاية الآن، ليس مجرد متجر.",
    quoteAuthor: "إدارة فروع الدلتا",
    category: "تجاري – فرع شارع",
    client: "أبو عوف Abu Auf",
    location: "المشاية، المنصورة",
    year: "2024",
    link: "#",
    model3dUrl: "https://3d.magicplan.app/#embed/?key=OThjY2VjZjVhMDJiMWJjZjUwMDk1OTRlYmY3MmI5OGE5NmY2MDMyNDhiMDM0MDMxYTQwNzllMjQzMDJlMWIwZFcHIQj6JXi1MqT5h6RYI%2Bw8CIBkSfHEDsK5z7Fuq2sfxYi5wklhp4ZRZrpg%2BEOEeC%2Foj1L9mC%2FPis2x5LsNzRL107giHOtKGnBsahI9wBzC",
    stats: {
      surfaceWithoutWalls: "60.1 م²",
      floorArea: "41.2 م",
      volume: "205 م³",
      rooms: 2,
      doors: 2,
      windows: 0,
      ceilingHeight: "3.60 م",
      interiorWallThickness: "0.12 م",
      exteriorWallThickness: "0.25 م"
    }
  }
];
