import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  formatDateVn,
  useApi,
  type LegalDocType,
  type LegalDocumentDetail,
  type LegalDocumentSummary,
} from '@chargeops/api';
import {
  Button,
  Card,
  EmptyState,
  IconArrowRight,
  IconBook,
  IconCheck,
  IconClock,
  IconCopy,
  IconHome,
  IconInfoCircle,
  IconSearch,
  IconShieldCheck,
  IconTag,
  IconUsers,
  PageHeader,
  SearchInput,
  Skeleton,
  useToast,
} from '@chargeops/ui';
import { PolicyMarkdownViewer } from '../../shared/components/PolicyMarkdownViewer';

const DOC_TYPE_LABELS: Record<LegalDocType, string> = {
  TERMS_OF_SERVICE: 'Điều khoản dịch vụ',
  PRIVACY_POLICY: 'Chính sách bảo mật',
  LICENSE_AGREEMENT: 'Thỏa thuận License B2B',
  OPERATIONAL_REGULATION: 'Quy chế vận hành',
};

export function LegalPolicies() {
  const api = useApi();
  const toast = useToast();
  const [searchInput, setSearchInput] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');
  const [selectedSlug, setSelectedSlug] = useState<string>('station-owner-license-agreement');
  const [inDocSearch, setInDocSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<'all' | 'license' | 'operation' | 'general'>('all');

  // Fetch list of documents for Owner - only queries when committedSearch changes on Submit/Enter
  const { data: listData, isLoading: listLoading, isFetching: listFetching } = useQuery({
    queryKey: ['owner-legal-documents', committedSearch],
    queryFn: () =>
      api.legalDocuments.list({
        audience: 'OWNER',
        search: committedSearch.trim() || undefined,
      }),
  });

  const handleTriggerSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    setCommittedSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setCommittedSearch('');
  };

  const allDocs = listData?.items ?? [];

  // Group filter
  const filteredDocs = useMemo(() => {
    if (selectedGroup === 'all') return allDocs;
    if (selectedGroup === 'license') {
      return allDocs.filter((d) => d.docType === 'LICENSE_AGREEMENT' || d.slug.includes('license'));
    }
    if (selectedGroup === 'operation') {
      return allDocs.filter(
        (d) =>
          d.slug.includes('equipment') ||
          d.slug.includes('staff') ||
          d.slug.includes('incident') ||
          d.slug.includes('payout'),
      );
    }
    return allDocs.filter(
      (d) =>
        d.slug === 'terms-of-service' ||
        d.slug === 'privacy-policy' ||
        d.slug === 'operational-regulations',
    );
  }, [allDocs, selectedGroup]);

  // Default select first doc if selectedSlug not in filtered list
  const activeSlug = useMemo(() => {
    if (filteredDocs.some((d) => d.slug === selectedSlug)) return selectedSlug;
    return filteredDocs[0]?.slug ?? 'station-owner-license-agreement';
  }, [filteredDocs, selectedSlug]);

  // Fetch full detail of active document
  const { data: activeDoc, isLoading: docLoading } = useQuery({
    queryKey: ['legal-document-detail', activeSlug],
    queryFn: () => api.legalDocuments.get(activeSlug),
    enabled: Boolean(activeSlug),
  });

  return (
    <>
      <PageHeader
        title="Chính sách & Quy định Nền tảng"
        subtitle="Kho văn kiện pháp lý và quy chuẩn vận hành chính thức dành cho Chủ trạm sạc: cấp phép License B2B, quản lý trụ sạc, phân quyền nhân viên và chi trả doanh thu."
      />

      <div className="grid items-start gap-5 lg:grid-cols-[330px_1fr]">
        {/* Left Sidebar: Topic Filter + Document Selector */}
        <div className="flex flex-col gap-3">
          {/* Quick Search with explicit search button & Enter trigger */}
          <form onSubmit={handleTriggerSearch} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <SearchInput
                  value={searchInput}
                  onChange={setSearchInput}
                  placeholder="Tìm theo tiêu đề, từ khóa..."
                  accent="owner"
                  className="w-full"
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="shrink-0 gap-1 px-3 py-2 font-medium"
                disabled={listFetching}
                title="Tìm kiếm tài liệu"
              >
                <IconSearch size={14} />
                <span>Tìm</span>
              </Button>
            </div>
            {(searchInput || committedSearch) && (
              <div className="flex items-center justify-between px-1 text-[11.5px]">
                <span className="truncate text-muted">
                  {committedSearch ? (
                    <>Đang lọc: <strong className="font-semibold text-ink">{committedSearch}</strong></>
                  ) : (
                    <span>Nhấn Tìm để tra cứu</span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="shrink-0 font-semibold text-owner hover:underline"
                >
                  Xóa lọc
                </button>
              </div>
            )}
          </form>

          {/* Group Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1">
            <button
              onClick={() => setSelectedGroup('all')}
              className={`rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition ${
                selectedGroup === 'all'
                  ? 'bg-ink text-surface shadow-xs'
                  : 'text-muted hover:bg-canvas hover:text-ink'
              }`}
            >
              Tất cả ({allDocs.length})
            </button>
            <button
              onClick={() => setSelectedGroup('license')}
              className={`rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition ${
                selectedGroup === 'license'
                  ? 'bg-ink text-surface shadow-xs'
                  : 'text-muted hover:bg-canvas hover:text-ink'
              }`}
            >
              License B2B
            </button>
            <button
              onClick={() => setSelectedGroup('operation')}
              className={`rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition ${
                selectedGroup === 'operation'
                  ? 'bg-ink text-surface shadow-xs'
                  : 'text-muted hover:bg-canvas hover:text-ink'
              }`}
            >
              Vận hành
            </button>
            <button
              onClick={() => setSelectedGroup('general')}
              className={`rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition ${
                selectedGroup === 'general'
                  ? 'bg-ink text-surface shadow-xs'
                  : 'text-muted hover:bg-canvas hover:text-ink'
              }`}
            >
              Chung
            </button>
          </div>

          {/* Document list cards */}
          <div className="flex flex-col gap-2">
            {listLoading ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
                <Skeleton className="h-16 rounded-xl" />
              </div>
            ) : filteredDocs.length === 0 ? (
              <Card className="p-4 text-center text-[12.5px] text-muted">
                Không tìm thấy tài liệu phù hợp
              </Card>
            ) : (
              filteredDocs.map((d) => {
                const isSelected = d.slug === activeSlug;
                const isOwnerDoc = d.targetAudience === 'OWNER';

                return (
                  <button
                    key={d.slug}
                    onClick={() => {
                      setSelectedSlug(d.slug);
                      setInDocSearch('');
                    }}
                    className={`group relative flex w-full items-start justify-between rounded-xl p-3.5 text-left transition ${
                      isSelected
                        ? 'border-2 border-owner bg-owner-soft shadow-xs'
                        : 'border border-line bg-surface hover:border-line-2 hover:bg-surface-2'
                    }`}
                  >
                    <div className="flex-1 pr-2">
                      <div className="mb-1 flex items-center gap-1.5">
                        <span
                          className={`rounded px-1.5 py-0.2 font-mono text-[9.5px] font-bold ${
                            isSelected ? 'bg-owner/20 text-owner-deep' : 'bg-chip text-muted'
                          }`}
                        >
                          {DOC_TYPE_LABELS[d.docType]}
                        </span>
                        {isOwnerDoc && (
                          <span className="rounded bg-emerald-100 px-1 py-0.2 text-[9px] font-bold text-emerald-800">
                            Chủ trạm
                          </span>
                        )}
                        <span className="font-mono text-[9.5px] text-ghost">v{d.version}</span>
                      </div>

                      <div
                        className={`text-[13px] font-bold leading-snug transition ${
                          isSelected ? 'text-owner-deep' : 'text-ink group-hover:text-owner'
                        }`}
                      >
                        {d.title}
                      </div>

                      <p className="mt-1 line-clamp-1 text-[11.5px] leading-relaxed text-muted">
                        {d.summary}
                      </p>
                    </div>

                    <IconArrowRight
                      size={15}
                      className={`mt-2 shrink-0 transition ${
                        isSelected ? 'text-owner-deep translate-x-0.5' : 'text-faint group-hover:text-body'
                      }`}
                    />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Viewer */}
        <div>
          {docLoading || !activeDoc ? (
            <Skeleton className="h-[600px] rounded-2xl" />
          ) : (
            <div className="flex flex-col gap-4">
              {/* Document Overview Header Card */}
              <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-owner-soft px-2.5 py-0.5 font-mono text-[11px] font-bold text-owner-deep">
                    <IconTag size={12} />
                    {DOC_TYPE_LABELS[activeDoc.docType]}
                  </span>
                  <span className="rounded-md bg-chip px-2 py-0.5 text-[11px] font-medium text-body">
                    {activeDoc.targetAudience === 'OWNER' ? 'Áp dụng cho Chủ trạm' : 'Toàn hệ thống'}
                  </span>
                  <span className="rounded-md border border-line bg-canvas px-2 py-0.5 font-mono text-[10.5px] text-muted">
                    v{activeDoc.version}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-good-soft px-2 py-0.5 text-[10px] font-bold text-good-deep">
                    <span className="h-1.5 w-1.5 rounded-full bg-good" />
                    Hiệu lực
                  </span>
                  <span className="text-[11.5px] text-ghost">
                    Cập nhật: {formatDateVn(activeDoc.updatedAt)}
                  </span>
                </div>

                {activeDoc.eyebrow && (
                  <div className="text-[12px] font-semibold uppercase tracking-wider text-owner">
                    {activeDoc.eyebrow}
                  </div>
                )}
                <h1 className="text-[23px] font-extrabold text-ink">{activeDoc.title}</h1>

                {activeDoc.summary && (
                  <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-owner-border bg-owner-soft/50 p-3.5 text-[13px] leading-relaxed text-owner-deep">
                    <IconInfoCircle size={16} className="mt-0.5 shrink-0 text-owner" />
                    <div>{activeDoc.summary}</div>
                  </div>
                )}
              </div>

              {/* In-Document Search Input */}
              <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2 shadow-xs">
                <IconSearch size={16} className="text-muted shrink-0" />
                <input
                  type="text"
                  value={inDocSearch}
                  onChange={(e) => setInDocSearch(e.target.value)}
                  placeholder="Tra cứu từ khóa trong nội dung văn bản này (In-document search)..."
                  className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted"
                />
                {inDocSearch && (
                  <button
                    onClick={() => setInDocSearch('')}
                    className="rounded-md px-2 py-0.5 text-[11px] font-medium text-muted hover:bg-canvas"
                  >
                    Xóa
                  </button>
                )}
              </div>

              {/* Policy Markdown Viewer with Table of Contents */}
              <PolicyMarkdownViewer
                content={activeDoc.content}
                searchQuery={inDocSearch}
                showToc={true}
                onCopySuccess={() => toast('Đã chép mã nguồn Markdown vào clipboard', 'success')}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
