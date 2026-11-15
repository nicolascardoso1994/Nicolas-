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

const visualDiagramPartSchema = {
  type: Type.OBJECT,
  properties: {
    number: { type: Type.INTEGER, description: "Número secuencial 1, 2, 3..." },
    label: { type: Type.STRING, description: "Nombre anatómico, biológico o conceptual exacto" },
    location: { type: Type.STRING, description: "Ubicación espacial o región dentro del esquema" },
    description: { type: Type.STRING, description: "Qué es y qué función cumple de forma clara" },
    examTip: { type: Type.STRING, description: "Dato clave que suelen evaluar en parciales o finales" },
    x: { type: Type.NUMBER, description: "Coordenada horizontal del pin sobre lienzo 0..400" },
    y: { type: Type.NUMBER, description: "Coordenada vertical del pin sobre lienzo 0..260" },
  },
  required: ["number", "label", "location", "description", "examTip", "x", "y"],
};

const svgShapePrimitiveSchema = {
  type: Type.OBJECT,
  properties: {
    kind: {
      type: Type.STRING,
      description: "Uno de: ellipse, rect, circle, line, path, polygon",
    },
    fill: { type: Type.STRING },
    stroke: { type: Type.STRING },
    strokeWidth: { type: Type.NUMBER },
    cx: { type: Type.NUMBER },
    cy: { type: Type.NUMBER },
    rx: { type: Type.NUMBER },
    ry: { type: Type.NUMBER },
    r: { type: Type.NUMBER },
    x: { type: Type.NUMBER },
    y: { type: Type.NUMBER },
    width: { type: Type.NUMBER },
    height: { type: Type.NUMBER },
    x1: { type: Type.NUMBER },
    y1: { type: Type.NUMBER },
    x2: { type: Type.NUMBER },
    y2: { type: Type.NUMBER },
    d: { type: Type.STRING },
    points: { type: Type.STRING },
  },
  required: ["kind"],
};

const visualExampleSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    categoryLabel: {
      type: Type.STRING,
      description: "Ej: Ejemplo anatómico, Esquema celular, Mapa de proceso",
    },
    caption: { type: Type.STRING },
    templateId: {
      type: Type.STRING,
      description:
        "Elegí la plantilla más acorde: heart, cell, neuron, respiratory, nephron, bone, o custom si es otra estructura.",
    },
    shapes: {
      type: Type.ARRAY,
      description:
        "Solo completar si templateId es custom: formas vectoriales limpias en lienzo 400x260 que representen la estructura.",
      items: svgShapePrimitiveSchema,
    },
    parts: {
      type: Type.ARRAY,
      description: "4 a 6 partes clave ubicadas sobre el diagrama (x en 20..380, y en 20..240).",
      items: visualDiagramPartSchema,
    },
  },
  required: ["title", "categoryLabel", "caption", "templateId", "parts"],
};

