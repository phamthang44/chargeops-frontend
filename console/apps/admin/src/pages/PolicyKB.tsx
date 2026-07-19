import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDateVn, useApi, type PolicyDoc } from '@chargeops/api';
import { Card, EmptyState, IconPlusCircle, PageHeader, SearchInput, Skeleton, useToast } from '@chargeops/ui';
import { DocModal } from '../features/kb/DocModal';

/** FR15 — admin CRUD over the policy knowledge base that powers the RAG assistant. */
export function PolicyKB() {
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PolicyDoc | null>(null);

  const { data, isLoading, error } = useQuery({ queryKey: ['policies'], queryFn: () => api.policies.docs() });

  const save = useMutation({
    mutationFn: (input: { id?: string; category: string; content: string }) => api.policies.save(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['policies'] });
      toast('Đã lưu & tái tạo embedding', 'success');
      setModalOpen(false);
      setEditing(null);
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.policies.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['policies'] });
      toast('Đã xóa tài liệu', 'success');
    },
    onError: (e) => toast((e as Error).message, 'error'),
  });

  const all = data ?? [];
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of all) map.set(d.category, (map.get(d.category) ?? 0) + 1);
    return [...map.entries()].map(([label, count]) => ({ label, count }));
  }, [all]);

  const q = search.trim().toLowerCase();
  const docs = all.filter(
    (d) => (category === 'all' || d.category === category) && (!q || d.content.toLowerCase().includes(q)),
  );

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (d: PolicyDoc) => {
    setEditing(d);
    setModalOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Kho chính sách"
        subtitle="Nguồn tri thức cho trợ lý chính sách (RAG)."
        action={
          <button
            onClick={openCreate}
            className="flex items-center gap-[7px] rounded-ctl bg-brand px-[15px] py-[9px] text-[13px] font-semibold text-white hover:bg-brand-strong"
          >
            <IconPlusCircle size={16} strokeWidth={2} />
            Thêm tài liệu
          </button>
        }
      />

      {error ? (
        <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
          Không tải được kho chính sách: {(error as Error).message}
        </Card>
      ) : isLoading || !data ? (
        <Skeleton className="h-[420px] rounded-card" />
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[240px_1fr]">
          {/* sidebar */}
          <div className="flex flex-col gap-[13px]">
            <Card className="p-[13px]">
              <div className="mb-[11px] flex gap-[9px]">
                <div className="flex-1 rounded-[9px] border border-line-3 px-[11px] py-[9px] text-center">
                  <div className="text-[18px] font-bold text-brand">{all.length}</div>
                  <div className="font-mono text-[9.5px] text-faint">TÀI LIỆU</div>
                </div>
                <div className="flex-1 rounded-[9px] border border-line-3 px-[11px] py-[9px] text-center">
                  <div className="text-[18px] font-bold">{categories.length}</div>
                  <div className="font-mono text-[9.5px] text-faint">DANH MỤC</div>
                </div>
              </div>
              <div className="flex items-center gap-[7px] rounded-lg bg-good-soft px-2.5 py-2 text-[11px] font-medium text-good-deep">
                <span className="h-[7px] w-[7px] rounded-full bg-good" />
                Embedding đồng bộ · cập nhật 29/06
              </div>
            </Card>
            <Card className="p-[9px]">
              <div className="px-[9px] pb-[5px] pt-[7px] font-mono text-[9px] font-semibold tracking-[0.06em] text-ghost">
                DANH MỤC
              </div>
              <CatItem label="Tất cả" count={all.length} active={category === 'all'} onClick={() => setCategory('all')} />
              {categories.map((c) => (
                <CatItem
                  key={c.label}
                  label={c.label}
                  count={c.count}
                  active={category === c.label}
                  onClick={() => setCategory(c.label)}
                />
              ))}
            </Card>
          </div>

          {/* doc list */}
          <div>
            <div className="mb-[13px]">
              <SearchInput value={search} onChange={setSearch} placeholder="Tìm trong nội dung chính sách…" className="w-full" />
            </div>
            {docs.length === 0 ? (
              <Card>
                <EmptyState>Không có tài liệu nào khớp.</EmptyState>
              </Card>
            ) : (
              <div className="flex flex-col gap-[11px]">
                {docs.map((d) => (
                  <Card key={d.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="mb-[7px] flex items-center gap-[9px]">
                          <span className="font-mono text-[10.5px] font-semibold text-brand">{d.id}</span>
                          <span className="rounded-full bg-line-3 px-[9px] py-0.5 text-[10px] font-semibold text-muted">
                            {d.category}
                          </span>
                          <span className="font-mono text-[10.5px] text-ghost">cập nhật {formatDateVn(d.updatedAt)}</span>
                        </div>
                        <div className="text-[13px] leading-[1.55]">{d.content}</div>
                      </div>
                      <div className="flex shrink-0 gap-1.5">
                        <button
                          onClick={() => openEdit(d)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-body hover:bg-canvas"
                          aria-label="Sửa"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => remove.mutate(d.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-bad-border bg-bad-soft text-bad hover:brightness-95"
                          aria-label="Xóa"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <DocModal
        open={modalOpen}
        doc={editing}
        pending={save.isPending}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={(input) => save.mutate(input)}
      />
    </>
  );
}

function CatItem({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`mb-px flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[12.5px] ${
        active ? 'bg-brand-soft font-semibold text-brand' : 'font-medium text-body hover:bg-canvas'
      }`}
    >
      <span>{label}</span>
      <span className="font-mono text-[10.5px] opacity-70">{count}</span>
    </button>
  );
}
