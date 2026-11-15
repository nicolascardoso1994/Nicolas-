export type ElementCategory =
  | 'alkali-metal'
  | 'alkaline-earth'
  | 'transition-metal'
  | 'post-transition'
  | 'metalloid'
  | 'reactive-nonmetal'
  | 'halogen'
  | 'noble-gas'
  | 'lanthanide'
  | 'actinide';

export type MatterState = 'Sólido' | 'Líquido' | 'Gas';

export interface PeriodicElement {
  number: number;
  symbol: string;
  name: string;
  atomicMass: number;
  category: ElementCategory;
  group: number | null;
  period: number;
  gridRow: number;
  gridCol: number;
  state: MatterState;
  electronegativity: number | null;
  electronConfig: string;
  oxidationStates: string;
  ionizationEv: number | null;
  studyNote: string;
}

export const CATEGORY_META: Record<
  ElementCategory,
  {
    label: string;
    shortLabel: string;
    cellBg: string;
    cellBorder: string;
    cellText: string;
    dotColor: string;
  }
> = {
  'reactive-nonmetal': {
    label: 'No metales',
    shortLabel: 'No metal',
    cellBg: 'bg-sky-50 hover:bg-sky-100',
    cellBorder: 'border-sky-200',
    cellText: 'text-sky-950',
    dotColor: 'bg-sky-500',
  },
  'noble-gas': {
    label: 'Gases nobles',
    shortLabel: 'Gas noble',
    cellBg: 'bg-indigo-50 hover:bg-indigo-100',
    cellBorder: 'border-indigo-200',
    cellText: 'text-indigo-950',
    dotColor: 'bg-indigo-500',
  },
  'alkali-metal': {
    label: 'Metales alcalinos',
    shortLabel: 'Alcalino',
    cellBg: 'bg-rose-50 hover:bg-rose-100',
    cellBorder: 'border-rose-200',
    cellText: 'text-rose-950',
    dotColor: 'bg-rose-500',
  },
  'alkaline-earth': {
    label: 'Alcalinotérreos',
    shortLabel: 'Alcalinotérreo',
    cellBg: 'bg-amber-50 hover:bg-amber-100',
    cellBorder: 'border-amber-200',
    cellText: 'text-amber-950',
    dotColor: 'bg-amber-500',
  },
  metalloid: {
    label: 'Metaloides',
    shortLabel: 'Metaloide',
    cellBg: 'bg-teal-50 hover:bg-teal-100',
    cellBorder: 'border-teal-200',
    cellText: 'text-teal-950',
    dotColor: 'bg-teal-500',
  },
  halogen: {
    label: 'Halógenos',
    shortLabel: 'Halógeno',
    cellBg: 'bg-cyan-50 hover:bg-cyan-100',
    cellBorder: 'border-cyan-200',
    cellText: 'text-cyan-950',
    dotColor: 'bg-cyan-500',
  },
  'post-transition': {
    label: 'Otros metales',
    shortLabel: 'Post-transición',
    cellBg: 'bg-emerald-50 hover:bg-emerald-100',
    cellBorder: 'border-emerald-200',
    cellText: 'text-emerald-950',
    dotColor: 'bg-emerald-500',
  },
  'transition-metal': {
    label: 'Metales de transición',
    shortLabel: 'Transición',
    cellBg: 'bg-slate-100 hover:bg-slate-200/80',
    cellBorder: 'border-slate-300',
    cellText: 'text-slate-900',
    dotColor: 'bg-slate-500',
  },
  lanthanide: {
    label: 'Lantánidos',
    shortLabel: 'Lantánido',
    cellBg: 'bg-orange-50 hover:bg-orange-100',
    cellBorder: 'border-orange-200',
    cellText: 'text-orange-950',
    dotColor: 'bg-orange-500',
  },
  actinide: {
    label: 'Actínidos',
    shortLabel: 'Actínido',
    cellBg: 'bg-fuchsia-50 hover:bg-fuchsia-100',
    cellBorder: 'border-fuchsia-200',
    cellText: 'text-fuchsia-950',
    dotColor: 'bg-fuchsia-500',
  },
};

type RawElementTuple = [
  number, // 0: Z
  string, // 1: symbol
  string, // 2: Spanish name
  number, // 3: atomic mass
  ElementCategory, // 4: category
  number | null, // 5: group (1..18 or null for f-block)
  number, // 6: period (1..7)
  number, // 7: gridRow (1..7, 9 for lanthanides, 10 for actinides)
  number, // 8: gridCol (1..18)
  MatterState, // 9: state at 25°C
  number | null, // 10: Pauling electronegativity
  string, // 11: electron configuration
  string, // 12: oxidation states
  number | null, // 13: 1st ionization energy (eV)
  string, // 14: concise study note
];

