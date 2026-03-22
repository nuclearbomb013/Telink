/**
 * 文档解析工具
 * 支持解析 .md 和 .doc/.docx 文件
 */

// mammoth 是 CommonJS 模块，需要动态导入
const getMammoth = async () => {
  const mammoth = await import('mammoth');
  return mammoth.default || mammoth;
};

export interface ParsedDocument {
  title: string;
  subtitle: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  images: string[];
  wordCount: number;
  readTime: number;
}

export interface ParseError {
  message: string;
  code: string;
}

/**
 * 检测文件类型
 */
export function detectFileType(file: File): 'markdown' | 'word' | 'unknown' {
  const name = file.name.toLowerCase();
  if (name.endsWith('.md') || name.endsWith('.markdown') || name.endsWith('.txt')) {
    return 'markdown';
  }
  if (name.endsWith('.doc') || name.endsWith('.docx')) {
    return 'word';
  }
  return 'unknown';
}

/**
 * 计算阅读时间（按每分钟 300 字计算）
 */
export function calculateReadTime(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  const totalWords = chineseChars + englishWords;
  return Math.max(1, Math.ceil(totalWords / 300));
}

/**
 * 从内容中提取标题
 * 优先从 Markdown 的 # 标题或文档第一行提取
 */
function extractTitle(content: string, fileName: string): string {
  // 尝试提取 Markdown 标题
  const markdownTitleMatch = content.match(/^#\s+(.+)$/m);
  if (markdownTitleMatch) {
    return markdownTitleMatch[1].trim();
  }
  
  // 尝试提取文档第一行作为标题
  const firstLine = content.split('\n')[0].trim();
  if (firstLine && firstLine.length < 100 && !firstLine.startsWith('#')) {
    return firstLine;
  }
  
  // 使用文件名作为标题
  return fileName.replace(/\.[^/.]+$/, '');
}

/**
 * 从内容中提取副标题
 */
function extractSubtitle(content: string, title: string): string {
  // 尝试提取 Markdown 的 ## 副标题
  const markdownSubtitleMatch = content.match(/^##\s+(.+)$/m);
  if (markdownSubtitleMatch) {
    return markdownSubtitleMatch[1].trim();
  }
  
  // 提取第一段的摘要（前 100 个字符）
  const paragraphs = content
    .replace(/#+\s+/g, '')
    .split('\n')
    .map(p => p.trim())
    .filter(p => p.length > 20 && p !== title);
  
  if (paragraphs.length > 0) {
    const summary = paragraphs[0].substring(0, 150);
    return summary.length >= 150 ? summary + '...' : summary;
  }
  
  return '';
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 从内容中提取标签
 */
function extractTags(content: string): string[] {
  const tags: string[] = [];
  
  // 常见的技术关键词
  const techKeywords = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'C#', 'PHP', 'Ruby',
    'React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'Nuxt', 'Node.js', 'Django', 'Spring',
    '前端', '后端', '全栈', '移动端', 'iOS', 'Android', 'Flutter', 'React Native',
    '数据库', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch',
    'Docker', 'Kubernetes', 'DevOps', 'CI/CD', 'Git', 'GitHub',
    'AI', '人工智能', '机器学习', '深度学习', 'LLM', 'ChatGPT',
    '云计算', 'AWS', 'Azure', '阿里云', '腾讯云',
    '微服务', '架构', '设计模式', '算法', '数据结构',
    '安全', '性能优化', '测试', '敏捷开发'
  ];
  
  techKeywords.forEach(keyword => {
    try {
      // 转义特殊字符后再创建正则表达式
      const escapedKeyword = escapeRegExp(keyword);
      const regex = new RegExp(escapedKeyword, 'i');
      if (regex.test(content) && !tags.includes(keyword)) {
        tags.push(keyword);
      }
    } catch (e) {
      // 如果正则表达式创建失败，使用简单的字符串包含检查
      if (content.toLowerCase().includes(keyword.toLowerCase()) && !tags.includes(keyword)) {
        tags.push(keyword);
      }
    }
  });
  
  return tags.slice(0, 5);
}

/**
 * 将HTML转换为Markdown格式
 */
function convertHtmlToMarkdown(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // 确保HTML是字符串类型
  let content = String(html || '');

  // HTML实体解码映射
  const entities: { [key: string]: string } = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' '
  };

  // 解码HTML实体
  content = content.replace(/(&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;)/g, (match) => entities[match]);

  // 转换标题
  content = content.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  content = content.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  content = content.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  content = content.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  content = content.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
  content = content.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

  // 转换粗体和斜体
  content = content.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  content = content.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  content = content.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  content = content.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

  // 转换列表
  content = content.replace(/<ul[^>]*>/gi, '\n');
  content = content.replace(/<\/ul>/gi, '\n');
  content = content.replace(/<ol[^>]*>/gi, '\n');
  content = content.replace(/<\/ol>/gi, '\n');
  content = content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');

  // 转换段落
  content = content.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

  // 转换链接
  content = content.replace(/<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // 转换换行
  content = content.replace(/<br[^>]*>/gi, '\n');
  content = content.replace(/<div[^>]*>/gi, '\n');
  content = content.replace(/<\/div>/gi, '\n');

  // 清理多余的空白行
  content = content.replace(/\n{3,}/g, '\n\n');

  // 去除其他HTML标签（保留内部文本）
  content = content.replace(/<[^>]+>/g, '');

  return content.trim();
}

/**
 * 清理内容，移除过多的空行
 */
function cleanContent(content: string): string {
  return content
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

/**
 * 解析 Markdown 文件
 */
export async function parseMarkdownFile(file: File): Promise<ParsedDocument> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = String(e.target?.result || '');
          if (content === undefined || content === null || content === 'undefined' || content === 'null') {
            reject({
              message: '读取文件内容失败，文件可能为空',
              code: 'READ_ERROR',
            });
            return;
          }

          const title = extractTitle(content, file.name);
          const subtitle = extractSubtitle(content, title);
          const cleanedContent = cleanContent(content);
          const wordCount = content.length;
          const readTime = calculateReadTime(content);

          resolve({
            title,
            subtitle,
            content: cleanedContent,
            author: '',
            category: '',
            tags: extractTags(content),
            images: [],
            wordCount,
            readTime,
          });
        } catch (error) {
          console.error('Markdown parse error:', error);
          reject({
            message: '解析 Markdown 文件失败：' + (error instanceof Error ? error.message : '未知错误'),
            code: 'PARSE_ERROR',
          });
        }
      };
      
      reader.onerror = (e) => {
        console.error('FileReader error:', e);
        let userMessage = '读取文件失败';
        let errorCode = 'READ_ERROR';

        if (reader.error) {
          const errorMsg = reader.error.message.toLowerCase();

          if (errorMsg.includes('not found') || errorMsg.includes('404')) {
            userMessage = '文件未找到，请重新选择文件';
            errorCode = 'FILE_NOT_FOUND';
          } else if (errorMsg.includes('security')) {
            userMessage = '安全错误，无法读取文件';
            errorCode = 'SECURITY_ERROR';
          } else if (errorMsg.includes('abort')) {
            userMessage = '文件读取被中断';
            errorCode = 'ABORT_ERROR';
          } else {
            userMessage = '读取文件失败：' + reader.error.message;
          }
        }

        reject({
          message: userMessage,
          code: errorCode,
        });
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('FileReader setup error:', error);

      let userMessage = '初始化文件读取失败';
      let errorCode = 'SETUP_ERROR';

      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();

        if (errorMsg.includes('security') || errorMsg.includes('permission')) {
          userMessage = '安全权限不足，无法读取文件';
          errorCode = 'PERMISSION_ERROR';
        } else if (errorMsg.includes('memory')) {
          userMessage = '内存不足，无法读取文件';
          errorCode = 'MEMORY_ERROR';
        } else {
          userMessage = '初始化文件读取失败：' + error.message;
        }
      }

      reject({
        message: userMessage,
        code: errorCode,
      });
    }
  });
}

