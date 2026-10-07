import { niceName } from '../../utils/columnLabels';
import { useLang } from '../../i18n/LanguageContext';

interface Props { data: any[] }

const TableRenderer = ({ data }: Props) => {
      const { t } = useLang();   // ← burada, komponentin içində

  if (!Array.isArray(data) || data.length === 0) {
    return <div className="text-gray-500 text-sm p-4">{t('detail.noData')}</div>;
  }

  const columns = Object.keys(data[0]);
  const rows = data.slice(0, 200);

  return (
    <div className="overflow-auto max-h-[70vh] rounded-lg border border-border">
      <table className="w-full text-xs">
        <thead className="bg-bg-primary sticky top-0 z-10">
          <tr>
            {columns.map(col => (
              <th
                key={col}
                className="text-left px-3 py-2.5 font-semibold text-gray-200 border-b border-border whitespace-nowrap"
                title={col} // hover-da orijinal adı göstər
              >
                {niceName(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-bg-hover/50">
              {columns.map(col => (
                <td
                  key={col}
                  className="px-3 py-1.5 text-gray-400 border-b border-border/50 whitespace-nowrap"
                >
                  {String(row[col] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 200 && (
        <div className="p-2 text-center text-[10px] text-gray-500 bg-bg-primary">
          {t('home.um')} {data.length}
        </div>
      )}
    </div>
  );
};

export default TableRenderer;