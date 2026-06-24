import { useMemo, useRef, useState } from 'react';
import {
  Bold,
  Code2,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Table2,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { compileMarkdown } from '@/lib/markdownCompiler';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { uploadApi } from '@/lib/apiClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  applyEditorAction,
  replaceRange,
  type EditorTransformResult,
  type InsertAction,
} from '@/components/articleEditorTransforms';

interface ArticleEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  minHeight?: number;
  onError?: (message: string) => void;
}

const toolbarItems: Array<{ action: InsertAction; label: string; icon: typeof Bold }> = [
  { action: 'h1', label: 'Heading 1', icon: Heading1 },
  { action: 'h2', label: 'Heading 2', icon: Heading2 },
  { action: 'h3', label: 'Heading 3', icon: Heading3 },
  { action: 'bold', label: 'Bold', icon: Bold },
  { action: 'italic', label: 'Italic', icon: Italic },
  { action: 'inline-code', label: 'Inline code', icon: Code2 },
  { action: 'code-block', label: 'Code block', icon: Code2 },
  { action: 'link', label: 'Link', icon: Link2 },
  { action: 'quote', label: 'Quote', icon: Quote },
  { action: 'ul', label: 'Bulleted list', icon: List },
  { action: 'ol', label: 'Numbered list', icon: ListOrdered },
  { action: 'table', label: 'Table', icon: Table2 },
];

