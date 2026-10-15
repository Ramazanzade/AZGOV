import { useParams, Link } from 'react-router-dom';
import { ChevronRight, FolderOpen, FileText, Home } from 'lucide-react';
import { useCategoryTree } from '../hooks/useCategoryTree';
import { useGroupedNavigation } from '../hooks/useGroupedNavigation';
import { useEffect, useState } from 'react';
const BrowsePage = () => {
  const { group: groupId, category: categoryId } = useParams();
  const { data: roots, loading } = useCategoryTree();
  const { groups } = useGroupedNavigation();

  const currentGroup = groups.find(g => g.id === groupId);

  // Seçilmiş kateqoriyanı tap (rekursiv)
  const findNode = (nodes: any[], id: number): any => {
    for (const n of nodes) {
      if (n.id === id) return n;
      if (n.children?.length) {
        const found = findNode(n.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const currentCategory = categoryId
    ? findNode(roots, Number(categoryId))
    : null;
// Kateqoriyaya aid datasetlər
const [datasets, setDatasets] = useState<any[]>([]);
const [datasetsLoading, setDatasetsLoading] = useState(false);

useEffect(() => {
  if (!currentCategory || !currentCategory.path) {
    setDatasets([]);
    return;
  }

  const base = (import.meta as any).env?.VITE_API_URL || '';
  const params = new URLSearchParams({
    categoryPath: currentCategory.path,
    rows: '500',
  });

  setDatasetsLoading(true);
  fetch(`${base}/api/opendataRoutes/datasets?${params.toString()}`)
    .then(r => r.json())
    .then(json => setDatasets(Array.isArray(json) ? json : []))
    .catch(() => setDatasets([]))
    .finally(() => setDatasetsLoading(false));
}, [currentCategory?.path]);
  // ---------- SƏHİFƏ 1: /browse (qrup seçilməyib) ----------
  if (!groupId) {
    return (
      <div className="p-6 overflow-y-auto h-full">
        <h1 className="text-2xl font-bold mb-1">Məlumat Kateqoriyaları</h1>
        <p className="text-sm text-gray-400 mb-6">
          {loading ? 'Yüklənir...' : `${groups.length} əsas qrup`}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {groups.map(g => (
            <Link
              key={g.id}
              to={`/browse/${g.id}`}
              className="rounded-xl bg-bg-card border border-border p-5 hover:border-accent-cyan/50 hover:bg-bg-hover transition-all"
            >
              <FolderOpen size={28} className="text-accent-cyan mb-3" />
              <div className="text-sm font-semibold">{g.label}</div>
              <div className="text-[11px] text-gray-500 mt-1">
                {g.categories.length} kateqoriya
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // ---------- SƏHİFƏ 2: /browse/:group (kateqoriya seçilməyib) ----------
  if (!categoryId) {
    if (!currentGroup) {
      return (
        <div className="p-6">
          <p className="text-gray-400">Qrup tapılmadı.</p>
          <Link to="/browse" className="text-accent-cyan text-sm">← Geri</Link>
        </div>
      );
    }
    return (
      <div className="p-6 overflow-y-auto h-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4">
          <Link to="/browse" className="hover:text-accent-cyan flex items-center gap-1">
            <Home size={12} /> Ana
          </Link>
          <ChevronRight size={12} />
          <span className="text-gray-300">{currentGroup.label}</span>
        </div>

        <h1 className="text-2xl font-bold mb-1">{currentGroup.label}</h1>
        <p className="text-sm text-gray-400 mb-6">
          {currentGroup.categories.length} kateqoriya
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentGroup.categories.map(cat => (
            <Link
              key={cat.id}
              to={`/browse/${groupId}/${cat.id}`}
              className="rounded-xl bg-bg-card border border-border p-5 hover:border-accent-cyan/50 hover:bg-bg-hover transition-all"
            >
              <FolderOpen size={24} className="text-accent-purple mb-3" />
              <div className="text-sm font-semibold leading-tight">
                {cat.name.replace(/^\d+\s*/, '')}
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                {cat.children.length} alt-kateqoriya
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // ---------- SƏHİFƏ 3: /browse/:group/:category ----------
  if (!currentCategory) {
    return (
      <div className="p-6">
        <p className="text-gray-400">Kateqoriya tapılmadı.</p>
        <Link to={`/browse/${groupId}`} className="text-accent-cyan text-sm">
          ← {currentGroup?.label}
        </Link>
      </div>
    );
  }

  const hasSubcategories = currentCategory.children && currentCategory.children.length > 0;

  return (
    <div className="p-6 overflow-y-auto h-full">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 flex-wrap">
        <Link to="/browse" className="hover:text-accent-cyan flex items-center gap-1">
          <Home size={12} /> Ana
        </Link>
        <ChevronRight size={12} />
        <Link to={`/browse/${groupId}`} className="hover:text-accent-cyan">
          {currentGroup?.label}
        </Link>
        <ChevronRight size={12} />
        <span className="text-gray-300">
          {currentCategory.name.replace(/^\d+\s*/, '')}
        </span>
      </div>

      <h1 className="text-2xl font-bold mb-1">
        {currentCategory.name.replace(/^\d+\s*/, '')}
      </h1>
      <p className="text-sm text-gray-400 mb-6">
        {hasSubcategories
          ? `${currentCategory.children.length} alt-kateqoriya`
          : 'Datasetlər bu kateqoriyada'}
      </p>

      {/* Alt-kateqoriyalar */}
      {hasSubcategories && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {currentCategory.children.map((child: any) => (
            <Link
              key={child.id}
              to={`/browse/${groupId}/${child.id}`}
              className="rounded-xl bg-bg-card border border-border p-4 hover:border-accent-cyan/50 hover:bg-bg-hover transition-all"
            >
              <FileText size={20} className="text-accent-cyan mb-2" />
              <div className="text-[13px] font-medium leading-tight">
                {child.name}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Datasetlər üçün yer — sonrakı addımda doldurulacaq */}
      {/* Datasetlər */}
{datasetsLoading && (
  <div className="text-center py-8 text-gray-500 text-sm">
    Datasetlər yüklənir...
  </div>
)}

{!datasetsLoading && datasets.length === 0 && (
  <div className="text-center py-16 text-gray-500 text-sm border border-dashed border-border rounded-xl">
    Bu kateqoriyada dataset tapılmadı.
  </div>
)}

{!datasetsLoading && datasets.length > 0 && (
  <>
    <div className="text-xs text-gray-500 mb-3">
      {datasets.length} dataset tapıldı
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {datasets.map(d => (
        <Link
          key={d.id}
          to={`/dataset/${d.id}`}
          className="rounded-lg bg-bg-card border border-border p-4 hover:border-accent-cyan/50 hover:bg-bg-hover transition-all"
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-cyan/10 text-accent-cyan font-medium">
              {d.format}
            </span>
          </div>
          <div className="text-[13px] font-medium text-gray-200 line-clamp-3">
            {d.title}
          </div>
        </Link>
      ))}
    </div>
  </>
)}
    </div>
  );
};

export default BrowsePage;