const studyPlanResponseSchema = {
  type: Type.OBJECT,
  properties: {
    subjectMode: {
      type: Type.STRING,
      description:
        "Exactamente 'theoretical' si la materia es teórica/descriptiva/anatómica/biológica sin cuentas matemáticas obligatorias, o 'quantitative' si requiere cálculos, despejes o ecuaciones.",
    },
    executiveSummary: {
      type: Type.STRING,
      description:
        "Síntesis ejecutiva breve de 2 a 3 oraciones que resume el hilo central del examen.",
    },
    summarySections: {
      type: Type.ARRAY,
      description:
        "Resumen universitario ordenado por secciones numeradas (ej: 1. Conexión entre unidades, 2. Núcleo conceptual, 3. Criterios de aplicación). Cada sección lleva título claro, explicación amigable debajo del título y, SOLO si la materia es cuantitativa y hay una fórmula clave, se coloca en formulaLatex.",
      items: {
        type: Type.OBJECT,
        properties: {
          order: { type: Type.INTEGER },
          title: { type: Type.STRING, description: "Título breve y claro de la sección sin el número (ej: Conexión entre unidades)" },
          content: { type: Type.STRING, description: "Texto ordenado y fácil de leer." },
          formulaLatex: { type: Type.STRING, description: "Ecuación principal en LaTeX puro (sin signos $), SOLO si la materia requiere cuentas." },
          formulaCaption: { type: Type.STRING, description: "Breve aclaración sobre la fórmula (si aplica)." },
        },
        required: ["order", "title", "content"],
      },
    },
    visualExamples: {
      type: Type.ARRAY,
      description:
        "Para materias teóricas, anatómicas o biológicas (subjectMode = theoretical), incluí 2 ejemplos gráficos/visuales con sus partes señaladas. Opcional (0-1) para materias cuantitativas.",
      items: visualExampleSchema,
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
                description:
                  "Uno de: inclined_plane, projectile, visual_diagram, circuit_or_generic, none. Usá visual_diagram para anatomía, biología y materias teóricas.",
              },
              angleDeg: { type: Type.NUMBER },
              massKg: { type: Type.NUMBER },
              mu: { type: Type.NUMBER },
              velocityMs: { type: Type.NUMBER },
              caption: { type: Type.STRING },
              visualExample: visualExampleSchema,
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
                mathLatex: {
                  type: Type.STRING,
                  description:
                    "Ecuaciones en LaTeX puro sin $$ SOLO si el tema requiere cuentas matemáticas; en materias teóricas/anatómicas dejalo vacío \"\".",
                },
                explanation: { type: Type.STRING },
                watchOut: { type: Type.STRING },
                highlightElement: {
                  type: Type.STRING,
                  description: "Uno de: axes, gravity, normal, friction, applied, result, energy",
                },
                highlightPartNumber: {
                  type: Type.INTEGER,
                  description: "Número de parte (1..6) del visualExample que corresponde a este paso.",
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
    "subjectMode",
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
        visualExample: visualExampleSchema,
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
          highlightPartNumber: { type: Type.INTEGER },
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

const examModelSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "Título claro del modelo de parcial o final (ej: Primer Parcial Modelo — Dinámica y Energía).",
    },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          number: { type: Type.INTEGER },
          type: {
            type: Type.STRING,
            description: "Uno de: 'choice' (opción múltiple de 4 opciones) o 'open' (desarrollo / ejercicio / análisis de caso).",
          },
          topic: { type: Type.STRING },
          points: {
            type: Type.INTEGER,
            description: "Puntaje de la consigna; la suma de todas las preguntas debe dar exactamente 100.",
          },
          prompt: {
            type: Type.STRING,
            description: "Enunciado completo y claro de nivel universitario. Si usa símbolos matemáticos usar $...$, nunca inventar cuentas en materias teóricas.",
          },
          options: {
            type: Type.ARRAY,
            description: "Obligatorio (4 opciones) si type='choice'; arreglo vacío [] si type='open'.",
            items: { type: Type.STRING },
          },
          correctIndex: {
            type: Type.INTEGER,
            description: "Índice 0..3 de la opción correcta si type='choice'.",
          },
          modelSolution: {
            type: Type.STRING,
            description: "Resolución modelo paso a paso o respuesta esperada completa para corregir.",
          },
          modelFormulaLatex: {
            type: Type.STRING,
            description: "Fórmula clave usada en LaTeX puro (sin $$) SOLO en materias cuantitativas; vacío '' en materias teóricas.",
          },
          gradingCriteria: {
            type: Type.STRING,
            description: "Criterio concreto de corrección para asignar puntaje parcial o total.",
          },
        },
        required: [
          "number",
          "type",
          "topic",
          "points",
          "prompt",
          "modelSolution",
          "gradingCriteria",
        ],
      },
    },
  },
  required: ["title", "questions"],
};

