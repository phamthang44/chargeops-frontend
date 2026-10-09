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
import { ApiErrorState } from '../../shared/components/ApiErrorState';

export type CategoryTab = 'all' | 'foundation' | 'booking' | 'hardware' | 'license';

/**
 * Universal suffix-agnostic category matching function.
 * Matches documents regardless of whether their slug has -en, -vi, -version, or dot notation.
 */
export function matchDocumentCategory(slug: string, tabId: CategoryTab, docType?: string): boolean {
  if (tabId === 'all') return true;

  // Normalize slug: lowercase and strip any language suffix: -en, -vi, -en-version, -vi-version, .en, .vi, etc.
  const s = slug
    .toLowerCase()
    .replace(/[._-](en|vi)([-_]version)?$/i, '')
    .trim();

  switch (tabId) {
    case 'foundation':
      return (
        s === 'terms-of-service' ||
        s.startsWith('terms-of-service') ||
        s === 'privacy-policy' ||
        s.startsWith('privacy-policy') ||
        s === 'operational-regulations' ||
        s.startsWith('operational-regulation') ||
        docType === 'TERMS_OF_SERVICE' ||
        docType === 'PRIVACY_POLICY'
      );

    case 'booking':
      // Exclude items that explicitly belong to owner ledger or FAQ/glossary
      if (
        s.includes('owner-ledger') ||
        s.includes('refund-attempts') ||
        s.includes('faq') ||
        s.includes('glossary')
      ) {
        return false;
      }
      // Matches any booking, pricing, cancellation, refund, availability or payment document
      return (
        s.includes('cancellation') ||
        s.includes('refund') ||
        s.includes('booking') ||
        s.includes('payment') ||
        s.includes('pricing') ||
        s.includes('availability')
      );

    case 'hardware':
      return (
        s.includes('check-in') ||
        s.includes('no-show') ||
        s.includes('qr') ||
        s.includes('incident') ||
        s.includes('support') ||
        s.includes('failure') ||
        s.includes('discovery') ||
        s.includes('eligibility') ||
        s.includes('equipment') ||
        s.includes('responsibility')
      );

    case 'license':
      return (
        docType === 'LICENSE_AGREEMENT' ||
        s.includes('license') ||
        s.includes('owner-ledger') ||
        s.includes('refund-attempts') ||
        s.includes('staff') ||
        s.includes('owner-payout') ||
        s.includes('payout') ||
        s.includes('adjustment') ||
        s.includes('faq') ||
        s.includes('glossary')
      );

    default:
      return true;
  }
}

