import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("No se encontró GEMINI_API_KEY en el entorno del servidor.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

interface IncomingFile {
  name: string;
  mimeType: string;
  base64Data: string;
  textContent?: string;
}

function buildContentParts(promptText: string, files?: IncomingFile[]) {
  const parts: Array<
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
  > = [];

  if (Array.isArray(files)) {
    for (const file of files) {
      if (file.textContent && file.textContent.trim().length > 0) {
        parts.push({
          text: `\n--- Contenido del archivo "${file.name}" ---\n${file.textContent.slice(0, 80000)}\n--- Fin del archivo ---\n`,
        });
      } else if (file.base64Data && file.mimeType) {
        parts.push({
          inlineData: {
            mimeType: file.mimeType,
            data: file.base64Data,
          },
        });
      }
    }
  }

  parts.push({ text: promptText });
  return parts;
}

function extractGeminiError(err: unknown): { status: number; message: string } {
  const rawMessage = err instanceof Error ? err.message : String(err);
  if (rawMessage.includes("API_KEY_INVALID") || rawMessage.includes("PERMISSION_DENIED")) {
    return {
      status: 401,
      message: "La clave de API de Gemini no es válida o falta configurarla en Settings > Secrets.",
    };
  }
  if (rawMessage.includes("RESOURCE_EXHAUSTED") || rawMessage.includes("429")) {
    return {
      status: 429,
      message: "Se alcanzó el límite temporal de solicitudes. Esperá unos segundos y volvé a intentar.",
    };
  }
  return {
    status: 500,
    message: rawMessage || "Error interno al generar el contenido académico.",
  };
}

const studyPlanResponseSchema = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: {
      type: Type.STRING,
      description:
        "Síntesis ejecutiva breve de 2 a 3 oraciones que resume el hilo central del examen.",
    },
    summarySections: {
      type: Type.ARRAY,
      description:
        "Resumen universitario ordenado por secciones numeradas (ej: 1. Conexión entre unidades, 2. Núcleo conceptual, 3. Criterios de aplicación). Cada sección lleva título claro, explicación amigable debajo del título y, si incluye una fórmula o ecuación clave, se coloca aparte en formulaLatex.",
      items: {
        type: Type.OBJECT,
        properties: {
          order: { type: Type.INTEGER },
          title: { type: Type.STRING, description: "Título breve y claro de la sección sin el número (ej: Conexión entre unidades)" },
          content: { type: Type.STRING, description: "Texto ordenado y fácil de leer. Si mencionás una ecuación importante dentro del texto, ponela en párrafo aparte con $$...$$ o en formulaLatex." },
          formulaLatex: { type: Type.STRING, description: "Ecuación principal de la sección en LaTeX puro (sin signos $), opcional si aplica." },
          formulaCaption: { type: Type.STRING, description: "Breve aclaración de lectura rápida sobre la fórmula." },
        },
        required: ["order", "title", "content"],
      },
    },
    studyBlocks: {
      type: Type.ARRAY,
      description:
        "Bloques de estudio distribuidos exactamente dentro del tiempo total disponible del estudiante, incluyendo pausas cortas si supera 90 minutos.",
      items: {
        type: Type.OBJECT,
        properties: {
          sessionLabel: { type: Type.STRING, description: "Ej: Día 1 · Bloque 1" },
          title: { type: Type.STRING },
          category: {
            type: Type.STRING,
            description: "Exactamente uno de: teoria, practica, repaso, simulacro, descanso",
          },
          durationMinutes: { type: Type.INTEGER },
          objective: { type: Type.STRING },
          deliverable: { type: Type.STRING, description: "Resultado concreto que logra al terminar el bloque" },
          targetTab: {
            type: Type.STRING,
            description: "Exactamente uno de: plan, summary, guide, exercises",
          },
        },
        required: [
          "sessionLabel",
          "title",
          "category",
          "durationMinutes",
          "objective",
          "deliverable",
          "targetTab",
        ],
      },
    },
    keyConcepts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING },
          academicDefinition: { type: Type.STRING },
          simpleExplanation: { type: Type.STRING },
          everydayExample: { type: Type.STRING },
        },
        required: ["term", "academicDefinition", "simpleExplanation", "everydayExample"],
      },
    },
    formulas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          latex: { type: Type.STRING, description: "Fórmula en LaTeX puro sin signos $ alrededor" },
          variables: { type: Type.STRING, description: "Significado de cada símbolo y unidad en SI" },
          whenToUse: { type: Type.STRING },
          whenNotToUse: { type: Type.STRING },
        },
        required: ["name", "latex", "variables", "whenToUse", "whenNotToUse"],
      },
    },
    examTraps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          mistake: { type: Type.STRING },
          whyItHappens: { type: Type.STRING },
          howToAvoid: { type: Type.STRING },
        },
        required: ["mistake", "whyItHappens", "howToAvoid"],
      },
    },
    guideSections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          order: { type: Type.INTEGER },
          title: { type: Type.STRING },
          coreIdea: { type: Type.STRING },
          explanation: { type: Type.STRING },
          concreteExample: { type: Type.STRING },
          keyTakeaway: { type: Type.STRING },
        },
        required: ["order", "title", "coreIdea", "explanation", "concreteExample", "keyTakeaway"],
      },
    },
    masteryChecklist: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
        },
        required: ["label"],
      },
    },
    quizQuestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          correctIndex: { type: Type.INTEGER },
          explanation: { type: Type.STRING },
        },
        required: ["question", "options", "correctIndex", "explanation"],
      },
    },
    exercises: {
      type: Type.ARRAY,
      description: "2 ejercicios universitarios resueltos paso a paso con detalle didáctico.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          topic: { type: Type.STRING },
          difficulty: { type: Type.STRING, description: "Base, Parcial o Integrador" },
          statement: { type: Type.STRING },
          givenData: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                symbol: { type: Type.STRING },
                value: { type: Type.STRING },
                unit: { type: Type.STRING },
              },
              required: ["symbol", "value", "unit"],
            },
          },
          unknowns: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          visualConfig: {
            type: Type.OBJECT,
            properties: {
              type: {
                type: Type.STRING,
                description: "Uno de: inclined_plane, projectile, circuit_or_generic, none",
              },
              angleDeg: { type: Type.NUMBER },
              massKg: { type: Type.NUMBER },
              mu: { type: Type.NUMBER },
              velocityMs: { type: Type.NUMBER },
              caption: { type: Type.STRING },
            },
            required: ["type"],
          },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                stepNumber: { type: Type.INTEGER },
                title: { type: Type.STRING },
                thinkingPrompt: { type: Type.STRING },
                mathLatex: { type: Type.STRING, description: "Ecuaciones en LaTeX puro sin $$" },
                explanation: { type: Type.STRING },
                watchOut: { type: Type.STRING },
                highlightElement: {
                  type: Type.STRING,
                  description: "Uno de: axes, gravity, normal, friction, applied, result, energy",
                },
                quickCheck: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                    correctIndex: { type: Type.INTEGER },
                    feedback: { type: Type.STRING },
                  },
                  required: ["question", "options", "correctIndex", "feedback"],
                },
              },
              required: [
                "stepNumber",
                "title",
                "thinkingPrompt",
                "mathLatex",
                "explanation",
                "watchOut",
              ],
            },
          },
          finalAnswer: { type: Type.STRING },
        },
        required: [
          "title",
          "topic",
          "difficulty",
          "statement",
          "givenData",
          "unknowns",
          "steps",
          "finalAnswer",
        ],
      },
    },
  },
  required: [
    "executiveSummary",
    "studyBlocks",
    "keyConcepts",
    "formulas",
    "examTraps",
    "guideSections",
    "masteryChecklist",
    "quizQuestions",
    "exercises",
  ],
};

const singleExerciseSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    topic: { type: Type.STRING },
    difficulty: { type: Type.STRING },
    statement: { type: Type.STRING },
    givenData: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          symbol: { type: Type.STRING },
          value: { type: Type.STRING },
          unit: { type: Type.STRING },
        },
        required: ["symbol", "value", "unit"],
      },
    },
    unknowns: { type: Type.ARRAY, items: { type: Type.STRING } },
    visualConfig: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING },
        angleDeg: { type: Type.NUMBER },
        massKg: { type: Type.NUMBER },
        mu: { type: Type.NUMBER },
        velocityMs: { type: Type.NUMBER },
        caption: { type: Type.STRING },
      },
      required: ["type"],
    },
    steps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          stepNumber: { type: Type.INTEGER },
          title: { type: Type.STRING },
          thinkingPrompt: { type: Type.STRING },
          mathLatex: { type: Type.STRING },
          explanation: { type: Type.STRING },
          watchOut: { type: Type.STRING },
          highlightElement: { type: Type.STRING },
          quickCheck: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctIndex: { type: Type.INTEGER },
              feedback: { type: Type.STRING },
            },
            required: ["question", "options", "correctIndex", "feedback"],
          },
        },
        required: [
          "stepNumber",
          "title",
          "thinkingPrompt",
          "mathLatex",
          "explanation",
          "watchOut",
        ],
      },
    },
    finalAnswer: { type: Type.STRING },
  },
  required: [
    "title",
    "topic",
    "difficulty",
    "statement",
    "givenData",
    "unknowns",
    "steps",
    "finalAnswer",
  ],
};

const adaptiveExamSummarySchema = {
  type: Type.OBJECT,
  properties: {
    strategyTitle: {
      type: Type.STRING,
      description: "Título estratégico breve adaptado al tiempo restante antes del examen.",
    },
    timeAllocationAdvice: {
      type: Type.STRING,
      description: "Recomendación concreta de cómo repartir las horas útiles disponibles hasta el examen (solo completar si fue solicitada).",
    },
    compressedSummary: {
      type: Type.STRING,
      description:
        "Introducción breve de 2 oraciones al resumen adaptado.",
    },
    summarySections: {
      type: Type.ARRAY,
      description:
        "Secciones ordenadas del resumen adaptado al tiempo restante (ej: Conexión entre unidades, Leyes o conceptos clave, Criterios para el examen). Cada sección tiene título, desarrollo claro debajo y ecuación destacada aparte en formulaLatex si aplica.",
      items: {
        type: Type.OBJECT,
        properties: {
          order: { type: Type.INTEGER },
          title: { type: Type.STRING },
          content: { type: Type.STRING },
          formulaLatex: { type: Type.STRING, description: "LaTeX puro sin signos $ para mostrar en párrafo aparte en negrita." },
          formulaCaption: { type: Type.STRING },
        },
        required: ["order", "title", "content"],
      },
    },
    priorityTopics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          weight: { type: Type.STRING, description: "Ej: Prioridad Crítica, Prioridad Alta o Refuerzo" },
          whyItMatters: { type: Type.STRING },
          quickRule: { type: Type.STRING },
        },
        required: ["topic", "weight", "whyItMatters", "quickRule"],
      },
    },
    mustMemorizeFormulas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          latex: { type: Type.STRING, description: "LaTeX puro sin signos $" },
          survivalTip: { type: Type.STRING },
        },
        required: ["name", "latex", "survivalTip"],
      },
    },
    discardForNow: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Temas secundarios o detalles de bajo rendimiento que conviene posponer si queda poco tiempo (o profundizaciones opcionales si sobra tiempo).",
    },
    lastHourChecklist: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Lista de 4 a 6 puntos clave para repasar justo antes de entrar a rendir.",
    },
  },
  required: [
    "strategyTitle",
    "compressedSummary",
    "summarySections",
    "priorityTopics",
    "mustMemorizeFormulas",
    "discardForNow",
    "lastHourChecklist",
  ],
};

const chartDatasetSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    subjectTag: { type: Type.STRING },
    xLabel: { type: Type.STRING },
    xUnit: { type: Type.STRING },
    yLabel: { type: Type.STRING },
    yUnit: { type: Type.STRING },
    insightSummary: {
      type: Type.STRING,
      description: "Explicación pedagógica breve de qué muestra el gráfico y qué puntos clave observar (podés usar $...$ para símbolos).",
    },
    slopeMeaning: { type: Type.STRING },
    areaMeaning: { type: Type.STRING },
    series: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          unit: { type: Type.STRING },
          mode: { type: Type.STRING, description: "line o scatter" },
          points: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
                group: { type: Type.STRING, description: "Categoría o tramo opcional para filtrar (ej: Tramo 1, Zona ácida, Experimento A)" },
              },
              required: ["x", "y"],
            },
          },
        },
        required: ["name", "mode", "points"],
      },
    },
  },
  required: ["title", "subjectTag", "xLabel", "xUnit", "yLabel", "yUnit", "insightSummary", "series"],
};

const studyAssistantResponseSchema = {
  type: Type.OBJECT,
  properties: {
    reply: {
      type: Type.STRING,
      description:
        "Respuesta cercana, amigable y didáctica para el estudiante en español. Usá párrafos breves y claros. Si incluís fórmulas en el texto usá $...$ o $$...$$.",
    },
    suggestedSections: {
      type: Type.ARRAY,
      description:
        "Completar SOLO cuando el estudiante pida corregir, simplificar, aclarar o reescribir secciones del resumen para hacer la lectura más fácil.",
      items: {
        type: Type.OBJECT,
        properties: {
          order: { type: Type.INTEGER },
          title: { type: Type.STRING },
          content: {
            type: Type.STRING,
            description: "Versión corregida, ordenada y muy fácil de leer sin perder rigor académico.",
          },
          formulaLatex: {
            type: Type.STRING,
            description: "Fórmula principal de la sección en LaTeX puro (sin signos $), si aplica.",
          },
          formulaCaption: { type: Type.STRING },
        },
        required: ["order", "title", "content"],
      },
    },
  },
  required: ["reply"],
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "25mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/api/study-plan", async (req, res) => {
    try {
      const {
        subject,
        examType = "Parcial",
        daysAvailable = 2,
        hoursPerDay = 3,
        pace = "Equilibrado",
        notesText = "",
        focusHint = "",
        files = [],
      } = req.body ?? {};

      if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
        return res.status(400).json({ error: "Indicá el nombre de la materia o tema principal." });
      }

      const safeDays = Math.max(1, Math.min(30, Number(daysAvailable) || 1));
      const safeHoursPerDay = Math.max(0.5, Math.min(14, Number(hoursPerDay) || 2));
      const totalMinutes = Math.round(safeDays * safeHoursPerDay * 60);

      const ai = getAiClient();

      const prompt = `
Sos un profesor universitario experto y tutor pedagógico de alto rendimiento.
Tu tarea es transformar el material proporcionado por un estudiante en un sistema de estudio completo en español, de nivel académico universitario riguroso, pero de lectura ligera, concreta, sin relleno y con ejemplos cotidianos sencillos.

DATOS DEL ESTUDIANTE:
- Materia / Tema: ${subject.trim()}
- Tipo de evaluación: ${examType}
- Tiempo disponible: ${safeDays} día(s) a razón de ${safeHoursPerDay} hora(s) por día (TOTAL EXACTO: ${totalMinutes} minutos).
- Ritmo deseado: ${pace}
- Dificultad o foco específico indicado por el alumno: ${focusHint || "No especificado; priorizá los puntos de mayor peso en examen."}

MATERIAL CARGADO POR EL ESTUDIANTE:
${notesText ? notesText : "(El estudiante no pegó texto adicional; revisá los archivos adjuntos o elaborá sobre la materia y tema indicados con rigor universitario.)"}

INSTRUCCIONES ESTRICTAS:
1. **Plan de estudio por bloques (studyBlocks)**: La suma de \`durationMinutes\` de todos los bloques debe aproximarse lo máximo posible a ${totalMinutes} minutos (idealmente exactamente ${totalMinutes} min). Dividí el tiempo en sesiones claras (\`Día 1 · Bloque 1\`, etc.) alternando teoría, práctica guiada, repaso y simulacro (y descansos breves de 10-15 min si una jornada supera los 90 minutos).
2. **Resumen optimizado para examen**:
   - \`summarySections\`: Creá 3 a 4 secciones ordenadas (por ejemplo: 1. Conexión entre unidades, 2. Leyes o pilares centrales, 3. Criterios prácticos para resolver el examen). Cada sección debe tener un título claro arriba y el desarrollo ordenado debajo. Si aparece una fórmula o ecuación clave en una sección, ponela aparte en \`formulaLatex\` (o en un párrafo aparte con \`$$...$$\`) para que no quede escondida dentro del texto.
   - \`keyConcepts\`: 4 a 6 conceptos centrales con definición académica rigurosa + explicación en palabras simples + ejemplo sencillo cotidiano.
   - \`formulas\`: Si la materia usa ecuaciones, leyes o reglas formales, incluí 3 a 6 fórmulas en LaTeX puro (sin signos \`$\`), explicando cada variable con su unidad SI, cuándo usarla y cuándo NO usarla. Si la materia es humanística/teórica, incluí modelos analíticos, marcos o relaciones estructurales clave en formato limpio.
   - \`examTraps\`: 3 a 4 trampas típicas de examen universitario y cómo evitarlas rápido.
3. **Guía de repaso detallada**:
   - \`guideSections\`: 3 a 5 secciones progresivas ordenadas de lo fundamental a lo complejo, lectura ágil, con ejemplo concreto y idea clave para retener.
   - \`masteryChecklist\`: 5 a 7 afirmaciones verificables ("Sé identificar...", "Puedo deducir...").
   - \`quizQuestions\`: 4 preguntas tipo parcial con 4 opciones cada una, \`correctIndex\` (0-3) y explicación breve y clara.
4. **Resolución de ejercicios paso a paso**:
   - \`exercises\`: Creá 2 ejercicios universitarios representativos del material (si el alumno cargó problemas en su texto o archivos, usalos directamente; si no, creá 2 ejercicios clásicos de parcial de la materia).
   - Cada ejercicio debe llevar al estudiante **paso a paso** (4 a 6 pasos): qué pensar antes de calcular, ecuaciones en LaTeX puro en \`mathLatex\`, explicación clara, alerta \`watchOut\`, y una pregunta corta \`quickCheck\` en al menos 2 pasos por ejercicio para comprobar comprensión.
   - Si el ejercicio es de física mecánica (plano inclinado o tiro parabólico/proyectil), completá \`visualConfig\` con \`inclined_plane\` o \`projectile\` y los valores numéricos aproximados; para otras áreas usá \`circuit_or_generic\` o \`none\`.
5. Cuando escribas fórmulas dentro de campos de texto normal (fuera de \`latex\`, \`formulaLatex\` o \`mathLatex\`), si es una ecuación importante ponela en párrafo aparte entre \`$$...$$\` para que se resalte en negrita. En \`formulas[].latex\`, \`summarySections[].formulaLatex\` y \`steps[].mathLatex\`, devolvé SOLO el código LaTeX sin delimitadores \`$\` o \`$$\`.
`;

      const contents = buildContentParts(prompt, Array.isArray(files) ? files : []);

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: { parts: contents },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
          responseMimeType: "application/json",
          responseSchema: studyPlanResponseSchema,
          systemInstruction:
            "Respondé únicamente en español rioplatense/académico neutro claro, preciso y directo. Mantené rigor universitario con explicaciones concretas y livianas para estudiar rápido.",
        },
      });

      const rawJson = (response.text ?? "{}").trim();
      const parsed = JSON.parse(rawJson);

      const nowId = `plan-${Date.now()}`;
      const normalized = {
        id: nowId,
        subject: subject.trim(),
        examType,
        createdAt: new Date().toISOString(),
        totalMinutes,
        daysAvailable: safeDays,
        hoursPerDay: safeHoursPerDay,
        pace,
        executiveSummary: parsed.executiveSummary ?? "",
        summarySections: (parsed.summarySections ?? []).map(
          (s: Record<string, unknown>, idx: number) => ({
            order: Number(s.order) || idx + 1,
            title: String(s.title ?? `Sección ${idx + 1}`),
            content: String(s.content ?? ""),
            formulaLatex: s.formulaLatex ? String(s.formulaLatex) : undefined,
            formulaCaption: s.formulaCaption ? String(s.formulaCaption) : undefined,
          })
        ),
        studyBlocks: (parsed.studyBlocks ?? []).map((b: Record<string, unknown>, idx: number) => ({
          id: `blk-${nowId}-${idx}`,
          sessionLabel: String(b.sessionLabel ?? `Bloque ${idx + 1}`),
          title: String(b.title ?? "Sesión de estudio"),
          category: ["teoria", "practica", "repaso", "simulacro", "descanso"].includes(
            String(b.category)
          )
            ? String(b.category)
            : "teoria",
          durationMinutes: Math.max(10, Number(b.durationMinutes) || 30),
          objective: String(b.objective ?? ""),
          deliverable: String(b.deliverable ?? ""),
          targetTab: ["plan", "summary", "guide", "exercises"].includes(String(b.targetTab))
            ? String(b.targetTab)
            : "summary",
          completed: false,
        })),
        keyConcepts: (parsed.keyConcepts ?? []).map((c: Record<string, unknown>, idx: number) => ({
          id: `con-${nowId}-${idx}`,
          term: String(c.term ?? ""),
          academicDefinition: String(c.academicDefinition ?? ""),
          simpleExplanation: String(c.simpleExplanation ?? ""),
          everydayExample: String(c.everydayExample ?? ""),
        })),
        formulas: (parsed.formulas ?? []).map((f: Record<string, unknown>, idx: number) => ({
          id: `frm-${nowId}-${idx}`,
          name: String(f.name ?? ""),
          latex: String(f.latex ?? ""),
          variables: String(f.variables ?? ""),
          whenToUse: String(f.whenToUse ?? ""),
          whenNotToUse: String(f.whenNotToUse ?? ""),
        })),
        examTraps: (parsed.examTraps ?? []).map((t: Record<string, unknown>, idx: number) => ({
          id: `trp-${nowId}-${idx}`,
          mistake: String(t.mistake ?? ""),
          whyItHappens: String(t.whyItHappens ?? ""),
          howToAvoid: String(t.howToAvoid ?? ""),
        })),
        guideSections: (parsed.guideSections ?? []).map(
          (g: Record<string, unknown>, idx: number) => ({
            id: `gui-${nowId}-${idx}`,
            order: Number(g.order) || idx + 1,
            title: String(g.title ?? ""),
            coreIdea: String(g.coreIdea ?? ""),
            explanation: String(g.explanation ?? ""),
            concreteExample: String(g.concreteExample ?? ""),
            keyTakeaway: String(g.keyTakeaway ?? ""),
          })
        ),
        masteryChecklist: (parsed.masteryChecklist ?? []).map(
          (m: Record<string, unknown>, idx: number) => ({
            id: `chk-${nowId}-${idx}`,
            label: String(m.label ?? ""),
            checked: false,
          })
        ),
        quizQuestions: (parsed.quizQuestions ?? []).map(
          (q: Record<string, unknown>, idx: number) => ({
            id: `qz-${nowId}-${idx}`,
            question: String(q.question ?? ""),
            options: Array.isArray(q.options) ? q.options.map(String) : [],
            correctIndex: Number(q.correctIndex) || 0,
            explanation: String(q.explanation ?? ""),
          })
        ),
        exercises: (parsed.exercises ?? []).map((ex: Record<string, unknown>, idx: number) => ({
          id: `ex-${nowId}-${idx}`,
          title: String(ex.title ?? `Ejercicio ${idx + 1}`),
          topic: String(ex.topic ?? subject.trim()),
          difficulty: ["Base", "Parcial", "Integrador"].includes(String(ex.difficulty))
            ? String(ex.difficulty)
            : "Parcial",
          statement: String(ex.statement ?? ""),
          givenData: Array.isArray(ex.givenData) ? ex.givenData : [],
          unknowns: Array.isArray(ex.unknowns) ? ex.unknowns.map(String) : [],
          visualConfig: ex.visualConfig ?? { type: "none" },
          steps: Array.isArray(ex.steps) ? ex.steps : [],
          finalAnswer: String(ex.finalAnswer ?? ""),
        })),
      };

      return res.json(normalized);
    } catch (err) {
      const { status, message } = extractGeminiError(err);
      return res.status(status).json({ error: message });
    }
  });

  app.post("/api/solve-exercise", async (req, res) => {
    try {
      const { subject = "Física Universitaria", statement = "", files = [] } = req.body ?? {};
      if ((!statement || String(statement).trim().length === 0) && (!Array.isArray(files) || files.length === 0)) {
        return res.status(400).json({ error: "Escribí el enunciado del ejercicio o adjuntá una imagen/PDF." });
      }

      const ai = getAiClient();
      const prompt = `
Resolvé paso a paso el siguiente ejercicio universitario de la materia "${subject}" para que el estudiante aprenda el razonamiento completo, no solo el resultado.

ENUNCIADO / NOTA:
${statement || "(Revisá la imagen o documento adjunto para extraer el enunciado completo.)"}

REQUISITOS:
- Descomponé la resolución en 4 a 6 pasos lógicos y claros.
- En cada paso incluí:
  1. \`thinkingPrompt\`: Qué debe preguntarse o plantear el estudiante antes de hacer cuentas.
  2. \`mathLatex\`: Las ecuaciones del paso en LaTeX puro (sin \`$$\` alrededor).
  3. \`explanation\`: Explicación ágil y concreta de por qué se aplica esa ecuación o despeje.
  4. \`watchOut\`: Un error clásico que conviene revisar en este punto (signos, unidades, sistema de referencia).
  5. \`quickCheck\`: Incluí una pregunta rápida de opción múltiple en al menos 3 pasos para que el estudiante verifique si entendió el paso.
- Si es un problema de plano inclinado o proyectil, configurá \`visualConfig\` adecuadamente (\`inclined_plane\` o \`projectile\`) con sus parámetros numéricos. Si no, usá \`circuit_or_generic\` o \`none\`.
- Verificá todos los cálculos numéricos y las unidades en Sistema Internacional (SI) o las que pida el enunciado.
`;

      const contents = buildContentParts(prompt, Array.isArray(files) ? files : []);
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: { parts: contents },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
          responseMimeType: "application/json",
          responseSchema: singleExerciseSchema,
          systemInstruction:
            "Sos un docente universitario de ciencias exactas y tutor didáctico. Explicás con precisión matemática, unidades consistentes y lenguaje claro en español.",
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      return res.json({
        id: `ex-custom-${Date.now()}`,
        title: parsed.title ?? "Ejercicio resuelto paso a paso",
        topic: parsed.topic ?? subject,
        difficulty: ["Base", "Parcial", "Integrador"].includes(parsed.difficulty)
          ? parsed.difficulty
          : "Parcial",
        statement: parsed.statement ?? statement,
        givenData: Array.isArray(parsed.givenData) ? parsed.givenData : [],
        unknowns: Array.isArray(parsed.unknowns) ? parsed.unknowns : [],
        visualConfig: parsed.visualConfig ?? { type: "none" },
        steps: Array.isArray(parsed.steps) ? parsed.steps : [],
        finalAnswer: parsed.finalAnswer ?? "",
      });
    } catch (err) {
      const { status, message } = extractGeminiError(err);
      return res.status(status).json({ error: message });
    }
  });

  app.post("/api/adaptive-exam-summary", async (req, res) => {
    try {
      const {
        subject = "Materia Universitaria",
        examType = "Parcial",
        examDate,
        daysRemaining = 2,
        hoursPerDay = 3,
        includeTimeDistribution = false,
        executiveSummary = "",
        keyConcepts = [],
        formulas = [],
        examTraps = [],
      } = req.body ?? {};

      const safeDays = Math.max(0, Number(daysRemaining) || 0);
      const safeHoursPerDay = Math.max(0.5, Math.min(16, Number(hoursPerDay) || 2));
      const effectiveDays = safeDays === 0 ? 0.5 : safeDays;
      const totalEffectiveHours = Math.round(effectiveDays * safeHoursPerDay * 10) / 10;

      let tier: "emergencia" | "sprint" | "consolidacion" | "profundo" = "sprint";
      let tierInstruction = "";

      if (safeDays <= 1) {
        tier = "emergencia";
        tierInstruction =
          "MODO EMERGENCIA (≤ 24 horas): El alumno rinde hoy o mañana. Necesita impacto máximo 80/20: solo lo que define el aprobado, fórmulas indispensables con trucos de memoria rápida, qué temas secundarios descartar sin culpa y un repaso express de última hora. Lectura muy ágil y directa.";
      } else if (safeDays <= 4) {
        tier = "sprint";
        tierInstruction =
          "MODO SPRINT TÁCTICO (2 a 4 días): Tiempo ajustado pero manejable. Priorizá comprensión de conceptos evaluables, conexión directa teoría-ejercicio y cómo evitar trampas de parcial, equilibrando teoría esencial con práctica.";
      } else if (safeDays <= 10) {
        tier = "consolidacion";
        tierInstruction =
          "MODO CONSOLIDACIÓN (5 a 10 días): Buen margen temporal. Generá un resumen universitario estructurado que conecte unidades entre sí, incluya criterios de validez de cada fórmula, ejemplos claros y espacio para simulacros.";
      } else {
        tier = "profundo";
        tierInstruction =
          "MODO DOMINIO PROFUNDO (> 10 días): El alumno planifica con anticipación. Generá un resumen completo con rigor académico, articulación conceptual, casos límite y estrategia de repaso espaciado hasta la fecha del examen.";
      }

      const ai = getAiClient();
      const contextConcepts = Array.isArray(keyConcepts)
        ? keyConcepts
            .slice(0, 8)
            .map((c: { term?: string; simpleExplanation?: string }) => `- ${c.term ?? ""}: ${c.simpleExplanation ?? ""}`)
            .join("\n")
        : "";
      const contextFormulas = Array.isArray(formulas)
        ? formulas
            .slice(0, 8)
            .map((f: { name?: string; latex?: string; whenToUse?: string }) => `- ${f.name ?? ""} (${f.latex ?? ""}): ${f.whenToUse ?? ""}`)
            .join("\n")
        : "";
      const contextTraps = Array.isArray(examTraps)
        ? examTraps
            .slice(0, 6)
            .map((t: { mistake?: string; howToAvoid?: string }) => `- ${t.mistake ?? ""} -> ${t.howToAvoid ?? ""}`)
            .join("\n")
        : "";

      const prompt = `
Generá un resumen de examen adaptado exactamente al tiempo que le queda al estudiante antes de rendir.

CONTEXTO DEL EXAMEN:
- Materia: ${subject}
- Tipo de evaluación: ${examType}
- Fecha del examen: ${examDate || "Próxima"}
- Días restantes: ${safeDays === 0 ? "Hoy / menos de 24 horas" : `${safeDays} día(s)`}
- Horas disponibles por día: ${safeHoursPerDay} h
- Horas útiles totales hasta el examen: ${totalEffectiveHours} h
- ¿El estudiante pidió sugerencia de distribución del tiempo?: ${includeTimeDistribution ? "SÍ" : "NO (dejá timeAllocationAdvice vacío \"\")"}

ESTRATEGIA REQUERIDA:
${tierInstruction}

BASE DE CONTENIDOS DE LA MATERIA:
Resumen general: ${executiveSummary}
Conceptos clave:
${contextConcepts || "(Elaborar sobre los conceptos centrales universitarios de la materia)"}
Fórmulas / Relaciones:
${contextFormulas || "(Incluir las fórmulas o modelos centrales de la materia en LaTeX puro)"}
Trampas de examen:
${contextTraps || "(Incluir errores frecuentes en exámenes universitarios de esta materia)"}

INSTRUCCIONES DE FORMATO PARA LECTURA AMIGABLE:
- En \`compressedSummary\`, escribí solo una breve introducción de 1 a 2 oraciones.
- En \`summarySections\`, organizá el resumen completo en 3 a 4 secciones ordenadas (ej: 1. Conexión entre unidades, 2. Leyes y conceptos fundamentales, 3. Criterios prácticos de examen). Cada sección debe tener título claro, explicación amigable debajo y, cuando aparezca una fórmula o ecuación clave, colocala en \`formulaLatex\` (LaTeX puro sin signos \`$\`) para que se destaque aparte en negrita y en su propio párrafo.
- ${includeTimeDistribution ? "En `timeAllocationAdvice`, recomendá concretamente cómo repartir las " + totalEffectiveHours + " horas útiles disponibles." : "Dejá `timeAllocationAdvice` como cadena vacía \"\" porque el usuario no solicitó distribución de tiempo."}
- En \`priorityTopics\`, ordená 3 a 5 temas de mayor a menor rentabilidad para el examen.
- En \`mustMemorizeFormulas\`, devolvé 3 a 5 fórmulas o relaciones en LaTeX puro (sin \`$\` alrededor) con un consejo práctico de aplicación rápida.
- En \`discardForNow\`, indicá 2 a 3 cosas que conviene dejar para el final (o descartar si faltan horas) para maximizar la nota con el tiempo real disponible.
- En \`lastHourChecklist\`, incluí 4 a 5 verificaciones rápidas previas a entrar al aula.
`;

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
          responseMimeType: "application/json",
          responseSchema: adaptiveExamSummarySchema,
          systemInstruction:
            "Sos un estratega académico universitario. Adaptás la profundidad, el recorte de temas y el tono del resumen estrictamente al tiempo real que queda hasta el examen, manteniendo rigor, orden por secciones numeradas y claridad en español.",
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());

      return res.json({
        tier,
        examDate: examDate || new Date().toISOString().slice(0, 10),
        daysRemaining: safeDays,
        hoursPerDay: safeHoursPerDay,
        totalEffectiveHours,
        generatedAt: new Date().toISOString(),
        strategyTitle: String(parsed.strategyTitle ?? "Resumen adaptado al examen"),
        timeAllocationAdvice: includeTimeDistribution
          ? String(parsed.timeAllocationAdvice ?? "")
          : undefined,
        compressedSummary: String(parsed.compressedSummary ?? ""),
        summarySections: Array.isArray(parsed.summarySections)
          ? parsed.summarySections.map((s: Record<string, unknown>, idx: number) => ({
              order: Number(s.order) || idx + 1,
              title: String(s.title ?? `Sección ${idx + 1}`),
              content: String(s.content ?? ""),
              formulaLatex: s.formulaLatex ? String(s.formulaLatex) : undefined,
              formulaCaption: s.formulaCaption ? String(s.formulaCaption) : undefined,
            }))
          : [],
        priorityTopics: Array.isArray(parsed.priorityTopics) ? parsed.priorityTopics : [],
        mustMemorizeFormulas: Array.isArray(parsed.mustMemorizeFormulas)
          ? parsed.mustMemorizeFormulas
          : [],
        discardForNow: Array.isArray(parsed.discardForNow) ? parsed.discardForNow : [],
        lastHourChecklist: Array.isArray(parsed.lastHourChecklist) ? parsed.lastHourChecklist : [],
      });
    } catch (err) {
      const { status, message } = extractGeminiError(err);
      return res.status(status).json({ error: message });
    }
  });

  app.post("/api/time-distribution", async (req, res) => {
    try {
      const {
        subject = "Materia Universitaria",
        examType = "Parcial",
        daysRemaining = 3,
        hoursPerDay = 2.5,
        priorityTopics = [],
      } = req.body ?? {};

      const safeDays = Math.max(0, Number(daysRemaining) || 0);
      const safeHoursPerDay = Math.max(0.5, Math.min(16, Number(hoursPerDay) || 2));
      const effectiveDays = safeDays === 0 ? 0.5 : safeDays;
      const totalEffectiveHours = Math.round(effectiveDays * safeHoursPerDay * 10) / 10;

      const ai = getAiClient();
      const topicsList = Array.isArray(priorityTopics)
        ? priorityTopics
            .map((t: { topic?: string; weight?: string }) => `- ${t.topic ?? ""} (${t.weight ?? ""})`)
            .join("\n")
        : "";

      const prompt = `
El estudiante solicitó explícitamente una recomendación práctica de cómo distribuir su tiempo restante hasta el examen.
- Materia: ${subject} (${examType})
- Días restantes: ${safeDays === 0 ? "Hoy / menos de 24 horas" : `${safeDays} día(s)`}
- Horas por día: ${safeHoursPerDay} h
- Total horas útiles: ${totalEffectiveHours} h
- Temas prioritarios:\n${topicsList || "(Núcleo de la materia)"}

Escribí un consejo claro y concreto en 3 a 4 oraciones indicando exactamente cuántas horas dedicar a teoría esencial, práctica de ejercicios y autoevaluación final dentro de esas ${totalEffectiveHours} h disponibles.
`;

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            "Respondé en español de manera directa, práctica y sin relleno.",
        },
      });

      return res.json({
        advice: (response.text ?? "").trim(),
      });
    } catch (err) {
      const { status, message } = extractGeminiError(err);
      return res.status(status).json({ error: message });
    }
  });

  app.post("/api/generate-chart-data", async (req, res) => {
    try {
      const { subject = "Ciencias", promptText = "", files = [] } = req.body ?? {};
      if ((!promptText || String(promptText).trim().length === 0) && (!Array.isArray(files) || files.length === 0)) {
        return res.status(400).json({ error: "Describí qué datos o fenómeno querés graficar, o adjuntá una tabla/imagen." });
      }

      const ai = getAiClient();
      const prompt = `
Generá un conjunto de datos numéricos exactos para graficar e interpretar en una clase universitaria de "${subject}".

PEDIDO O DATOS DEL ESTUDIANTE:
${promptText || "(Revisá la tabla, foto o archivo adjunto y extraé o calculá los puntos numéricos.)"}

REQUISITOS:
- Generá 1 o 2 series numéricas (\`series\`) con entre 7 y 15 puntos ordenados de menor a mayor en \`x\`.
- Usá \`mode: "scatter"\` si son mediciones experimentales discretas o \`mode: "line"\` si es una curva continua o función.
- Asigná un \`group\` corto a cada punto cuando tenga sentido agrupar por zonas o etapas (ej: "Tramo 1", "Tramo 2", "Zona ácida", "Equivalencia") para que el alumno pueda filtrar el gráfico.
- En \`slopeMeaning\` y \`areaMeaning\`, explicá qué representa físicamente/matemáticamente la pendiente y el área bajo la curva.
`;

      const contents = buildContentParts(prompt, Array.isArray(files) ? files : []);
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: { parts: contents },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
          responseMimeType: "application/json",
          responseSchema: chartDatasetSchema,
          systemInstruction:
            "Sos un profesor universitario de física, matemática y química. Devolvés puntos numéricos precisos, consistentes con las leyes científicas, y explicaciones claras en español.",
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      const palette = ["#1D4ED8", "#059669", "#D97706"];

      return res.json({
        id: `chart-${Date.now()}`,
        title: String(parsed.title ?? "Gráfico generado"),
        subjectTag: String(parsed.subjectTag ?? subject),
        xLabel: String(parsed.xLabel ?? "x"),
        xUnit: String(parsed.xUnit ?? ""),
        yLabel: String(parsed.yLabel ?? "y"),
        yUnit: String(parsed.yUnit ?? ""),
        insightSummary: String(parsed.insightSummary ?? ""),
        slopeMeaning: parsed.slopeMeaning ? String(parsed.slopeMeaning) : undefined,
        areaMeaning: parsed.areaMeaning ? String(parsed.areaMeaning) : undefined,
        series: Array.isArray(parsed.series)
          ? parsed.series.map((s: Record<string, unknown>, idx: number) => ({
              id: `ser-${Date.now()}-${idx}`,
              name: String(s.name ?? `Serie ${idx + 1}`),
              unit: s.unit ? String(s.unit) : "",
              color: palette[idx % palette.length],
              mode: s.mode === "scatter" ? "scatter" : "line",
              points: Array.isArray(s.points)
                ? s.points
                    .map((p: Record<string, unknown>) => ({
                      x: Number(p.x),
                      y: Number(p.y),
                      group: p.group ? String(p.group) : undefined,
                    }))
                    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
                    .sort((a, b) => a.x - b.x)
                : [],
            }))
          : [],
      });
    } catch (err) {
      const { status, message } = extractGeminiError(err);
      return res.status(status).json({ error: message });
    }
  });

  app.post("/api/study-assistant", async (req, res) => {
    try {
      const {
        mode = "ask",
        message = "",
        targetSectionOrder = null,
        subject = "Materia Universitaria",
        examType = "Parcial",
        summarySections = [],
        keyConcepts = [],
        formulas = [],
        history = [],
      } = req.body ?? {};

      if (!message || typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({ error: "Escribí tu duda o lo que querés mejorar del resumen." });
      }

      const ai = getAiClient();

      const sectionsText = Array.isArray(summarySections)
        ? summarySections
            .map(
              (s: { order?: number; title?: string; content?: string; formulaLatex?: string }) =>
                `[${s.order ?? ""}. ${s.title ?? ""}]\n${s.content ?? ""}${
                  s.formulaLatex ? `\nFórmula: ${s.formulaLatex}` : ""
                }`
            )
            .join("\n\n")
        : "";

      const conceptsText = Array.isArray(keyConcepts)
        ? keyConcepts
            .slice(0, 8)
            .map((c: { term?: string; simpleExplanation?: string }) => `- ${c.term ?? ""}: ${c.simpleExplanation ?? ""}`)
            .join("\n")
        : "";

      const formulasText = Array.isArray(formulas)
        ? formulas
            .slice(0, 8)
            .map((f: { name?: string; latex?: string; whenToUse?: string }) => `- ${f.name ?? ""}: ${f.latex ?? ""} (${f.whenToUse ?? ""})`)
            .join("\n")
        : "";

      const historyText = Array.isArray(history)
        ? history
            .slice(-6)
            .map((h: { role?: string; text?: string }) =>
              `${h.role === "user" ? "Estudiante" : "Tutor"}: ${String(h.text ?? "").slice(0, 500)}`
            )
            .join("\n")
        : "";

      const isImproveMode = mode === "improve";
      const targetNote =
        targetSectionOrder !== null && targetSectionOrder !== undefined
          ? `El estudiante seleccionó específicamente la sección #${targetSectionOrder} para mejorar o corregir su lectura.`
          : "El estudiante quiere mejorar o simplificar la lectura del resumen en general (devolvé las secciones corregidas manteniendo su numeración `order`).";

      const prompt = `
Sos un tutor universitario cercano, paciente y muy amigable. Tu objetivo es ayudar al estudiante a entender cualquier duda sin tecnicismos innecesarios y, cuando te lo pida, generar versiones corregidas o más simples de su resumen para que la lectura sea fluida y agradable.

CONTEXTO DE LA MATERIA:
- Materia: ${subject} (${examType})
- Modo elegido: ${isImproveMode ? "MEJORAR / CORREGIR RESUMEN PARA LECTURA FÁCIL" : "RESPONDER DUDA DEL ESTUDIANTE"}
${isImproveMode ? `- Alcance de corrección: ${targetNote}` : ""}

SECCIONES ACTUALES DEL RESUMEN:
${sectionsText || "(Sin secciones cargadas aún)"}

CONCEPTOS Y FÓRMULAS DE APOYO:
${conceptsText}
${formulasText}

${historyText ? `CONVERSACIÓN PREVIA:\n${historyText}\n` : ""}
MENSAJE DEL ESTUDIANTE:
"${message.trim()}"

INSTRUCCIONES:
1. En \`reply\`: Respondé siempre con calidez, claridad y tono amigable (como un buen docente particular o ayudante de cátedra). Usá ejemplos sencillos de la vida cotidiana cuando ayuden a visualizar la idea. Si escribís una ecuación importante en el texto, ponela en párrafo aparte entre \`$$...$$\` para que se lea cómoda.
2. ${
        isImproveMode
          ? "En `suggestedSections`: Generá las secciones corregidas con mejor redacción, oraciones más cortas, transiciones claras y sin perder precisión universitaria. Conservá `order` exacto de cada sección modificada. Si había una fórmula útil en `formulaLatex`, mantenela o aclarala en `formulaCaption`."
          : "Si el estudiante solo está haciendo una pregunta conceptual o de ejercicio, dejá `suggestedSections` como arreglo vacío `[]`. Solo completá `suggestedSections` si el usuario pide explícitamente corregir o reescribir una sección del resumen."
      }
`;

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: studyAssistantResponseSchema,
          systemInstruction:
            "Sos un tutor universitario empático y claro. Respondés en español con cercanía, precisión académica y foco en hacer la lectura lo más amigable y comprensible posible.",
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());

      return res.json({
        reply: String(parsed.reply ?? "No pude generar una respuesta en este momento."),
        suggestedSections: Array.isArray(parsed.suggestedSections)
          ? parsed.suggestedSections.map((s: Record<string, unknown>, idx: number) => ({
              order: Number(s.order) || idx + 1,
              title: String(s.title ?? `Sección ${idx + 1}`),
              content: String(s.content ?? ""),
              formulaLatex: s.formulaLatex ? String(s.formulaLatex) : undefined,
              formulaCaption: s.formulaCaption ? String(s.formulaCaption) : undefined,
            }))
          : [],
      });
    } catch (err) {
      const { status, message } = extractGeminiError(err);
      return res.status(status).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("/{*path}", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Códice server running on http://localhost:${PORT}`);
  });
}

startServer();