const gradeExamSchema = {
  type: Type.OBJECT,
  properties: {
    overallFeedback: {
      type: Type.STRING,
      description: "Devolución general breve y constructiva al estudiante sobre su desempeño en el parcial.",
    },
    questionGrades: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          questionId: { type: Type.STRING },
          earnedPoints: { type: Type.INTEGER },
          isCorrect: { type: Type.BOOLEAN },
          feedback: { type: Type.STRING },
        },
        required: ["questionId", "earnedPoints", "isCorrect", "feedback"],
      },
    },
  },
  required: ["overallFeedback", "questionGrades"],
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
0. **Clasificación de la asignatura (\`subjectMode\`) — REGLA FUNDAMENTAL**:
   - Evaluá primero si la materia requiere cuentas, cálculos numéricos o ecuaciones matemáticas (\`quantitative\`, ej. Física, Matemática, Química, Estadística, Finanzas) **O** si es una materia principalmente teórica, descriptiva o morfológica (\`theoretical\`, ej. **Anatomía, Biología, Histología, Embriología, Fisiología descriptiva, Medicina, Enfermería, Historia, Derecho, Psicología, Sociología, Filosofía, Literatura**).
   - **SI \`subjectMode === "theoretical"\`**:
     - **PROHIBIDO inventar cuentas, números artificiales o fórmulas matemáticas**. Dejá \`formulas\` como arreglo vacío \`[]\`, no pongas ecuaciones en \`formulaLatex\`, y dejá \`steps[].mathLatex\` vacío \`""\`.
     - En su lugar, generá **ejemplos gráficos y visuales concretos** en \`visualExamples\` (2 esquemas interactivos) y usá \`visualConfig.type = "visual_diagram"\` con su \`visualExample\` en cada elemento de \`exercises\`.
     - Por ejemplo, en Anatomía mostrá partes anatómicas reales con sus pines (x: 20..380, y: 20..240), ubicación, función y dato de examen; en Biología mostrá organelas, membranas o fases celulares; en materias humanísticas mostrá esquemas de actores, poderes o etapas históricas usando \`templateId: "custom"\` y \`shapes\` vectoriales simples.
     - Usá \`templateId\` (\`heart\`, \`cell\`, \`neuron\`, \`respiratory\`, \`nephron\`, \`bone\`) cuando el tema coincida con alguna de esas estructuras para mostrar una ilustración anatómica de alta precisión con los pines ubicados sobre cada región; si es otro órgano o tema teórico, usá \`templateId: "custom"\` y dibujá formas limpias en \`shapes\` (400×260) alineadas con las coordenadas \`(x, y)\` de \`parts\`.

1. **Plan de estudio por bloques (studyBlocks)**: La suma de \`durationMinutes\` de todos los bloques debe aproximarse lo máximo posible a ${totalMinutes} minutos (idealmente exactamente ${totalMinutes} min). Dividí el tiempo en sesiones claras (\`Día 1 · Bloque 1\`, etc.) alternando teoría, práctica o análisis visual, repaso y autoevaluación (y descansos breves de 10-15 min si supera 90 minutos).
2. **Resumen optimizado para examen**:
   - \`summarySections\`: Creá 3 a 4 secciones ordenadas (por ejemplo: 1. Conexión entre unidades, 2. Núcleo conceptual, 3. Criterios prácticos para el examen). Cada sección debe tener título claro arriba y desarrollo ordenado debajo. Solo si \`subjectMode === "quantitative"\` y hay una fórmula clave, ponela aparte en \`formulaLatex\`.
   - \`keyConcepts\`: 4 a 6 conceptos centrales con definición académica rigurosa + explicación en palabras simples + ejemplo cotidiano concreto.
   - \`formulas\`: SOLO si \`subjectMode === "quantitative"\`, incluí 3 a 6 fórmulas en LaTeX puro con variables SI, cuándo usarla y cuándo NO usarla. Si \`subjectMode === "theoretical"\`, devolvé \`[]\`.
   - \`examTraps\`: 3 a 4 trampas típicas de examen universitario y cómo evitarlas rápido.
3. **Guía de repaso detallada**:
   - \`guideSections\`: 3 a 5 secciones progresivas ordenadas de lo fundamental a lo complejo, con ejemplo concreto e idea clave para retener.
   - \`masteryChecklist\`: 5 a 7 afirmaciones verificables ("Sé identificar...", "Puedo explicar...").
   - \`quizQuestions\`: 4 preguntas tipo parcial con 4 opciones cada una, \`correctIndex\` (0-3) y explicación breve y clara.
4. **Paso a Paso (\`exercises\`)**:
   - Si \`subjectMode === "quantitative"\`: Creá 2 ejercicios universitarios representativos resueltos paso a paso (4 a 6 pasos con \`mathLatex\`, \`thinkingPrompt\`, \`watchOut\`, \`quickCheck\` y \`visualConfig\` \`inclined_plane\`, \`projectile\`, \`circuit_or_generic\` o \`none\`).
   - Si \`subjectMode === "theoretical"\`: Creá 2 **casos visuales / recorridos anatómicos o conceptuales paso a paso** (SIN cuentas ni \`mathLatex\`). Cada caso lleva \`visualConfig.type = "visual_diagram"\`, su \`visualExample\` con 4-6 partes anatómicas o conceptuales señaladas, \`givenData\` listando las estructuras/componentes clave, \`unknowns\` listando qué debe saber identificar el alumno, y 4 a 5 pasos (\`steps\`) donde cada paso apunta a una parte (\`highlightPartNumber\`) y explica qué observar, su función y errores típicos de examen, con \`quickCheck\` en al menos 2 pasos.
5. En materias cuantitativas, cuando escribas ecuaciones importantes en texto normal ponelas en párrafo aparte entre \`$$...$$\`. En \`formulas[].latex\`, \`summarySections[].formulaLatex\` y \`steps[].mathLatex\`, devolvé SOLO LaTeX puro sin signos \`$\`.
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
            "Respondé únicamente en español claro, preciso y directo. Mantené rigor universitario con explicaciones concretas. Nunca inventes fórmulas ni cuentas matemáticas en materias teóricas, anatómicas o biológicas descriptivas: usá ejemplos visuales con partes señaladas.",
        },
      });

      const rawJson = (response.text ?? "{}").trim();
      const parsed = JSON.parse(rawJson);

      const nowId = `plan-${Date.now()}`;
      const resolvedMode =
        parsed.subjectMode === "theoretical" ||
        (!Array.isArray(parsed.formulas) || parsed.formulas.length === 0)
          ? "theoretical"
          : "quantitative";

      const normalizeVisualExample = (v: Record<string, unknown> | undefined, fallbackId: string) => {
        if (!v || !Array.isArray(v.parts) || v.parts.length === 0) return undefined;
        return {
          id: fallbackId,
          title: String(v.title ?? "Esquema visual"),
          categoryLabel: String(v.categoryLabel ?? "Ejemplo gráfico"),
          caption: String(v.caption ?? ""),
          templateId: String(v.templateId ?? "custom"),
          shapes: Array.isArray(v.shapes) ? v.shapes : undefined,
          parts: v.parts.map((p: Record<string, unknown>, pIdx: number) => ({
            id: `${fallbackId}-part-${pIdx + 1}`,
            number: Number(p.number) || pIdx + 1,
            label: String(p.label ?? `Parte ${pIdx + 1}`),
            location: String(p.location ?? ""),
            description: String(p.description ?? ""),
            examTip: String(p.examTip ?? ""),
            x: Math.min(380, Math.max(20, Number(p.x) || 80 + pIdx * 55)),
            y: Math.min(240, Math.max(20, Number(p.y) || 120)),
          })),
        };
      };

      const normalized = {
        id: nowId,
        subject: subject.trim(),
        subjectMode: resolvedMode,
        examType,
        createdAt: new Date().toISOString(),
        totalMinutes,
        daysAvailable: safeDays,
        hoursPerDay: safeHoursPerDay,
        pace,
        executiveSummary: parsed.executiveSummary ?? "",
        visualExamples: Array.isArray(parsed.visualExamples)
          ? parsed.visualExamples
              .map((v: Record<string, unknown>, idx: number) =>
                normalizeVisualExample(v, `vis-${nowId}-${idx}`)
              )
              .filter(Boolean)
          : [],
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
        exercises: (parsed.exercises ?? []).map((ex: Record<string, unknown>, idx: number) => {
          const vc = (ex.visualConfig ?? { type: "none" }) as Record<string, unknown>;
          const normalizedVisualExample = vc.visualExample
            ? normalizeVisualExample(
                vc.visualExample as Record<string, unknown>,
                `ex-vis-${nowId}-${idx}`
              )
            : undefined;
          return {
            id: `ex-${nowId}-${idx}`,
            title: String(ex.title ?? `Caso ${idx + 1}`),
            topic: String(ex.topic ?? subject.trim()),
            difficulty: ["Base", "Parcial", "Integrador"].includes(String(ex.difficulty))
              ? String(ex.difficulty)
              : "Parcial",
            statement: String(ex.statement ?? ""),
            givenData: Array.isArray(ex.givenData) ? ex.givenData : [],
            unknowns: Array.isArray(ex.unknowns) ? ex.unknowns.map(String) : [],
            visualConfig: {
              ...vc,
              type: String(vc.type ?? "none"),
              visualExample: normalizedVisualExample,
            },
            steps: Array.isArray(ex.steps) ? ex.steps : [],
            finalAnswer: String(ex.finalAnswer ?? ""),
          };
        }),
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
Analizá paso a paso el siguiente problema, caso o estructura de la materia "${subject}" para que el estudiante comprenda el razonamiento completo.

ENUNCIADO / TEMA:
${statement || "(Revisá la imagen o documento adjunto para extraer el contenido completo.)"}

REQUISITOS IMPORTANTES SEGÚN EL TIPO DE MATERIA:
- Si la materia o consigna NO requiere cálculos matemáticos (por ejemplo Anatomía, Biología, Histología, Derecho, Historia o temas teóricos/morfológicos):
  - **NO inventes cuentas ni fórmulas matemáticas**: dejá \`mathLatex\` como cadena vacía \`""\`.
  - Usá \`visualConfig.type = "visual_diagram"\` y completá \`visualConfig.visualExample\` con un esquema claro (\`templateId\`: \`heart\`, \`cell\`, \`neuron\`, \`respiratory\`, \`nephron\`, \`bone\` o \`custom\` con \`shapes\`) y 4 a 6 \`parts\` reales con coordenadas sobre 400×260.
  - Descomponé el tema en 4 a 5 pasos visuales/conceptuales conectando cada paso con \`highlightPartNumber\` (1..6).
- Si la materia SÍ requiere cálculos (Física, Matemática, Química cuantitativa):
  - Descomponé en 4 a 6 pasos con ecuaciones en \`mathLatex\` (LaTeX puro sin \`$$\`), \`thinkingPrompt\`, \`watchOut\` y verificaciones SI.
  - Si es plano inclinado o proyectil, configurá \`visualConfig\` (\`inclined_plane\` o \`projectile\`).
- En todos los casos incluí \`quickCheck\` en al menos 2-3 pasos para que el alumno compruebe lo aprendido.
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
            "Sos un docente universitario claro y visual. Si la materia es teórica, anatómica o biológica sin cálculos, explicás con esquemas visuales y partes anatómicas reales sin inventar matemática; si es cuantitativa, explicás con precisión matemática en español.",
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      const customVc = (parsed.visualConfig ?? { type: "none" }) as Record<string, unknown>;
      const customVis = customVc.visualExample as Record<string, unknown> | undefined;
      return res.json({
        id: `ex-custom-${Date.now()}`,
        title: parsed.title ?? "Guía visual paso a paso",
        topic: parsed.topic ?? subject,
        difficulty: ["Base", "Parcial", "Integrador"].includes(parsed.difficulty)
          ? parsed.difficulty
          : "Parcial",
        statement: parsed.statement ?? statement,
        givenData: Array.isArray(parsed.givenData) ? parsed.givenData : [],
        unknowns: Array.isArray(parsed.unknowns) ? parsed.unknowns : [],
        visualConfig: {
          ...customVc,
          type: String(customVc.type ?? "none"),
          visualExample:
            customVis && Array.isArray(customVis.parts)
              ? {
                  id: `custom-vis-${Date.now()}`,
                  title: String(customVis.title ?? parsed.title ?? "Esquema visual"),
                  categoryLabel: String(customVis.categoryLabel ?? "Ejemplo gráfico"),
                  caption: String(customVis.caption ?? ""),
                  templateId: String(customVis.templateId ?? "custom"),
                  shapes: Array.isArray(customVis.shapes) ? customVis.shapes : undefined,
                  parts: customVis.parts.map((p: Record<string, unknown>, pIdx: number) => ({
                    id: `custom-part-${Date.now()}-${pIdx + 1}`,
                    number: Number(p.number) || pIdx + 1,
                    label: String(p.label ?? `Parte ${pIdx + 1}`),
                    location: String(p.location ?? ""),
                    description: String(p.description ?? ""),
                    examTip: String(p.examTip ?? ""),
                    x: Math.min(380, Math.max(20, Number(p.x) || 80 + pIdx * 55)),
                    y: Math.min(240, Math.max(20, Number(p.y) || 120)),
                  })),
                }
              : undefined,
        },
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

      const isTheoreticalNoMath =
        !Array.isArray(formulas) || formulas.length === 0;

      const prompt = `
Generá un resumen de examen adaptado exactamente al tiempo que le queda al estudiante antes de rendir.

CONTEXTO DEL EXAMEN:
- Materia: ${subject}
- Tipo de evaluación: ${examType}
- Perfil de la materia: ${isTheoreticalNoMath ? "TEÓRICA / VISUAL (NO requiere cuentas ni fórmulas matemáticas)" : "CUANTITATIVA (con fórmulas y cálculos)"}
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
${!isTheoreticalNoMath ? `Fórmulas / Relaciones:\n${contextFormulas}` : ""}
Trampas de examen:
${contextTraps || "(Incluir errores frecuentes en exámenes universitarios de esta materia)"}

INSTRUCCIONES DE FORMATO PARA LECTURA AMIGABLE:
- En \`compressedSummary\`, escribí solo una breve introducción de 1 a 2 oraciones.
- En \`summarySections\`, organizá el resumen completo en 3 a 4 secciones ordenadas (ej: 1. Conexión entre unidades, 2. Ejes o estructuras fundamentales, 3. Criterios prácticos de examen). Cada sección debe tener título claro y explicación amigable debajo. ${isTheoreticalNoMath ? "NO inventes fórmulas en `formulaLatex` (dejalo vacío)." : "Cuando aparezca una fórmula clave, colocala en `formulaLatex` (LaTeX puro sin `$`)."}
- ${includeTimeDistribution ? "En `timeAllocationAdvice`, recomendá concretamente cómo repartir las " + totalEffectiveHours + " horas útiles disponibles." : "Dejá `timeAllocationAdvice` como cadena vacía \"\" porque el usuario no solicitó distribución de tiempo."}
- En \`priorityTopics\`, ordená 3 a 5 temas de mayor a menor rentabilidad para el examen.
- En \`mustMemorizeFormulas\`: ${isTheoreticalNoMath ? "Devolvé arreglo vacío `[]` porque esta asignatura no requiere cálculos ni fórmulas." : "Devolvé 3 a 5 fórmulas en LaTeX puro (sin `$` alrededor) con un consejo práctico de aplicación rápida."}
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

      const hasFormulas = Array.isArray(formulas) && formulas.length > 0;
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
1. En \`reply\`: Respondé siempre con calidez, claridad y tono amigable (como un buen docente particular o ayudante de cátedra). Usá ejemplos sencillos de la vida cotidiana o visuales/anatómicos cuando ayuden a visualizar la idea. ${
        hasFormulas
          ? "Si escribís una ecuación importante en el texto, ponela en párrafo aparte entre `$$...$$` para que se lea cómoda."
          : "Esta materia es teórica/visual y NO requiere cuentas ni fórmulas matemáticas: explicá mediante relaciones conceptuales, ubicación espacial, partes, estructuras y ejemplos gráficos o clínicos sin inventar ecuaciones ni cálculos."
      }
2. ${
        isImproveMode
          ? hasFormulas
            ? "En `suggestedSections`: Generá las secciones corregidas con mejor redacción, oraciones más cortas, transiciones claras y sin perder precisión universitaria. Conservá `order` exacto de cada sección modificada. Si había una fórmula útil en `formulaLatex`, mantenela o aclarala en `formulaCaption`."
            : "En `suggestedSections`: Generá las secciones corregidas con mejor redacción, oraciones más cortas, transiciones claras y descripciones visuales/anatómicas precisas. Conservá `order` exacto de cada sección modificada y dejá `formulaLatex` vacío porque la materia no requiere fórmulas."
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

  app.post("/api/generate-exam-model", async (req, res) => {
    try {
      const {
        subject = "Materia Universitaria",
        subjectMode = "quantitative",
        examType = "Primer Parcial",
        mode = "from_material",
        customTitle = "",
        uploadedText = "",
        files = [],
        executiveSummary = "",
        summarySections = [],
        keyConcepts = [],
        formulas = [],
        examTraps = [],
        difficultyFocus = "Parcial estándar",
      } = req.body ?? {};

      const isUploadMode = mode === "from_upload";
      if (
        isUploadMode &&
        (!uploadedText || String(uploadedText).trim().length === 0) &&
        (!Array.isArray(files) || files.length === 0)
      ) {
        return res.status(400).json({
          error: "Pegá el texto de tu modelo de parcial o adjuntá un archivo (PDF, imagen o texto).",
        });
      }

      const ai = getAiClient();
      const isTheoretical = subjectMode === "theoretical";

      const sectionsSummary = Array.isArray(summarySections)
        ? summarySections
            .slice(0, 8)
            .map(
              (s: { order?: number; title?: string; content?: string }) =>
                `${s.order ?? ""}. ${s.title ?? ""}: ${String(s.content ?? "").slice(0, 350)}`
            )
            .join("\n")
        : "";

      const conceptsSummary = Array.isArray(keyConcepts)
        ? keyConcepts
            .slice(0, 8)
            .map((c: { term?: string; academicDefinition?: string }) => `- ${c.term ?? ""}: ${c.academicDefinition ?? ""}`)
            .join("\n")
        : "";

      const formulasSummary =
        !isTheoretical && Array.isArray(formulas) && formulas.length > 0
          ? formulas
              .slice(0, 8)
              .map((f: { name?: string; latex?: string }) => `- ${f.name ?? ""}: ${f.latex ?? ""}`)
              .join("\n")
          : "";

      const trapsSummary = Array.isArray(examTraps)
        ? examTraps
            .slice(0, 6)
            .map((t: { mistake?: string; howToAvoid?: string }) => `- ${t.mistake ?? ""} -> ${t.howToAvoid ?? ""}`)
            .join("\n")
        : "";

      const prompt = isUploadMode
        ? `
El estudiante cargó un MODELO DE PARCIAL REAL para la materia "${subject}" (${examType}).
${customTitle ? `Título deseado: ${customTitle}` : ""}

INSTRUCCIÓN PRINCIPAL:
1. Leé cuidadosamente el archivo adjunto o texto pegado con las consignas del modelo de parcial.
2. Convertí cada consigna en una pregunta evaluable dentro de \`questions\` (entre 3 y 6 preguntas). Si el parcial tiene ítems de opción múltiple usá \`type: "choice"\` con sus 4 opciones; si son ejercicios de desarrollo, problemas o análisis clínico/anatómico usá \`type: "open"\`.
3. Ajustá \`points\` proporcionalmente para que la suma total de todas las preguntas sea EXACTAMENTE 100 puntos.
4. Escribí \`modelSolution\` y \`gradingCriteria\` detallados y precisos para poder corregir automáticamente al estudiante cuando lo rinda.
5. ${
            isTheoretical
              ? "Esta asignatura es teórica/morfológica (NO requiere cuentas matemáticas): mantené `modelFormulaLatex` vacío `\"\"` y evaluá relaciones conceptuales, ubicación anatómica o casos clínicos/biológicos."
              : "Si una consigna requiere una fórmula matemática/física/química clave en su resolución, ponela en `modelFormulaLatex` (LaTeX puro sin $$)."
          }