export function PolicyKB() {
  const { t } = useTranslation('admin');
  const api = useApi();
  const qc = useQueryClient();
  const toast = useToast();

  const docTypeLabels: Record<LegalDocType, string> = useMemo(() => ({
    TERMS_OF_SERVICE: t('policyKB.docTypes.TERMS_OF_SERVICE', 'Điều khoản dịch vụ'),
    PRIVACY_POLICY: t('policyKB.docTypes.PRIVACY_POLICY', 'Chính sách bảo mật'),
    LICENSE_AGREEMENT: t('policyKB.docTypes.LICENSE_AGREEMENT', 'Thỏa thuận License'),
    OPERATIONAL_REGULATION: t('policyKB.docTypes.OPERATIONAL_REGULATION', 'Quy chế vận hành'),
  }), [t]);

  const audienceLabels: Record<TargetAudience, string> = useMemo(() => ({
    ALL: t('policyKB.audiences.ALL', 'Toàn hệ thống (ALL)'),
    DRIVER: t('policyKB.audiences.DRIVER', 'Tài xế (DRIVER)'),
    OWNER: t('policyKB.audiences.OWNER', 'Chủ trạm (OWNER)'),
  }), [t]);

  const docTypeOptions: SelectOption[] = useMemo(() => [
    { value: 'all', label: t('policyKB.docTypes.all', 'Tất cả loại văn bản') },
    { value: 'TERMS_OF_SERVICE', label: t('policyKB.docTypes.TERMS_OF_SERVICE', 'Điều khoản dịch vụ') },
    { value: 'PRIVACY_POLICY', label: t('policyKB.docTypes.PRIVACY_POLICY', 'Chính sách bảo mật') },
    { value: 'LICENSE_AGREEMENT', label: t('policyKB.docTypes.LICENSE_AGREEMENT', 'Thỏa thuận License') },
    { value: 'OPERATIONAL_REGULATION', label: t('policyKB.docTypes.OPERATIONAL_REGULATION', 'Quy chế vận hành') },
  ], [t]);

  const audienceOptions: SelectOption[] = useMemo(() => [
    { value: 'all', label: t('policyKB.audiences.all', 'Tất cả đối tượng') },
    { value: 'ALL', label: t('policyKB.audiences.ALL', 'Toàn hệ thống (ALL)') },
    { value: 'OWNER', label: t('policyKB.audiences.OWNER', 'Chủ trạm (OWNER)') },
    { value: 'DRIVER', label: t('policyKB.audiences.DRIVER', 'Tài xế (DRIVER)') },
  ], [t]);

  const statusOptions: SelectOption[] = useMemo(() => [
    { value: 'all', label: t('policyKB.statusOptions.all', 'Tất cả trạng thái') },
    { value: 'active', label: t('policyKB.statusOptions.active', 'Đang hiệu lực') },
    { value: 'inactive', label: t('policyKB.statusOptions.inactive', 'Bản nháp / Ẩn') },
  ], [t]);

  const localeOptions: SelectOption[] = useMemo(() => [
    { value: 'all', label: t('policyKB.locales.all', 'Tất cả ngôn ngữ') },
    { value: 'vi', label: t('policyKB.locales.vi', 'Tiếng Việt (VI)') },
    { value: 'en', label: t('policyKB.locales.en', 'English (EN)') },
  ], [t]);

  const formLocaleOptions: SelectOption[] = useMemo(() => [
    { value: 'vi', label: t('policyKB.locales.vi', 'Tiếng Việt (VI)') },
    { value: 'en', label: t('policyKB.locales.en', 'English (EN)') },
  ], [t]);

  const formDocTypeOptions: SelectOption[] = useMemo(() => [
    { value: 'TERMS_OF_SERVICE', label: t('policyKB.docTypes.TERMS_OF_SERVICE', 'Điều khoản dịch vụ') },
    { value: 'PRIVACY_POLICY', label: t('policyKB.docTypes.PRIVACY_POLICY', 'Chính sách bảo mật') },
    { value: 'LICENSE_AGREEMENT', label: t('policyKB.docTypes.LICENSE_AGREEMENT', 'Thỏa thuận License') },
    { value: 'OPERATIONAL_REGULATION', label: t('policyKB.docTypes.OPERATIONAL_REGULATION', 'Quy chế vận hành') },
  ], [t]);

  const formAudienceOptions: SelectOption[] = useMemo(() => [
    { value: 'ALL', label: t('policyKB.audiences.ALL', 'Toàn hệ thống (ALL)') },
    { value: 'OWNER', label: t('policyKB.audiences.OWNER', 'Chủ trạm (OWNER)') },
    { value: 'DRIVER', label: t('policyKB.audiences.DRIVER', 'Tài xế (DRIVER)') },
  ], [t]);

  const categoryTabs = useMemo(() => [
    { id: 'all' as CategoryTab, label: t('policyKB.categories.all', 'Tất cả văn bản') },
    { id: 'foundation' as CategoryTab, label: t('policyKB.categories.foundation', 'Pháp lý nền tảng') },
    { id: 'booking' as CategoryTab, label: t('policyKB.categories.booking', 'Đặt chỗ & Biểu giá') },
    { id: 'hardware' as CategoryTab, label: t('policyKB.categories.hardware', 'Vận hành & Phần cứng') },
    { id: 'license' as CategoryTab, label: t('policyKB.categories.license', 'Chủ trạm & License') },
  ], [t]);

  const [activeTab, setActiveTab] = useState<CategoryTab>('all');

  // Search state
  const [searchInput, setSearchInput] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');

  // Dropdown & filter states
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedAudience, setSelectedAudience] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedLocale, setSelectedLocale] = useState<string>('all');

  // Clipboard copy state for feedback
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

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
  const [formLocale, setFormLocale] = useState<string>('vi');
  const [formActive, setFormActive] = useState(true);
  const [formKeywords, setFormKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [editorTab, setEditorTab] = useState<'write' | 'preview' | 'split'>('write');

  const handleCopySlug = async (slug: string) => {
    try {
      await navigator.clipboard.writeText(`/${slug}`);
      setCopiedSlug(slug);
      toast(`Đã chép slug "/${slug}" vào clipboard`, 'success');
      setTimeout(() => {
        setCopiedSlug((curr) => (curr === slug ? null : curr));
      }, 2500);
    } catch {
      toast('Không thể sao chép slug', 'error');
    }
  };

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

  // Fetch admin legal documents list with pageSize: 100 to avoid Spring Pageable pagination truncation
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['admin-legal-documents', committedSearch, selectedType, selectedAudience, selectedLocale],
    queryFn: () =>
      api.legalDocuments.adminList({
        pageSize: 100,
        size: 100,
        search: committedSearch || undefined,
        docType: selectedType !== 'all' ? (selectedType as LegalDocType) : undefined,
        audience: selectedAudience !== 'all' ? (selectedAudience as TargetAudience) : undefined,
        locale: selectedLocale !== 'all' ? selectedLocale : undefined,
      }),
  });

  const allDocs = data?.items ?? [];

  // Filtered by category tab and status
  const filteredDocs = useMemo(() => {
    return allDocs.filter((doc) => {
      // Category tab
      if (!matchDocumentCategory(doc.slug, activeTab, doc.docType)) {
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
          locale: formLocale,
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
          locale: formLocale,
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
    setFormLocale('vi');
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
      setFormLocale(detail.locale || 'vi');
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
      {/* Top Eyebrow Pill & Header */}
      <div className="mb-2">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft/60 px-3 py-1 shadow-2xs backdrop-blur-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
          <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-brand">
            SSOT Knowledge Architecture · Legal Intelligence
          </span>
        </div>
        <PageHeader
          title={t('policyKB.pageTitle', 'Kho Văn Bản Nghiệp Vụ & Pháp Lý (SSOT)')}
          subtitle={t(
            'policyKB.pageSubtitle',
            'Nguồn dữ liệu chân lý duy nhất (Single Source of Truth) quản lý 15 văn kiện quy chuẩn, biểu phí, vận hành trạm và thỏa thuận License theo SRS v4.9.',
          )}
          action={
            <div className="flex items-center gap-2.5">
              <Button
                variant="secondary"
                icon={<IconRefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />}
                onClick={() => refetch()}
              >
                {t('policyKB.refreshBtn', 'Làm mới')}
              </Button>
              <Button
                icon={
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface/20">
                    <IconPlusCircle size={15} strokeWidth={2.4} />
                  </span>
                }
                onClick={openCreate}
              >
                {t('policyKB.addDocBtn', 'Thêm văn kiện mới')}
              </Button>
            </div>
          }
        />
      </div>

      {/* KPI Metric Strip - Double-Bezel Architecture */}
      <div className="mb-6 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        {/* Metric 1: Total Docs */}
        <div className="group rounded-2xl border border-line/80 bg-surface-2/40 p-1.5 shadow-xs transition duration-300 hover:border-brand/30 hover:shadow-md">
          <div className="flex items-center gap-3.5 rounded-xl border border-line/40 bg-surface p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand transition-transform duration-300 group-hover:scale-105">
              <IconBook size={20} />
            </div>
            <div>
              <div className="text-[11.5px] font-medium text-muted">{t('policyKB.kpi.totalDocs', 'Tổng số văn kiện')}</div>
              <div className="font-mono text-[22px] font-black tracking-tight text-ink">{allDocs.length}</div>
            </div>
          </div>
        </div>

        {/* Metric 2: Active Docs */}
        <div className="group rounded-2xl border border-line/80 bg-surface-2/40 p-1.5 shadow-xs transition duration-300 hover:border-good/30 hover:shadow-md">
          <div className="flex items-center gap-3.5 rounded-xl border border-line/40 bg-surface p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-good-soft text-good transition-transform duration-300 group-hover:scale-105">
              <IconShieldCheck size={20} />
            </div>
            <div>
              <div className="text-[11.5px] font-medium text-muted">{t('policyKB.kpi.activeDocs', 'Đang hiệu lực')}</div>
              <div className="font-mono text-[22px] font-black tracking-tight text-good-deep">
                {allDocs.filter((d) => d.active).length}
              </div>
            </div>
          </div>
        </div>

        {/* Metric 3: Booking & Pricing Category Docs */}
        <div className="group rounded-2xl border border-line/80 bg-surface-2/40 p-1.5 shadow-xs transition duration-300 hover:border-amber-400/30 hover:shadow-md">
          <div className="flex items-center gap-3.5 rounded-xl border border-line/40 bg-surface p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 transition-transform duration-300 group-hover:scale-105">
              <IconBolt size={20} />
            </div>
            <div>
              <div className="text-[11.5px] font-medium text-muted">Đặt chỗ & Biểu giá</div>
              <div className="font-mono text-[22px] font-black tracking-tight text-ink">
                {allDocs.filter((d) => matchDocumentCategory(d.slug, 'booking', d.docType)).length}
              </div>
            </div>
          </div>
        </div>

        {/* Metric 4: Owner & License Docs */}
        <div className="group rounded-2xl border border-line/80 bg-surface-2/40 p-1.5 shadow-xs transition duration-300 hover:border-emerald-400/30 hover:shadow-md">
          <div className="flex items-center gap-3.5 rounded-xl border border-line/40 bg-surface p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform duration-300 group-hover:scale-105">
              <IconHome size={20} />
            </div>
            <div>
              <div className="text-[11.5px] font-medium text-muted">{t('policyKB.audiences.OWNER', 'Chủ trạm & License')}</div>
              <div className="font-mono text-[22px] font-black tracking-tight text-ink">
                {allDocs.filter((d) => matchDocumentCategory(d.slug, 'license', d.docType)).length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <ApiErrorState
          error={error}
          eyebrow={t('policy.title', { defaultValue: 'Kho tài liệu pháp lý' })}
          title={t('policy.loadError', { defaultValue: 'Không thể tải danh sách tài liệu' })}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      ) : isLoading ? (
        <Skeleton className="h-[420px] rounded-3xl" />
      ) : (
        <div className="flex flex-col gap-5">
          {/* Category Tabs - Floating Glass Segmented Dock */}
          <div className="rounded-2xl border border-line/80 bg-surface-2/40 p-1.5 shadow-xs backdrop-blur-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-line/30 bg-surface p-1 scrollbar-none">
              {categoryTabs.map((tab) => {
                const count = allDocs.filter((d) => matchDocumentCategory(d.slug, tab.id, d.docType)).length;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`group flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-[12.5px] font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-ink text-surface shadow-xs scale-[1.01]'
                        : 'text-muted hover:bg-surface-2 hover:text-ink'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-bold transition ${
                        isActive
                          ? 'bg-surface/20 text-surface'
                          : 'bg-line/80 text-muted group-hover:bg-line group-hover:text-ink'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter & Search Toolbar - Double-Bezel Control Architecture */}
          <div className="rounded-2xl border border-line/80 bg-surface-2/40 p-1.5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3.5 rounded-xl border border-line/40 bg-surface p-3.5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
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
                    placeholder={t('policyKB.searchPlaceholder', 'Tìm trong nội dung chính sách (tiêu đề, slug, keywords)…')}
                    className="w-full rounded-xl border border-line bg-canvas py-[9px] pl-9 pr-8 text-[13px] font-medium text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 placeholder:text-faint"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-faint hover:bg-line hover:text-ink transition"
                      title={t('common.clear', 'Xóa tìm kiếm')}
                    >
                      <IconX size={12} strokeWidth={2.4} />
                    </button>
                  )}
                </div>
                <Button type="submit" size="md" variant="secondary" icon={<IconSearch size={14} />}>
                  {t('common.search', 'Tìm kiếm')}
                </Button>
              </form>

              {/* Filters & Quick Locale Pill Segmented Control */}
              <div className="flex flex-wrap items-center gap-3">
                {/* 1-Click Locale Quick Switcher */}
                <div className="flex items-center gap-1 rounded-xl border border-line-2 bg-canvas p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setSelectedLocale('all')}
                    className={`rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition ${
                      selectedLocale === 'all'
                        ? 'bg-ink text-surface shadow-xs'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    Tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLocale('vi')}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition ${
                      selectedLocale === 'vi'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    <span>VI</span>
                    <span className="text-[10px] opacity-80">(Việt)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedLocale('en')}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition ${
                      selectedLocale === 'en'
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'text-muted hover:text-ink'
                    }`}
                  >
                    <span>EN</span>
                    <span className="text-[10px] opacity-80">(Anh)</span>
                  </button>
                </div>

                {/* Type selector */}
                <div className="flex items-center gap-1.5 text-[12px]">
                  <span className="font-semibold text-muted shrink-0">{t('policyKB.table.cols.type', 'Loại')}:</span>
                  <Select
                    value={selectedType}
                    onChange={setSelectedType}
                    options={docTypeOptions}
                    className="w-[170px]"
                  />
                </div>

                {/* Audience selector */}
                <div className="flex items-center gap-1.5 text-[12px]">
                  <span className="font-semibold text-muted shrink-0">{t('policyKB.table.cols.audience', 'Đối tượng')}:</span>
                  <Select
                    value={selectedAudience}
                    onChange={setSelectedAudience}
                    options={audienceOptions}
                    className="w-[170px]"
                  />
                </div>

                {/* Status selector */}
                <div className="flex items-center gap-1.5 text-[12px]">
                  <span className="font-semibold text-muted shrink-0">{t('policyKB.table.cols.status', 'Trạng thái')}:</span>
                  <Select
                    value={selectedStatus}
                    onChange={setSelectedStatus}
                    options={statusOptions}
                    className="w-[145px]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between text-[12.5px] text-muted px-1.5">
            <span className="flex items-center gap-2">
              <span>Hiển thị</span>
              <span className="inline-flex items-center rounded-md bg-canvas px-2 py-0.5 font-mono text-[12px] font-bold text-ink border border-line">
                {filteredDocs.length}
              </span>
              <span>/ {allDocs.length} văn kiện trong kho</span>
            </span>
            {committedSearch && (
              <div className="flex items-center gap-1.5">
                <span>Bộ lọc từ khóa:</span>
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

          {/* Document Cards Grid - Double-Bezel Nested Architecture */}
          {filteredDocs.length === 0 ? (
            <div className="rounded-3xl border border-line/80 bg-surface-2/40 p-2 shadow-xs">
              <div className="rounded-2xl border border-line/40 bg-surface p-12 text-center">
                <EmptyState>
                  Không tìm thấy văn bản pháp lý nào phù hợp với bộ lọc hiện tại. Thử chọn "Tất cả văn bản" hoặc xóa từ khóa tìm kiếm.
                </EmptyState>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredDocs.map((doc) => {
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
                    className="group rounded-[1.75rem] border border-line/70 bg-surface-2/30 p-1.5 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg"
                  >
                    <div className="flex flex-col justify-between gap-4 rounded-[calc(1.75rem-0.375rem)] border border-line/40 bg-surface p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] lg:flex-row lg:items-start">
                      <div className="flex-1">
                        {/* Top Micro-Pills Row */}
                        <div className="mb-2.5 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 font-mono text-[11px] font-bold ${badgeBg}`}
                          >
                            <IconTag size={11} />
                            {docTypeLabels[doc.docType]}
                          </span>

                          <span className="inline-flex items-center gap-1 rounded-lg bg-chip px-2.5 py-0.5 text-[11px] font-medium text-body">
                            {doc.targetAudience === 'OWNER' ? (
                              <IconHome size={11} className="text-emerald-600" />
                            ) : (
                              <IconUsers size={11} className="text-muted" />
                            )}
                            {audienceLabels[doc.targetAudience]}
                          </span>

                          {/* Locale Pill */}
                          <span
                            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10.5px] font-bold ${
                              doc.locale === 'en'
                                ? 'border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300'
                                : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            }`}
                          >
                            {doc.locale ? doc.locale.toUpperCase() : 'VI'}
                          </span>

                          <span className="rounded-lg border border-line bg-canvas px-2 py-0.5 font-mono text-[10.5px] font-semibold text-muted">
                            v{doc.version}
                          </span>

                          {doc.active ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-good-soft px-2.5 py-0.5 text-[10.5px] font-bold text-good-deep">
                              <span className="h-1.5 w-1.5 rounded-full bg-good animate-pulse" />
                              {t('policyKB.statusOptions.active', 'Hiệu lực')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-line-3 px-2 py-0.5 text-[10.5px] font-medium text-faint">
                              {t('policyKB.statusOptions.inactive', 'Bản nháp / Ẩn')}
                            </span>
                          )}

                          <span className="text-[11px] text-ghost">
                            {t('policyKB.previewModal.effectiveDate', 'Hiệu lực từ:')} {formatDateVn(doc.effectiveFrom)}
                          </span>
                        </div>

                        {/* Eyebrow & Title */}
                        {doc.eyebrow && (
                          <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-brand">
                            {doc.eyebrow}
                          </div>
                        )}
                        <h3 className="mb-1 text-[17px] font-extrabold text-ink transition duration-200 group-hover:text-brand">
                          {doc.title}
                        </h3>

                        {/* Interactive Click-to-Copy Slug Chip */}
                        <div className="mb-2.5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopySlug(doc.slug)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-line-2 bg-canvas px-2.5 py-1 font-mono text-[11px] font-semibold text-brand-strong transition hover:border-brand/40 hover:bg-brand-soft/30 active:scale-95"
                            title="Nhấn để sao chép slug"
                          >
                            {copiedSlug === doc.slug ? (
                              <>
                                <IconCheck size={12} className="text-good" />
                                <span className="text-good font-bold">Đã sao chép: /{doc.slug}</span>
                              </>
                            ) : (
                              <>
                                <IconCopy size={12} className="text-faint transition group-hover:text-brand" />
                                <span>/{doc.slug}</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Summary */}
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
                                className="rounded-md border border-line-2 bg-canvas px-2 py-0.5 font-mono text-[11px] text-body shadow-2xs"
                              >
                                {kw}
                              </span>
                            ))}
                            {doc.keywords.length > 5 && (
                              <span className="text-[11px] font-medium text-ghost">
                                +{doc.keywords.length - 5}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action buttons - Button-in-Button Architecture */}
                      <div className="flex shrink-0 items-center gap-2 pt-1 lg:self-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<IconBook size={14} className="text-brand" />}
                          onClick={() => openPreview(doc)}
                        >
                          {t('policyKB.actions.viewMarkdown', 'Xem trước')}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<IconEdit size={14} />}
                          onClick={() => openEdit(doc)}
                        >
                          {t('policyKB.actions.edit', 'Sửa')}
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
                          {t('policyKB.actions.delete', 'Xóa')}
                        </Button>
                      </div>
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
                    {docTypeLabels[activeDoc.docType]}
                  </span>
                  <span className="rounded-md bg-chip px-2 py-0.5 text-[11px] font-medium text-body">
                    {audienceLabels[activeDoc.targetAudience]}
                  </span>
                  <span
                    className={`rounded-md border px-2 py-0.5 font-mono text-[10.5px] font-bold ${
                      activeDoc.locale === 'en'
                        ? 'border-sky-300 bg-sky-50 text-sky-700'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {activeDoc.locale ? activeDoc.locale.toUpperCase() : 'VI'}
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
                <label className="mb-1 block text-[12px] font-semibold text-body">{t('policyKB.modal.typeLabel', 'Loại văn bản *')}</label>
                <Select
                  value={formDocType}
                  disabled={Boolean(activeDoc)}
                  onChange={(val) => setFormDocType(val as LegalDocType)}
                  options={formDocTypeOptions}
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-body">{t('policyKB.modal.audienceLabel', 'Đối tượng áp dụng *')}</label>
                <Select
                  value={formAudience}
                  onChange={(val) => setFormAudience(val as TargetAudience)}
                  options={formAudienceOptions}
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-semibold text-body">Ngôn ngữ *</label>
                <Select
                  value={formLocale}
                  disabled={Boolean(activeDoc)}
                  onChange={(val) => setFormLocale(val as string)}
                  options={formLocaleOptions}
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
                  Nội dung toàn văn (Markdown) <span className="text-bad">*</span>
                </label>

                {/* Editor Tabs */}
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
