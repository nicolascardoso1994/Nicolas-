import { StudyPlan } from '../types/study';

export const SAMPLE_PHYSICS_PLAN: StudyPlan = {
  id: 'plan-fisica-1-demo',
  subject: 'Física I — Dinámica, Rozamiento y Energía',
  examType: 'Primer Parcial',
  examDate: '2026-11-17',
  folder: 'Física',
  pinned: true,
  createdAt: '2026-11-14T10:00:00.000Z',
  totalMinutes: 270,
  daysAvailable: 2,
  hoursPerDay: 2.25,
  pace: 'Equilibrado',
  executiveSummary:
    'Síntesis central para dominar Dinámica y Trabajo-Energía con criterio de examen universitario.',
  summarySections: [
    {
      order: 1,
      title: 'Conexión entre unidades',
      content:
        'Las leyes de Newton y el Teorema del Trabajo y la Energía describen el mismo movimiento desde dos herramientas distintas. Usá Newton cuando necesitás hallar aceleraciones, tensiones o fuerzas de contacto punto a punto; pasá a Energía cuando el problema conecta alturas, resortes o velocidades sin pedir el tiempo.',
      formulaLatex: '\\sum \\vec{F} = m\\vec{a} \\qquad \\Longleftrightarrow \\qquad W_{FNC} = \\Delta K + \\Delta U',
      formulaCaption: 'Elegí Newton para fuerzas y tiempos; elegí Energía para velocidades y distancias.',
    },
    {
      order: 2,
      title: 'Diagrama de Cuerpo Libre y fuerza Normal',
      content:
        'Alineá siempre el eje $x$ con la dirección posible de desplazamiento para anular la aceleración perpendicular ($a_y = 0$). La Normal es una reacción de apoyo que se despeja del eje perpendicular y no vale automáticamente $mg$.',
      formulaLatex: '\\sum F_y = 0 \\implies N = m g \\cos(\\theta)',
      formulaCaption: 'Expresión válida para un plano inclinado de ángulo θ sin otras fuerzas verticales.',
    },
    {
      order: 3,
      title: 'Umbral estático frente al deslizamiento dinámico',
      content:
        'Mientras el cuerpo no desliza, el rozamiento estático adopta solo el valor necesario para equilibrar el sistema hasta un tope máximo. Una vez superado ese umbral, actúa el rozamiento dinámico de módulo constante y trabajo negativo.',
      formulaLatex: 'f_{e,\\text{máx}} = \\mu_e \\cdot N \\qquad ; \\qquad f_d = \\mu_d \\cdot N',
      formulaCaption: 'Primero comprobá si vence f_e,máx; recién si desliza aplicás μ_d.',
    },
  ],
  adaptiveSummary: {
    tier: 'sprint',
    examDate: '2026-11-17',
    daysRemaining: 3,
    hoursPerDay: 2.5,
    totalEffectiveHours: 7.5,
    generatedAt: '2026-11-14T16:00:00.000Z',
    strategyTitle: 'Sprint Táctico (3 días): Núcleo Newton + Energía en 7.5 h útiles',
    compressedSummary:
      'Con 3 días de margen, el 80% de los puntos del parcial se concentra en plantear bien el Diagrama de Cuerpo Libre y decidir rápido cuándo usar balance energético.',
    summarySections: [
      {
        order: 1,
        title: 'Conexión entre unidades',
        content:
          'Si el ejercicio transcurre sobre un plano inclinado recto y pide aceleración o tiempo, resolvé por componentes con Newton. Si transcurre sobre una rampa curva o vincula velocidades entre dos alturas distintas, planteá directamente el balance energético.',
        formulaLatex: 'W_{FNC} = \\Delta E_M = (K_f + U_f) - (K_i + U_i)',
        formulaCaption: 'Recordá que el rozamiento disipa energía y siempre entra con signo negativo.',
      },
      {
        order: 2,
        title: 'Descomposición segura y chequeo del ángulo',
        content:
          'Al inclinar los ejes paralelos a la rampa, la componente del peso que desliza es proporcional al seno y la que aprieta al plano es proporcional al coseno. Para evitar errores de signo, imaginá llevar el ángulo a cero grados: la fuerza que aprieta debe coincidir con todo el peso.',
        formulaLatex: 'P_x = m g \\sin(\\theta) \\qquad ; \\qquad P_y = m g \\cos(\\theta)',
        formulaCaption: 'Verificá siempre que la calculadora esté en modo DEG.',
      },
      {
        order: 3,
        title: 'Verificación obligatoria antes de calcular aceleración',
        content:
          'Si el bloque parte del reposo con rozamiento estático, compará primero la fuerza motora contra el agarre máximo. Solo si lo supera el cuerpo acelera usando el coeficiente dinámico.',
        formulaLatex: 'a = \\frac{P_x - \\mu_d N}{m} = g\\big(\\sin\\theta - \\mu_d \\cos\\theta\\big)',
        formulaCaption: 'La aceleración resultante nunca puede superar g = 9.81 m/s².',
      },
    ],
    priorityTopics: [
      {
        topic: 'Diagramas de Cuerpo Libre y Plano Inclinado',
        weight: 'Prioridad Crítica',
        whyItMatters: 'Aparece en casi todos los primeros ejercicios de parcial y define los signos de toda la resolución.',
        quickRule: 'Alineá el eje $x$ con el movimiento posible; en plano inclinado $P_x = mg\\sin\\theta$ y $N = mg\\cos\\theta$.',
      },
      {
        topic: 'Umbral Estático vs. Deslizamiento Dinámico',
        weight: 'Prioridad Crítica',
        whyItMatters: 'Muchos parciales preguntan si el cuerpo se mueve antes de pedir la aceleración.',
        quickRule: 'Compará siempre $F_{\\text{motora}}$ contra $f_{e,\\text{máx}} = \\mu_e N$ antes de usar $\\mu_d$.',
      },
      {
        topic: 'Trabajo de Fuerzas No Conservativas y Energía',
        weight: 'Prioridad Alta',
        whyItMatters: 'Resuelve rampas curvas, resortes y choques con tramos posteriores en mitad de tiempo que Newton.',
        quickRule: 'Elegí referencia $h = 0$ en el punto más bajo del tramo y recordá que $W_{\\text{roce}} < 0$.',
      },
    ],
    mustMemorizeFormulas: [
      {
        name: 'Condición de deslizamiento y roce dinámico',
        latex: 'f_{e,\\text{máx}} = \\mu_e N \\qquad ; \\qquad f_d = \\mu_d N',
        survivalTip: 'Primero despejá $N$ del eje perpendicular; recién después multiplicá por $\\mu$.',
      },
      {
        name: 'Teorema Trabajo-Energía Mecánica',
        latex: 'W_{FNC} = \\Delta E_M = (K_f + U_f) - (K_i + U_i)',
        survivalTip: 'Si solo actúan gravedad y resortes ideales, $W_{FNC} = 0$ y la energía se conserva.',
      },
      {
        name: 'Torricelli (cinemática sin tiempo)',
        latex: 'v_f^2 = v_0^2 + 2 a d',
        survivalTip: 'Atajo ideal tras hallar aceleración constante con Newton cuando no te dan el tiempo.',
      },
    ],
    discardForNow: [
      'Demostraciones históricas extensas de teoremas integrales (enfocate en cuándo aplicar cada hipótesis).',
      'Casos excepcionales de coeficientes variables dependientes de la velocidad si no figuran en tu guía práctica.',
    ],
    lastHourChecklist: [
      'Confirmar que la calculadora esté en modo DEG (grados) y no en RAD.',
      'Verificar coherencia de unidades en SI ($\\text{kg}$, $\\text{m}$, $\\text{s}$, $\\text{N}$, $\\text{J}$).',
      'Comprobar que la aceleración obtenida en un plano inclinado sea menor a $g = 9.81\\text{ m/s}^2$.',
      'Revisar el signo negativo del trabajo de la fuerza de rozamiento.',
    ],
  },
  studyBlocks: [
    {
      id: 'blk-demo-1',
      sessionLabel: 'Día 1 · Bloque 1',
      title: 'Leyes de Newton, Normal y Fuerza de Rozamiento',
      category: 'teoria',
      durationMinutes: 45,
      objective:
        'Distinguir con claridad cuándo actúa el rozamiento estático ($f_e \\le \\mu_e N$) frente al dinámico ($f_d = \\mu_d N$).',
      deliverable: 'Dominar las 4 definiciones clave y evitar las trampas de signo.',
      targetTab: 'summary',
      completed: true,
    },
    {
      id: 'blk-demo-2',
      sessionLabel: 'Día 1 · Bloque 2',
      title: 'Práctica guiada: Bloque en plano inclinado con rozamiento',
      category: 'practica',
      durationMinutes: 60,
      objective:
        'Descomponer el peso sin memorizar fórmulas ciegas y calcular la aceleración paso a paso.',
      deliverable: 'Resolver completo el Ejercicio 1 verificando cada paso.',
      targetTab: 'exercises',
      completed: false,
    },
    {
      id: 'blk-demo-3',
      sessionLabel: 'Día 1 · Descanso activo',
      title: 'Pausa de consolidación cognitiva',
      category: 'descanso',
      durationMinutes: 15,
      objective: 'Despejar la vista de pantallas y fijar las ecuaciones principales.',
      deliverable: 'Descanso completo para sostener la retención.',
      targetTab: 'plan',
      completed: false,
    },
    {
      id: 'blk-demo-4',
      sessionLabel: 'Día 2 · Bloque 1',
      title: 'Trabajo de fuerzas no conservativas y energía mecánica',
      category: 'repaso',
      durationMinutes: 50,
      objective:
        'Entender la relación entre rozamiento, variación de energía mecánica y tiro parabólico.',
      deliverable: 'Completar la guía progresiva y el checklist de dominio.',
      targetTab: 'guide',
      completed: false,
    },
    {
      id: 'blk-demo-5',
      sessionLabel: 'Día 2 · Bloque 2',
      title: 'Ejercicio integrador: Rampa, rozamiento y lanzamiento',
      category: 'practica',
      durationMinutes: 60,
      objective:
        'Combinar conservación de energía en el tramo curvo con cinemática en el vuelo.',
      deliverable: 'Resolver el Ejercicio 2 sin consultar la respuesta final.',
      targetTab: 'exercises',
      completed: false,
    },
    {
      id: 'blk-demo-6',
      sessionLabel: 'Día 2 · Cierre',
      title: 'Autoevaluación rápida tipo parcial',
      category: 'simulacro',
      durationMinutes: 40,
      objective:
        'Detectar errores conceptuales de última hora antes de rendir.',
      deliverable: 'Obtener 4/4 en el cuestionario de verificación.',
      targetTab: 'guide',
      completed: false,
    },
  ],
  keyConcepts: [
    {
      id: 'con-demo-1',
      term: 'Fuerza Normal ($\\vec{N}$)',
      academicDefinition:
        'Reacción vincular ejercida por una superficie de contacto en dirección estrictamente perpendicular al plano tangente en el punto de apoyo. No tiene una fórmula universal propia: su módulo se despeja de la segunda ley de Newton en el eje perpendicular al contacto.',
      simpleExplanation:
        'Es la fuerza con la que el piso o la rampa "empujan hacia afuera" para evitar que el objeto la atraviese. No siempre vale $m\\cdot g$.',
      everydayExample:
        'Cuando estás parado en un ascensor que arranca hacia arriba, sentís más presión en tus pies: el piso empuja más fuerte ($N > mg$). En una rampa inclinada, en cambio, parte del peso desliza el cuerpo hacia abajo y solo una fracción aprieta la superficie ($N = mg\\cos\\theta$).',
    },
    {
      id: 'con-demo-2',
      term: 'Rozamiento Estático vs. Dinámico',
      academicDefinition:
        'La fuerza de rozamiento estático ($\\vec{f}_e$) se opone a la tendencia de movimiento relativo entre dos superficies en reposo mutuo y adopta exactamente el valor necesario para mantener el equilibrio hasta un umbral máximo $\\mu_e N$. Una vez iniciado el deslizamiento, actúa el rozamiento dinámico de módulo constante $f_d = \\mu_d N$.',
      simpleExplanation:
        'El rozamiento estático es "adaptable": si empujás suavemente una mesa pesada con $10\\text{ N}$ y no se mueve, el rozamiento vale exactamente $10\\text{ N}$, no el máximo posible.',
      everydayExample:
        'Empujar una heladera llena: cuesta muchísimo hacer que empiece a moverse (vencer $f_{e,\\text{máx}}$), pero una vez que desliza se vuelve un poco más liviana porque $\\mu_d < \\mu_e$.',
    },
    {
      id: 'con-demo-3',
      term: 'Teorema del Trabajo y la Energía Mecánica',
      academicDefinition:
        'La variación de la energía mecánica total de un sistema ($\\Delta E_M = \\Delta K + \\Delta U$) es igual al trabajo neto realizado por todas las fuerzas no conservativas que actúan sobre él.',
      simpleExplanation:
        'Si no hay rozamiento ni motores empujando, la energía total se transforma de altura a velocidad (y viceversa) sin perderse. Si hay rozamiento, el trabajo negativo del roce es la energía "perdida" en calor.',
      everydayExample:
        'Una montaña rusa sin motor sube lento en la cima (mucha energía potencial) y baja rapidísimo en el valle (energía cinética). Con viento y roce en las vías, la segunda colina siempre tiene que ser un poco más baja.',
    },
    {
      id: 'con-demo-4',
      term: 'Sistema de Referencia Inercial',
      academicDefinition:
        'Marco coordenado en el cual un cuerpo libre de interacciones netas mantiene su estado de reposo o movimiento rectilíneo uniforme, permitiendo aplicar $\\sum \\vec{F} = m\\vec{a}$ sin fuerzas ficticias.',
      simpleExplanation:
        'Elegir ejes cómodos (por ejemplo, eje $x$ inclinado paralelo a la rampa) simplifica la mitad de las cuentas, siempre que los ejes no estén acelerando.',
      everydayExample:
        'Dentro de un colectivo que frena de golpe pareciera que algo te empuja hacia adelante, pero desde la vereda (marco inercial) solo seguías con tu inercia mientras el colectivo frenaba.',
    },
  ],
  formulas: [
    {
      id: 'frm-demo-1',
      name: 'Segunda Ley de Newton (por componentes)',
      latex: '\\sum F_x = m \\cdot a_x \\qquad ; \\qquad \\sum F_y = m \\cdot a_y',
      variables: '$F$: Fuerza [$\\text{N}$], $m$: masa [$\\text{kg}$], $a$: aceleración [$\\text{m/s}^2$]',
      whenToUse: 'Cuando necesitás hallar aceleraciones, tensiones de cuerdas o la fuerza normal.',
      whenNotToUse: 'No sumes fuerzas de cuerpos distintos en la misma ecuación sin aislar primero cada cuerpo.',
    },
    {
      id: 'frm-demo-2',
      name: 'Descomposición del Peso en Plano Inclinado',
      latex: 'P_x = m g \\sin(\\theta) \\qquad ; \\qquad P_y = m g \\cos(\\theta)',
      variables: '$g = 9.81\\text{ m/s}^2$, $\\theta$: ángulo del plano medido respecto de la horizontal',
      whenToUse: 'Cuando el eje $x$ se alinea paralelo al plano inclinado y el eje $y$ perpendicular a él.',
      whenNotToUse: 'Cuidado si el ángulo del enunciado está medido respecto a la vertical: ahí $\\sin$ y $\\cos$ se intercambian.',
    },
    {
      id: 'frm-demo-3',
      name: 'Rozamiento Estático Máximo y Dinámico',
      latex: 'f_{e,\\text{máx}} = \\mu_e \\cdot N \\qquad ; \\qquad f_d = \\mu_d \\cdot N',
      variables: '$\\mu_e, \\mu_d$: coeficientes adimensionales, $N$: fuerza normal [$\\text{N}$]',
      whenToUse: 'Usá $f_d$ siempre que haya deslizamiento efectivo; usá $f_{e,\\text{máx}}$ solo en el instante límite antes de deslizar.',
      whenNotToUse: 'Nunca uses $\\mu_e N$ automáticamente si el cuerpo está quieto y no está a punto de deslizar.',
    },
    {
      id: 'frm-demo-4',
      name: 'Balance Energético con Fuerzas No Conservativas',
      latex: 'W_{FNC} = \\Delta E_M = (K_f + U_{g,f} + U_{e,f}) - (K_i + U_{g,i} + U_{e,i})',
      variables: '$K = \\tfrac{1}{2}mv^2$ [$\\text{J}$], $U_g = mgh$ [$\\text{J}$], $U_e = \\tfrac{1}{2}k\\Delta x^2$ [$\\text{J}$]',
      whenToUse: 'Ideal cuando el problema relaciona alturas, resortes, distancias recorridas y velocidades sin pedir el tiempo.',
      whenNotToUse: 'Si necesitás cuánto tiempo tarda en bajar o el valor instantáneo de la normal en una curva, volvé a Newton.',
    },
  ],
  examTraps: [
    {
      id: 'trp-demo-1',
      mistake: 'Asumir automáticamente que $N = m \\cdot g$',
      whyItHappens:
        'En ejercicios básicos de superficie horizontal sin otras fuerzas verticales funciona, y el alumno lo generaliza por memoria.',
      howToAvoid:
        'Planteá siempre $\\sum F_y = 0$ en el eje perpendicular al apoyo. Si hay plano inclinado o una fuerza inclinada tirando del cuerpo, la normal cambia.',
    },
    {
      id: 'trp-demo-2',
      mistake: 'Confundir el sentido de la fuerza de rozamiento',
      whyItHappens:
        'Se suele pensar que el rozamiento "siempre apunta hacia la izquierda o hacia atrás del dibujo".',
      howToAvoid:
        'El rozamiento siempre se opone al deslizamiento relativo (o a la tendencia de deslizamiento) respecto de la superficie de apoyo.',
    },
    {
      id: 'trp-demo-3',
      mistake: 'Olvidar el signo negativo del trabajo del rozamiento ($W_{f_d}$)',
      whyItHappens:
        'Al calcular $W = f_d \\cdot d \\cdot \\cos(180^\\circ)$ se omite el $\\cos(180^\\circ) = -1$ y la energía termina aumentando en lugar de disiparse.',
      howToAvoid:
        'Verificá físicamente al final: el rozamiento cinético frena o calienta el sistema, por lo que $W_{f_d}$ debe restar energía mecánica ($E_{M,f} < E_{M,i}$).',
    },
  ],
  guideSections: [
    {
      id: 'gui-demo-1',
      order: 1,
      title: '1. El método infalible antes de escribir ecuaciones',
      coreIdea: 'La física falla en el planteo del dibujo, casi nunca en la calculadora.',
      explanation:
        'Antes de buscar una fórmula, identificá qué cuerpo estás analizando y qué cosas lo tocan. Toda fuerza en mecánica clásica (salvo el peso y fuerzas electromagnéticas) requiere contacto físico directo: si hay una cuerda, hay tensión; si apoya en un piso, hay normal; si intenta deslizar sobre superficie rugosa, hay rozamiento.',
      concreteExample:
        'Si un bloque apoya sobre una rampa de $30^\\circ$ sin cuerdas, solo lo tocan la Tierra (Peso vertical hacia abajo) y la rampa (Normal perpendicular a la rampa + Rozamiento paralelo a la rampa). Nada más.',
      keyTakeaway: 'Cada contacto en el dibujo equivale a una fuerza en el Diagrama de Cuerpo Libre.',
    },
    {
      id: 'gui-demo-2',
      order: 2,
      title: '2. Cómo elegir ejes y descomponer sin confundir seno y coseno',
      coreIdea: 'Alineá uno de tus ejes con la dirección de la aceleración para anular la otra componente.',
      explanation:
        'En un plano inclinado de ángulo $\\theta$, si ponés el eje $x$ paralelo a la pendiente y el eje $y$ perpendicular, la aceleración vive 100% en el eje $x$ ($a_y = 0$). El único vector inclinado respecto a esos ejes es el Peso $\\vec{P}$. Por semejanza de triángulos, el ángulo $\\theta$ de la rampa se repite entre el Peso vertical y el semieje $y$ negativo.',
      concreteExample:
        'Imaginá bajar el ángulo $\\theta$ a $0^\\circ$ (piso plano): intuitivamente todo el peso aprieta el piso ($P_y = P$) y nada desliza ($P_x = 0$). Como $\\cos(0^\\circ)=1$ y $\\sin(0^\\circ)=0$, sabés al instante que $P_y = mg\\cos\\theta$ y $P_x = mg\\sin\\theta$.',
      keyTakeaway: 'Test de $\\theta \\to 0^\\circ$: es la mejor forma de verificar en 3 segundos que no invertiste seno y coseno.',
    },
    {
      id: 'gui-demo-3',
      order: 3,
      title: '3. Cuándo pasar de Newton a Energía',
      coreIdea: 'Newton usa aceleración y tiempo; Energía conecta posiciones y velocidades directamente.',
      explanation:
        'Si un ejercicio pregunta "con qué velocidad llega al pie de la rampa" o "qué distancia recorre hasta frenar", podés usar Trabajo y Energía sin calcular aceleraciones ni tiempos intermedios. Eso es clave en rampas curvas donde la normal y la aceleración cambian punto a punto.',
      concreteExample:
        'Un esquiador baja una pista ondulada de altura $h = 20\\text{ m}$ sin rozamiento. Aunque la pendiente cambie todo el tiempo, su rapidez abajo es simplemente $v = \\sqrt{2gh} \\approx 19.8\\text{ m/s}$.',
      keyTakeaway: 'Trayectorias curvas o preguntas sin tiempo = primera opción: Balance Energético.',
    },
  ],
  masteryChecklist: [
    { id: 'chk-demo-1', label: 'Puedo dibujar un DCL limpio separando fuerzas de contacto y a distancia.', checked: true },
    { id: 'chk-demo-2', label: 'Sé verificar en 3 segundos cuál componente del peso lleva seno y cuál coseno.', checked: true },
    { id: 'chk-demo-3', label: 'Distingo cuándo comprobar primero si el bloque vence al rozamiento estático ($\\mu_e N$).', checked: false },
    { id: 'chk-demo-4', label: 'Planteo correctamente el signo negativo del trabajo del rozamiento dinámico.', checked: false },
    { id: 'chk-demo-5', label: 'Sé combinar conservación de energía mecánica con cinemática de tiro oblicuo.', checked: false },
  ],
  quizQuestions: [
    {
      id: 'qz-demo-1',
      question:
        'Un bloque de masa $m$ descansa en reposo sobre una rampa de $20^\\circ$ con $\\mu_e = 0.60$. Si aplicamos una fuerza muy pequeña hacia abajo, ¿cuánto vale la fuerza de rozamiento estático si el bloque sigue quieto?',
      options: [
        'Siempre vale $\\mu_e \\cdot m g \\cos(20^\\circ)$',
        'Vale exactamente lo necesario para equilibrar las fuerzas paralelas a la rampa ($m g \\sin 20^\\circ + F_{\\text{aplicada}}$)',
        'Vale cero porque no hay movimiento',
        'Vale $\\mu_d \\cdot m g$',
      ],
      correctIndex: 1,
      explanation:
        'Mientras no deslice, el rozamiento estático es una fuerza reactiva variable: toma exactamente el módulo requerido para que $\\sum F_x = 0$, siempre que ese valor no supere $\\mu_e N$.',
    },
    {
      id: 'qz-demo-2',
      question:
        'Si duplicás la masa de un bloque que desliza por un plano inclinado con rozamiento dinámico $\\mu_d$, ¿qué ocurre con su aceleración de descenso?',
      options: [
        'Se duplica porque el peso es el doble',
        'Se reduce a la mitad por mayor inercia',
        'Permanece exactamente igual porque la masa se cancela en la ecuación',
        'Depende del área de contacto del bloque',
      ],
      correctIndex: 2,
      explanation:
        'En la ecuación $m g \\sin\\theta - \\mu_d m g \\cos\\theta = m a$, la masa $m$ aparece en todos los términos y se simplifica: $a = g(\\sin\\theta - \\mu_d \\cos\\theta)$.',
    },
    {
      id: 'qz-demo-3',
      question:
        'En el punto más alto de un tiro oblicuo sin resistencia del aire, ¿qué sucede con la aceleración y la velocidad?',
      options: [
        'Ambas son cero',
        'La velocidad es cero y la aceleración es $g$ hacia abajo',
        'La componente vertical de velocidad es cero ($v_y = 0$), pero $v_x \\ne 0$ y la aceleración sigue siendo $g$ hacia abajo',
        'La aceleración cambia de sentido',
      ],
      correctIndex: 2,
      explanation:
        'La gravedad actúa todo el vuelo hacia abajo ($a_y = -g$). Arriba solo se anula momentáneamente la componente vertical $v_y$, mientras el proyectil sigue avanzando horizontalmente con $v_x$.',
    },
    {
      id: 'qz-demo-4',
      question:
        'Un bloque comprime un resorte horizontal sobre un piso sin roce y luego sale despedido. ¿Cuál es el balance energético correcto desde la compresión máxima hasta que se despega?',
      options: [
        '$\\frac{1}{2}k \\Delta x^2 = \\frac{1}{2} m v^2$',
        '$k \\Delta x = m v$',
        '$\\frac{1}{2}k \\Delta x^2 = m g h$',
        '$m g \\Delta x = \\frac{1}{2} m v^2$',
      ],
      correctIndex: 0,
      explanation:
        'Toda la energía potencial elástica acumulada ($U_e = \\frac{1}{2}k\\Delta x^2$) se transforma íntegramente en energía cinética ($K = \\frac{1}{2}mv^2$) al no existir rozamiento ni cambio de altura.',
    },
  ],
  exercises: [
    {
      id: 'ex-demo-1',
      title: 'Bloque en plano inclinado con verificación estática y cálculo de aceleración',
      topic: 'Dinámica y Rozamiento',
      difficulty: 'Parcial',
      statement:
        'Un bloque de masa $m = 5.0\\text{ kg}$ se coloca en reposo sobre un plano inclinado $\\theta = 35^\\circ$ respecto de la horizontal. Los coeficientes de rozamiento entre el bloque y el plano son $\\mu_e = 0.45$ y $\\mu_d = 0.30$. Determinar si el bloque desliza y, en caso afirmativo, calcular su aceleración y la rapidez tras recorrer $d = 4.0\\text{ m}$. (Usar $g = 9.81\\text{ m/s}^2$).',
      givenData: [
        { symbol: 'm', value: '5.0', unit: 'kg' },
        { symbol: '\\theta', value: '35', unit: '°' },
        { symbol: '\\mu_e', value: '0.45', unit: '-' },
        { symbol: '\\mu_d', value: '0.30', unit: '-' },
        { symbol: 'd', value: '4.0', unit: 'm' },
      ],
      unknowns: [
        '¿Vence el rozamiento estático?',
        'Aceleración $a$ [$\\text{m/s}^2$]',
        'Rapidez $v_f$ tras $4.0\\text{ m}$ [$\\text{m/s}$]',
      ],
      visualConfig: {
        type: 'inclined_plane',
        angleDeg: 35,
        massKg: 5.0,
        mu: 0.3,
        caption: 'Esquema interactivo de fuerzas sobre plano inclinado a 35°',
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Elegir sistema de ejes y trazar el Diagrama de Cuerpo Libre',
          thinkingPrompt:
            '¿Por qué inclinamos los ejes en lugar de dejarlos horizontal y vertical? Porque el bloque solo puede moverse paralelo a la rampa: así $a_y = 0$.',
          mathLatex:
            '\\text{Eje } x: \\text{ paralelo al plano (positivo hacia abajo)} \\qquad \\text{Eje } y: \\text{ perpendicular hacia arriba}',
          explanation:
            'Sobre el bloque actúan 3 fuerzas: el Peso $\\vec{P} = m\\vec{g}$ vertical hacia abajo, la Normal $\\vec{N}$ perpendicular al plano (eje $+y$), y el Rozamiento $\\vec{f}$ paralelo al plano hacia arriba (eje $-x$), oponiéndose a la tendencia de deslizamiento.',
          watchOut:
            'No dibujes una fuerza extra "de bajada" además del peso: lo que empuja al bloque hacia abajo es simplemente la componente $P_x$ del propio peso.',
          highlightElement: 'axes',
        },
        {
          stepNumber: 2,
          title: 'Descomponer el peso y hallar la Normal $N$',
          thinkingPrompt:
            'Como el bloque no despega ni se hunde en la rampa, la sumatoria de fuerzas en el eje perpendicular $y$ debe ser cero.',
          mathLatex:
            '\\sum F_y = 0 \\implies N - m g \\cos(35^\\circ) = 0 \\implies N = 5.0 \\cdot 9.81 \\cdot 0.8192 = 40.18\\text{ N}',
          explanation:
            'Calculamos también la componente del peso paralela a la pendiente, que es quien intenta hacer deslizar al bloque hacia abajo: $P_x = m g \\sin(35^\\circ) = 5.0 \\cdot 9.81 \\cdot 0.5736 = 28.13\\text{ N}$.',
          watchOut:
            'Verificá que tu calculadora esté en grados sexagesimales (DEG) y no en radianes (RAD) antes de evaluar $\\sin(35^\\circ)$ y $\\cos(35^\\circ)$.',
          highlightElement: 'normal',
          quickCheck: {
            question: 'Si el ángulo aumentara de 35° a 50°, ¿qué pasaría con el módulo de la Normal $N$?',
            options: [
              'Aumentaría porque el bloque pesa lo mismo',
              'Disminuiría porque $\\cos(\\theta)$ decrece al acercarse a 90°',
              'Permanecería constante',
            ],
            correctIndex: 1,
            feedback:
              'Correcto: cuanto más empinada es la rampa, menos "aprieta" el bloque contra la superficie y menor es la Normal.',
          },
        },
        {
          stepNumber: 3,
          title: 'Comprobar si el bloque rompe el reposo ($P_x$ vs $f_{e,\\text{máx}}$)',
          thinkingPrompt:
            'Nunca asumas que el bloque desliza sin antes comparar la fuerza motora $P_x$ contra el límite máximo de agarre estático.',
          mathLatex:
            'f_{e,\\text{máx}} = \\mu_e \\cdot N = 0.45 \\cdot 40.18\\text{ N} = 18.08\\text{ N} \\qquad ; \\qquad P_x = 28.13\\text{ N} > 18.08\\text{ N}',
          explanation:
            'Como la componente del peso que tira hacia abajo ($28.13\\text{ N}$) supera ampliamente el rozamiento estático máximo ($18.08\\text{ N}$), el bloque efectivamente rompe el reposo y comienza a deslizar hacia abajo.',
          watchOut:
            'Si $P_x$ hubiera sido menor o igual a $f_{e,\\text{máx}}$, el ejercicio terminaría aquí con $a = 0$ y $f_e = P_x$.',
          highlightElement: 'friction',
          quickCheck: {
            question: 'Una vez que confirmamos que el bloque desliza, ¿qué coeficiente debemos usar para calcular la aceleración?',
            options: [
              'El estático ($\\mu_e = 0.45$) porque partió del reposo',
              'El dinámico ($\\mu_d = 0.30$) porque ya existe deslizamiento relativo',
              'El promedio de ambos',
            ],
            correctIndex: 1,
            feedback:
              'Exacto: $\\mu_e$ solo decide si empieza a moverse; una vez en movimiento relativo actúa $\\mu_d$.',
          },
        },
        {
          stepNumber: 4,
          title: 'Aplicar Newton en el eje $x$ con rozamiento dinámico',
          thinkingPrompt:
            'Con el bloque en movimiento hacia $+x$, el rozamiento vale $f_d = \\mu_d N$ y apunta en sentido contrario ($-x$).',
          mathLatex:
            'P_x - f_d = m \\cdot a \\implies 28.13 - (0.30 \\cdot 40.18) = 5.0 \\cdot a \\implies a = \\frac{28.13 - 12.05}{5.0} = 3.22\\text{ m/s}^2',
          explanation:
            'La fuerza neta en la dirección del movimiento es $16.08\\text{ N}$. Al dividir por la masa de $5.0\\text{ kg}$ obtenemos una aceleración constante de descenso $a = 3.22\\text{ m/s}^2$.',
          watchOut:
            'Chequeo rápido de coherencia: la aceleración obtenida ($3.22\\text{ m/s}^2$) debe ser estrictamente menor a la caída libre ($9.81\\text{ m/s}^2$).',
          highlightElement: 'result',
        },
        {
          stepNumber: 5,
          title: 'Calcular la rapidez tras recorrer $d = 4.0\\text{ m}$',
          thinkingPrompt:
            'Tenemos aceleración constante, desplazamiento $d$ y velocidad inicial $v_0 = 0$, pero no tenemos el tiempo. ¿Qué ecuación cinemática evita el tiempo?',
          mathLatex:
            'v_f^2 = v_0^2 + 2 \\cdot a \\cdot d \\implies v_f = \\sqrt{0 + 2 \\cdot 3.22 \\cdot 4.0} = \\sqrt{25.76} = 5.08\\text{ m/s}',
          explanation:
            'Usando la ecuación de Torricelli ($v_f^2 = v_0^2 + 2ad$), obtenemos la rapidez final directamente en un paso. También podés verificar este resultado usando Trabajo y Energía: $(P_x - f_d)\\cdot d = \\frac{1}{2}m v_f^2$.',
          watchOut:
            'Verificá unidades dentro de la raíz: $\\text{m/s}^2 \\cdot \\text{m} = \\text{m}^2/\\text{s}^2$, cuya raíz cuadrada devuelve exactamente $\\text{m/s}$.',
          highlightElement: 'energy',
        },
      ],
      finalAnswer:
        'El bloque sí desliza ($P_x = 28.13\\text{ N} > f_{e,\\text{máx}} = 18.08\\text{ N}$). Desciende con $a = 3.22\\text{ m/s}^2$ y alcanza $v_f = 5.08\\text{ m/s}$ al recorrer $4.0\\text{ m}$.',
    },
    {
      id: 'ex-demo-2',
      title: 'Rampa con rozamiento seguida de lanzamiento horizontal',
      topic: 'Energía Mecánica y Cinemática',
      difficulty: 'Integrador',
      statement:
        'Un carrito de $m = 2.0\\text{ kg}$ parte del reposo desde una altura $h = 3.5\\text{ m}$ por una rampa curva. Durante la bajada, el rozamiento disipa $18\\text{ J}$ de energía térmica. Al llegar al extremo inferior horizontal, ubicado a $H = 1.8\\text{ m}$ sobre el suelo, el carrito sale despedido horizontalmente. Calcular: (a) la rapidez con la que abandona la rampa, y (b) el alcance horizontal $D$ hasta tocar el suelo.',
      givenData: [
        { symbol: 'm', value: '2.0', unit: 'kg' },
        { symbol: 'h', value: '3.5', unit: 'm' },
        { symbol: 'W_{f}', value: '-18', unit: 'J' },
        { symbol: 'H', value: '1.8', unit: 'm' },
      ],
      unknowns: [
        'Rapidez de salida $v_B$ [$\\text{m/s}$]',
        'Alcance horizontal $D$ [$\\text{m}$]',
      ],
      visualConfig: {
        type: 'projectile',
        velocityMs: 7.12,
        caption: 'Tramo 2: Lanzamiento horizontal desde altura H = 1.8 m',
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Separar el problema en dos tramos físicos independientes',
          thinkingPrompt:
            'En la rampa curva no conocemos la forma exacta ni el ángulo punto a punto: no podemos usar $\\sum F = ma$. ¿Qué herramienta sí funciona independientemente de la forma de la curva?',
          mathLatex:
            '\\text{Tramo 1 (rampa curva): Balance de Energía} \\qquad \\longrightarrow \\qquad \\text{Tramo 2 (vuelo libre): Tiro Horizontal}',
          explanation:
            'Dividimos el problema en el punto $B$ (borde de salida de la rampa). La velocidad final del tramo 1 será la velocidad inicial horizontal $v_{0x} = v_B$ del tramo 2.',
          watchOut:
            'No mezcles la altura de caída dentro de la rampa ($h = 3.5\\text{ m}$) con la altura del borde respecto al piso ($H = 1.8\\text{ m}$). Poné el cero de referencia para el tramo 1 en la salida $B$.',
          highlightElement: 'axes',
        },
        {
          stepNumber: 2,
          title: 'Calcular la rapidez $v_B$ al salir de la rampa por Energía',
          thinkingPrompt:
            'En la cima parte del reposo ($K_A = 0$) a altura $h = 3.5\\text{ m}$ sobre $B$. El rozamiento realiza un trabajo negativo $W_{FNC} = -18\\text{ J}$.',
          mathLatex:
            'W_{FNC} = E_{M,B} - E_{M,A} \\implies -18 = \\frac{1}{2} m v_B^2 - m g h \\implies \\frac{1}{2}(2.0) v_B^2 = (2.0)(9.81)(3.5) - 18',
          explanation:
            'La energía potencial inicial era $68.67\\text{ J}$. Al restar los $18\\text{ J}$ disipados por el roce, llegan $50.67\\text{ J}$ como energía cinética: $v_B^2 = 50.67 \\implies v_B = 7.12\\text{ m/s}$.',
          watchOut:
            'Asegurate de restar los $18\\text{ J}$ y no sumarlos: si los sumaras, el carrito saldría más rápido gracias al rozamiento, lo cual viola la física.',
          highlightElement: 'energy',
          quickCheck: {
            question: 'Si no hubiera existido rozamiento en la rampa ($W_f = 0$), la velocidad de salida $v_B$ sería:',
            options: [
              'Menor a $7.12\\text{ m/s}$',
              'Mayor a $7.12\\text{ m/s}$ ($\\approx 8.29\\text{ m/s}$)',
              'Igual porque el roce solo afecta a la masa',
            ],
            correctIndex: 1,
            feedback:
              'Exacto: sin disipación térmica, toda la energía potencial se convertiría en cinética.',
          },
        },
        {
          stepNumber: 3,
          title: 'Hallar el tiempo de vuelo $t$ en el eje vertical',
          thinkingPrompt:
            'Al salir horizontalmente del borde, la velocidad vertical inicial es nula ($v_{0y} = 0$). El tiempo de caída solo depende de la altura $H$ y de $g$.',
          mathLatex:
            'y(t) = H - \\frac{1}{2} g t^2 = 0 \\implies t = \\sqrt{\\frac{2 H}{g}} = \\sqrt{\\frac{2 \\cdot 1.8}{9.81}} = 0.606\\text{ s}',
          explanation:
            'En el aire (sin roce del aire), el movimiento horizontal y el vertical son independientes. El carrito tarda $0.606\\text{ s}$ en caer los $1.8\\text{ m}$ verticales.',
          watchOut:
            'Nunca pongas $v_B = 7.12\\text{ m/s}$ dentro de la ecuación vertical: esa velocidad es puramente horizontal ($v_{0x}$).',
          highlightElement: 'gravity',
        },
        {
          stepNumber: 4,
          title: 'Calcular el alcance horizontal $D$',
          thinkingPrompt:
            'En el eje horizontal no hay fuerzas actuando durante el vuelo ($a_x = 0$), por lo tanto avanza con Movimiento Rectilíneo Uniforme.',
          mathLatex:
            'D = v_{0x} \\cdot t = 7.12\\text{ m/s} \\cdot 0.606\\text{ s} = 4.31\\text{ m}',
          explanation:
            'Multiplicamos la rapidez horizontal constante por el tiempo que permanece en el aire y obtenemos un alcance de $4.31\\text{ m}$ medido desde la vertical del borde.',
          watchOut:
            'Revisá las cifras significativas y las unidades finales: $\\text{m/s} \\cdot \\text{s} = \\text{m}$.',
          highlightElement: 'result',
        },
      ],
      finalAnswer:
        'Abandona la rampa a $v_B = 7.12\\text{ m/s}$ y recorre un alcance horizontal $D = 4.31\\text{ m}$ en $0.606\\text{ s}$ de vuelo.',
    },
  ],
  examModels: [
    {
      id: 'sample-exam-fisica-1',
      title: 'Primer Parcial Modelo — Dinámica, Rozamiento y Energía',
      source: 'sample',
      examType: 'Primer Parcial',
      passingScore: 60,
      createdAt: '2026-11-15T08:00:00.000Z',
      questions: [
        {
          id: 'fis-q1',
          number: 1,
          type: 'choice',
          topic: 'Diagrama de Cuerpo Libre y Normal',
          points: 20,
          prompt:
            'Un bloque de masa $m$ descansa sobre un plano inclinado de ángulo $\\theta$ sin rozamiento mientras una fuerza horizontal $F$ lo empuja hacia el plano. ¿Qué expresión describe correctamente la fuerza Normal $N$?',
          options: [
            '$N = m g \\cos(\\theta) + F \\sin(\\theta)$',
            '$N = m g \\cos(\\theta)$',
            '$N = m g$',
            '$N = m g \\sin(\\theta) - F \\cos(\\theta)$',
          ],
          correctIndex: 0,
          modelSolution:
            'Al descomponer tanto el peso como la fuerza horizontal $F$ sobre el eje perpendicular al plano, ambas apuntan hacia la superficie, por lo que $N = mg\\cos(\\theta) + F\\sin(\\theta)$.',
          modelFormulaLatex: 'N = m g \\cos(\\theta) + F \\sin(\\theta)',
          gradingCriteria: 'Selección de la opción que suma la componente perpendicular de F al término mg cos(θ).',
        },
        {
          id: 'fis-q2',
          number: 2,
          type: 'choice',
          topic: 'Rozamiento Estático vs. Dinámico',
          points: 20,
          prompt:
            'Un cuerpo de $4\\text{ kg}$ está en reposo sobre una mesa horizontal ($\\mu_e = 0.5$, $\\mu_d = 0.3$, $g = 9.8\\text{ m/s}^2$). Si se le aplica una fuerza horizontal de $12\\text{ N}$, ¿cuál es el valor de la fuerza de rozamiento?',
          options: [
            '$12\\text{ N}$ (permanece en reposo)',
            '$19.6\\text{ N}$ (rozamiento estático máximo)',
            '$11.76\\text{ N}$ (desliza con rozamiento dinámico)',
            '$0\\text{ N}$ porque no hay aceleración',
          ],
          correctIndex: 0,
          modelSolution:
            'El tope estático es $f_{e,\\text{máx}} = 0.5 \\cdot 4 \\cdot 9.8 = 19.6\\text{ N}$. Como $12\\text{ N} < 19.6\\text{ N}$, el cuerpo no desliza y el rozamiento estático toma exactamente el valor necesario para equilibrar: $12\\text{ N}$.',
          modelFormulaLatex: 'f_{e,\\text{máx}} = \\mu_e N = 19.6\\text{ N} > 12\\text{ N}',
          gradingCriteria: 'Comprender que el rozamiento estático es variable hasta f_e,máx y no vale μ_e·N automáticamente.',
        },
        {
          id: 'fis-q3',
          number: 3,
          type: 'open',
          topic: 'Trabajo y Energía con Rozamiento',
          points: 30,
          prompt:
            'Un bloque de $2\\text{ kg}$ parte del reposo desde una altura $h = 3\\text{ m}$ por una rampa lisa y luego recorre un tramo horizontal áspero de $5\\text{ m}$ hasta detenerse. Calculá el coeficiente de rozamiento dinámico $\\mu_d$ en el tramo horizontal (usá $g = 9.8\\text{ m/s}^2$).',
          modelSolution:
            'Aplicando $W_{FNC} = \\Delta K + \\Delta U$: parte del reposo y termina en reposo ($\\Delta K = 0$). La energía potencial inicial $mgh$ se disipa íntegramente por el trabajo del rozamiento $-\\mu_d m g d$. Despejando: $\\mu_d = h / d = 3 / 5 = 0.60$.',
          modelFormulaLatex: '-\\mu_d m g d = -m g h \\implies \\mu_d = \\frac{h}{d} = 0.60',
          gradingCriteria: '15 pts por plantear correctamente el balance energético con trabajo negativo del rozamiento; 15 pts por despejar μ_d = 0.60.',
        },
        {
          id: 'fis-q4',
          number: 4,
          type: 'open',
          topic: 'Dinámica de Sistemas Vinculados',
          points: 30,
          prompt:
            'Dos bloques de masas $m_1 = 3\\text{ kg}$ (sobre mesa horizontal lisa) y $m_2 = 2\\text{ kg}$ (colgando verticalmente) están unidos por una cuerda ideal que pasa por una polea sin fricción. Determiná la aceleración del sistema y la tensión de la cuerda ($g = 9.8\\text{ m/s}^2$).',
          modelSolution:
            'Para el sistema completo, la fuerza neta motriz es el peso colgante $m_2 g = 19.6\\text{ N}$ y la masa total es $m_1 + m_2 = 5\\text{ kg}$. Entonces $a = 19.6 / 5 = 3.92\\text{ m/s}^2$. Luego, para $m_1$: $T = m_1 a = 3 \\cdot 3.92 = 11.76\\text{ N}$.',
          modelFormulaLatex: 'a = \\frac{m_2 g}{m_1 + m_2} = 3.92\\text{ m/s}^2 \\qquad ; \\qquad T = m_1 a = 11.76\\text{ N}',
          gradingCriteria: '15 pts por plantear las ecuaciones de Newton y hallar a = 3.92 m/s²; 15 pts por calcular T = 11.76 N (menor que m_2 g).',
        },
      ],
    },
  ],
};