TEXTO DEL MODELO CARGADO:
${String(uploadedText || "(Ver archivo adjunto)")}

MATERIAL DE APOYO DE LA MATERIA:
${executiveSummary}
${conceptsSummary}
`
        : `
Generá un MODELO DE PARCIAL UNIVERSITARIO REALISTA Y EVALUABLE basado exclusivamente en el material de estudio cargado de la materia "${subject}" (${examType} · Enfoque: ${difficultyFocus}).

MATERIAL DE ESTUDIO CARGADO:
- Resumen ejecutivo: ${executiveSummary}
- Secciones:
${sectionsSummary}
- Conceptos clave:
${conceptsSummary}
${formulasSummary ? `- Fórmulas:\n${formulasSummary}` : ""}
${trapsSummary ? `- Trampas frecuentes a evaluar:\n${trapsSummary}` : ""}

REQUISITOS DEL PARCIAL:
1. Generá exactamente 4 o 5 consignas (\`questions\`) cuya suma de \`points\` dé EXACTAMENTE 100 puntos (ej: 20 + 20 + 30 + 30 = 100).
2. Incluí una mezcla equilibrada: al menos 2 preguntas de \`type: "choice"\` (4 opciones realistas donde los distractores reflejan las trampas típicas de examen) y al menos 2 consignas de \`type: "open"\` (para que el estudiante desarrolle su respuesta o resolución).
3. ${
            isTheoretical
              ? "ATENCIÓN — MATERIA TEÓRICA/VISUAL SIN CUENTAS: NO inventes cálculos, fórmulas ni ecuaciones matemáticas. Dejá `modelFormulaLatex` como `\"\"`. Basá las consignas en identificación anatómica/estructural, relaciones funcionales, fisiología o casos clínicos/conceptuales."
              : "En consignas cuantitativas, incluí datos numéricos concretos y coherentes en `prompt`, la fórmula principal en `modelFormulaLatex` (LaTeX puro sin $$) y la resolución paso a paso en `modelSolution`."
          }
