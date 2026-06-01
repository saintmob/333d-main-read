export interface SubmittedWork {
  id: string;
  url: string;
  coverUrl: string;
  createdAt: string;
}

export interface DesignerSubmission {
  id: string;
  name: string;
  createdAt: string;
  works: SubmittedWork[];
}

export interface ExhibitionWork extends SubmittedWork {
  designerName: string;
  submissionId: string;
}

export const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.DEV ? 'http://127.0.0.1:3102' : '');
const REVIEW_API_BASE = (import.meta.env.VITE_REVIEW_API_BASE || 'https://review-api.saintmob.workers.dev').replace(/\/+$/, '');

interface ReviewBootstrapStudent {
  id?: string;
  fullName?: string;
  name?: string;
}

interface ReviewBootstrapWork {
  id?: string;
  studentId?: string;
  studentName?: string;
  workIndex?: number;
  workUrl?: string;
  coverUrl?: string;
  createdAt?: string;
}

interface ReviewBootstrapResponse {
  works?: ReviewBootstrapWork[];
  students?: ReviewBootstrapStudent[];
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || '请求失败');
  }
  return data as T;
}

function normalizeReviewWorks(payload: unknown): ExhibitionWork[] {
  const bootstrap = Array.isArray(payload)
    ? { works: payload, students: [] }
    : (payload as ReviewBootstrapResponse) || { works: [], students: [] };

  const studentNameById = new Map<string, string>();
  for (const student of bootstrap.students || []) {
    const id = typeof student.id === 'string' ? student.id.trim() : '';
    const fullName = typeof student.fullName === 'string' && student.fullName.trim()
      ? student.fullName.trim()
      : typeof student.name === 'string' && student.name.trim()
        ? student.name.trim()
        : '';
    if (id && fullName) {
      studentNameById.set(id, fullName);
    }
  }

  return (bootstrap.works || []).flatMap((item, index) => {
    const work = item as ReviewBootstrapWork;
    const url = typeof work.workUrl === 'string' ? work.workUrl.trim() : '';
    const coverUrl = typeof work.coverUrl === 'string' ? work.coverUrl.trim() : '';

    if (!url || !coverUrl) return [];

    const studentId = typeof work.studentId === 'string' && work.studentId.trim()
      ? work.studentId.trim()
      : 'review';
    const workIndex = Number.isFinite(work.workIndex) && work.workIndex
      ? Math.max(1, Math.floor(work.workIndex))
      : index + 1;
    const studentName = typeof work.studentName === 'string' && work.studentName.trim()
      ? work.studentName.trim()
      : studentNameById.get(studentId) || '匿名作者';

    return [{
      id: typeof work.id === 'string' && work.id.trim() ? work.id.trim() : `${studentId}-${workIndex}`,
      url,
      coverUrl,
      createdAt: typeof work.createdAt === 'string' && work.createdAt.trim()
        ? work.createdAt.trim()
        : new Date(0).toISOString(),
      designerName: studentName,
      submissionId: studentId,
    }];
  });
}

export async function fetchWorks() {
  const response = await fetch(`${REVIEW_API_BASE}/api/bootstrap`);
  const bootstrap = await parseResponse<ReviewBootstrapResponse | ReviewBootstrapWork[]>(response);
  return normalizeReviewWorks(bootstrap).slice(0, 100);
}

export async function fetchSubmissions() {
  const response = await fetch(`${API_BASE}/api/submissions`);
  return parseResponse<DesignerSubmission[]>(response);
}

export async function createSubmission(formData: FormData) {
  const response = await fetch(`${API_BASE}/api/submissions`, {
    method: 'POST',
    body: formData,
  });
  return parseResponse<DesignerSubmission>(response);
}

export async function deleteSubmission(id: string) {
  const response = await fetch(`${API_BASE}/api/submissions?id=${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  return parseResponse<{ ok: true }>(response);
}