export const SAMPLE_MATH_PLAN: StudyPlan = {
  id: 'plan-analisis-2-demo',
  subject: 'Análisis Matemático II — Integrales y Series',
  examType: 'Segundo Parcial',
  examDate: '2026-11-22',
  folder: 'Matemática',
  pinned: false,
  createdAt: '2026-11-14T09:00:00.000Z',
  totalMinutes: 240,
  daysAvailable: 4,
  hoursPerDay: 1,
  pace: 'Equilibrado',
  executiveSummary:
    'Guía práctica para elegir rápido el método de integración y determinar la convergencia de series numéricas sin pruebas innecesarias.',
  summarySections: [
    {
      order: 1,
      title: 'Conexión entre unidades',
      content:
        'Una integral impropia de primera especie y una serie numérica positiva comparten la misma pregunta central: si la suma de infinitos aportes tiende a un número finito. Por eso el criterio de la integral conecta directamente ambos temas del parcial.',
      formulaLatex: '\\int_1^{\\infty} f(x)\\,dx \\text{ converge} \\iff \\sum_{n=1}^{\\infty} f(n) \\text{ converge}',
      formulaCaption: 'Válido cuando f(x) es continua, positiva y decreciente para x ≥ 1.',
    },
    {
      order: 2,
      title: 'Selección rápida del criterio de series',
      content:
        'Antes de probar criterios complejos, verificá siempre la condición necesaria: si el límite del término general no da cero, la serie diverge al instante. Si aparecen factoriales o potencias n-ésimas, usá D’Alembert o Cauchy.',
      formulaLatex: '\\lim_{n \\to \\infty} a_n \\ne 0 \\implies \\sum a_n \\text{ diverge}',
      formulaCaption: 'Si el límite da 0 no garantiza convergencia; recién ahí aplicás D’Alembert o comparación.',
    },
  ],
  studyBlocks: [
    {
      id: 'blk-math-1',
      sessionLabel: 'Día 1 · Bloque 1',
      title: 'Integración por partes y fracciones simples',
      category: 'teoria',
      durationMinutes: 60,
      objective: 'Identificar la elección correcta de u y dv (regla ILATE) y descomponer denominadores.',
      deliverable: 'Dominar los 3 casos de raíces en fracciones simples.',
      targetTab: 'summary',
      completed: false,
    },
    {
      id: 'blk-math-2',
      sessionLabel: 'Día 2 · Bloque 1',
      title: 'Integrales impropias y criterios de convergencia',
      category: 'practica',
      durationMinutes: 60,
      objective: 'Resolver límites laterales en extremos infinitos o discontinuidades.',
      deliverable: 'Evaluar convergencia de integrales tipo p.',
      targetTab: 'exercises',
      completed: false,
    },
    {
      id: 'blk-math-3',
      sessionLabel: 'Día 3 · Bloque 1',
      title: 'Series numéricas y series de potencias',
      category: 'repaso',
      durationMinutes: 60,
      objective: 'Calcular radio e intervalo de convergencia analizando los extremos.',
      deliverable: 'Completar checklist de criterios.',
      targetTab: 'guide',
      completed: false,
    },
    {
      id: 'blk-math-4',
      sessionLabel: 'Día 4 · Cierre',
      title: 'Simulacro rápido de parcial',
      category: 'simulacro',
      durationMinutes: 60,
      objective: 'Resolver ejercicios mixtos cronometrados.',
      deliverable: 'Validar respuestas sin errores de signo.',
      targetTab: 'guide',
      completed: false,
    },
  ],
  keyConcepts: [
    {
      id: 'con-math-1',
      term: 'Integral Impropia de Primera Especie',
      academicDefinition:
        'Integral definida cuyo intervalo de integración es no acotado, definida formalmente como el límite de una integral propia cuando el extremo tiende a infinito.',
      simpleExplanation:
        'No se puede evaluar un área "hasta infinito" directo: primero integrás hasta una letra $b$ y después hacés tender $b \\to \\infty$.',
      everydayExample:
        'Sumar cuotas que cada mes se achican a la mitad: aunque pagues infinitos meses, el total nunca pasa del doble de la primera cuota.',
    },
    {
      id: 'con-math-2',
      term: 'Radio de Convergencia ($R$)',
      academicDefinition:
        'Semiamplitud del intervalo centrado en $x_0$ dentro del cual una serie de potencias $\\sum c_n (x - x_0)^n$ converge absolutamente.',
      simpleExplanation:
        'Es la distancia máxima desde el centro donde podés evaluar la serie de potencias obteniendo un resultado finito.',
      everydayExample:
        'Es como la zona de cobertura de una antena: dentro del radio $R$ la señal funciona perfecto; afuera se pierde.',
    },
  ],
  formulas: [
    {
      id: 'frm-math-1',
      name: 'Integración por Partes',
      latex: '\\int u\\,dv = u\\cdot v - \\int v\\,du',
      variables: '$u$: función fácil de derivar, $dv$: diferencial fácil de integrar',
      whenToUse: 'Productos de polinomios por exponenciales, trigonométricas o logaritmos.',
      whenNotToUse: 'Si una sustitución simple $u = g(x)$ ya cancela la derivada adentro.',
    },
    {
      id: 'frm-math-2',
      name: 'Criterio del Cociente (D’Alembert)',
      latex: 'L = \\lim_{n\\to\\infty} \\left|\\frac{a_{n+1}}{a_n}\\right|',
      variables: '$L < 1$: converge absolutamente · $L > 1$: diverge · $L = 1$: no decide',
      whenToUse: 'Cuando el término general $a_n$ contiene factoriales ($n!$) o potencias ($r^n$).',
      whenNotToUse: 'En series racionales tipo $1/n^2$ siempre da $L=1$; usá comparación o serie $p$.',
    },
  ],
  examTraps: [
    {
      id: 'trp-math-1',
      mistake: 'Concluir que $\\sum a_n$ converge solo porque $\\lim_{n\\to\\infty} a_n = 0$',
      whyItHappens: 'Se invierte la implicación lógica de la condición necesaria.',
      howToAvoid: 'Recordá la serie armónica $\\sum 1/n$: su término tiende a 0 pero la suma diverge.',
    },
    {
      id: 'trp-math-2',
      mistake: 'Olvidar analizar los extremos del intervalo de convergencia',
      whyItHappens: 'El criterio del cociente deja indeterminado justo el borde $|x - x_0| = R$.',
      howToAvoid: 'Reemplazá ambos extremos por separado en la serie original y analizalos como series numéricas.',
    },
  ],
  guideSections: [
    {
      id: 'gui-math-1',
      order: 1,
      title: '1. Árbol de decisión en 10 segundos para series',
      coreIdea: 'No pruebes criterios al azar; mirá la estructura algebraica de a_n.',
      explanation:
        'Si ves factoriales o exponenciales mezcladas, elegí D’Alembert. Si todo está elevado a la potencia $n$, elegí Cauchy (raíz). Si es un cociente de polinomios, compará con una serie $p$ ($1/n^p$).',
      concreteExample:
        'En $\\sum \\frac{2^n}{n!}$, el factorial grita D’Alembert: al dividir $a_{n+1}/a_n$ queda $2/(n+1) \\to 0 < 1$, converge al instante.',
      keyTakeaway: 'La forma del término general te dicta qué criterio usar.',
    },
  ],
  masteryChecklist: [
    { id: 'chk-math-1', label: 'Sé aplicar el criterio del cociente sin confundir cuándo L = 1.', checked: false },
    { id: 'chk-math-2', label: 'Recuerdo evaluar los dos extremos en series de potencias.', checked: false },
  ],
  quizQuestions: [
    {
      id: 'qz-math-1',
      question: 'Si al aplicar D’Alembert obtenés $L = 1$, ¿qué podés concluir?',
      options: [
        'La serie converge condicionalmente',
        'La serie diverge siempre',
        'El criterio no decide y hay que usar otro método',
        'El radio de convergencia es 0',
      ],
      correctIndex: 2,
      explanation: 'Cuando $L = 1$ (como en $\\sum 1/n$ y $\\sum 1/n^2$), D’Alembert es inconcluyente.',
    },
  ],
  exercises: [
    {
      id: 'ex-math-1',
      title: 'Intervalo de convergencia de serie de potencias',
      topic: 'Series de Potencias',
      difficulty: 'Parcial',
      statement:
        'Hallar el radio y el intervalo completo de convergencia de la serie $\\sum_{n=1}^{\\infty} \\frac{(x - 2)^n}{n \\cdot 3^n}$.',
      givenData: [
        { symbol: 'x_0', value: '2', unit: '-' },
        { symbol: 'a_n', value: '(x-2)^n / (n·3^n)', unit: '-' },
      ],
      unknowns: ['Radio $R$', 'Intervalo de convergencia completo'],
      visualConfig: { type: 'none' },
      steps: [
        {
          stepNumber: 1,
          title: 'Aplicar D’Alembert en valor absoluto',
          thinkingPrompt: 'Buscamos para qué valores de $x$ el límite del cociente es estrictamente menor que $1$.',
          mathLatex:
            'L = \\lim_{n\\to\\infty} \\left|\\frac{(x-2)^{n+1}}{(n+1)3^{n+1}} \\cdot \\frac{n\\cdot 3^n}{(x-2)^n}\\right| = \\frac{|x-2|}{3} < 1 \\implies |x-2| < 3',
          explanation: 'El radio de convergencia es $R = 3$ centrado en $x_0 = 2$, por lo que converge absolutamente en $(-1, 5)$.',
          watchOut: 'No olvides el valor absoluto alrededor de $(x - 2)$ al plantear el límite.',
        },
        {
          stepNumber: 2,
          title: 'Evaluar los extremos $x = -1$ y $x = 5$',
          thinkingPrompt: 'Sustituimos ambos bordes en la serie original para verificar si se incluyen.',
          mathLatex:
            'x = 5 \\implies \\sum \\frac{1}{n} \\text{ (diverge)} \\qquad ; \\qquad x = -1 \\implies \\sum \\frac{(-1)^n}{n} \\text{ (converge por Leibniz)}',
          explanation: 'En $x = 5$ queda la serie armónica divergente; en $x = -1$ queda la armónica alternada convergente.',
          watchOut: 'Siempre justificá explícitamente cada extremo por separado en el parcial.',
        },
      ],
      finalAnswer: 'Radio $R = 3$ e intervalo de convergencia $[-1, 5)$.',
    },
  ],
  examModels: [
    {
      id: 'sample-exam-math-1',
      title: 'Segundo Parcial Modelo — Integrales y Series',
      source: 'sample',
      examType: 'Segundo Parcial',
      passingScore: 60,
      createdAt: '2026-11-15T08:00:00.000Z',
      questions: [
        {
          id: 'mat-q1',
          number: 1,
          type: 'choice',
          topic: 'Integrales Impropias',
          points: 25,
          prompt:
            '¿Para qué valores de $p$ converge la integral impropia de primera especie $\\int_{1}^{\\infty} \\frac{1}{x^p}\\,dx$?',
          options: ['$p > 1$', '$p \\ge 1$', '$0 < p < 1$', 'Para todo $p > 0$'],
          correctIndex: 0,
          modelSolution:
            'La primitiva es $x^{1-p}/(1-p)$ para $p \\neq 1$ y $\\ln(x)$ para $p=1$; solo tiende a un límite finito en $\\infty$ cuando $1-p < 0$, es decir $p > 1$.',
          modelFormulaLatex: '\\int_{1}^{\\infty} \\frac{1}{x^p}\\,dx < \\infty \\iff p > 1',
          gradingCriteria: 'Identificar la condición estricta p > 1.',
        },
        {
          id: 'mat-q2',
          number: 2,
          type: 'choice',
          topic: 'Condición Necesaria de Convergencia',
          points: 25,
          prompt:
            'Si $\\lim_{n \\to \\infty} a_n = 0$, ¿qué podemos concluir con certeza sobre la serie $\\sum_{n=1}^{\\infty} a_n$?',
          options: [
            'No podemos asegurar convergencia; la serie aún puede divergir (ej: serie armónica)',
            'La serie converge absolutamente',
            'La serie converge por criterio de Cauchy',
            'La serie diverge siempre',
          ],
          correctIndex: 0,
          modelSolution:
            'Que el término general tienda a cero es condición necesaria pero NO suficiente para que la serie converja, como muestra $\\sum 1/n$.',
          gradingCriteria: 'Distinguir condición necesaria de suficiente.',
        },
        {
          id: 'mat-q3',
          number: 3,
          type: 'open',
          topic: 'Integración por Partes',
          points: 25,
          prompt: 'Calculá la integral indefinida $\\int x e^{2x}\\,dx$ indicando claramente tu elección de $u$ y $dv$.',
          modelSolution:
            'Elegimos $u = x \\implies du = dx$ y $dv = e^{2x}dx \\implies v = \\frac{1}{2}e^{2x}$. Aplicando $uv - \\int v\\,du$ resulta $\\frac{x}{2}e^{2x} - \\frac{1}{4}e^{2x} + C$.',
          modelFormulaLatex: '\\int x e^{2x}\\,dx = \\frac{1}{2}x e^{2x} - \\frac{1}{4}e^{2x} + C',
          gradingCriteria: '10 pts por elegir u=x y dv=e^{2x}dx; 15 pts por integrar correctamente sin olvidar el factor 1/2 y + C.',
        },
        {
          id: 'mat-q4',
          number: 4,
          type: 'open',
          topic: 'Radio e Intervalo de Convergencia',
          points: 25,
          prompt:
            'Determiná el radio de convergencia $R$ y analizá ambos extremos de $\\sum_{n=1}^{\\infty} \\frac{(x-2)^n}{n \\cdot 3^n}$.',
          modelSolution:
            'Por D’Alembert, $|x-2|/3 < 1 \\implies R = 3$ sobre $(-1, 5)$. En $x = 5$ queda $\\sum 1/n$ (diverge); en $x = -1$ queda $\\sum (-1)^n/n$ (converge por Leibniz). Intervalo: $[-1, 5)$.',
          modelFormulaLatex: 'R = 3 \\qquad ; \\qquad I = [-1, 5)',
          gradingCriteria: '15 pts por hallar R=3; 10 pts por justificar ambos extremos por separado.',
        },
      ],
    },
  ],
};