/**
 * 解析 Word 文档
 */
export async function parseWordFile(file: File): Promise<ParsedDocument> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            reject({
              message: '读取文件内容失败，文件可能为空',
              code: 'READ_ERROR',
            });
            return;
          }

          try {
            // 动态导入 mammoth
            const mammoth = await getMammoth();

            // 首先尝试提取富文本（HTML），再转换为Markdown样式的格式
            const result = await mammoth.convertToHtml({
              arrayBuffer
            });

            if (result.messages && result.messages.length > 0) {
              console.warn('Mammoth messages:', result.messages);
            }

            // 验证解析结果
            let content = result.value;
            if (typeof content !== 'string' || content.trim().length === 0) {
              throw new Error('无法从文档中提取有效文本内容，文件可能损坏或为纯二进制格式');
            }

            // 确保内容是字符串（再次验证并转换）
            content = String(content || '');

            // 将HTML标签转换为Markdown格式
            let markdownContent = convertHtmlToMarkdown(content);

            const title = extractTitle(markdownContent, file.name);
            const subtitle = extractSubtitle(markdownContent, title);
            const cleanedContent = cleanContent(markdownContent);
            const wordCount = cleanedContent.length;
            const readTime = calculateReadTime(cleanedContent);

            resolve({
              title,
              subtitle,
              content: cleanedContent,
              author: '',
              category: '',
              tags: extractTags(cleanedContent),
              images: [],
              wordCount,
              readTime,
            });
          } catch (mammothError) {
            console.error('Mammoth parse error:', mammothError);

            let userMessage = '解析 Word 文档失败';
            let errorCode = 'PARSE_ERROR';

            if (mammothError instanceof Error) {
              const msg = mammothError.message.toLowerCase();

              if (msg.includes('end of central directory')) {
                userMessage = '文件已损坏或不完整，请重新上传完整的 .docx 文件';
                errorCode = 'FILE_CORRUPTED';
              } else if (msg.includes('invalid') || msg.includes('corrupt')) {
                userMessage = '无效的文件格式，请确保上传的是标准 .docx 格式';
                errorCode = 'INVALID_FORMAT';
              } else if (msg.includes('zip') || msg.includes('archive')) {
                userMessage = '文件不是有效的 ZIP 格式，请上传正确的 .docx 文件';
                errorCode = 'INVALID_ARCHIVE';
              } else {
                userMessage = '解析 Word 文档失败：' + mammothError.message;
              }
            }

            reject({
              message: userMessage,
              code: errorCode,
            });
          }
        } catch (error) {
          console.error('Word file processing error:', error);

          let userMessage = '处理 Word 文件失败';
          let errorCode = 'PROCESS_ERROR';

          if (error instanceof Error) {
            const msg = error.message.toLowerCase();

            if (msg.includes('read') && msg.includes('buffer')) {
              userMessage = '文件读取失败，请检查文件是否被占用或损坏';
              errorCode = 'READ_ERROR';
            } else if (msg.includes('aborted') || msg.includes('abort')) {
              userMessage = '文件读取被中断，请重试';
              errorCode = 'ABORT_ERROR';
            } else {
              userMessage = '处理 Word 文件时发生错误：' + error.message;
            }
          }

          reject({
            message: userMessage,
            code: errorCode,
          });
        }
      };
      
      reader.onerror = (e) => {
        console.error('FileReader error:', e);
        let userMessage = '读取文件失败';
        let errorCode = 'READ_ERROR';

        if (reader.error) {
          const errorMsg = reader.error.message.toLowerCase();

          if (errorMsg.includes('not found') || errorMsg.includes('404')) {
            userMessage = '文件未找到，请重新选择文件';
            errorCode = 'FILE_NOT_FOUND';
          } else if (errorMsg.includes('security')) {
            userMessage = '安全错误，无法读取文件';
            errorCode = 'SECURITY_ERROR';
          } else if (errorMsg.includes('abort')) {
            userMessage = '文件读取被中断';
            errorCode = 'ABORT_ERROR';
          } else {
            userMessage = '读取文件失败：' + reader.error.message;
          }
        }

        reject({
          message: userMessage,
          code: errorCode,
        });
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('FileReader setup error:', error);

      let userMessage = '初始化文件读取失败';
      let errorCode = 'SETUP_ERROR';

      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();

        if (errorMsg.includes('security') || errorMsg.includes('permission')) {
          userMessage = '安全权限不足，无法读取文件';
          errorCode = 'PERMISSION_ERROR';
        } else if (errorMsg.includes('memory')) {
          userMessage = '内存不足，无法读取文件';
          errorCode = 'MEMORY_ERROR';
        } else {
          userMessage = '初始化文件读取失败：' + error.message;
        }
      }

      reject({
        message: userMessage,
        code: errorCode,
      });
    }
  });
}

