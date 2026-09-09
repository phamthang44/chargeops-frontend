import { useTranslation } from 'react-i18next';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  formatDateVn,
  useApi,
  type LegalDocType,
  type LegalDocumentDetail,
  type LegalDocumentSummary,
  type TargetAudience,
} from '@chargeops/api';
import {
  Button,
  Card,
  EmptyState,
  IconArrowRight,
  IconBolt,
  IconBook,
  IconCheck,
  IconClock,
  IconCopy,
  IconEdit,
  IconHome,
  IconInfoCircle,
  IconPlusCircle,
  IconRefreshCw,
  IconSearch,
  IconShieldCheck,
  IconTag,
  IconTrash,
  IconUsers,
  IconX,
  Modal,
  PageHeader,
  Select,
  type SelectOption,
  Skeleton,
  useToast,
} from '@chargeops/ui';
import { PolicyMarkdownViewer } from '../../shared/components/PolicyMarkdownViewer';

const DOC_TYPE_LABELS: Record<LegalDocType, string> = {
  TERMS_OF_SERVICE: 'Điều khoản dịch vụ',
  PRIVACY_POLICY: 'Chính sách bảo mật',
  LICENSE_AGREEMENT: 'Thỏa thuận License',
  OPERATIONAL_REGULATION: 'Quy chế vận hành',
};

const AUDIENCE_LABELS: Record<TargetAudience, string> = {
  ALL: 'Toàn hệ thống (ALL)',
  DRIVER: 'Tài xế (DRIVER)',
  OWNER: 'Chủ trạm (OWNER)',
};

const DOC_TYPE_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Tất cả loại văn bản' },
  { value: 'TERMS_OF_SERVICE', label: 'Điều khoản dịch vụ' },
  { value: 'PRIVACY_POLICY', label: 'Chính sách bảo mật' },
  { value: 'LICENSE_AGREEMENT', label: 'Thỏa thuận License' },
  { value: 'OPERATIONAL_REGULATION', label: 'Quy chế vận hành' },
];

const AUDIENCE_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Tất cả đối tượng' },
  { value: 'ALL', label: 'Toàn hệ thống (ALL)' },
  { value: 'OWNER', label: 'Chủ trạm (OWNER)' },
  { value: 'DRIVER', label: 'Tài xế (DRIVER)' },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: 'active', label: 'Đang hiệu lực' },
  { value: 'inactive', label: 'Bản nháp / Ẩn' },
];

const FORM_DOC_TYPE_OPTIONS: SelectOption[] = [
  { value: 'TERMS_OF_SERVICE', label: 'Điều khoản dịch vụ' },
  { value: 'PRIVACY_POLICY', label: 'Chính sách bảo mật' },
  { value: 'LICENSE_AGREEMENT', label: 'Thỏa thuận License' },
  { value: 'OPERATIONAL_REGULATION', label: 'Quy chế vận hành' },
];

const FORM_AUDIENCE_OPTIONS: SelectOption[] = [
  { value: 'ALL', label: 'Toàn hệ thống (ALL)' },
  { value: 'OWNER', label: 'Chủ trạm (OWNER)' },
  { value: 'DRIVER', label: 'Tài xế (DRIVER)' },
];

type CategoryTab = 'all' | 'foundation' | 'booking' | 'hardware' | 'license';

const CATEGORY_TABS: { id: CategoryTab; label: string; countPredicate: (slug: string) => boolean }[] = [
  {
    id: 'all',
    label: 'Tất cả văn bản',
    countPredicate: () => true,
  },
  {
    id: 'foundation',
    label: 'Pháp lý nền tảng',
    countPredicate: (slug) =>
      ['terms-of-service', 'privacy-policy', 'operational-regulations'].includes(slug),
  },
  {
    id: 'booking',
    label: 'Đặt chỗ & Biểu giá',
    countPredicate: (slug) =>
      [
        'booking-time-and-availability',
        'time-package-pricing-policy',
        'cancellation-and-refund-policy',
        'payment-reconciliation-policy',
      ].includes(slug),
  },
  {
    id: 'hardware',
    label: 'Vận hành & Phần cứng',
    countPredicate: (slug) =>
      [
        'qr-check-in-and-no-show-policy',
        'station-incident-and-support-policy',
        'station-discovery-and-eligibility-policy',
        'station-equipment-operation-policy',
      ].includes(slug),
  },
  {
    id: 'license',
    label: 'Chủ trạm & License',
    countPredicate: (slug) =>
      [
        'station-owner-license-agreement',
        'license-lifecycle-and-renewal-policy',
        'station-staff-access-policy',
        'owner-payout-and-adjustment-policy',
      ].includes(slug),
  },
];

