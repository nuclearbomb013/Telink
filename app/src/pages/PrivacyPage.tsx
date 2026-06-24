import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MarkdownRenderer from '@/components/MarkdownRenderer';

const PRIVACY_CONTENT = `# 隐私政策

最后更新日期：2026年3月1日

TechInk（以下简称"本平台"）重视用户隐私保护。本政策说明我们如何收集、使用和保护你的个人信息。

## 一、信息收集

### 我们收集的信息

1. **账户信息**：用户名、邮箱、密码（加密存储）
2. **个人资料**：头像、个人简介（可选）
3. **内容数据**：你发布的文章、帖子、评论、收藏
4. **使用数据**：浏览记录、操作日志，用于改善服务体验

### 我们不收集的信息

- 敏感身份信息（身份证号、银行卡号等）
- 通讯录、相册等设备权限数据

## 二、信息使用

我们收集的信息仅用于以下目的：

- 提供、维护和改进平台服务
- 用户身份验证与账户安全
- 内容推荐与个性化体验
- 社区管理与违规处理
- 必要时与用户沟通服务事项

> 我们绝不会将你的个人信息出售给第三方。

## 三、信息存储与安全

### 存储方式

- 密码使用 bcrypt 算法加密存储，无法逆向还原
- 敏感操作记录保留 90 天后自动清除
- 数据存储于安全的服务器环境中

### 安全措施

- HTTPS 加密传输
- 定期安全审计与漏洞修复
- 访问权限严格管控，仅授权人员可接触用户数据

## 四、Cookie 使用

本平台使用以下类型的 Cookie：

| Cookie 类型 | 用途 | 是否必需 |
|-------------|------|----------|
| 认证 Cookie | 保持登录状态 | 是 |
| 偏好 Cookie | 记录阅读偏好（字号、主题等） | 否 |
| 分析 Cookie | 了解使用情况以优化服务 | 否 |

你可以在浏览器设置中清除或禁用非必需 Cookie。

## 五、信息共享

除非以下情形，我们不会与第三方共享你的个人信息：

1. 获得你的明确同意
2. 法律法规要求或行政、司法机关依法要求
3. 为保护本平台、用户或公众的合法权益所必需

## 六、你的权利

你对个人信息享有以下权利：

- **知情权**：了解我们收集了哪些信息
- **更正权**：修改不准确的信息
- **删除权**：申请删除你的账户和相关数据
- **导出权**：获取你的数据副本

如需行使上述权利，请通过平台反馈功能联系我们。

## 七、未成年人保护

本平台不面向 13 岁以下未成年人。如发现未成年人注册使用，我们将采取措施删除相关账户。

## 八、政策变更

本政策可能不时更新。更新后的政策发布在本页面，重要变更将通过站内通知告知用户。

## 九、联系方式

如有任何隐私相关问题，请通过平台内的反馈功能与我们联系。
`;

const PrivacyPage = () => {
  return (
    <div className="min-h-[80vh] bg-brand-linen py-16 px-4">
      <div className="max-w-[720px] mx-auto">
        <Link
          to="/register"
          className="font-roboto text-sm text-brand-dark-gray/70 hover:text-brand-text transition-colors mb-8 inline-flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          返回注册
        </Link>
        <MarkdownRenderer content={PRIVACY_CONTENT} mode="preview" />
      </div>
    </div>
  );
};

export default PrivacyPage;
