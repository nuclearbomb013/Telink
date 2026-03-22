import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  CheckCircle,
  FileText,
  Eye,
  Edit3,
  FileUp,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { submitArticle } from '@/services/submission.service';
import {
  parseDocument,
  validateDocumentFile,
  formatFileSize,
  type ParsedDocument
} from '@/lib/documentParser';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import CoverImageUploader from '@/components/CoverImageUploader';
import type { CreateArticleData } from '@/services/articles.types';

type SubmitStep = 'upload' | 'preview' | 'edit' | 'success';

/**
 * Submit Article Page
 *
 * Allows users to submit articles by uploading .md or .doc/.docx files.
 * Includes automatic document parsing, preview, and submission handling.
 */
const SubmitArticlePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [currentStep, setCurrentStep] = useState<SubmitStep>('upload');
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Parsed document data
  const [parsedDoc, setParsedDoc] = useState<ParsedDocument | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // Editable form data
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    author: '',
    category: '',
    content: '',
    tags: '',
    coverImage: '',
  });

  const categories = [
    '前端开发',
    '后端架构',
    '人工智能',
    '开源项目',
    '职业发展',
    '编程语言',
    '系统设计',
    '开发工具',
  ];

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      setError(validation.error || '文件验证失败');
      return;
    }

    setError(null);
    setIsParsing(true);
    setUploadedFile(file);

    try {
      const parsed = await parseDocument(file);
      setParsedDoc(parsed);
      
      // Auto-fill form data
      setFormData({
        title: parsed.title,
        subtitle: parsed.subtitle,
        author: '',
        category: '',
        content: parsed.content,
        tags: parsed.tags.join(', '),
        coverImage: '',
      });
      
      setCurrentStep('preview');
    } catch (err: any) {
      setError(err.message || '解析文件失败');
      setUploadedFile(null);
    } finally {
      setIsParsing(false);
    }
  }, []);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag and drop
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.title.trim()) {
      setError('请输入文章标题');
      setCurrentStep('edit');
      return;
    }
    if (!formData.author.trim()) {
      setError('请输入作者名称');
      setCurrentStep('edit');
      return;
    }
    if (!formData.category) {
      setError('请选择文章分类');
      setCurrentStep('edit');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const tagsArray = formData.tags
        ? formData.tags.split(/[,，]/).map(tag => tag.trim()).filter(Boolean)
        : [];

      const articleData: CreateArticleData = {
        title: formData.title,
        subtitle: formData.subtitle || formData.title,
        content: formData.content,
        author: formData.author,
        category: formData.category,
        tags: tagsArray,
        image: formData.coverImage || undefined,
        excerpt: formData.subtitle || formData.title,
      };

      const submittedArticle = submitArticle(articleData);
      setCurrentStep('success');
      
      // Redirect after success
      setTimeout(() => {
        navigate(`/articles/${submittedArticle.slug}`);
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || '提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setCurrentStep('upload');
    setParsedDoc(null);
    setUploadedFile(null);
    setFormData({
      title: '',
      subtitle: '',
      author: '',
      category: '',
      content: '',
      tags: '',
      coverImage: '',
    });
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Render upload step
  const renderUploadStep = () => (
    <div className="space-y-8">
      {/* Upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
          transition-all duration-300 ease-out
          ${isParsing 
            ? 'border-brand-text bg-brand-text/5' 
            : 'border-brand-border hover:border-brand-dark-gray hover:bg-brand-linen/30'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,.txt,.doc,.docx"
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        {isParsing ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto border-2 border-brand-border border-t-brand-text rounded-full animate-spin" />
            <p className="font-roboto text-brand-dark-gray">正在解析文档...</p>
          </div>
        ) : (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-brand-linen/50 flex items-center justify-center">
              <FileUp className="w-10 h-10 text-brand-dark-gray/50" />
            </div>
            <h3 className="font-oswald text-xl text-brand-text mb-2">
              上传文章文件
            </h3>
            <p className="font-roboto text-brand-dark-gray mb-4">
              点击选择文件，或将文件拖放到这里
            </p>
            <p className="font-roboto text-xs text-brand-dark-gray/50">
              支持 .md、.markdown、.txt、.doc、.docx 格式，最大 10MB
            </p>
          </>
        )}
      </div>

      {/* Guidelines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-brand-linen/30 rounded-lg">
          <div className="w-10 h-10 rounded-full bg-brand-text/10 flex items-center justify-center mb-4">
            <FileText className="w-5 h-5 text-brand-text" />
          </div>
          <h4 className="font-roboto font-medium text-brand-text mb-2">Markdown 支持</h4>
          <p className="font-roboto text-sm text-brand-dark-gray">
            支持标准 Markdown 语法，包括标题、列表、代码块、表格等
          </p>
        </div>
        
        <div className="p-6 bg-brand-linen/30 rounded-lg">
          <div className="w-10 h-10 rounded-full bg-brand-text/10 flex items-center justify-center mb-4">
            <Upload className="w-5 h-5 text-brand-text" />
          </div>
          <h4 className="font-roboto font-medium text-brand-text mb-2">Word 文档</h4>
          <p className="font-roboto text-sm text-brand-dark-gray">
            支持 .doc 和 .docx 格式，自动提取文本内容并转换
          </p>
        </div>
        
        <div className="p-6 bg-brand-linen/30 rounded-lg">
          <div className="w-10 h-10 rounded-full bg-brand-text/10 flex items-center justify-center mb-4">
            <Eye className="w-5 h-5 text-brand-text" />
          </div>
          <h4 className="font-roboto font-medium text-brand-text mb-2">实时预览</h4>
          <p className="font-roboto text-sm text-brand-dark-gray">
            上传后可预览排版效果，确认无误后再发布
          </p>
        </div>
      </div>

      {/* Writing tips */}
      <div className="p-6 bg-brand-linen/30 rounded-lg">
        <h4 className="font-roboto font-medium text-brand-text mb-4">写作建议</h4>
        <ul className="space-y-2 font-roboto text-sm text-brand-dark-gray list-disc pl-5">
          <li>使用一级标题 (#) 作为文章标题</li>
          <li>使用二级标题 (##) 作为副标题或章节标题</li>
          <li>代码块使用三个反引号 (```) 包裹，并指定语言以获得语法高亮</li>
          <li>适当使用列表、表格和引用丰富内容层次</li>
          <li>文章开头添加一段简短的摘要，有助于读者快速了解内容</li>
        </ul>
      </div>
    </div>
  );

  // Render preview step
  const renderPreviewStep = () => (
    <div className="space-y-6">
      {/* File info */}
      <div className="flex items-center justify-between p-4 bg-brand-linen/30 rounded-lg">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-brand-text" />
          <div>
            <p className="font-roboto text-sm font-medium text-brand-text">
              {uploadedFile?.name}
            </p>
            <p className="font-roboto text-xs text-brand-dark-gray/70">
              {uploadedFile && formatFileSize(uploadedFile.size)} · 
              {parsedDoc?.wordCount.toLocaleString()} 字 · 
              约 {parsedDoc?.readTime} 分钟阅读
            </p>
          </div>
        </div>
        <button
          onClick={handleReset}
          className="p-2 text-brand-dark-gray hover:text-brand-text transition-colors"
          title="重新上传"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Preview content */}
      <div className="border border-brand-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-brand-linen/50 border-b border-brand-border flex items-center justify-between">
          <h3 className="font-roboto font-medium text-brand-text">文章预览</h3>
          <span className="font-roboto text-xs text-brand-dark-gray/70">
            以下是将发布的内容
          </span>
        </div>
        <div className="p-6 max-h-[600px] overflow-y-auto bg-white">
          {formData.content && typeof formData.content === 'string' ? (
            <MarkdownRenderer content={formData.content} />
          ) : (
            <p className="font-roboto text-brand-dark-gray/50 text-center py-8">
              暂无内容
            </p>
          )}
        </div>
      </div>

      {/* Auto-extracted info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-brand-linen/30 rounded-lg">
        <div>
          <span className="font-roboto text-xs text-brand-dark-gray/70">检测到的标题</span>
          <p className="font-roboto text-brand-text truncate">{formData.title || '未检测到'}</p>
        </div>
        <div>
          <span className="font-roboto text-xs text-brand-dark-gray/70">检测到的标签</span>
          <p className="font-roboto text-brand-text truncate">
            {formData.tags || '无'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => setCurrentStep('edit')}
          className="flex-1 px-6 py-3 font-roboto text-sm uppercase tracking-wider text-brand-text bg-white/90 backdrop-blur-sm border border-brand-border rounded-lg hover:bg-brand-text hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
        >
          <Edit3 size={16} />
          编辑信息
        </button>
        <button
          onClick={() => setCurrentStep('edit')}
          className="flex-1 px-6 py-3 font-roboto text-sm uppercase tracking-wider text-white bg-brand-text border border-brand-text rounded-lg hover:bg-brand-dark-gray hover:border-brand-dark-gray transition-all duration-300"
        >
          继续发布
        </button>
      </div>
    </div>
  );

  // Render edit step
  const renderEditStep = () => (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 text-sm">
        <button 
          onClick={() => setCurrentStep('upload')}
          className="text-brand-dark-gray hover:text-brand-text transition-colors"
        >
          上传文件
        </button>
        <span className="text-brand-dark-gray/30">/</span>
        <button 
          onClick={() => setCurrentStep('preview')}
          className="text-brand-dark-gray hover:text-brand-text transition-colors"
        >
          预览
        </button>
        <span className="text-brand-dark-gray/30">/</span>
        <span className="text-brand-text font-medium">完善信息</span>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block font-roboto text-sm font-medium text-brand-text mb-2">
            文章标题 *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="输入文章标题"
            className="w-full px-4 py-3 font-roboto text-brand-text bg-white/90 backdrop-blur-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-text/30 focus:border-brand-text transition-all"
          />
        </div>

        {/* Subtitle */}
        <div>
          <label htmlFor="subtitle" className="block font-roboto text-sm font-medium text-brand-text mb-2">
            副标题 / 简短描述
          </label>
          <input
            type="text"
            id="subtitle"
            name="subtitle"
            value={formData.subtitle}
            onChange={handleChange}
            placeholder="简要描述文章内容"
            className="w-full px-4 py-3 font-roboto text-brand-text bg-white/90 backdrop-blur-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-text/30 focus:border-brand-text transition-all"
          />
        </div>

        {/* Author */}
        <div>
          <label htmlFor="author" className="block font-roboto text-sm font-medium text-brand-text mb-2">
            作者名称 *
          </label>
          <input
            type="text"
            id="author"
            name="author"
            value={formData.author}
            onChange={handleChange}
            placeholder="输入你的姓名或笔名"
            className="w-full px-4 py-3 font-roboto text-brand-text bg-white/90 backdrop-blur-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-text/30 focus:border-brand-text transition-all"
          />
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block font-roboto text-sm font-medium text-brand-text mb-2">
            文章分类 *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-3 font-roboto text-brand-text bg-white/90 backdrop-blur-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-text/30 focus:border-brand-text transition-all appearance-none cursor-pointer"
          >
            <option value="">选择文章分类</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Cover Image */}
        <div>
          <CoverImageUploader
            value={formData.coverImage || null}
            onChange={(imageData) => setFormData(prev => ({ ...prev, coverImage: imageData || '' }))}
            onError={(error) => setError(error)}
            disabled={isSubmitting}
            label="封面图片"
            helpText="建议尺寸 1200x630 或 16:9 比例，最大 5MB"
          />
          <p className="mt-2 font-roboto text-xs text-brand-dark-gray/70">
            封面图片将显示在文章列表和文章详情页顶部
          </p>
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block font-roboto text-sm font-medium text-brand-text mb-2">
            标签（用逗号分隔）
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="例如：React, TypeScript, 前端开发"
            className="w-full px-4 py-3 font-roboto text-brand-text bg-white/90 backdrop-blur-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-text/30 focus:border-brand-text transition-all"
          />
          <p className="mt-2 font-roboto text-xs text-brand-dark-gray">
            添加相关标签可以帮助读者更容易找到你的文章
          </p>
        </div>

        {/* Content preview (read-only) */}
        <div>
          <label className="block font-roboto text-sm font-medium text-brand-text mb-2">
            文章内容
          </label>
          <div className="border border-brand-border rounded-lg overflow-hidden bg-white max-h-[300px] overflow-y-auto">
            <div className="p-4">
              {formData.content && typeof formData.content === 'string' ? (
                <MarkdownRenderer content={formData.content} />
              ) : (
                <p className="font-roboto text-brand-dark-gray/50 text-center">
                  暂无内容
                </p>
              )}
            </div>
          </div>
          <p className="mt-2 font-roboto text-xs text-brand-dark-gray">
            如需修改内容，请重新上传文件
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-brand-border">
        <button
          onClick={() => setCurrentStep('preview')}
          className="flex-1 px-6 py-3 font-roboto text-sm uppercase tracking-wider text-brand-text bg-white/90 backdrop-blur-sm border border-brand-border rounded-lg hover:bg-brand-linen transition-all duration-300"
        >
          返回预览
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1 px-6 py-3 font-roboto text-sm uppercase tracking-wider text-white bg-brand-text border border-brand-text rounded-lg hover:bg-brand-dark-gray hover:border-brand-dark-gray transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              发布中...
            </>
          ) : (
            <>
              <CheckCircle size={16} />
              确认发布
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Render success step
  const renderSuccessStep = () => (
    <div className="text-center py-12">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle className="w-10 h-10 text-green-600" />
      </div>
      <h2 className="font-oswald text-3xl text-brand-text mb-4">
        文章发布成功！
      </h2>
      <p className="font-roboto text-brand-dark-gray mb-8">
        你的文章已成功发布到 TechInk 社区。正在跳转到文章页面...
      </p>
      <div className="flex justify-center">
        <Link
          to="/articles"
          className="inline-flex items-center gap-2 px-6 py-3 font-roboto text-sm uppercase tracking-wider text-brand-text bg-white/90 backdrop-blur-sm border border-brand-border rounded-lg hover:bg-brand-text hover:text-white transition-all duration-300"
        >
          <ArrowLeft size={16} />
          返回文章列表
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-linen pt-32 pb-20">
      <div className="max-w-3xl mx-auto px-6 lg:px-12">
        {/* Back navigation */}
        {currentStep !== 'success' && (
          <div className="mb-8">
            <Link
              to="/articles"
              className="inline-flex items-center gap-2 font-roboto text-sm text-brand-dark-gray hover:text-brand-text transition-colors"
            >
              <ArrowLeft size={16} />
              返回文章列表
            </Link>
          </div>
        )}

        {/* Page header */}
        <header className="mb-12">
          <h1 className="font-oswald font-light text-4xl lg:text-5xl text-brand-text mb-4">
            {currentStep === 'upload' && '投稿文章'}
            {currentStep === 'preview' && '预览文章'}
            {currentStep === 'edit' && '完善信息'}
            {currentStep === 'success' && '发布成功'}
          </h1>
          <p className="font-roboto text-lg text-brand-dark-gray">
            {currentStep === 'upload' && '上传 Markdown 或 Word 文档，自动排版为精美的阅读版面'}
            {currentStep === 'preview' && '预览文章的排版效果，确认无误后继续'}
            {currentStep === 'edit' && '补充文章信息，让读者更好地了解你的内容'}
            {currentStep === 'success' && '感谢你的贡献，TechInk 因你而精彩'}
          </p>
        </header>

        {/* Error message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50/50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="font-roboto text-red-700">{error}</p>
          </div>
        )}

        {/* Step content */}
        {currentStep === 'upload' && renderUploadStep()}
        {currentStep === 'preview' && renderPreviewStep()}
        {currentStep === 'edit' && renderEditStep()}
        {currentStep === 'success' && renderSuccessStep()}
      </div>
    </div>
  );
};

export default SubmitArticlePage;