export function PolicyKB() {
  const { t } = useTranslation('admin');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<CategoryTab>('all');
  
  // Search state: searchInput is controlled locally, committedSearch triggers the query on button click/Enter
  const [searchInput, setSearchInput] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');

  // Dropdown states
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedAudience, setSelectedAudience] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [activeDoc, setActiveDoc] = useState<LegalDocumentDetail | null>(null);

  // In-document preview search
  const [inDocSearch, setInDocSearch] = useState('');

  // Form state for Create / Edit
  const [formSlug, setFormSlug] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formEyebrow, setFormEyebrow] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formVersion, setFormVersion] = useState('4.9.0');
  const [formDocType, setFormDocType] = useState<LegalDocType>('TERMS_OF_SERVICE');
  const [formAudience, setFormAudience] = useState<TargetAudience>('ALL');
  const [formActive, setFormActive] = useState(true);
  const [formKeywords, setFormKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [editorTab, setEditorTab] = useState<'write' | 'preview' | 'split'>('write');

  const handleAddKeyword = (kwToAdd?: string) => {
    const text = (kwToAdd ?? keywordInput).trim().replace(/\s+/g, ' ');
    if (!text) return;
    if (!formKeywords.some((k) => k.toLowerCase() === text.toLowerCase())) {
      if (formKeywords.length >= 30) {
        toast('Tối đa 30 từ khóa cho mỗi văn kiện', 'info');
        return;
      }
      setFormKeywords([...formKeywords, text]);
    }
    setKeywordInput('');
  };

  const handleRemoveKeyword = (indexToRemove: number) => {
    setFormKeywords(formKeywords.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleTriggerSearch = () => {
    setCommittedSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setCommittedSearch('');
  };

  // Fetch admin legal documents list - only refetches when committedSearch or selects change
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['admin-legal-documents', committedSearch, selectedType, selectedAudience],
    queryFn: () =>
      api.legalDocuments.adminList({
        search: committedSearch || undefined,
        docType: selectedType !== 'all' ? (selectedType as LegalDocType) : undefined,
        audience: selectedAudience !== 'all' ? (selectedAudience as TargetAudience) : undefined,
      }),
  });

  const allDocs = data?.items ?? [];

  // Filtered by category tab and status
  const filteredDocs = useMemo(() => {
    return allDocs.filter((doc) => {
      // Category tab
      const currentTabDef = CATEGORY_TABS.find((t) => t.id === activeTab);
      if (currentTabDef && !currentTabDef.countPredicate(doc.slug)) {
        return false;
      }
      // Status filter
      if (selectedStatus === 'active' && !doc.active) return false;
      if (selectedStatus === 'inactive' && doc.active) return false;
      return true;
    });
  }, [allDocs, activeTab, selectedStatus]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (payload: { id?: string }) => {
      if (payload.id) {
        return api.legalDocuments.adminUpdate(payload.id, {
          title: formTitle.trim(),
          eyebrow: formEyebrow.trim(),
          summary: formSummary.trim(),
          content: formContent.trim(),
          version: formVersion.trim(),
          targetAudience: formAudience,
          keywords: formKeywords,
          active: formActive,
        });
      } else {
        return api.legalDocuments.adminCreate({
          slug: formSlug.trim().toLowerCase(),
          docType: formDocType,
          targetAudience: formAudience,
          title: formTitle.trim(),
          eyebrow: formEyebrow.trim(),
          summary: formSummary.trim(),
          content: formContent.trim(),
          version: formVersion.trim(),
          keywords: formKeywords,
          active: formActive,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-legal-documents'] });
      toast('Đã lưu văn kiện pháp lý thành công', 'success');
      setEditModalOpen(false);
      resetForm();
    },
    onError: (e: any) => toast(e.message || 'Lỗi khi lưu tài liệu', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.legalDocuments.adminRemove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-legal-documents'] });
      toast('Đã xóa mềm văn kiện pháp lý thành công', 'success');
    },
    onError: (e: any) => toast(e.message || 'Lỗi khi xóa tài liệu', 'error'),
  });

  const resetForm = () => {
    setActiveDoc(null);
    setFormSlug('');
    setFormTitle('');
    setFormEyebrow('');
    setFormSummary('');
    setFormContent('');
    setFormVersion('4.9.0');
    setFormDocType('TERMS_OF_SERVICE');
    setFormAudience('ALL');
    setFormActive(true);
    setFormKeywords([]);
    setKeywordInput('');
    setEditorTab('write');
  };

  const openCreate = () => {
    resetForm();
    setEditModalOpen(true);
  };

  const openEdit = async (doc: LegalDocumentSummary) => {
    try {
      const detail = await api.legalDocuments.adminGet(doc.id);
      setActiveDoc(detail);
      setFormSlug(detail.slug);
      setFormTitle(detail.title);
      setFormEyebrow(detail.eyebrow || '');
      setFormSummary(detail.summary || '');
      setFormContent(detail.content);
      setFormVersion(detail.version);
      setFormDocType(detail.docType);
      setFormAudience(detail.targetAudience);
      setFormActive(detail.active);
      setFormKeywords(detail.keywords || []);
      setKeywordInput('');
      setEditorTab('write');
      setEditModalOpen(true);
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const openPreview = async (doc: LegalDocumentSummary) => {
    try {
      const detail = await api.legalDocuments.adminGet(doc.id);
      setActiveDoc(detail);
      setInDocSearch('');
      setPreviewModalOpen(true);
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  // Auto-generate slug helper
  const handleTitleChange = (val: string) => {
    setFormTitle(val);
    if (!activeDoc && !formSlug) {
      const generated = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormSlug(generated);
    }
  };

  // Quick insertion helpers for Markdown Editor
  const insertMarkdown = (prefix: string, suffix = '') => {
    setFormContent((prev) => `${prev}\n${prefix}${suffix}`);
  };

  return (
    <>
      <PageHeader
        title="Kho Văn Bản Nghiệp Vụ & Pháp Lý (SSOT)"
        subtitle="Nguồn dữ liệu chân lý duy nhất (Single Source of Truth) quản lý 15 văn kiện quy chuẩn, biểu phí, vận hành trạm và thỏa thuận License theo SRS v4.9."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<IconRefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />}
              onClick={() => refetch()}
            >
              Làm mới
            </Button>
            <Button icon={<IconPlusCircle size={16} strokeWidth={2} />} onClick={openCreate}>
              Thêm văn kiện mới
            </Button>
          </div>
        }
      />

      {/* KPI Metric Strip */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 shadow-xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <IconBook size={20} />
          </div>
          <div>
            <div className="text-[11.5px] font-medium text-muted">Tổng số văn kiện</div>
            <div className="text-[20px] font-extrabold text-ink">{allDocs.length} tài liệu</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 shadow-xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-good-soft text-good">
            <IconShieldCheck size={20} />
          </div>
          <div>
            <div className="text-[11.5px] font-medium text-muted">Đang hiệu lực</div>
            <div className="text-[20px] font-extrabold text-ink">
              {allDocs.filter((d) => d.active).length} văn bản
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 shadow-xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <IconUsers size={20} />
          </div>
          <div>
            <div className="text-[11.5px] font-medium text-muted">Toàn hệ thống (ALL)</div>
            <div className="text-[20px] font-extrabold text-ink">
              {allDocs.filter((d) => d.targetAudience === 'ALL').length} văn bản
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-4 shadow-xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <IconHome size={20} />
          </div>
          <div>
            <div className="text-[11.5px] font-medium text-muted">Dành cho Chủ trạm</div>
            <div className="text-[20px] font-extrabold text-ink">
              {allDocs.filter((d) => d.targetAudience === 'OWNER').length} văn bản
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <Card className="border-bad-border bg-bad-soft p-5 text-[13px] font-medium text-bad-deep">
          {(error as Error).message}
        </Card>
      ) : isLoading ? (
        <Skeleton className="h-[420px] rounded-2xl" />
      ) : (
        <div className="flex flex-col gap-5">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto border-b border-line pb-2 scrollbar-none">
            {CATEGORY_TABS.map((tab) => {
              const count = allDocs.filter((d) => tab.countPredicate(d.slug)).length;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-medium transition ${
                    isActive
                      ? 'bg-ink text-surface shadow-xs'
                      : 'text-muted hover:bg-surface-2 hover:text-ink'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 font-mono text-[11px] ${
                      isActive ? 'bg-surface/20 text-surface' : 'bg-line text-muted'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filter & Search Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-xs">
            {/* Search Box with explicit action (click or Enter) */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleTriggerSearch();
              }}
              className="flex items-center gap-2 w-full max-w-md"
            >
              <div className="relative flex-1">
                <IconSearch
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
                />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Tìm kiếm theo tiêu đề, slug, tóm tắt..."
                  className="w-full rounded-[10px] border border-line bg-surface py-[9px] pl-9 pr-8 text-[13px] font-medium text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 placeholder:text-faint"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-4 w-4 items-center justify-center text-faint hover:text-ink transition"
                    title="Xóa tìm kiếm"
                  >
                    <IconX size={12} strokeWidth={2.4} />
                  </button>
                )}
              </div>
              <Button type="submit" size="md" variant="secondary" icon={<IconSearch size={14} />}>
                Tìm kiếm
              </Button>
            </form>

            <div className="flex flex-wrap items-center gap-3">
              {/* Type selector with system Select */}
              <div className="flex items-center gap-2 text-[12px]">
                <span className="font-medium text-muted shrink-0">Loại:</span>
                <Select
                  value={selectedType}
                  onChange={setSelectedType}
                  options={DOC_TYPE_OPTIONS}
                  className="w-[185px]"
                />
              </div>

              {/* Audience selector with system Select */}
              <div className="flex items-center gap-2 text-[12px]">
                <span className="font-medium text-muted shrink-0">Đối tượng:</span>
                <Select
                  value={selectedAudience}
                  onChange={setSelectedAudience}
                  options={AUDIENCE_OPTIONS}
                  className="w-[185px]"
                />
              </div>

              {/* Status selector with system Select */}
              <div className="flex items-center gap-2 text-[12px]">
                <span className="font-medium text-muted shrink-0">Trạng thái:</span>
                <Select
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  options={STATUS_OPTIONS}
                  className="w-[155px]"
                />
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-[12.5px] text-muted px-1">
            <span>
              Hiển thị <strong className="text-ink font-semibold">{filteredDocs.length}</strong> /{' '}
              {allDocs.length} văn kiện
            </span>
            {committedSearch && (
              <div className="flex items-center gap-1.5">
                <span>Từ khóa:</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-0.5 font-mono text-[11px] font-semibold text-brand">
                  "{committedSearch}"
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="hover:text-ink ml-0.5"
                    title="Bỏ tìm kiếm"
                  >
                    <IconX size={11} strokeWidth={2.4} />
                  </button>
                </span>
              </div>
            )}
          </div>

          {/* Document Cards Grid */}
          {filteredDocs.length === 0 ? (
            <Card className="p-8">
              <EmptyState>
                Không tìm thấy văn bản pháp lý nào phù hợp với điều kiện tìm kiếm và bộ lọc hiện tại.
              </EmptyState>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredDocs.map((doc) => {
                // Color accent by docType
                const isLicense = doc.docType === 'LICENSE_AGREEMENT';
                const isPrivacy = doc.docType === 'PRIVACY_POLICY';
                const isToS = doc.docType === 'TERMS_OF_SERVICE';

                const badgeBg = isLicense
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : isPrivacy
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : isToS
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200';

                return (
                  <div
                    key={doc.id}
                    className="group relative flex flex-col justify-between gap-4 rounded-2xl border border-line bg-surface p-5 transition duration-200 hover:-translate-y-0.5 hover:border-line-2 hover:shadow-md lg:flex-row lg:items-start"
                  >
                    <div className="flex-1">
                      {/* Top Pills Row */}
                      <div className="mb-2.5 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 font-mono text-[11px] font-bold ${badgeBg}`}
                        >
                          <IconTag size={11} />
                          {DOC_TYPE_LABELS[doc.docType]}
                        </span>

                        <span className="inline-flex items-center gap-1 rounded-lg bg-chip px-2.5 py-0.5 text-[11px] font-medium text-body">
                          {doc.targetAudience === 'OWNER' ? (
                            <IconHome size={11} className="text-emerald-600" />
                          ) : (
                            <IconUsers size={11} className="text-muted" />
                          )}
                          {AUDIENCE_LABELS[doc.targetAudience]}
                        </span>

                        <span className="rounded-lg border border-line bg-canvas px-2 py-0.5 font-mono text-[10.5px] font-semibold text-muted">
                          v{doc.version}
                        </span>

                        {doc.active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-good-soft px-2.5 py-0.5 text-[10.5px] font-bold text-good-deep">
                            <span className="h-1.5 w-1.5 rounded-full bg-good animate-pulse" />
                            Hiệu lực
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-line-3 px-2 py-0.5 text-[10.5px] font-medium text-faint">
                            Bản nháp / Ẩn
                          </span>
                        )}

                        <span className="text-[11px] text-ghost">
                          Hiệu lực từ: {formatDateVn(doc.effectiveFrom)}
                        </span>
                      </div>

                      {/* Eyebrow & Title */}
                      {doc.eyebrow && (
                        <div className="text-[11.5px] font-semibold uppercase tracking-wider text-brand">
                          {doc.eyebrow}
                        </div>
                      )}
                      <h3 className="mb-1 text-[17px] font-bold text-ink group-hover:text-brand transition">
                        {doc.title}
                      </h3>

                      <div className="mb-2.5 flex items-center gap-2">
                        <code className="rounded bg-canvas px-2 py-0.5 font-mono text-[11px] font-semibold text-brand-strong border border-line-2">
                          /{doc.slug}
                        </code>
                      </div>

                      <p className="text-[13px] leading-relaxed text-muted line-clamp-2">
                        {doc.summary}
                      </p>

                      {/* Keywords Badges */}
                      {doc.keywords && doc.keywords.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          <IconTag size={12} className="text-muted shrink-0" />
                          {doc.keywords.slice(0, 5).map((kw, idx) => (
                            <span
                              key={idx}
                              className="rounded-md bg-canvas px-2 py-0.5 font-mono text-[11px] text-body border border-line-2 shadow-2xs"
                            >
                              {kw}
                            </span>
                          ))}
                          {doc.keywords.length > 5 && (
                            <span className="text-[11px] font-medium text-ghost">
                              +{doc.keywords.length - 5} từ khóa
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex shrink-0 items-center gap-2 pt-1 lg:self-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<IconBook size={14} className="text-brand" />}
                        onClick={() => openPreview(doc)}
                      >
                        Đọc toàn văn
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<IconEdit size={14} />}
                        onClick={() => openEdit(doc)}
                      >
                        Sửa
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-bad hover:bg-bad-soft"
                        icon={<IconTrash size={14} />}
                        onClick={() => {
                          if (window.confirm(`Xác nhận xóa mềm tài liệu "${doc.title}"?`)) {
                            deleteMutation.mutate(doc.id);
                          }
                        }}
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reader / Preview Modal */}
      <Modal
        open={previewModalOpen}
        onClose={() => {
          setPreviewModalOpen(false);
          setActiveDoc(null);
        }}
        maxWidth={1080}
      >
        {activeDoc && (
          <div className="flex flex-col gap-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded-md bg-brand-soft px-2 py-0.5 font-mono text-[11px] font-bold text-brand">
                    {DOC_TYPE_LABELS[activeDoc.docType]}
                  </span>
                  <span className="rounded-md bg-chip px-2 py-0.5 text-[11px] font-medium text-body">
                    {AUDIENCE_LABELS[activeDoc.targetAudience]}
                  </span>
                  <span className="font-mono text-[11px] text-muted">v{activeDoc.version}</span>
                </div>
                <h2 className="text-[21px] font-extrabold text-ink">{activeDoc.title}</h2>
                <div className="text-[12px] text-ghost">
                  Slug: <code className="font-mono text-brand">/{activeDoc.slug}</code> · Hiệu lực từ {formatDateVn(activeDoc.effectiveFrom)}
                </div>

                {/* Keywords Tags in Reader Header */}
                {activeDoc.keywords && activeDoc.keywords.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <IconTag size={13} className="text-brand shrink-0" />
                    {activeDoc.keywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="rounded-md bg-brand-soft px-2 py-0.5 font-mono text-[11px] font-semibold text-brand"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* In-document keyword search bar */}
            <div className="flex items-center gap-2.5 rounded-xl border border-line bg-canvas px-3.5 py-2 shadow-xs">
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
                  className="rounded-md px-2 py-0.5 text-[11px] font-medium text-muted hover:bg-line"
                >
                  Xóa
                </button>
              )}
            </div>

            {/* Document Reader Container with Table of Contents */}
            <div className="max-h-[70vh] overflow-y-auto pr-1">
              <PolicyMarkdownViewer
                content={activeDoc.content}
                searchQuery={inDocSearch}
                showToc={true}
                onCopySuccess={() => toast('Đã chép mã nguồn Markdown vào clipboard', 'success')}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Create / Edit Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          resetForm();
        }}
        maxWidth={880}
      >
        <div>
          <div className="mb-4 border-b border-line pb-3">
            <h2 className="text-[19px] font-bold text-ink">
              {activeDoc ? `Chỉnh sửa: ${activeDoc.title}` : 'Tạo mới Văn kiện Nghiệp vụ (SSOT)'}
            </h2>
            <p className="text-[12.5px] text-muted">
              Nội dung văn bản được lưu trữ tập trung tại cơ sở dữ liệu làm nguồn chân lý (SSOT) cho toàn hệ thống.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!formTitle.trim() || (!activeDoc && !formSlug.trim()) || !formContent.trim()) {
                toast('Vui lòng điền đầy đủ các trường bắt buộc', 'error');
                return;
              }
              saveMutation.mutate({ id: activeDoc?.id });
            }}
            className="flex flex-col gap-4"
          >
            {/* Title & Slug */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-body">
                  Tiêu đề văn bản <span className="text-bad">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ví dụ: Điều khoản dịch vụ"
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-[13px] outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-body">
                  Slug (Định danh URL) <span className="text-bad">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={Boolean(activeDoc)}
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="terms-of-service"
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 font-mono text-[12px] disabled:opacity-60 outline-none focus:border-brand"
                />
              </div>
            </div>

            {/* Eyebrow, DocType, Audience, Version */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-body">Eyebrow (Tiêu đề phụ)</label>
                <input
                  type="text"
                  value={formEyebrow}
                  onChange={(e) => setFormEyebrow(e.target.value)}
                  placeholder="ChargeOps Policy"
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-[13px] outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-body">Loại văn bản</label>
                <Select
                  value={formDocType}
                  disabled={Boolean(activeDoc)}
                  onChange={(val) => setFormDocType(val as LegalDocType)}
                  options={FORM_DOC_TYPE_OPTIONS}
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-body">Đối tượng áp dụng</label>
                <Select
                  value={formAudience}
                  onChange={(val) => setFormAudience(val as TargetAudience)}
                  options={FORM_AUDIENCE_OPTIONS}
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-body">Phiên bản</label>
                <input
                  type="text"
                  required
                  value={formVersion}
                  onChange={(e) => setFormVersion(e.target.value)}
                  placeholder="4.9.0"
                  className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-[13px] outline-none"
                />
              </div>
            </div>

            {/* Summary */}
            <div>
              <label className="mb-1 block text-[12px] font-semibold text-body">Tóm tắt ngắn gọn</label>
              <textarea
                rows={2}
                value={formSummary}
                onChange={(e) => setFormSummary(e.target.value)}
                placeholder="Tóm tắt 1-2 câu về nội dung và phạm vi của tài liệu..."
                className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-[13px] outline-none"
              />
            </div>

            {/* Keywords Tag Input */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[12px] font-semibold text-body flex items-center gap-1.5">
                  <IconTag size={14} className="text-brand" />
                  Từ khóa ngữ nghĩa (Keywords phục vụ tra cứu & tìm kiếm)
                </label>
                <span className="text-[11px] text-muted">
                  {formKeywords.length}/30 từ khóa · Nhấn Enter hoặc dấu phẩy để thêm
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-canvas p-2.5 focus-within:border-brand transition shadow-2xs">
                {formKeywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-soft px-2.5 py-1 text-[12px] font-medium text-brand"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(idx)}
                      className="rounded-full p-0.5 hover:bg-brand/20 text-brand"
                      title="Xóa từ khóa"
                    >
                      <IconX size={12} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={handleKeywordKeyDown}
                  placeholder={
                    formKeywords.length === 0
                      ? 'Nhập từ khóa (vd: refund, hoàn tiền, hủy đặt chỗ, ân hạn) rồi nhấn Enter...'
                      : 'Thêm từ khóa...'
                  }
                  className="min-w-[180px] flex-1 bg-transparent px-2 py-0.5 text-[13px] outline-none placeholder:text-muted"
                />
                {keywordInput.trim() && (
                  <button
                    type="button"
                    onClick={() => handleAddKeyword()}
                    className="rounded-lg bg-brand px-3 py-1 text-[11.5px] font-semibold text-white hover:bg-brand/90 transition shadow-xs"
                  >
                    Thêm
                  </button>
                )}
              </div>
              <p className="mt-1 text-[11px] text-muted">
                Admin gắn từ khóa để tra cứu song ngữ và đồng nghĩa linh hoạt (unaccent + ILIKE), ví dụ tài liệu tiếng Việt gắn thêm "refund" để tìm thấy ngay.
              </p>
            </div>

            {/* Markdown Content Editor with Live Preview tabs */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[12px] font-semibold text-body">
                  Nội dung toàn văn (Markdown tiếng Việt) <span className="text-bad">*</span>
                </label>

                {/* Editor Tabs & Quick Snippets */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-lg border border-line bg-canvas p-0.5">
                    <button
                      type="button"
                      onClick={() => setEditorTab('write')}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                        editorTab === 'write' ? 'bg-surface text-ink shadow-xs' : 'text-muted'
                      }`}
                    >
                      Soạn thảo
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorTab('preview')}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                        editorTab === 'preview' ? 'bg-surface text-ink shadow-xs' : 'text-muted'
                      }`}
                    >
                      Xem trước
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorTab('split')}
                      className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                        editorTab === 'split' ? 'bg-surface text-ink shadow-xs' : 'text-muted'
                      }`}
                    >
                      Chia đôi
                    </button>
                  </div>
                </div>
              </div>

              {/* Formatting Toolbar */}
              <div className="mb-2 flex flex-wrap items-center gap-1.5 rounded-lg border border-line-2 bg-surface-2 p-1.5 text-[11.5px]">
                <button
                  type="button"
                  onClick={() => insertMarkdown('### 1. ')}
                  className="rounded px-2 py-0.5 text-muted hover:bg-canvas hover:text-ink"
                >
                  + Tiêu đề mục (###)
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('**in đậm**')}
                  className="rounded px-2 py-0.5 text-muted hover:bg-canvas hover:text-ink font-bold"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('> Phạm vi: ')}
                  className="rounded px-2 py-0.5 text-muted hover:bg-canvas hover:text-ink italic"
                >
                  Trích dẫn (&gt;)
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('1. ')}
                  className="rounded px-2 py-0.5 text-muted hover:bg-canvas hover:text-ink"
                >
                  1. Danh sách số
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('- ')}
                  className="rounded px-2 py-0.5 text-muted hover:bg-canvas hover:text-ink"
                >
                  • Danh sách gạch đầu dòng
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown('\n---\n')}
                  className="rounded px-2 py-0.5 text-muted hover:bg-canvas hover:text-ink"
                >
                  Đường phân cách (---)
                </button>
              </div>

              {/* Editor Workspace */}
              {editorTab === 'write' ? (
                <textarea
                  rows={14}
                  required
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="# Tiêu đề\n\n### 1. Điều khoản thứ nhất\nNội dung..."
                  className="w-full rounded-xl border border-line bg-canvas p-3.5 font-mono text-[12.5px] leading-relaxed outline-none focus:border-brand"
                />
              ) : editorTab === 'preview' ? (
                <div className="max-h-[420px] overflow-y-auto rounded-xl border border-line bg-surface p-4">
                  <PolicyMarkdownViewer content={formContent || '*Chưa có nội dung soạn thảo*'} showToc={false} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <textarea
                    rows={14}
                    required
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    className="w-full rounded-xl border border-line bg-canvas p-3 font-mono text-[12px] leading-relaxed outline-none focus:border-brand"
                  />
                  <div className="max-h-[350px] overflow-y-auto rounded-xl border border-line bg-surface p-3 text-[12px]">
                    <PolicyMarkdownViewer content={formContent || '*Chưa có nội dung soạn thảo*'} showToc={false} />
                  </div>
                </div>
              )}
            </div>

            {/* Active checkbox */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="formActiveCheck"
                checked={formActive}
                onChange={(e) => setFormActive(e.target.checked)}
                className="h-4 w-4 rounded border-line text-brand"
              />
              <label htmlFor="formActiveCheck" className="text-[13px] font-medium text-body cursor-pointer">
                Kích hoạt tài liệu này (Công bố cho người dùng và đối soát)
              </label>
            </div>

            {/* Modal Actions */}
            <div className="mt-2 flex justify-end gap-2 border-t border-line pt-3">
              <Button
                variant="secondary"
                type="button"
                onClick={() => {
                  setEditModalOpen(false);
                  resetForm();
                }}
              >
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Đang lưu...' : activeDoc ? 'Cập nhật văn kiện' : 'Tạo mới văn kiện'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