export const SAMPLE_ANATOMY_PLAN: StudyPlan = {
  id: 'plan-anatomia-demo',
  subject: 'Anatomía Humana — Corazón y Sistema Nervioso',
  subjectMode: 'theoretical',
  examType: 'Primer Parcial',
  examDate: '2026-11-19',
  folder: 'Anatomía',
  pinned: false,
  createdAt: '2026-11-15T08:00:00.000Z',
  totalMinutes: 240,
  daysAvailable: 2,
  hoursPerDay: 2,
  pace: 'Equilibrado',
  executiveSummary:
    'Síntesis anatómica centrada en reconocer las cavidades cardíacas, grandes vasos, recorrido de la circulación y las partes funcionales de la neurona.',
  summarySections: [
    {
      order: 1,
      title: 'Conexión entre anatomía macroscópica y función',
      content:
        'En anatomía descriptiva no memorices nombres aislados: cada estructura explica su función por su forma y ubicación. Las paredes gruesas del ventrículo izquierdo responden a la presión necesaria para impulsar sangre a todo el cuerpo, mientras que la vaina de mielina en la neurona acelera la conducción saltatoria del impulso.',
    },
    {
      order: 2,
      title: 'Corazón derecho vs. corazón izquierdo',
      content:
        'El lado derecho del corazón maneja sangre carboxigenada proveniente de las venas cavas y la envía hacia los pulmones por el tronco pulmonar. El lado izquierdo recibe sangre oxigenada desde las venas pulmonares y la eyecta hacia la aorta para irrigar la circulación sistémica.',
    },
    {
      order: 3,
      title: 'Organización estructural de la neurona',
      content:
        'La neurona presenta polaridad funcional: las dendritas y el soma integran señales entrantes, el axón conduce el potencial de acción en dirección anterógrada y los botones terminales liberan neurotransmisores en la hendidura sináptica.',
    },
  ],
  visualExamples: [
    {
      id: 'vis-anat-heart',
      title: 'Anatomía del Corazón y Grandes Vasos',
      categoryLabel: 'Ejemplo anatómico · Vista anterior',
      caption: 'Hacé clic en cada número para ubicar cavidades, válvulas y grandes vasos.',
      templateId: 'heart',
      parts: [
        {
          id: 'heart-1',
          number: 1,
          label: 'Aurícula derecha',
          location: 'Región superior derecha del corazón',
          description:
            'Recibe sangre venosa desoxigenada de todo el cuerpo a través de la vena cava superior e inferior y del seno coronario.',
          examTip:
            'En su pared superior se aloja el nodo sinoauricular (marcapasos fisiológico del corazón).',
          x: 138,
          y: 118,
        },
        {
          id: 'heart-2',
          number: 2,
          label: 'Ventrículo derecho',
          location: 'Región anteroinferior derecha',
          description:
            'Recibe sangre desde la aurícula derecha a través de la válvula tricúspide y la impulsa hacia los pulmones por el tronco pulmonar.',
          examTip:
            'Tiene pared muscular más delgada que el ventrículo izquierdo porque la resistencia pulmonar es menor.',
          x: 164,
          y: 184,
        },
        {
          id: 'heart-3',
          number: 3,
          label: 'Cayado de la aorta',
          location: 'Base superior, emerge del ventrículo izquierdo',
          description:
            'Arteria elástica principal que distribuye sangre oxigenada hacia la circulación sistémica mediante tres troncos supraaórticos.',
          examTip:
            'Sus tres ramas principales en orden son: tronco braquiocefálico, carótida común izquierda y subclavia izquierda.',
          x: 196,
          y: 52,
        },
        {
          id: 'heart-4',
          number: 4,
          label: 'Aurícula izquierda',
          location: 'Región posterosuperior izquierda',
          description:
            'Recibe sangre oxigenada desde los pulmones por medio de las cuatro venas pulmonares y la pasa al ventrículo izquierdo por la válvula mitral.',
          examTip:
            'Es la cavidad más posterior del corazón; su dilatación puede comprimir el esófago.',
          x: 248,
          y: 112,
        },
        {
          id: 'heart-5',
          number: 5,
          label: 'Ventrículo izquierdo',
          location: 'Vértice (ápex) y cara izquierda',
          description:
            'Cavidad de pared miocárdica más gruesa encargada de eyectar la sangre oxigenada hacia la aorta venciendo la presión sistémica.',
          examTip:
            'Forma el choque de punta cardíaco palpable en el 5.° espacio intercostal izquierdo, línea medioclavicular.',
          x: 234,
          y: 184,
        },
      ],
    },
    {
      id: 'vis-anat-neuron',
      title: 'Partes Anatómicas de la Neurona Multipolar',
      categoryLabel: 'Ejemplo neuroanatómico',
      caption: 'Explorá cada región desde la recepción de estímulos hasta la sinapsis.',
      templateId: 'neuron',
      parts: [
        {
          id: 'neuron-1',
          number: 1,
          label: 'Dendritas',
          location: 'Prolongaciones ramificadas del soma',
          description:
            'Constituyen la principal superficie receptora donde llegan sinapsis excitatorias e inhibitorias desde otras neuronas.',
          examTip:
            'Presentan espinas dendríticas clave en la plasticidad sináptica y el aprendizaje.',
          x: 62,
          y: 112,
        },
        {
          id: 'neuron-2',
          number: 2,
          label: 'Soma (cuerpo celular)',
          location: 'Centro metabólico neuronal',
          description:
            'Contiene el núcleo y los corpúsculos de Nissl (retículo endoplasmático rugoso) donde se sintetizan proteínas y enzimas.',
          examTip:
            'En el sistema nervioso central los somas se agrupan formando núcleos; en el periférico forman ganglios.',
          x: 114,
          y: 132,
        },
        {
          id: 'neuron-3',
          number: 3,
          label: 'Vaina de mielina',
          location: 'Envoltura aislante alrededor del axón',
          description:
            'Capas lipídicas que aíslan eléctricamente el axón para permitir conducción rápida entre nódulos.',
          examTip:
            'En el SNC la mielina la producen los oligodendrocitos; en el SNP la producen las células de Schwann.',
          x: 183,
          y: 132,
        },
        {
          id: 'neuron-4',
          number: 4,
          label: 'Nódulo de Ranvier',
          location: 'Espacios sin mielina entre segmentos',
          description:
            'Zonas ricas en canales de sodio dependientes de voltaje donde se regenera el potencial de acción (conducción saltatoria).',
          examTip:
            'Evitan la atenuación de la señal a lo largo de axones largos sin gastar energía excesiva.',
          x: 255,
          y: 132,
        },
        {
          id: 'neuron-5',
          number: 5,
          label: 'Botones terminales (telodendrón)',
          location: 'Extremo distal del axón',
          description:
            'Almacenan vesículas con neurotransmisores que se liberan por exocitosis cuando ingresa calcio tras la despolarización.',
          examTip:
            'Conforman el elemento presináptico de la sinapsis química.',
          x: 356,
          y: 132,
        },
      ],
    },
  ],
  studyBlocks: [
    {
      id: 'blk-anat-1',
      sessionLabel: 'Día 1 · Bloque 1',
      title: 'Cavidades cardíacas, válvulas y grandes vasos',
      category: 'teoria',
      durationMinutes: 60,
      objective: 'Ubicar las 4 cavidades y el sentido unidireccional del flujo sanguíneo en el esquema del corazón.',
      deliverable: 'Recorrido completo de circulación menor y mayor explicado de memoria.',
      targetTab: 'summary',
      completed: false,
    },
    {
      id: 'blk-anat-2',
      sessionLabel: 'Día 1 · Bloque 2',
      title: 'Recorrido anatómico paso a paso sobre esquemas',
      category: 'practica',
      durationMinutes: 60,
      objective: 'Identificar cada estructura en los casos visuales de Corazón y Neurona.',
      deliverable: 'Acertar todas las comprobaciones visuales sin mirar apuntes.',
      targetTab: 'exercises',
      completed: false,
    },
    {
      id: 'blk-anat-3',
      sessionLabel: 'Día 2 · Bloque 1',
      title: 'Estructura neuronal y glía mielinizante',
      category: 'repaso',
      durationMinutes: 60,
      objective: 'Diferenciar dendritas, soma, mielina (SNC vs SNP) y botón terminal.',
      deliverable: 'Lista de verificación completa sin errores.',
      targetTab: 'guide',
      completed: false,
    },
    {
      id: 'blk-anat-4',
      sessionLabel: 'Día 2 · Bloque 2',
      title: 'Autoevaluación de reconocimiento anatómico',
      category: 'simulacro',
      durationMinutes: 60,
      objective: 'Responder preguntas tipo parcial diferenciando cavidades y regiones.',
      deliverable: 'Diagnóstico listo antes de rendir.',
      targetTab: 'guide',
      completed: false,
    },
  ],
  keyConcepts: [
    {
      id: 'con-anat-1',
      term: 'Circulación menor (pulmonar) vs. mayor (sistémica)',
      academicDefinition:
        'La circulación menor transporta sangre venosa desde el ventrículo derecho hacia los pulmones para hematosis y retorna a la aurícula izquierda; la mayor parte del ventrículo izquierdo hacia los tejidos y vuelve a la aurícula derecha.',
      simpleExplanation:
        'El circuito menor oxigena la sangre en los pulmones; el circuito mayor reparte esa sangre ya oxigenada a todo el cuerpo.',
      everydayExample:
        'Es como un camión que primero pasa por la planta de carga (pulmones) y después sale a repartir por toda la ciudad (cuerpo).',
    },
    {
      id: 'con-anat-2',
      term: 'Válvulas auriculoventriculares y sigmoideas',
      academicDefinition:
        'Las válvulas tricúspide (derecha) y mitral o bicúspide (izquierda) impiden el reflujo hacia las aurículas durante la sístole; las semilunares pulmonar y aórtica impiden el retorno desde las arterias en diástole.',
      simpleExplanation:
        'Funcionan como puertas de una sola dirección para que la sangre nunca retroceda.',
      everydayExample:
        'Parecido a un molinete de subte o una válvula de bicicleta: dejan pasar hacia adelante y se cierran si algo empuja hacia atrás.',
    },
    {
      id: 'con-anat-3',
      term: 'Conducción saltatoria y mielina',
      academicDefinition:
        'El recubrimiento mielínico segmentado aísla la membrana axonal y restringe la despolarización a los nódulos de Ranvier, multiplicando la velocidad de propagación.',
      simpleExplanation:
        'En lugar de avanzar paso a paso por toda la membrana, la señal eléctrica “salta” de un espacio libre al siguiente.',
      everydayExample:
        'Como cruzar un charco saltando solo por las piedras secas en vez de caminar paso a paso por el agua.',
    },
    {
      id: 'con-anat-4',
      term: 'Diferencia anatómica: arteria vs. vena',
      academicDefinition:
        'Las arterias son vasos eferentes que salen de los ventrículos con pared muscular gruesa; las venas son vasos aferentes que llegan a las aurículas con paredes más delgadas y válvulas venosas.',
      simpleExplanation:
        'Arteria significa que SALE del corazón y vena significa que ENTRA al corazón, sin importar si lleva sangre con mucho o poco oxígeno.',
      everydayExample:
        'La arteria pulmonar lleva sangre con poco oxígeno pero sigue siendo arteria porque sale del ventrículo derecho.',
    },
  ],
  formulas: [],
  examTraps: [
    {
      id: 'trp-anat-1',
      mistake: 'Confundir qué lleva la arteria pulmonar y las venas pulmonares',
      whyItHappens: 'Se suele asociar automáticamente “arteria = sangre oxigenada” y “vena = desoxigenada”.',
      howToAvoid:
        'Recordá la regla anatómica: ARTERIA sale del corazón; VENA entra al corazón. Por eso la arteria pulmonar lleva sangre desoxigenada al pulmón y las venas pulmonares traen sangre oxigenada.',
    },
    {
      id: 'trp-anat-2',
      mistake: 'Invertir derecha e izquierda en un esquema anatómico frontal',
      whyItHappens: 'Mirar el dibujo desde tu propia derecha en vez de la posición anatómica del paciente.',
      howToAvoid:
        'En posición anatómica estándar, el lado derecho del corazón aparece a la izquierda de la pantalla.',
    },
    {
      id: 'trp-anat-3',
      mistake: 'Confundir oligodendrocitos con células de Schwann',
      whyItHappens: 'Ambos fabrican mielina, pero pertenecen a divisiones anatómicas distintas.',
      howToAvoid:
        'Oligodendrocito = Sistema Nervioso Central (SNC, mieliniza varios axones). Célula de Schwann = Sistema Nervioso Periférico (SNP, un segmento por célula).',
    },
  ],
  guideSections: [
    {
      id: 'gui-anat-1',
      order: 1,
      title: '1. Seguir el recorrido de una gota de sangre paso a paso',
      coreIdea: 'Si dominás el orden de las cavidades y válvulas, no fallás ninguna pregunta cardiovascular.',
      explanation:
        'Venas cavas → Aurícula derecha → Válvula tricúspide → Ventrículo derecho → Válvula pulmonar → Pulmones → Venas pulmonares → Aurícula izquierda → Válvula mitral → Ventrículo izquierdo → Válvula aórtica → Aorta.',
      concreteExample:
        'Si en el parcial te preguntan qué válvula separa la aurícula izquierda del ventrículo izquierdo, ubicás el lado izquierdo en el esquema: válvula mitral (bicúspide).',
      keyTakeaway: 'Derecha = tricúspide; izquierda = mitral (bicúspide).',
    },
    {
      id: 'gui-anat-2',
      order: 2,
      title: '2. Polaridad y dirección de la señal en la neurona',
      coreIdea: 'La información fluye de dendritas y soma hacia el axón y los botones terminales.',
      explanation:
        'Las dendritas reciben múltiples estímulos, el cono axónico decide si se dispara el potencial de acción y el axón mielinizado lo conduce rápido hasta la sinapsis distal.',
      concreteExample:
        'En una motoneurona medular, las dendritas reciben órdenes corticales y el axón recorre todo el nervio periférico hasta el músculo.',
      keyTakeaway: 'Recepción (dendritas) → Integración (soma) → Conducción (axón) → Transmisión (terminal).',
    },
  ],
  masteryChecklist: [
    { id: 'chk-anat-1', label: 'Identifico en un esquema anterior las 4 cavidades cardíacas sin invertir derecha e izquierda.', checked: false },
    { id: 'chk-anat-2', label: 'Nombro en orden las válvulas y grandes vasos de la circulación menor y mayor.', checked: false },
    { id: 'chk-anat-3', label: 'Distingo qué célula mieliniza en el SNC (oligodendrocito) y en el SNP (Schwann).', checked: false },
    { id: 'chk-anat-4', label: 'Ubico dendritas, soma, nódulos de Ranvier y botones terminales en una neurona.', checked: false },
  ],
  quizQuestions: [
    {
      id: 'qz-anat-1',
      question: '¿Qué vaso sanguíneo desemboca en la aurícula izquierda trayendo sangre oxigenada desde los pulmones?',
      options: [
        'Vena cava superior',
        'Tronco pulmonar',
        'Venas pulmonares',
        'Arteria aorta',
      ],
      correctIndex: 2,
      explanation: 'Las cuatro venas pulmonares traen sangre oxigenada desde ambos pulmones hacia la aurícula izquierda.',
    },
    {
      id: 'qz-anat-2',
      question: '¿Qué célula produce la vaina de mielina en los nervios del sistema nervioso periférico (SNP)?',
      options: [
        'Astrocito fibroso',
        'Célula de Schwann',
        'Microglía',
        'Oligodendrocito',
      ],
      correctIndex: 1,
      explanation: 'Las células de Schwann forman la mielina en el SNP; los oligodendrocitos lo hacen en el SNC.',
    },
  ],
  exercises: [
    {
      id: 'ex-anat-heart-walk',
      title: 'Recorrido anatómico de la sangre en el corazón',
      topic: 'Anatomía Cardiovascular',
      difficulty: 'Base',
      statement:
        'Identificá en orden las partes anatómicas del corazón que atraviesa la sangre desde su llegada sistémica hasta su eyección por la aorta.',
      givenData: [
        { symbol: 'Llegada', value: 'Venas cavas', unit: 'Sangre venosa' },
        { symbol: 'Lado derecho', value: 'AD → VD', unit: 'Válvula tricúspide' },
        { symbol: 'Lado izquierdo', value: 'AI → VI', unit: 'Válvula mitral' },
      ],
      unknowns: [
        'Ubicar cavidades derecha e izquierda en vista anterior',
        'Diferenciar la pared del ventrículo izquierdo frente al derecho',
      ],
      visualConfig: {
        type: 'visual_diagram',
        caption: 'Hacé clic en los pines o avanzá por los pasos para resaltar cada parte anatómica.',
        visualExample: {
          id: 'ex-vis-heart',
          title: 'Esquema cardíaco por etapas',
          categoryLabel: 'Ejemplo anatómico · Recorrido paso a paso',
          caption: 'Vista anterior anatómica del corazón y grandes vasos',
          templateId: 'heart',
          parts: [
            {
              id: 'eh-1',
              number: 1,
              label: 'Aurícula derecha',
              location: 'Superior derecha (izquierda en la imagen)',
              description: 'Recibe la sangre carboxigenada de las venas cavas superior e inferior.',
              examTip: 'Alberga al nodo sinusal.',
              x: 138,
              y: 118,
            },
            {
              id: 'eh-2',
              number: 2,
              label: 'Ventrículo derecho',
              location: 'Inferior derecha',
              description: 'Impulsa la sangre por el tronco pulmonar hacia los pulmones.',
              examTip: 'Separado de la aurícula derecha por la válvula tricúspide.',
              x: 164,
              y: 184,
            },
            {
              id: 'eh-3',
              number: 3,
              label: 'Aurícula izquierda',
              location: 'Superior izquierda',
              description: 'Recibe la sangre ya oxigenada por las cuatro venas pulmonares.',
              examTip: 'Cara más posterior del corazón.',
              x: 248,
              y: 112,
            },
            {
              id: 'eh-4',
              number: 4,
              label: 'Ventrículo izquierdo y Aorta',
              location: 'Vértice cardíaco y cayado superior',
              description: 'Su pared gruesa impulsa la sangre hacia la válvula aórtica y todo el organismo.',
              examTip: 'Válvula mitral separa AI de VI.',
              x: 234,
              y: 184,
            },
          ],
        },
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Ubicar la Aurícula Derecha (entrada sistémica)',
          thinkingPrompt: 'Recordá que en posición anatómica, la derecha del paciente queda a la izquierda del esquema.',
          explanation:
            'La sangre venosa llega por las venas cavas superior e inferior a la aurícula derecha. Desde allí atraviesa la válvula tricúspide en diástole.',
          watchOut: 'No confundas el lado derecho del dibujo con tu mano derecha.',
          highlightPartNumber: 1,
          quickCheck: {
            question: '¿Qué válvula comunica la aurícula derecha con el ventrículo derecho?',
            options: ['Válvula mitral', 'Válvula tricúspide', 'Válvula aórtica'],
            correctIndex: 1,
            feedback: 'Correcto: en el lado derecho está la válvula tricúspide; en el izquierdo la mitral.',
          },
        },
        {
          stepNumber: 2,
          title: 'Seguir hacia el Ventrículo Derecho y circulación pulmonar',
          thinkingPrompt: 'Observá qué vaso sale hacia arriba desde el centro del corazón.',
          explanation:
            'El ventrículo derecho se contrae y eyecta la sangre a través de la válvula sigmoidea pulmonar hacia el tronco pulmonar rumbo a los alvéolos para el intercambio gaseoso.',
          watchOut: 'El tronco pulmonar es una arteria aunque lleve sangre desoxigenada.',
          highlightPartNumber: 2,
        },
        {
          stepNumber: 3,
          title: 'Retorno oxigenado a la Aurícula Izquierda',
          thinkingPrompt: 'Ubicá la cavidad superior del lado izquierdo del corazón.',
          explanation:
            'La sangre oxigenada regresa por las cuatro venas pulmonares a la aurícula izquierda y desciende por la válvula bicúspide o mitral.',
          watchOut: 'Son cuatro venas pulmonares (dos derechas y dos izquierdas) y carecen de válvulas en su desembocadura.',
          highlightPartNumber: 3,
        },
        {
          stepNumber: 4,
          title: 'Eyección desde el Ventrículo Izquierdo hacia la Aorta',
          thinkingPrompt: 'Compará el grosor muscular izquierdo frente al derecho.',
          explanation:
            'El ventrículo izquierdo posee la pared más gruesa porque debe vencer la presión arterial sistémica y enviar sangre por la válvula aórtica hacia el cayado de la aorta.',
          watchOut: 'El vértice (ápex) cardíaco pertenece al ventrículo izquierdo.',
          highlightPartNumber: 4,
          quickCheck: {
            question: '¿Por qué la pared del ventrículo izquierdo es aproximadamente tres veces más gruesa?',
            options: [
              'Porque almacena el doble de volumen que el derecho',
              'Porque debe impulsar sangre contra la alta resistencia de todo el cuerpo',
              'Porque recibe sangre directamente de las venas cavas',
            ],
            correctIndex: 1,
            feedback: 'Exacto: ambos ventrículos manejan el mismo volumen por latido, pero el izquierdo genera mucha más presión.',
          },
        },
      ],
      finalAnswer:
        'Circulación completa identificada: Venas cavas → Aurícula derecha → Tricúspide → Ventrículo derecho → Pulmones → Venas pulmonares → Aurícula izquierda → Mitral → Ventrículo izquierdo → Aorta.',
    },
    {
      id: 'ex-anat-neuron-walk',
      title: 'Partes de la neurona y conducción del impulso',
      topic: 'Neuroanatomía Básica',
      difficulty: 'Parcial',
      statement:
        'Analizá la secuencia anatómica y funcional de una neurona multipolar desde la recepción del estímulo hasta la sinapsis.',
      givenData: [
        { symbol: 'Zona receptora', value: 'Dendritas y soma', unit: 'Potenciales graduados' },
        { symbol: 'Zona conductora', value: 'Axón mielinizado', unit: 'Conducción saltatoria' },
        { symbol: 'Zona efectora', value: 'Botones terminales', unit: 'Sinapsis química' },
      ],
      unknowns: [
        'Relacionar cada estructura anatómica con su función',
        'Identificar dónde se regenera el impulso eléctrico',
      ],
      visualConfig: {
        type: 'visual_diagram',
        caption: 'Cada paso resalta la región neuronal correspondiente.',
        visualExample: {
          id: 'ex-vis-neuron',
          title: 'Anatomía funcional de la neurona',
          categoryLabel: 'Ejemplo anatómico · Neuroanatomía',
          caption: 'Estructura multipolar clásica',
          templateId: 'neuron',
          parts: [
            {
              id: 'en-1',
              number: 1,
              label: 'Dendritas',
              location: 'Extremo receptor ramificado',
              description: 'Captan señales sinápticas de neuronas vecinas.',
              examTip: 'Mayor ramificación implica mayor capacidad de integración.',
              x: 62,
              y: 112,
            },
            {
              id: 'en-2',
              number: 2,
              label: 'Soma y cono axónico',
              location: 'Cuerpo celular',
              description: 'Integra las señales entrantes y dispara el potencial de acción en el cono axónico.',
              examTip: 'Contiene corpúsculos de Nissl (RER abundante).',
              x: 114,
              y: 132,
            },
            {
              id: 'en-3',
              number: 3,
              label: 'Mielina y Nódulos de Ranvier',
              location: 'Trayecto del axón',
              description: 'La mielina aísla y el impulso salta de nódulo en nódulo.',
              examTip: 'En el SNC la mielina proviene de oligodendrocitos.',
              x: 220,
              y: 132,
            },
            {
              id: 'en-4',
              number: 4,
              label: 'Botones terminales',
              location: 'Extremo distal',
              description: 'Liberan neurotransmisores hacia la célula postsináptica.',
              examTip: 'La entrada de Ca²⁺ dispara la fusión de vesículas.',
              x: 356,
              y: 132,
            },
          ],
        },
      },
      steps: [
        {
          stepNumber: 1,
          title: 'Recepción en las dendritas',
          thinkingPrompt: 'Ubicá las ramificaciones cortas que rodean el cuerpo celular.',
          explanation:
            'Las dendritas actúan como antenas receptoras donde hacen contacto los terminales axónicos de otras neuronas.',
          watchOut: 'No tienen vaina de mielina.',
          highlightPartNumber: 1,
        },
        {
          stepNumber: 2,
          title: 'Integración en el soma y disparo en el cono axónico',
          thinkingPrompt: 'Observá el cuerpo central donde se aloja el núcleo.',
          explanation:
            'El soma mantiene el metabolismo celular e integra las señales recibidas; si alcanzan el umbral, el cono axónico inicia el potencial de acción.',
          watchOut: 'Un conjunto de somas en el SNC se llama núcleo, mientras que en el SNP se denomina ganglio.',
          highlightPartNumber: 2,
        },
        {
          stepNumber: 3,
          title: 'Conducción saltatoria por mielina y nódulos de Ranvier',
          thinkingPrompt: 'Mirá los segmentos aislantes alternados con pequeños espacios expuestos.',
          explanation:
            'La vaina de mielina impide fugas de corriente y concentra la despolarización en los nódulos de Ranvier, acelerando notablemente el impulso.',
          watchOut: 'En enfermedades desmielinizantes como la esclerosis múltiple se enlentece o bloquea esta conducción.',
          highlightPartNumber: 3,
          quickCheck: {
            question: '¿Dónde se regenera el potencial de acción durante la conducción saltatoria?',
            options: [
              'A lo largo de toda la vaina lipídica sin interrupciones',
              'Únicamente en los nódulos de Ranvier',
              'Dentro del núcleo celular',
            ],
            correctIndex: 1,
            feedback: 'Exacto: los canales de sodio dependientes de voltaje se concentran en los nódulos de Ranvier.',
          },
        },
        {
          stepNumber: 4,
          title: 'Transmisión sináptica en los botones terminales',
          thinkingPrompt: 'Ubicá las dilataciones finales al terminar el axón.',
          explanation:
            'Al llegar el impulso al botón terminal, se abren canales de calcio que provocan la liberación de neurotransmisores hacia la neurona o músculo siguiente.',
          watchOut: 'En la sinapsis química hay un retardo sináptico breve y transmisión unidireccional.',
          highlightPartNumber: 4,
        },
      ],
      finalAnswer:
        'Polaridad funcional completada: Dendritas (recepción) → Soma/Cono axónico (integración) → Axón mielinizado/Nódulos (conducción saltatoria) → Botones terminales (liberación de neurotransmisores).',
    },
  ],
  examModels: [
    {
      id: 'sample-exam-anat-1',
      title: 'Primer Parcial Modelo — Anatomía Cardiovascular y Neurona',
      source: 'sample',
      examType: 'Primer Parcial',
      passingScore: 60,
      createdAt: '2026-11-15T08:00:00.000Z',
      questions: [
        {
          id: 'ana-q1',
          number: 1,
          type: 'choice',
          topic: 'Válvulas Cardíacas',
          points: 25,
          prompt:
            '¿Qué válvula impide el reflujo de sangre desde el ventrículo izquierdo hacia la aurícula izquierda durante la sístole ventricular?',
          options: [
            'Válvula mitral o bicúspide',
            'Válvula tricúspide',
            'Válvula sigmoidea aórtica',
            'Válvula sigmoidea pulmonar',
          ],
          correctIndex: 0,
          modelSolution:
            'La válvula mitral (bicúspide) comunica la aurícula izquierda con el ventrículo izquierdo y se cierra en la sístole ventricular para evitar el retroceso hacia la aurícula.',
          gradingCriteria: 'Identificar correctamente la válvula auriculoventricular izquierda (mitral).',
        },
        {
          id: 'ana-q2',
          number: 2,
          type: 'choice',
          topic: 'Conducción Saltatoria Neuronal',
          points: 25,
          prompt:
            'En una neurona multipolar mielinizada, ¿en qué estructura anatómica se regenera el potencial de acción durante la conducción saltatoria?',
          options: [
            'En los nódulos de Ranvier',
            'Exclusivamente en las dendritas distales',
            'Dentro de las células de Schwann recubiertas de lípidos',
            'En el nucléolo del soma neuronal',
          ],
          correctIndex: 0,
          modelSolution:
            'Los nódulos de Ranvier son los espacios sin mielina entre segmentos consecutivos donde se concentran los canales de sodio dependientes de voltaje.',
          gradingCriteria: 'Reconocer la función de los nódulos de Ranvier en la conducción saltatoria.',
        },
        {
          id: 'ana-q3',
          number: 3,
          type: 'open',
          topic: 'Circulación Menor y Mayor',
          points: 25,
          prompt:
            'Describí ordenadamente el recorrido de la sangre desde que ingresa desoxigenada a la aurícula derecha hasta que sale oxigenada por la arteria aorta, nombrando las cavidades y válvulas atravesadas.',
          modelSolution:
            'Aurícula derecha → válvula tricúspide → ventrículo derecho → válvula pulmonar → arteria pulmonar hacia pulmones (hematosis) → venas pulmonares → aurícula izquierda → válvula mitral → ventrículo izquierdo → válvula aórtica → arteria aorta.',
          gradingCriteria: '15 pts por la secuencia correcta de cavidades y vasos; 10 pts por nombrar correctamente las cuatro válvulas en orden.',
        },
        {
          id: 'ana-q4',
          number: 4,
          type: 'open',
          topic: 'Morfología Funcional de la Neurona',
          points: 25,
          prompt:
            'Explicá la diferencia estructural y funcional entre las dendritas y el axón, y por qué la pared del ventrículo izquierdo es más gruesa que la del ventrículo derecho.',
          modelSolution:
            'Las dendritas son múltiples, cortas y ramificadas, especializadas en recibir señales aferentes; el axón es una prolongación única que conduce el impulso eferente hacia los botones terminales. El ventrículo izquierdo tiene miocardio más grueso porque debe vencer la alta resistencia vascular de la circulación sistémica (mayor), a diferencia del circuito pulmonar de baja presión.',
          gradingCriteria: '12 pts por contrastar dendritas vs axón; 13 pts por relacionar el grosor del miocardio izquierdo con la presión sistémica.',
        },
      ],
    },
  ],
};

