// GitHub 레포 _db/ 폴더에서 JSON 데이터 읽기
const REPO_RAW = 'https://raw.githubusercontent.com/choichoi3227-crypto/cp-ee6eeae3/main';

export const PLAN_LIMITS = {
  storage_gb: 36,
  traffic_gb: 100,
  custom_domain: true,
  backups: true,
};

async function fetchDb<T>(file: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(`${REPO_RAW}/_db/${file}`, { cache: 'no-store' });
    if (!res.ok) return fallback;
    return await res.json() as T;
  } catch { return fallback; }
}

export type Post = {
  id: number; slug: string; title: string; description?: string;
  status: 'publish' | 'draft'; author: string; categories: string[];
  tags: string[]; created_at: string; updated_at: string; content_file?: string;
};

export type SiteSettings = {
  site_name: string; site_url: string; site_description: string;
  admin_email: string; posts_per_page: number; theme: string;
  timezone: string; language: string;
};

export async function getPosts(status = 'publish'): Promise<Post[]> {
  const posts = await fetchDb<Post[]>('posts.json', []);
  return posts
    .filter(p => status === 'all' || p.status === status)
    .sort((a, b) => new Date(b.created_at).valueOf() - new Date(a.created_at).valueOf());
}

export async function getPost(slug: string): Promise<Post | null> {
  const posts = await fetchDb<Post[]>('posts.json', []);
  return posts.find(p => p.slug === slug) ?? null;
}

export async function getSettings(): Promise<SiteSettings> {
  return fetchDb<SiteSettings>('settings.json', {
    site_name: '테스트',
    site_url: '', site_description: '', admin_email: '',
    posts_per_page: 10, theme: 'default', timezone: 'Asia/Seoul', language: 'ko',
  });
}

export async function getCategories() { return fetchDb<any[]>('categories.json', []); }
export async function getTags() { return fetchDb<any[]>('tags.json', []); }

export async function getPostContent(slug: string): Promise<string> {
  try {
    const res = await fetch(`${REPO_RAW}/_content/posts/${slug}.md`);
    if (!res.ok) return '';
    return (await res.text()).replace(/^---[\s\S]*?---\n?/, '').trim();
  } catch { return ''; }
}