export default function ArticleEditor({
  value,
  onChange,
  disabled = false,
  className,
  minHeight = 640,
  onError,
}: ArticleEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const markdownDocument = useMemo(() => compileMarkdown(value || ''), [value]);
  const editorHeight = `min(${minHeight}px, calc(100vh - 14rem))`;

  const applyTransform = (result: EditorTransformResult) => {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;

    onChange(result.value);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  };

  const insertText = (text: string, selectionStartOffset = text.length, selectionLength = 0) => {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    applyTransform(replaceRange(value, start, end, text, selectionStartOffset, selectionLength));
  };

  const applyAction = (action: InsertAction) => {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;

    applyTransform(applyEditorAction(value, {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
    }, action));
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || disabled) return;

    if (!file.type.startsWith('image/')) {
      onError?.('Please select an image file.');
      return;
    }

    setIsUploadingImage(true);
    try {
      const response = await uploadApi.uploadImage(file);
      if (response.success && response.data?.url) {
        const safeName = file.name
          .replace(/\.[^/.]+$/, '')
          .replaceAll('[', '')
          .replaceAll(']', '')
          .replaceAll('(', '')
          .replaceAll(')', '');
        insertText(`\n![${safeName || 'image'}](${response.data.url})\n`, 3, safeName.length || 5);
      } else {
        onError?.(response.error?.message || 'Image upload failed.');
      }
    } catch {
      onError?.('Image upload failed. Check that the backend upload service is running.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const jumpToPreviewHeading = (id: string) => {
    setIsPreviewOpen(true);
    requestAnimationFrame(() => {
      const target = previewRef.current?.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  };

  return (
    <section className={cn('article-editor', className)}>
      <div className="mb-2 flex flex-wrap items-center gap-1 rounded-lg border border-brand-border/40 bg-white/70 p-1">
        {toolbarItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.action}
              type="button"
              onClick={() => applyAction(item.action)}
              className="inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs text-brand-dark-gray transition-colors hover:bg-brand-linen hover:text-brand-text disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={item.label}
              title={item.label}
              disabled={disabled}
            >
              <Icon size={16} />
              {item.action.startsWith('h') ? <span className="ml-1">{item.action.toUpperCase()}</span> : null}
            </button>
          );
        })}

        <div className="mx-1 h-5 w-px bg-brand-border/60" />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleImageSelect}
          disabled={disabled || isUploadingImage}
        />
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          className="inline-flex h-8 items-center justify-center gap-1 rounded-md px-2 text-xs text-brand-dark-gray transition-colors hover:bg-brand-linen hover:text-brand-text disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled || isUploadingImage}
        >
          {isUploadingImage ? <Upload size={16} className="animate-pulse" /> : <ImageIcon size={16} />}
          Image
        </button>

        <button
          type="button"
          onClick={() => setIsPreviewOpen(true)}
          className="ml-auto inline-flex h-8 items-center justify-center gap-1 rounded-md bg-brand-text px-3 text-xs text-white transition-colors hover:bg-brand-dark-gray disabled:cursor-not-allowed disabled:opacity-50"
          disabled={disabled}
        >
          <Eye size={16} />
          Preview
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-brand-dark-gray/60">Markdown</span>
            <span className="text-xs text-brand-dark-gray/50">
              {value.length} chars / {markdownDocument.readingTime} min read
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            spellCheck={false}
            data-native-scroll="true"
            className="w-full resize-y overflow-y-auto overscroll-contain rounded-lg border border-brand-border bg-white/90 p-4 font-mono text-sm leading-6 text-brand-text outline-none transition focus:border-brand-text focus:ring-2 focus:ring-brand-text/15 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ minHeight: editorHeight, maxHeight: 'calc(100vh - 10rem)' }}
            placeholder="# Title&#10;&#10;Write your article in Markdown. Use $...$ or $$...$$ for LaTeX."
          />
        </div>

        <aside className="min-w-0">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-brand-dark-gray/60">Outline</span>
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="inline-flex items-center gap-1 text-xs text-brand-dark-gray transition hover:text-brand-text"
            >
              <Eye size={14} />
              Open
            </button>
          </div>
          <div className="rounded-lg border border-brand-border bg-white/70 p-3" style={{ maxHeight: minHeight + 58 }}>
            {markdownDocument.toc.length > 0 ? (
              <nav className="space-y-1 overflow-y-auto pr-1" style={{ maxHeight: minHeight + 32 }}>
                {markdownDocument.toc.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => jumpToPreviewHeading(item.id)}
                    className="block w-full truncate rounded px-2 py-1.5 text-left text-xs text-brand-dark-gray transition-colors hover:bg-brand-linen hover:text-brand-text"
                    style={{ paddingLeft: `${Math.max(0, item.level - 1) * 10 + 8}px` }}
                    title={item.text}
                  >
                    {item.text}
                  </button>
                ))}
              </nav>
            ) : (
              <p className="text-sm leading-6 text-brand-dark-gray/60">
                Add headings with #, ##, or ### to build the article outline.
              </p>
            )}
          </div>
        </aside>
      </div>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="grid h-[calc(100vh-1.25rem)] w-[calc(100vw-1.25rem)] max-w-none grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-none" showCloseButton>
          <DialogHeader className="border-b border-brand-border bg-white px-5 py-4">
            <DialogTitle className="font-oswald text-2xl font-light text-brand-text">Markdown Preview</DialogTitle>
            <DialogDescription>
              Rendered article preview with generated outline.
            </DialogDescription>
          </DialogHeader>
          <div className="grid min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_320px]">
            <div
              ref={previewRef}
              className="min-h-0 overflow-y-auto overscroll-contain bg-white px-5 py-6 lg:px-12 xl:px-16"
              data-native-scroll="true"
            >
              <MarkdownRenderer
                document={markdownDocument}
                mode="preview"
                className="mx-auto max-w-[980px]"
              />
            </div>
            <aside className="hidden min-h-0 overflow-y-auto overscroll-contain border-l border-brand-border bg-brand-linen/40 p-4 lg:block" data-native-scroll="true">
              <div className="mb-3 text-xs uppercase tracking-wider text-brand-dark-gray/60">Outline</div>
              {markdownDocument.toc.length > 0 ? (
                <nav className="space-y-1">
                  {markdownDocument.toc.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => jumpToPreviewHeading(item.id)}
                      className="block w-full truncate rounded px-2 py-1.5 text-left text-xs text-brand-dark-gray transition-colors hover:bg-white hover:text-brand-text"
                      style={{ paddingLeft: `${Math.max(0, item.level - 1) * 10 + 8}px` }}
                      title={item.text}
                    >
                      {item.text}
                    </button>
                  ))}
                </nav>
              ) : (
                <p className="text-sm leading-6 text-brand-dark-gray/60">
                  Add headings to generate jump links.
                </p>
              )}
            </aside>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