/**
 * 解析文档文件（自动检测类型）
 */
export async function parseDocument(file: File): Promise<ParsedDocument> {
  try {
    const fileType = detectFileType(file);
    
    if (fileType === 'markdown') {
      return await parseMarkdownFile(file);
    }
    
    if (fileType === 'word') {
      return await parseWordFile(file);
    }
    
    throw {
      message: '不支持的文件格式，请上传 .md、.txt 或 .doc/.docx 文件',
      code: 'UNSUPPORTED_FORMAT',
    };
  } catch (error) {
    // 如果是已经格式化的错误，直接抛出
    if (error && typeof error === 'object' && 'code' in error) {
      throw error;
    }
    
    // 否则包装成通用错误
    console.error('Document parse error:', error);

    let userMessage = '解析文件时发生未知错误';
    let errorCode = 'UNKNOWN_ERROR';

    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();

      if (errorMsg.includes('corrupted') || errorMsg.includes('corrupt')) {
        userMessage = '文件已损坏，无法解析';
        errorCode = 'FILE_CORRUPTED';
      } else if (errorMsg.includes('size') || errorMsg.includes('large')) {
        userMessage = '文件过大，超出解析限制';
        errorCode = 'FILE_TOO_LARGE';
      } else if (errorMsg.includes('memory')) {
        userMessage = '内存不足，无法解析文件';
        errorCode = 'MEMORY_ERROR';
      } else if (errorMsg.includes('format') || errorMsg.includes('invalid')) {
        userMessage = '文件格式不正确，无法解析';
        errorCode = 'INVALID_FORMAT';
      } else {
        userMessage = '解析文件失败：' + error.message;
      }
    }

    throw {
      message: userMessage,
      code: errorCode,
    };
  }
}

/**
 * 验证文件
 */
export function validateDocumentFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: '文件大小不能超过 10MB',
    };
  }
  
  if (file.size === 0) {
    return {
      valid: false,
      error: '文件不能为空',
    };
  }
  
  const fileType = detectFileType(file);
  if (fileType === 'unknown') {
    return {
      valid: false,
      error: '不支持的文件格式，请上传 .md、.txt 或 .doc/.docx 文件',
    };
  }
  
  return { valid: true };
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
