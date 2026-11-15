import { UploadedFilePayload } from '../types/study';

export const MAX_UPLOAD_FILE_MB = 8;
export const MAX_UPLOAD_FILE_BYTES = MAX_UPLOAD_FILE_MB * 1024 * 1024;

export function validateUploadFileSize(file: File): string | null {
  if (file.size > MAX_UPLOAD_FILE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return `El archivo "${file.name}" pesa ${sizeMb} MB y supera el límite de ${MAX_UPLOAD_FILE_MB} MB por archivo.`;
  }
  return null;
}

export function readValidatedFilePayload(file: File): Promise<UploadedFilePayload> {
  const sizeError = validateUploadFileSize(file);
  if (sizeError) {
    return Promise.reject(new Error(sizeError));
  }

  return new Promise((resolve, reject) => {
    const isText =
      file.type.startsWith('text/') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.csv');

    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`No se pudo leer "${file.name}".`));

    if (isText) {
      reader.onload = () => {
        resolve({
          name: file.name,
          mimeType: file.type || 'text/plain',
          base64Data: '',
          textContent: typeof reader.result === 'string' ? reader.result : '',
        });
      };
      reader.readAsText(file);
    } else {
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        resolve({
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          base64Data,
        });
      };
      reader.readAsDataURL(file);
    }
  });
}

function getHttpErrorFallback(status: number): string {
  if (status === 413) {
    return 'El archivo o contenido enviado es demasiado grande (máximo 25 MB). Reducí el tamaño o adjuntá archivos más livianos.';
  }
  if (status === 429) {
    return 'Se alcanzó el límite de solicitudes por minuto. Esperá un momento y volvé a intentar.';
  }
  if (status === 401 || status === 403) {
    return 'No tenés autorización para realizar esta acción o la sesión/token no es válido.';
  }
  if (status >= 500) {
    return `El servidor tuvo un problema temporal (HTTP ${status}). Volvé a intentar en unos segundos.`;
  }
  return `No se pudo completar la solicitud (HTTP ${status}).`;
}

export async function safeFetchJson<T>(
  url: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const appAccessKey = import.meta.env.VITE_APP_ACCESS_KEY;
  if (typeof appAccessKey === 'string' && appAccessKey.trim().length > 0 && !headers.has('x-app-key')) {
    headers.set('x-app-key', appAccessKey.trim());
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    if (response.status === 413) {
      throw new Error(getHttpErrorFallback(413));
    }

    if (isJson) {
      let errorMessage = '';
      try {
        const errBody = (await response.json()) as { error?: string; message?: string };
        errorMessage = errBody?.error || errBody?.message || '';
      } catch {
        // Fallback below if malformed JSON error payload
      }
      throw new Error(errorMessage || getHttpErrorFallback(response.status));
    }

    throw new Error(getHttpErrorFallback(response.status));
  }

  if (!isJson) {
    throw new Error('El servidor devolvió una respuesta inválida que no está en formato JSON.');
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new Error('No se pudo interpretar la respuesta del servidor.');
  }
}