4. Completá \`gradingCriteria\` con criterios claros para corregir la respuesta del estudiante.
`;

      const contents = buildContentParts(prompt, Array.isArray(files) ? files : []);
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: { parts: contents },
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM },
          responseMimeType: "application/json",
          responseSchema: examModelSchema,
          systemInstruction:
            "Sos un profesor titular universitario. Redactás exámenes parciales y finales rigurosos, claros y justos en español, con rúbricas de corrección exactas.",
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
      const rawSum = rawQuestions.reduce(
        (acc: number, q: Record<string, unknown>) => acc + (Number(q.points) || 0),
        0
      );

      const questions = rawQuestions.map((q: Record<string, unknown>, idx: number) => {
        const type = q.type === "choice" && Array.isArray(q.options) && q.options.length >= 2
          ? "choice"
          : "open";
        const basePoints = Number(q.points) || Math.round(100 / Math.max(1, rawQuestions.length));
        const normalizedPoints =
          rawSum > 0 ? Math.max(5, Math.round((basePoints / rawSum) * 100)) : 25;

        return {
          id: `q-${Date.now()}-${idx + 1}`,
          number: Number(q.number) || idx + 1,
          type,
          topic: String(q.topic ?? subject),
          points: normalizedPoints,
          prompt: String(q.prompt ?? ""),
          options:
            type === "choice" && Array.isArray(q.options)
              ? q.options.map((o) => String(o))
              : undefined,
          correctIndex:
            type === "choice"
              ? Math.max(0, Math.min((Array.isArray(q.options) ? q.options.length : 4) - 1, Number(q.correctIndex) || 0))
              : undefined,
          modelSolution: String(q.modelSolution ?? ""),
          modelFormulaLatex:
            !isTheoretical && q.modelFormulaLatex ? String(q.modelFormulaLatex) : undefined,
          gradingCriteria: String(q.gradingCriteria ?? ""),
        };
      });

      // Ensure exact sum = 100
      if (questions.length > 0) {
        const currentTotal = questions.reduce((acc: number, q: { points: number }) => acc + q.points, 0);
        questions[questions.length - 1].points = Math.max(
          5,
          questions[questions.length - 1].points + (100 - currentTotal)
        );
      }

      return res.json({
        id: `exam-model-${Date.now()}`,
        title: String(
          customTitle?.trim() ||
            parsed.title ||
            (isUploadMode ? `Modelo cargado · ${subject}` : `Simulacro de ${examType} · ${subject}`)
        ),
        source: isUploadMode ? "uploaded" : "generated",
        examType,
        passingScore: 60,
        createdAt: new Date().toISOString(),
        sourceNotes: isUploadMode && uploadedText ? String(uploadedText).slice(0, 1000) : undefined,
        questions,
      });
    } catch (err) {
      const { status, message } = extractGeminiError(err);
      return res.status(status).json({ error: message });
    }
  });

  app.post("/api/grade-exam-model", async (req, res) => {
    try {
      const {
        subject = "Materia Universitaria",
        subjectMode = "quantitative",
        examModel,
        answers = {},
      } = req.body ?? {};

      if (!examModel || !Array.isArray(examModel.questions) || examModel.questions.length === 0) {
        return res.status(400).json({ error: "No se encontró un modelo de parcial válido para evaluar." });
      }

      const questions = examModel.questions as Array<{
        id: string;
        number: number;
        type: "choice" | "open";
        topic: string;
        points: number;
        prompt: string;
        options?: string[];
        correctIndex?: number;
        modelSolution: string;
        gradingCriteria: string;
      }>;

      const choiceResults: Array<{
        questionId: string;
        earnedPoints: number;
        maxPoints: number;
        isCorrect: boolean;
        feedback: string;
      }> = [];

      const openToEvaluate: Array<{
        questionId: string;
        number: number;
        points: number;
        prompt: string;
        modelSolution: string;
        gradingCriteria: string;
        studentAnswer: string;
      }> = [];

      const blankOpenResults: Array<{
        questionId: string;
        earnedPoints: number;
        maxPoints: number;
        isCorrect: boolean;
        feedback: string;
      }> = [];

      for (const q of questions) {
        const rawAns = answers[q.id];
        if (q.type === "choice") {
          const chosen = typeof rawAns === "number" ? rawAns : Number(rawAns);
          const hasChosen = Number.isFinite(chosen) && rawAns !== "" && rawAns !== undefined && rawAns !== null;
          const isCorrect = hasChosen && chosen === q.correctIndex;
          choiceResults.push({
            questionId: q.id,
            earnedPoints: isCorrect ? q.points : 0,
            maxPoints: q.points,
            isCorrect,
            feedback: !hasChosen
              ? "No seleccionaste ninguna opción."
              : isCorrect
                ? `¡Correcto! ${q.modelSolution}`
                : `Respuesta incorrecta. ${q.modelSolution}`,
          });
        } else {
          const textAns = typeof rawAns === "string" ? rawAns.trim() : "";
          if (!textAns) {
            blankOpenResults.push({
              questionId: q.id,
              earnedPoints: 0,
              maxPoints: q.points,
              isCorrect: false,
              feedback: "Dejaste esta consigna sin responder. Revisá la resolución modelo para practicarla.",
            });
          } else {
            openToEvaluate.push({
              questionId: q.id,
              number: q.number,
              points: q.points,
              prompt: q.prompt,
              modelSolution: q.modelSolution,
              gradingCriteria: q.gradingCriteria,
              studentAnswer: textAns,
            });
          }
        }
      }

      let openAiResults: Array<{
        questionId: string;
        earnedPoints: number;
        maxPoints: number;
        isCorrect: boolean;
        feedback: string;
      }> = [];
      let overallFeedback = "";

      if (openToEvaluate.length > 0) {
        const ai = getAiClient();
        const prompt = `
Evaluá las respuestas de desarrollo del estudiante en este examen de "${subject}" (${subjectMode === "theoretical" ? "materia teórica/conceptual" : "materia cuantitativa"}).

PREGUNTAS Y RESPUESTAS DEL ESTUDIANTE:
${openToEvaluate
  .map(
    (item) => `
---
questionId: ${item.questionId}
Consigna #${item.number} (Puntaje máximo: ${item.points} pts)
Enunciado: ${item.prompt}
Solución esperada: ${item.modelSolution}
Criterio de evaluación: ${item.gradingCriteria}
RESPUESTA DEL ESTUDIANTE:
"""
${item.studentAnswer}
"""
`
  )
  .join("\n")}

INSTRUCCIONES DE CORRECCIÓN:
1. Para cada \`questionId\`, asigná \`earnedPoints\` entero entre 0 y el puntaje máximo de esa pregunta (otorgá puntaje parcial justo si planteó bien la idea pero faltó un detalle o cuenta).
2. Marcá \`isCorrect: true\` si obtuvo al menos el 60% del puntaje de esa pregunta.
3. En \`feedback\`, explicá con tono claro y amigable qué estuvo bien y qué faltó corregir.
4. En \`overallFeedback\`, resumí en 2 oraciones el desempeño general y qué tema reforzar.
`;

        const response = await ai.models.generateContent({
          model: "gemini-4-hydrogen",
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: "application/json",
            responseSchema: gradeExamSchema,
            systemInstruction:
              "Sos un docente universitario justo y claro. Corregís exámenes con precisión académica y devoluciones constructivas en español.",
          },
        });

        const parsed = JSON.parse((response.text ?? "{}").trim());
        overallFeedback = String(parsed.overallFeedback ?? "");
        const gradesMap = new Map<string, { earnedPoints: number; isCorrect: boolean; feedback: string }>();
        if (Array.isArray(parsed.questionGrades)) {
          for (const g of parsed.questionGrades) {
            gradesMap.set(String(g.questionId), {
              earnedPoints: Number(g.earnedPoints) || 0,
              isCorrect: Boolean(g.isCorrect),
              feedback: String(g.feedback ?? ""),
            });
          }
        }

        openAiResults = openToEvaluate.map((item) => {
          const g = gradesMap.get(item.questionId);
          const earned = Math.max(0, Math.min(item.points, Math.round(g?.earnedPoints ?? 0)));
          return {
            questionId: item.questionId,
            earnedPoints: earned,
            maxPoints: item.points,
            isCorrect: g ? g.isCorrect : earned >= Math.ceil(item.points * 0.6),
            feedback: g?.feedback || "Evaluado según la rúbrica del parcial.",
          };
        });
      }

      const resultById = new Map<string, {
        questionId: string;
        earnedPoints: number;
        maxPoints: number;
        isCorrect: boolean;
        feedback: string;
      }>();
      for (const r of [...choiceResults, ...blankOpenResults, ...openAiResults]) {
        resultById.set(r.questionId, r);
      }

      const questionResults = questions.map(
        (q) =>
          resultById.get(q.id) ?? {
            questionId: q.id,
            earnedPoints: 0,
            maxPoints: q.points,
            isCorrect: false,
            feedback: "Sin respuesta evaluada.",
          }
      );

      const totalScore = Math.max(
        0,
        Math.min(
          100,
          questionResults.reduce((acc, r) => acc + r.earnedPoints, 0)
        )
      );
      const passingScore = Number(examModel.passingScore) || 60;
      const passed = totalScore >= passingScore;

      if (!overallFeedback) {
        overallFeedback = passed
          ? `Alcanzaste ${totalScore}/100 puntos y aprobaste el modelo de parcial (mínimo ${passingScore}/100).`
          : `Obtuviste ${totalScore}/100 puntos. Necesitás al menos ${passingScore}/100 para aprobar la materia; revisá las correcciones y volvé a intentarlo.`;
      }

      return res.json({
        submittedAt: new Date().toISOString(),
        totalScore,
        passed,
        overallFeedback,
        answers,
        questionResults,
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