const RAW_ELEMENTS: RawElementTuple[] = [
  [1, 'H', 'Hidrógeno', 1.008, 'reactive-nonmetal', 1, 1, 1, 1, 'Gas', 2.2, '1s¹', '-1, +1', 13.598, 'Elemento más abundante del universo; forma enlaces covalentes y puentes de hidrógeno.'],
  [2, 'He', 'Helio', 4.0026, 'noble-gas', 18, 1, 1, 18, 'Gas', null, '1s²', '0', 24.587, 'Gas noble con capa 1s completa (dueto estable); energía de ionización más alta.'],

  [3, 'Li', 'Litio', 6.94, 'alkali-metal', 1, 2, 2, 1, 'Sólido', 0.98, '[He] 2s¹', '+1', 5.392, 'Metal más liviano; muy reactivo con el agua y clave en baterías recargables.'],
  [4, 'Be', 'Berilio', 9.0122, 'alkaline-earth', 2, 2, 2, 2, 'Sólido', 1.57, '[He] 2s²', '+2', 9.323, 'Alcalinotérreo con tendencia covalente por su alta densidad de carga.'],
  [5, 'B', 'Boro', 10.81, 'metalloid', 13, 2, 2, 13, 'Sólido', 2.04, '[He] 2s² 2p¹', '+3', 8.298, 'Metaloide trivalente; suele formar compuestos con octeto incompleto como BF₃.'],
  [6, 'C', 'Carbono', 12.011, 'reactive-nonmetal', 14, 2, 2, 14, 'Sólido', 2.55, '[He] 2s² 2p²', '-4 a +4', 11.26, 'Base de la química orgánica; tetravalente con hibridación sp, sp² y sp³.'],
  [7, 'N', 'Nitrógeno', 14.007, 'reactive-nonmetal', 15, 2, 2, 15, 'Gas', 3.04, '[He] 2s² 2p³', '-3 a +5', 14.534, 'Forma N₂ con triple enlace muy estable; esencial en aminoácidos y ácidos nucleicos.'],
  [8, 'O', 'Oxígeno', 15.999, 'reactive-nonmetal', 16, 2, 2, 16, 'Gas', 3.44, '[He] 2s² 2p⁴', '-2, -1', 13.618, 'Segundo elemento más electronegativo; estado de oxidación típico -2 (excepto peróxidos -1).'],
  [9, 'F', 'Flúor', 18.998, 'halogen', 17, 2, 2, 17, 'Gas', 3.98, '[He] 2s² 2p⁵', '-1', 17.423, 'Elemento más electronegativo de la tabla (3.98); siempre actúa con número de oxidación -1.'],
  [10, 'Ne', 'Neón', 20.18, 'noble-gas', 18, 2, 2, 18, 'Gas', null, '[He] 2s² 2p⁶', '0', 21.565, 'Gas noble inerte con octeto completo en el nivel 2.'],

  [11, 'Na', 'Sodio', 22.99, 'alkali-metal', 1, 3, 3, 1, 'Sólido', 0.93, '[Ne] 3s¹', '+1', 5.139, 'Catión extracelular principal; reacciona vigorosamente con agua liberando H₂.'],
  [12, 'Mg', 'Magnesio', 24.305, 'alkaline-earth', 2, 3, 3, 2, 'Sólido', 1.31, '[Ne] 3s²', '+2', 7.646, 'Catión divalente Mg²⁺; átomo central en la clorofila y reactivos de Grignard.'],
  [13, 'Al', 'Aluminio', 26.982, 'post-transition', 13, 3, 3, 13, 'Sólido', 1.61, '[Ne] 3s² 3p¹', '+3', 5.986, 'Metal anfótero liviano; su óxido Al₂O₃ forma una capa pasivante protectora.'],
  [14, 'Si', 'Silicio', 28.085, 'metalloid', 14, 3, 3, 14, 'Sólido', 1.9, '[Ne] 3s² 3p²', '-4, +4', 8.152, 'Semiconductor fundamental en electrónica; base de los silicatos y el cuarzo (SiO₂).'],
  [15, 'P', 'Fósforo', 30.974, 'reactive-nonmetal', 15, 3, 3, 15, 'Sólido', 2.19, '[Ne] 3s² 3p³', '-3, +3, +5', 10.487, 'Puede expandir su octeto (ej. PCl₅, H₃PO₄); clave en ATP y ADN.'],
  [16, 'S', 'Azufre', 32.06, 'reactive-nonmetal', 16, 3, 3, 16, 'Sólido', 2.58, '[Ne] 3s² 3p⁴', '-2, +4, +6', 10.36, 'Forma sulfuros (-2), dióxido (+4) y ácido sulfúrico H₂SO₄ (+6).'],
  [17, 'Cl', 'Cloro', 35.45, 'halogen', 17, 3, 3, 17, 'Gas', 3.16, '[Ne] 3s² 3p⁵', '-1, +1, +3, +5, +7', 12.968, 'Halógeno oxidante; forma cloruros (-1) y oxoácidos desde HClO hasta HClO₄.'],
  [18, 'Ar', 'Argón', 39.948, 'noble-gas', 18, 3, 3, 18, 'Gas', null, '[Ne] 3s² 3p⁶', '0', 15.76, 'Tercer gas más abundante de la atmósfera (~0.93%); usado como atmósfera inerte.'],

  [19, 'K', 'Potasio', 39.098, 'alkali-metal', 1, 4, 4, 1, 'Sólido', 0.82, '[Ar] 4s¹', '+1', 4.341, 'Alcalino más reactivo que el sodio; esencial en el potencial de membrana celular.'],
  [20, 'Ca', 'Calcio', 40.078, 'alkaline-earth', 2, 4, 4, 2, 'Sólido', 1.0, '[Ar] 4s²', '+2', 6.113, 'Forma CaCO₃ (calcita) y Ca(OH)₂; clave en estructura ósea y coagulación.'],
  [21, 'Sc', 'Escandio', 44.956, 'transition-metal', 3, 4, 4, 3, 'Sólido', 1.36, '[Ar] 3d¹ 4s²', '+3', 6.561, 'Primer metal de transición del bloque d; forma casi exclusivamente ion Sc³⁺.'],
  [22, 'Ti', 'Titanio', 47.867, 'transition-metal', 4, 4, 4, 4, 'Sólido', 1.54, '[Ar] 3d² 4s²', '+2, +3, +4', 6.828, 'Alta resistencia mecánica con baja densidad y gran resistencia a la corrosión.'],
  [23, 'V', 'Vanadio', 50.942, 'transition-metal', 5, 4, 4, 5, 'Sólido', 1.63, '[Ar] 3d³ 4s²', '+2, +3, +4, +5', 6.746, 'Presenta estados de oxidación coloridos en solución acuosa (+2 a +5).'],
  [24, 'Cr', 'Cromo', 51.996, 'transition-metal', 6, 4, 4, 6, 'Sólido', 1.66, '[Ar] 3d⁵ 4s¹', '+2, +3, +6', 6.767, 'Excepción de Aufbau (3d⁵ 4s¹ por estabilidad de subcapa semillena); Cr(VI) es oxidante fuerte.'],
  [25, 'Mn', 'Manganeso', 54.938, 'transition-metal', 7, 4, 4, 7, 'Sólido', 1.55, '[Ar] 3d⁵ 4s²', '+2, +4, +7', 7.434, 'Amplio rango redox; el permanganato MnO₄⁻ (+7) es un oxidante clásico de titulación.'],
  [26, 'Fe', 'Hierro', 55.845, 'transition-metal', 8, 4, 4, 8, 'Sólido', 1.83, '[Ar] 3d⁶ 4s²', '+2, +3', 7.902, 'Base del acero; Fe²⁺ (ferroso) y Fe³⁺ (férrico) transportan O₂ en la hemoglobina.'],
  [27, 'Co', 'Cobalto', 58.933, 'transition-metal', 9, 4, 4, 9, 'Sólido', 1.88, '[Ar] 3d⁷ 4s²', '+2, +3', 7.881, 'Metal ferromagnético presente en la vitamina B₁₂ y complejos de coordinación.'],
  [28, 'Ni', 'Níquel', 58.693, 'transition-metal', 10, 4, 4, 10, 'Sólido', 1.91, '[Ar] 3d⁸ 4s²', '+2', 7.64, 'Catalizador frecuente en hidrogenaciones y componente de aceros inoxidables.'],
  [29, 'Cu', 'Cobre', 63.546, 'transition-metal', 11, 4, 4, 11, 'Sólido', 1.9, '[Ar] 3d¹⁰ 4s¹', '+1, +2', 7.726, 'Excepción de Aufbau (3d¹⁰ 4s¹ por subcapa d llena); excelente conductor eléctrico.'],
  [30, 'Zn', 'Cinc', 65.38, 'transition-metal', 12, 4, 4, 12, 'Sólido', 1.65, '[Ar] 3d¹⁰ 4s²', '+2', 9.394, 'Siempre forma Zn²⁺ (capa 3d¹⁰ completa); usado en galvanizado y pilas Daniell.'],
  [31, 'Ga', 'Galio', 69.723, 'post-transition', 13, 4, 4, 13, 'Sólido', 1.81, '[Ar] 3d¹⁰ 4s² 4p¹', '+3', 5.999, 'Funde a 29.8 °C (en la palma de la mano); base de semiconductores GaAs.'],
  [32, 'Ge', 'Germanio', 72.63, 'metalloid', 14, 4, 4, 14, 'Sólido', 2.01, '[Ar] 3d¹⁰ 4s² 4p²', '+2, +4', 7.9, 'Metaloide semiconductor predicho por Mendeléyev como «eka-silicio».'],
  [33, 'As', 'Arsénico', 74.922, 'metalloid', 15, 4, 4, 15, 'Sólido', 2.18, '[Ar] 3d¹⁰ 4s² 4p³', '-3, +3, +5', 9.789, 'Metaloide del grupo 15; usado en dopaje de semiconductores tipo n.'],
  [34, 'Se', 'Selenio', 78.971, 'reactive-nonmetal', 16, 4, 4, 16, 'Sólido', 2.55, '[Ar] 3d¹⁰ 4s² 4p⁴', '-2, +4, +6', 9.752, 'Propiedades fotocondutoras; oligoelemento esencial en enzimas antioxidantes.'],
  [35, 'Br', 'Bromo', 79.904, 'halogen', 17, 4, 4, 17, 'Líquido', 2.96, '[Ar] 3d¹⁰ 4s² 4p⁵', '-1, +1, +5', 11.814, 'Único no metal líquido a temperatura ambiente (25 °C); reacciona con alquenos.'],
  [36, 'Kr', 'Kriptón', 83.798, 'noble-gas', 18, 4, 4, 18, 'Gas', 3.0, '[Ar] 3d¹⁰ 4s² 4p⁶', '0, +2', 14.0, 'Gas noble que puede formar fluoruros como KrF₂ en condiciones extremas.'],

  [37, 'Rb', 'Rubidio', 85.468, 'alkali-metal', 1, 5, 5, 1, 'Sólido', 0.82, '[Kr] 5s¹', '+1', 4.177, 'Alcalino muy blando y reactivo; usado en relojes atómicos y láseres.'],
  [38, 'Sr', 'Estroncio', 87.62, 'alkaline-earth', 2, 5, 5, 2, 'Sólido', 0.95, '[Kr] 5s²', '+2', 5.695, 'Imparte color rojo intenso a la llama; químicamente similar al calcio.'],
  [39, 'Y', 'Itrio', 88.906, 'transition-metal', 3, 5, 5, 3, 'Sólido', 1.22, '[Kr] 4d¹ 5s²', '+3', 6.217, 'Presente en superconductores de alta temperatura (YBCO) y fósforos LED.'],
  [40, 'Zr', 'Circonio', 91.224, 'transition-metal', 4, 5, 5, 4, 'Sólido', 1.33, '[Kr] 4d² 5s²', '+4', 6.634, 'Muy resistente a la corrosión y baja absorción de neutrones en reactores.'],
  [41, 'Nb', 'Niobio', 92.906, 'transition-metal', 5, 5, 5, 5, 'Sólido', 1.6, '[Kr] 4d⁴ 5s¹', '+5', 6.759, 'Usado en imanes superconductores y superaleaciones aeroespaciales.'],
  [42, 'Mo', 'Molibdeno', 95.95, 'transition-metal', 6, 5, 5, 6, 'Sólido', 2.16, '[Kr] 4d⁵ 5s¹', '+4, +6', 7.092, 'Alto punto de fusión; cofactor en la enzima nitrogenasa para fijar N₂.'],
  [43, 'Tc', 'Tecnecio', 98.0, 'transition-metal', 7, 5, 5, 7, 'Sólido', 1.9, '[Kr] 4d⁵ 5s²', '+4, +7', 7.28, 'Elemento más liviano sin isótopos estables; Tc-99m se usa en medicina nuclear.'],
  [44, 'Ru', 'Rutenio', 101.07, 'transition-metal', 8, 5, 5, 8, 'Sólido', 2.2, '[Kr] 4d⁷ 5s¹', '+3, +4, +8', 7.361, 'Metal del grupo del platino; catalizador clave en metátesis de olefinas.'],
  [45, 'Rh', 'Rodio', 102.91, 'transition-metal', 9, 5, 5, 9, 'Sólido', 2.28, '[Kr] 4d⁸ 5s¹', '+3', 7.459, 'Catalizador altamente eficiente en convertidores catalíticos automotrices.'],
  [46, 'Pd', 'Paladio', 106.42, 'transition-metal', 10, 5, 5, 10, 'Sólido', 2.2, '[Kr] 4d¹⁰', '+2, +4', 8.337, 'Configuración 4d¹⁰ 5s⁰; absorbe grandes volúmenes de H₂ y cataliza acoplamientos.'],
  [47, 'Ag', 'Plata', 107.87, 'transition-metal', 11, 5, 5, 11, 'Sólido', 1.93, '[Kr] 4d¹⁰ 5s¹', '+1', 7.576, 'Mayor conductividad eléctrica y térmica de todos los metales; ion típico Ag⁺.'],
  [48, 'Cd', 'Cadmio', 112.41, 'transition-metal', 12, 5, 5, 12, 'Sólido', 1.69, '[Kr] 4d¹⁰ 5s²', '+2', 8.994, 'Metal tóxico del grupo 12; usado en pigmentos, recubrimientos y puntos cuánticos.'],
  [49, 'In', 'Indio', 114.82, 'post-transition', 13, 5, 5, 13, 'Sólido', 1.78, '[Kr] 4d¹⁰ 5s² 5p¹', '+3', 5.786, 'Óxido de indio y estaño (ITO) se usa en pantallas táctiles transparentes.'],
  [50, 'Sn', 'Estaño', 118.71, 'post-transition', 14, 5, 5, 14, 'Sólido', 1.96, '[Kr] 4d¹⁰ 5s² 5p²', '+2, +4', 7.344, 'Presenta efecto del par inerte (+2 y +4); componente tradicional de soldaduras y bronce.'],
  [51, 'Sb', 'Antimonio', 121.76, 'metalloid', 15, 5, 5, 15, 'Sólido', 2.05, '[Kr] 4d¹⁰ 5s² 5p³', '-3, +3, +5', 8.608, 'Metaloide usado en retardantes de llama y aleaciones para baterías de plomo.'],
  [52, 'Te', 'Telurio', 127.6, 'metalloid', 16, 5, 5, 16, 'Sólido', 2.1, '[Kr] 4d¹⁰ 5s² 5p⁴', '-2, +4, +6', 9.01, 'Metaloide utilizado en paneles solares CdTe y termoeléctricos.'],
  [53, 'I', 'Yodo', 126.9, 'halogen', 17, 5, 5, 17, 'Sólido', 2.66, '[Kr] 4d¹⁰ 5s² 5p⁵', '-1, +1, +5, +7', 10.451, 'Sólido molecular violeta que sublima fácilmente; esencial para hormonas tiroideas.'],
  [54, 'Xe', 'Xenón', 131.29, 'noble-gas', 18, 5, 5, 18, 'Gas', 2.6, '[Kr] 4d¹⁰ 5s² 5p⁶', '0, +2, +4, +6', 12.13, 'Primer gas noble en formar compuestos estables (ej. XePtF₆, XeF₄).'],

  [55, 'Cs', 'Cesio', 132.91, 'alkali-metal', 1, 6, 6, 1, 'Sólido', 0.79, '[Xe] 6s¹', '+1', 3.894, 'Metal alcalino de menor electronegatividad y energía de ionización entre estables.'],
  [56, 'Ba', 'Bario', 137.33, 'alkaline-earth', 2, 6, 6, 2, 'Sólido', 0.89, '[Xe] 6s²', '+2', 5.212, 'El BaSO₄ es insoluble y se utiliza como medio de contraste en radiografías.'],
  [57, 'La', 'Lantano', 138.91, 'lanthanide', null, 6, 9, 4, 'Sólido', 1.1, '[Xe] 5d¹ 6s²', '+3', 5.577, 'Inicia la serie de los lantánidos; usado en lentes ópticas y catalizadores.'],
  [58, 'Ce', 'Cerio', 140.12, 'lanthanide', null, 6, 9, 5, 'Sólido', 1.12, '[Xe] 4f¹ 5d¹ 6s²', '+3, +4', 5.539, 'Lantánido más abundante; Ce⁴⁺ actúa como oxidante fuerte en síntesis.'],
  [59, 'Pr', 'Praseodimio', 140.91, 'lanthanide', null, 6, 9, 6, 'Sólido', 1.13, '[Xe] 4f³ 6s²', '+3', 5.473, 'Se emplea en imanes de alta potencia y vidrios protectores para soldadores.'],
  [60, 'Nd', 'Neodimio', 144.24, 'lanthanide', null, 6, 9, 7, 'Sólido', 1.14, '[Xe] 4f⁴ 6s²', '+3', 5.525, 'Base de los imanes permanentes más potentes (Nd₂Fe₁₄B) y láseres Nd:YAG.'],
  [61, 'Pm', 'Prometio', 145.0, 'lanthanide', null, 6, 9, 8, 'Sólido', 1.13, '[Xe] 4f⁵ 6s²', '+3', 5.582, 'Único lantánido radiactivo sin isótopos estables en la naturaleza.'],
  [62, 'Sm', 'Samario', 150.36, 'lanthanide', null, 6, 9, 9, 'Sólido', 1.17, '[Xe] 4f⁶ 6s²', '+2, +3', 5.644, 'Forma imanes SmCo estables a altas temperaturas; SmI₂ es reductor selectivo.'],
  [63, 'Eu', 'Europio', 151.96, 'lanthanide', null, 6, 9, 10, 'Sólido', 1.2, '[Xe] 4f⁷ 6s²', '+2, +3', 5.67, 'Emite luminiscencia roja y azul en pantallas y tintas antifalsificación.'],
  [64, 'Gd', 'Gadolinio', 157.25, 'lanthanide', null, 6, 9, 11, 'Sólido', 1.2, '[Xe] 4f⁷ 5d¹ 6s²', '+3', 6.15, '7 electrones desapareados (4f⁷); muy usado como contraste en resonancia magnética.'],
  [65, 'Tb', 'Terbio', 158.93, 'lanthanide', null, 6, 9, 12, 'Sólido', 1.2, '[Xe] 4f⁹ 6s²', '+3', 5.864, 'Usado en fósforos verdes para iluminación y aleaciones magnetoestrictivas.'],
  [66, 'Dy', 'Disprosio', 162.5, 'lanthanide', null, 6, 9, 13, 'Sólido', 1.22, '[Xe] 4f¹⁰ 6s²', '+3', 5.939, 'Mejora la resistencia térmica de imanes de neodimio en motores eléctricos.'],
  [67, 'Ho', 'Holmio', 164.93, 'lanthanide', null, 6, 9, 14, 'Sólido', 1.23, '[Xe] 4f¹¹ 6s²', '+3', 6.022, 'Posee el mayor momento magnético entre los elementos naturales.'],
  [68, 'Er', 'Erbio', 167.26, 'lanthanide', null, 6, 9, 15, 'Sólido', 1.24, '[Xe] 4f¹² 6s²', '+3', 6.108, 'Clave en amplificadores ópticos de fibra para telecomunicaciones.'],
  [69, 'Tm', 'Tulio', 168.93, 'lanthanide', null, 6, 9, 16, 'Sólido', 1.25, '[Xe] 4f¹³ 6s²', '+3', 6.184, 'Lantánido raro utilizado en fuentes portátiles de rayos X y láseres médicos.'],
  [70, 'Yb', 'Iterbio', 173.05, 'lanthanide', null, 6, 9, 17, 'Sólido', 1.1, '[Xe] 4f¹⁴ 6s²', '+2, +3', 6.254, 'Subcapa 4f¹⁴ completa; empleado en relojes atómicos de red óptica.'],
  [71, 'Lu', 'Lutecio', 174.97, 'lanthanide', null, 6, 9, 18, 'Sólido', 1.27, '[Xe] 4f¹⁴ 5d¹ 6s²', '+3', 5.426, 'Último lantánido; posee el radio atómico más pequeño de su serie por contracción lantánida.'],

  [72, 'Hf', 'Hafnio', 178.49, 'transition-metal', 4, 6, 6, 4, 'Sólido', 1.3, '[Xe] 4f¹⁴ 5d² 6s²', '+4', 6.825, 'Radio casi idéntico al Zr por contracción lantánida; absorbe neutrones térmicos.'],
  [73, 'Ta', 'Tántalo', 180.95, 'transition-metal', 5, 6, 6, 5, 'Sólido', 1.5, '[Xe] 4f¹⁴ 5d³ 6s²', '+5', 7.55, 'Altamente resistente a ácidos y biocompatible; usado en capacitores e implantes.'],
  [74, 'W', 'Wolframio', 183.84, 'transition-metal', 6, 6, 6, 6, 'Sólido', 2.36, '[Xe] 4f¹⁴ 5d⁴ 6s²', '+4, +6', 7.864, 'Mayor punto de fusión de todos los metales (3422 °C); también llamado tungsteno.'],
  [75, 'Re', 'Renio', 186.21, 'transition-metal', 7, 6, 6, 7, 'Sólido', 1.9, '[Xe] 4f¹⁴ 5d⁵ 6s²', '+4, +7', 7.833, 'Usado en álabes de turbinas de aviación y catalizadores de reformado.'],
  [76, 'Os', 'Osmio', 190.23, 'transition-metal', 8, 6, 6, 8, 'Sólido', 2.2, '[Xe] 4f¹⁴ 5d⁶ 6s²', '+4, +8', 8.438, 'Elemento natural más denso (22.59 g/cm³); OsO₄ oxida alquenos a dioles sin.'],
  [77, 'Ir', 'Iridio', 192.22, 'transition-metal', 9, 6, 6, 9, 'Sólido', 2.2, '[Xe] 4f¹⁴ 5d⁷ 6s²', '+3, +4', 8.967, 'Metal más resistente a la corrosión; su capa geológica marca el límite K-Pg.'],
  [78, 'Pt', 'Platino', 195.08, 'transition-metal', 10, 6, 6, 10, 'Sólido', 2.28, '[Xe] 4f¹⁴ 5d⁹ 6s¹', '+2, +4', 8.959, 'Electrodo estándar de hidrógeno y catalizador noble de gran estabilidad.'],
  [79, 'Au', 'Oro', 196.97, 'transition-metal', 11, 6, 6, 11, 'Sólido', 2.54, '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', '+1, +3', 9.226, 'Altamente maleable y estable; efectos relativistas explican su color amarillo.'],
  [80, 'Hg', 'Mercurio', 200.59, 'transition-metal', 12, 6, 6, 12, 'Líquido', 2.0, '[Xe] 4f¹⁴ 5d¹⁰ 6s²', '+1, +2', 10.438, 'Único metal líquido a temperatura ambiente (25 °C); forma amalgamas con otros metales.'],
  [81, 'Tl', 'Talio', 204.38, 'post-transition', 13, 6, 6, 13, 'Sólido', 1.62, '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p¹', '+1, +3', 6.108, 'Por efecto del par inerte predomina su estado +1 frente a +3.'],
  [82, 'Pb', 'Plomo', 207.2, 'post-transition', 14, 6, 6, 14, 'Sólido', 1.87, '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p²', '+2, +4', 7.417, 'Producto final estable de series radiactivas; usado en blindaje contra radiación.'],
  [83, 'Bi', 'Bismuto', 208.98, 'post-transition', 15, 6, 6, 15, 'Sólido', 2.02, '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p³', '+3, +5', 7.286, 'Elemento prácticamente estable más pesado (vida media > edad del universo); muy diamagnético.'],
  [84, 'Po', 'Polonio', 209.0, 'post-transition', 16, 6, 6, 16, 'Sólido', 2.0, '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁴', '+2, +4', 8.417, 'Elemento intensamente radiactivo descubierto por Marie y Pierre Curie en 1898.'],
  [85, 'At', 'Astato', 210.0, 'halogen', 17, 6, 6, 17, 'Sólido', 2.2, '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁵', '-1, +1', 9.318, 'Halógeno más raro y pesado de la naturaleza; todos sus isótopos son radiactivos.'],
  [86, 'Rn', 'Radón', 222.0, 'noble-gas', 18, 6, 6, 18, 'Gas', 2.2, '[Xe] 4f¹⁴ 5d¹⁰ 6s² 6p⁶', '0, +2', 10.748, 'Gas noble radiactivo procedente de la desintegración natural del radio y uranio.'],

  [87, 'Fr', 'Francio', 223.0, 'alkali-metal', 1, 7, 7, 1, 'Sólido', 0.7, '[Rn] 7s¹', '+1', 4.073, 'Alcalino altamente radiactivo de vida media muy corta (~22 min para Fr-223).'],
  [88, 'Ra', 'Radio', 226.0, 'alkaline-earth', 2, 7, 7, 2, 'Sólido', 0.9, '[Rn] 7s²', '+2', 5.278, 'Alcalinotérreo radiactivo luminiscente aislado históricamente de la pechblenda.'],
  [89, 'Ac', 'Actinio', 227.0, 'actinide', null, 7, 10, 4, 'Sólido', 1.1, '[Rn] 6d¹ 7s²', '+3', 5.17, 'Da nombre a la serie de los actínidos; emite brillo azul pálido por radiación.'],
  [90, 'Th', 'Torio', 232.04, 'actinide', null, 7, 10, 5, 'Sólido', 1.3, '[Rn] 6d² 7s²', '+4', 6.307, 'Actínido fértil abundante en la corteza terrestre; potencial combustible nuclear.'],
  [91, 'Pa', 'Protactinio', 231.04, 'actinide', null, 7, 10, 6, 'Sólido', 1.5, '[Rn] 5f² 6d¹ 7s²', '+5', 5.89, 'Actínido escaso y altamente radiactivo intermedio entre torio y uranio.'],
  [92, 'U', 'Uranio', 238.03, 'actinide', null, 7, 10, 7, 'Sólido', 1.38, '[Rn] 5f³ 6d¹ 7s²', '+4, +6', 6.194, 'Elemento natural más pesado en cantidad apreciable; U-235 es fisible.'],
  [93, 'Np', 'Neptunio', 237.0, 'actinide', null, 7, 10, 8, 'Sólido', 1.36, '[Rn] 5f⁴ 6d¹ 7s²', '+3 a +7', 6.266, 'Primer elemento transuránico sintético; muestra múltiples estados de oxidación.'],
  [94, 'Pu', 'Plutonio', 244.0, 'actinide', null, 7, 10, 9, 'Sólido', 1.28, '[Rn] 5f⁶ 7s²', '+3, +4, +6', 6.026, 'Combustible nuclear (Pu-239) y fuente térmica RTG (Pu-238) en sondas espaciales.'],
  [95, 'Am', 'Americio', 243.0, 'actinide', null, 7, 10, 10, 'Sólido', 1.3, '[Rn] 5f⁷ 7s²', '+3', 5.974, 'Am-241 se utiliza en pequeñas cantidades como fuente alfa en detectores de humo.'],
  [96, 'Cm', 'Curio', 247.0, 'actinide', null, 7, 10, 11, 'Sólido', 1.3, '[Rn] 5f⁷ 6d¹ 7s²', '+3', 5.991, 'Nombrado en honor a Marie y Pierre Curie; usado en espectrómetros espaciales.'],
  [97, 'Bk', 'Berkelio', 247.0, 'actinide', null, 7, 10, 12, 'Sólido', 1.3, '[Rn] 5f⁹ 7s²', '+3, +4', 6.198, 'Elemento sintético empleado como blanco para sintetizar elementos superpesados.'],
  [98, 'Cf', 'Californio', 251.0, 'actinide', null, 7, 10, 13, 'Sólido', 1.3, '[Rn] 5f¹⁰ 7s²', '+3', 6.282, 'Cf-252 es un potente emisor de neutrones usado para iniciar reactores nucleares.'],
  [99, 'Es', 'Einstenio', 252.0, 'actinide', null, 7, 10, 14, 'Sólido', 1.3, '[Rn] 5f¹¹ 7s²', '+3', 6.42, 'Descubierto en residuos de la primera prueba termonuclear de 1952.'],
  [100, 'Fm', 'Fermio', 257.0, 'actinide', null, 7, 10, 15, 'Sólido', 1.3, '[Rn] 5f¹² 7s²', '+3', 6.5, 'Elemento más pesado obtenible mediante bombardeo neutrónico de elementos livianos.'],
  [101, 'Md', 'Mendelevio', 258.0, 'actinide', null, 7, 10, 16, 'Sólido', 1.3, '[Rn] 5f¹³ 7s²', '+2, +3', 6.58, 'Nombrado en honor a Dmitri Mendeléyev, creador de la tabla periódica.'],
  [102, 'No', 'Nobelio', 259.0, 'actinide', null, 7, 10, 17, 'Sólido', 1.3, '[Rn] 5f¹⁴ 7s²', '+2, +3', 6.65, 'Su estado de oxidación más estable en solución acuosa es +2 (por capa 5f¹⁴).'],
  [103, 'Lr', 'Lawrencio', 266.0, 'actinide', null, 7, 10, 18, 'Sólido', 1.3, '[Rn] 5f¹⁴ 7s² 7p¹', '+3', 4.9, 'Último elemento de la serie de los actínidos.'],

  [104, 'Rf', 'Rutherfordio', 267.0, 'transition-metal', 4, 7, 7, 4, 'Sólido', null, '[Rn] 5f¹⁴ 6d² 7s²', '+4', null, 'Primer elemento transactínido (superpesado) del grupo 4.'],
  [105, 'Db', 'Dubnio', 268.0, 'transition-metal', 5, 7, 7, 5, 'Sólido', null, '[Rn] 5f¹⁴ 6d³ 7s²', '+5', null, 'Elemento sintético de vida corta del grupo 5.'],
  [106, 'Sg', 'Seaborgio', 269.0, 'transition-metal', 6, 7, 7, 6, 'Sólido', null, '[Rn] 5f¹⁴ 6d⁴ 7s²', '+6', null, 'Homólogo más pesado del wolframio; forma hexacarbonilo Sg(CO)₆.'],
  [107, 'Bh', 'Bohrio', 270.0, 'transition-metal', 7, 7, 7, 7, 'Sólido', null, '[Rn] 5f¹⁴ 6d⁵ 7s²', '+7', null, 'Nombrado en honor a Niels Bohr; comportamiento similar al renio.'],
  [108, 'Hs', 'Hasio', 277.0, 'transition-metal', 8, 7, 7, 8, 'Sólido', null, '[Rn] 5f¹⁴ 6d⁶ 7s²', '+8', null, 'Forma el tetróxido volátil HsO₄ análogo al OsO₄.'],
  [109, 'Mt', 'Meitnerio', 278.0, 'transition-metal', 9, 7, 7, 9, 'Sólido', null, '[Rn] 5f¹⁴ 6d⁷ 7s²', '+3', null, 'Nombrado en honor a Lise Meitner, pionera de la fisión nuclear.'],
  [110, 'Ds', 'Darmstatio', 281.0, 'transition-metal', 10, 7, 7, 10, 'Sólido', null, '[Rn] 5f¹⁴ 6d⁸ 7s²', '+2', null, 'Elemento sintético del grupo del níquel y platino.'],
  [111, 'Rg', 'Roentgenio', 282.0, 'transition-metal', 11, 7, 7, 11, 'Sólido', null, '[Rn] 5f¹⁴ 6d⁹ 7s²', '+3', null, 'Nombrado en honor a Wilhelm Röntgen, descubridor de los rayos X.'],
  [112, 'Cn', 'Copernicio', 285.0, 'transition-metal', 12, 7, 7, 12, 'Líquido', null, '[Rn] 5f¹⁴ 6d¹⁰ 7s²', '+2', null, 'Por efectos relativistas se comporta de forma muy volátil, casi como un gas noble.'],
  [113, 'Nh', 'Nihonio', 286.0, 'post-transition', 13, 7, 7, 13, 'Sólido', null, '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p¹', '+1', null, 'Primer elemento descubierto en Asia (RIKEN, Japón).'],
  [114, 'Fl', 'Flerovio', 289.0, 'post-transition', 14, 7, 7, 14, 'Sólido', null, '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p²', '+2', null, 'Elemento superpesado próximo a la teórica isla de estabilidad nuclear.'],
  [115, 'Mc', 'Moscovio', 290.0, 'post-transition', 15, 7, 7, 15, 'Sólido', null, '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p³', '+1, +3', null, 'Elemento sintético del grupo 15 con vidas medias de milisegundos.'],
  [116, 'Lv', 'Livermorio', 293.0, 'post-transition', 16, 7, 7, 16, 'Sólido', null, '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁴', '+2', null, 'Elemento sintético del grupo de los calcógenos (grupo 16).'],
  [117, 'Ts', 'Teneso', 294.0, 'halogen', 17, 7, 7, 17, 'Sólido', null, '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁵', '-1, +1', null, 'Elemento del grupo 17 con carácter metálico esperado por efectos relativistas.'],
  [118, 'Og', 'Oganesón', 294.0, 'noble-gas', 18, 7, 7, 18, 'Sólido', null, '[Rn] 5f¹⁴ 6d¹⁰ 7s² 7p⁶', '0, +2', null, 'Elemento 118 (último conocido); nombrado en honor a Yuri Oganesián.'],
];

export const PERIODIC_ELEMENTS: PeriodicElement[] = RAW_ELEMENTS.map((item) => ({
  number: item[0],
  symbol: item[1],
  name: item[2],
  atomicMass: item[3],
  category: item[4],
  group: item[5],
  period: item[6],
  gridRow: item[7],
  gridCol: item[8],
  state: item[9],
  electronegativity: item[10],
  electronConfig: item[11],
  oxidationStates: item[12],
  ionizationEv: item[13],
  studyNote: item[14],
}));

export const ELEMENT_BY_SYMBOL: Record<string, PeriodicElement> = Object.fromEntries(
  PERIODIC_ELEMENTS.map((el) => [el.symbol, el])
);
